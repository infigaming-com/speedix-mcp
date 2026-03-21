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
  private _targetOperatorFullContext: Record<string, string> | null = null;
  private _internalCall = false;

  constructor(config: Config) {
    this.config = config;
    this.auth = new AuthManager(config);
  }

  /**
   * Set a target operator ID. When set, all API requests will automatically
   * include the appropriate operator context.
   * Set to null to clear (use current operator).
   */
  setTargetOperator(operatorId: string | null): void {
    this._targetOperatorId = operatorId;
    this._targetOperatorFullContext = null; // Clear cache, will be fetched on next request
  }

  /**
   * Get the current target operator ID.
   */
  getTargetOperator(): string | null {
    return this._targetOperatorId;
  }

  /**
   * Fetch and cache the full operator context (with company/retailer/system IDs)
   * for the target operator. Needed for operator_context_filters.
   */
  private async _fetchTargetOperatorContext(): Promise<Record<string, string> | null> {
    if (this._targetOperatorFullContext) return this._targetOperatorFullContext;
    if (!this._targetOperatorId) return null;

    try {
      // Fetch all operators to find the target's full context (internal call, bypass block)
      this._internalCall = true;
      const result = await this.request<{ operators?: Array<Record<string, unknown>> }>(
        "operator/list/all",
        { page: 1, page_size: 500 },
        false
      );
      this._internalCall = false;
      const ops = result.operators || [];
      const target = ops.find((op: Record<string, unknown>) => {
        const ctx = op.operatorContext as Record<string, unknown> | undefined;
        return ctx && String(ctx.operatorId) === this._targetOperatorId;
      });
      if (target) {
        const ctx = target.operatorContext as Record<string, unknown>;
        this._targetOperatorFullContext = {
          operator_id: String(ctx.operatorId || this._targetOperatorId),
          company_operator_id: String(ctx.companyOperatorId || "0"),
          retailer_operator_id: String(ctx.retailerOperatorId || "0"),
          system_operator_id: String(ctx.systemOperatorId || "0"),
          real_operator_id: String(ctx.realOperatorId || this._targetOperatorId),
          operator_type: String(ctx.operatorType || "operator"),
        };
        return this._targetOperatorFullContext;
      }
    } catch {
      this._internalCall = false;
      // Fallback: use basic context
    }

    // Fallback: just operator_id
    this._targetOperatorFullContext = {
      operator_id: this._targetOperatorId,
      company_operator_id: "0",
      retailer_operator_id: "0",
      system_operator_id: "0",
      real_operator_id: this._targetOperatorId,
      operator_type: "operator",
    };
    return this._targetOperatorFullContext;
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

    // When target operator is set, block APIs that could leak cross-tenant data
    if (this._targetOperatorId && !skipAuth) {
      const blockedPaths = [
        "operator/list/all",
        "operator/list/company",
        "operator/list/bottom",
        "operator/list/by-parent",
        "company/register",
        "operator/create",
        "account/list",
        "account/add",
        "role/list",
        "role/create",
      ];
      if (blockedPaths.some(p => path.startsWith(p))) {
        if (!this._internalCall) {
          throw new Error(
            `Access denied: this operation is not available. You can only access data for your own operator.`
          );
        }
      }
    }

    // Auto-inject operator context if a target operator is set
    let finalBody = body;
    if (this._targetOperatorId && !skipAuth && !path.startsWith("operator/list")) {
      if (!body.target_operator_context && !body.operator_context_filters) {
        try {
          // Fetch full operator context (with company/retailer/system IDs)
          const fullCtx = await this._fetchTargetOperatorContext();
          if (fullCtx) {
            // Report endpoints need operator_context_filters with full 4-tuple
            const isReportEndpoint = path.startsWith("report/") ||
              path.startsWith("game/data") ||
              path.includes("deposit/") ||
              path.includes("withdrawal/") ||
              path.includes("retention") ||
              path.includes("customer/record") ||
              path.includes("affiliate/report") ||
              path.includes("referral/report");

            if (isReportEndpoint) {
              finalBody = {
                ...body,
                operator_context_filters: {
                  operator_contexts: [fullCtx],
                },
              };
            } else {
              finalBody = {
                ...body,
                target_operator_context: fullCtx,
              };
            }
          }
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
