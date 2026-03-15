import type { Config } from "../config.js";
import { generateTotpCode } from "./totp.js";

export interface AuthState {
  token: string;
  expiresAt: number;
}

export interface Pending2faState {
  tempToken: string;
  twofaBound: boolean;
}

interface LoginResponse {
  token?: string;
  require2fa?: boolean;
  twofaBound?: boolean;
  tempToken?: string;
}

export class AuthManager {
  private state: AuthState | null = null;
  private pending2fa: Pending2faState | null = null;
  private config: Config;

  // Dynamic overrides (set via login tool or create_company)
  private dynamicOrigin: string | undefined;
  private dynamicEmail: string | undefined;
  private dynamicPassword: string | undefined;
  private dynamicTotpSecret: string | undefined;

  constructor(config: Config) {
    this.config = config;
  }

  get origin(): string | undefined {
    return this.dynamicOrigin || this.config.origin;
  }

  get pendingTwoFa(): Pending2faState | null {
    return this.pending2fa;
  }

  /**
   * Get a valid token, auto-refreshing if needed.
   * Throws if not authenticated and no credentials available.
   */
  async getToken(): Promise<string> {
    if (this.state && Date.now() < this.state.expiresAt - 60_000) {
      return this.state.token;
    }

    // Try auto-login if we have credentials
    const email = this.dynamicEmail || this.config.email;
    const password = this.dynamicPassword || this.config.password;
    const origin = this.origin;

    if (!email || !password || !origin) {
      throw new Error(
        "Not authenticated. Use the login tool or create_company to authenticate first."
      );
    }

    await this.login();
    if (!this.state) {
      throw new Error(
        "Authentication requires 2FA. Use setup_2fa or complete_2fa_login tool."
      );
    }
    return this.state.token;
  }

  /**
   * Attempt login with current credentials.
   * If 2FA is required and TOTP secret is available, auto-completes.
   * Otherwise sets pending2fa state.
   */
  async login(): Promise<LoginResponse> {
    const email = this.dynamicEmail || this.config.email;
    const password = this.dynamicPassword || this.config.password;
    const origin = this.origin;

    if (!email || !password || !origin) {
      throw new Error(
        "Missing credentials. Provide email, password, and origin."
      );
    }

    const totpSecret = this.dynamicTotpSecret || this.config.totpSecret;

    // If we have TOTP secret, include the code in login request
    const loginBody: Record<string, string> = { email, password };
    if (totpSecret) {
      loginBody.totp_code = generateTotpCode(totpSecret);
    }

    const url = `${this.config.apiBaseUrl}/v1/backoffice/accounts/login`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify(loginBody),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Login failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as LoginResponse;

    if (data.token) {
      // Full login success (no 2FA or 2FA already verified via totp_code)
      this.setTokenFromJwt(data.token);
      this.pending2fa = null;
      return data;
    }

    if (data.require2fa && data.tempToken) {
      // 2FA required but not completed
      this.pending2fa = {
        tempToken: data.tempToken,
        twofaBound: data.twofaBound ?? false,
      };
      this.state = null;
      return data;
    }

    throw new Error("Login response missing token");
  }

  /**
   * Login with explicit credentials (from login tool).
   */
  async loginWith(
    email: string,
    password: string,
    origin: string,
    totpSecret?: string
  ): Promise<LoginResponse> {
    this.dynamicEmail = email;
    this.dynamicPassword = password;
    this.dynamicOrigin = origin;
    if (totpSecret) this.dynamicTotpSecret = totpSecret;
    return this.login();
  }

  /**
   * Set auth state directly from a JWT token (e.g. from create_company response).
   */
  setTokenFromJwt(token: string): void {
    // Strip "Bearer " prefix if the API returns it
    const cleanToken = token.startsWith("Bearer ")
      ? token.slice(7)
      : token;
    const payload = JSON.parse(
      Buffer.from(cleanToken.split(".")[1], "base64").toString()
    );
    const expiresAt = (payload.exp as number) * 1000;
    this.state = { token: cleanToken, expiresAt };
    this.pending2fa = null;
  }

  /**
   * Set the dynamic origin (e.g. after create_company returns a subdomain).
   */
  setOrigin(origin: string): void {
    this.dynamicOrigin = origin;
  }

  /**
   * Complete 2FA verification with a TOTP code.
   */
  async verify2fa(totpCode: string): Promise<string> {
    if (!this.pending2fa) {
      throw new Error("No pending 2FA verification");
    }
    if (!this.pending2fa.twofaBound) {
      throw new Error(
        "2FA not yet bound. Use setup_2fa first to generate and bind 2FA."
      );
    }

    const origin = this.origin;
    if (!origin) throw new Error("No origin configured");

    const url = `${this.config.apiBaseUrl}/v1/backoffice/accounts/2fa/verify`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({
        temp_token: this.pending2fa.tempToken,
        totp_code: totpCode,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`2FA verification failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { token: string };
    this.setTokenFromJwt(data.token);
    return data.token;
  }

  /**
   * Generate 2FA secret for first-time binding.
   */
  async generate2fa(): Promise<{
    secret: string;
    qrCodeUrl: string;
    issuer: string;
  }> {
    if (!this.pending2fa) {
      throw new Error("No pending 2FA state. Login first.");
    }

    const origin = this.origin;
    if (!origin) throw new Error("No origin configured");

    const url = `${this.config.apiBaseUrl}/v1/backoffice/accounts/2fa/generate`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({
        temp_token: this.pending2fa.tempToken,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`2FA generation failed (${res.status}): ${body}`);
    }

    return (await res.json()) as {
      secret: string;
      qrCodeUrl: string;
      issuer: string;
    };
  }

  /**
   * Bind 2FA after scanning QR code.
   */
  async bind2fa(
    totpCode: string,
    secret: string
  ): Promise<string> {
    if (!this.pending2fa) {
      throw new Error("No pending 2FA state");
    }

    const origin = this.origin;
    if (!origin) throw new Error("No origin configured");

    const url = `${this.config.apiBaseUrl}/v1/backoffice/accounts/2fa/bind`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({
        temp_token: this.pending2fa.tempToken,
        totp_code: totpCode,
        secret,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`2FA binding failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { token: string };
    this.setTokenFromJwt(data.token);
    this.dynamicTotpSecret = secret;
    return data.token;
  }

  isAuthenticated(): boolean {
    return this.state !== null && Date.now() < this.state.expiresAt - 60_000;
  }

  isPending2fa(): boolean {
    return this.pending2fa !== null;
  }
}
