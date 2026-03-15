import type { Config } from "../config.js";
import { AuthManager } from "./auth.js";

export interface ApiError {
  code: number;
  reason: string;
  message: string;
}

export class MeepoClient {
  private config: Config;
  auth: AuthManager;

  constructor(config: Config) {
    this.config = config;
    this.auth = new AuthManager(config);
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

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorMsg: string;
      try {
        const err = (await res.json()) as ApiError;
        errorMsg = err.message || err.reason || `HTTP ${res.status}`;
      } catch {
        errorMsg = await res.text();
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
      let errorMsg: string;
      try {
        const err = (await res.json()) as ApiError;
        errorMsg = err.message || err.reason || `HTTP ${res.status}`;
      } catch {
        errorMsg = await res.text();
      }
      throw new Error(`Upload error (${res.status}): ${errorMsg}`);
    }

    return await res.json();
  }

  get isConnected(): boolean {
    return this.auth.isAuthenticated();
  }
}
