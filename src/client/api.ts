import type { Config } from "../config.js";
import { AuthManager, type OperatorContext } from "./auth.js";

export interface ApiError {
  code: number;
  reason: string;
  message: string;
}

export class MeepoClient {
  private config: Config;
  auth: AuthManager;
  private _reportingCurrency: string | null = null;
  private _targetOperatorId: string | null = null;

  constructor(config: Config) {
    this.config = config;
    this.auth = new AuthManager(config);
  }

  /**
   * Set a target operator ID. When set, all API requests will automatically
   * include target_operator_context for this operator.
   * Set to null to clear (use current operator).
   */
  setTargetOperator(operatorId: string | null): void {
    this._targetOperatorId = operatorId;
  }

  /**
   * Get the current target operator ID.
   */
  getTargetOperator(): string | null {
    return this._targetOperatorId;
  }

  /**
   * Call a backoffice API endpoint.
   * @param path - Relative path after /v1/backoffice/, e.g. "operator/list/all"
   * @param body - Request body (will be JSON-encoded)
   * @param skipAuth - Skip authentication (for public endpoints like company/register)
   */
  async request<T = unknown>(
    path: string,
    body: Record<string, unknown> = {},
    skipAuth = false
  ): Promise<T> {
    const url = `${this.config.apiBaseUrl}/v1/backoffice/${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Origin header if available
    const origin = this.auth.origin;
    if (origin) {
      headers["Origin"] = origin;
    }

    if (!skipAuth) {
      const token = await this.auth.getToken();
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Auto-inject target_operator_context if a target operator is set
    // and the request body doesn't already have one
    let finalBody = body;
    if (this._targetOperatorId && !skipAuth) {
      if (!body.target_operator_context && !body.operator_context_filters) {
        try {
          const ctx = this.buildTargetOperatorContext(this._targetOperatorId);
          finalBody = {
            ...body,
            target_operator_context: ctx,
            // Also add operator_context_filters for report endpoints
            operator_context_filters: {
              operator_contexts: [{ operator_id: this._targetOperatorId }],
            },
          };
        } catch {
          // Not authenticated yet, skip injection
        }
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(finalBody),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg: string;
      try {
        const err = JSON.parse(text) as ApiError;
        errorMsg = err.message || err.reason || `HTTP ${res.status}`;
      } catch {
        errorMsg = text || `HTTP ${res.status}`;
      }
      throw new Error(`API error (${res.status}): ${errorMsg}`);
    }

    return (await res.json()) as T;
  }

  /**
   * Ensure the client is authenticated. Call this at startup to validate credentials.
   * Does nothing if credentials are not configured (unauthenticated mode).
   */
  async connect(): Promise<void> {
    if (this.config.email && this.config.password && this.config.origin) {
      const result = await this.auth.login();
      if (result.require2fa && !result.token) {
        console.error(
          "[speedix-mcp] Login requires 2FA. Use setup_2fa or complete_2fa_login tool."
        );
      }
    } else {
      console.error(
        "[speedix-mcp] Starting in unauthenticated mode. Use login or create_company to authenticate."
      );
    }
  }

  /**
   * Upload a file to R2 via the filestore endpoint.
   * @param filePath - Target path in R2 (e.g. "site/config.json")
   * @param content - File content as string
   * @param contentType - MIME type (e.g. "application/json")
   * @param domain - Target subdomain
   * @param fileName - File name (e.g. "config.json")
   */
  async uploadFile(
    filePath: string,
    content: string,
    contentType: string,
    domain: string,
    fileName: string
  ): Promise<unknown> {
    const url = `${this.config.apiBaseUrl}/v1/backoffice/filestore/operator-static-files/upload`;
    const token = await this.auth.getToken();

    const formData = new FormData();
    const blob = new Blob([content], { type: contentType });
    formData.append("file", blob, fileName);
    formData.append("contentType", contentType);
    formData.append("filePath", filePath);
    formData.append("domain", domain);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const origin = this.auth.origin;
    if (origin) {
      headers["Origin"] = origin;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg: string;
      try {
        const err = JSON.parse(text) as ApiError;
        errorMsg = err.message || err.reason || `HTTP ${res.status}`;
      } catch {
        errorMsg = text || `HTTP ${res.status}`;
      }
      throw new Error(`Upload error (${res.status}): ${errorMsg}`);
    }

    return await res.json();
  }

  /**
   * Build target_operator_context for API requests.
   * If targetOperatorId is provided, builds context for that operator.
   * Otherwise uses current operator's context from JWT.
   */
  buildTargetOperatorContext(targetOperatorId?: string | number): Record<string, unknown> {
    const current = this.auth.getOperatorContext();
    if (!current) {
      throw new Error("Not authenticated. Cannot build operator context.");
    }

    if (targetOperatorId && String(targetOperatorId) !== String(current.operatorId)) {
      // Targeting a sub-operator: use target's operator_id with current's hierarchy
      return {
        operator_id: String(targetOperatorId),
        company_operator_id: current.companyOperatorId || current.operatorId,
        retailer_operator_id: current.retailerOperatorId,
        system_operator_id: current.systemOperatorId,
        real_operator_id: String(targetOperatorId),
        operator_type: "operator",
      };
    }

    // Targeting self
    return {
      operator_id: current.operatorId,
      company_operator_id: current.companyOperatorId,
      retailer_operator_id: current.retailerOperatorId,
      system_operator_id: current.systemOperatorId,
      real_operator_id: current.realOperatorId || current.operatorId,
      operator_type: current.operatorType,
    };
  }

  /**
   * Get the current operator's reporting currency.
   * Fetches from account info on first call and caches.
   */
  async getReportingCurrency(): Promise<string> {
    if (this._reportingCurrency) return this._reportingCurrency;

    try {
      const info = await this.request<{
        reportingCurrency?: { currency?: string };
      }>("account/info/get");
      this._reportingCurrency = info.reportingCurrency?.currency || "USD";
    } catch {
      this._reportingCurrency = "USD";
    }
    return this._reportingCurrency;
  }

  /**
   * Clear cached reporting currency (e.g. when switching accounts).
   */
  clearReportingCurrencyCache(): void {
    this._reportingCurrency = null;
  }

  get isConnected(): boolean {
    return this.auth.isAuthenticated();
  }
}
