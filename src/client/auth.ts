import type { Config } from "../config.js";
import { generateTotpCode } from "./totp.js";

export interface OperatorContext {
  operatorId: string;
  companyOperatorId: string;
  retailerOperatorId: string;
  systemOperatorId: string;
  realOperatorId: string;
  operatorType: string;
}

export interface AuthState {
  token: string;
  expiresAt: number;
  operatorContext: OperatorContext;
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

export interface Session {
  label: string;
  email: string;
  origin: string;
  password: string;
  totpSecret?: string;
  state: AuthState | null;
  pending2fa: Pending2faState | null;
}

export class AuthManager {
  private sessions: Map<string, Session> = new Map();
  private activeLabel: string | null = null;
  private config: Config;

  // Legacy single-session fields for pending 2FA before a session is created
  private _pendingEmail: string | undefined;
  private _pendingPassword: string | undefined;
  private _pendingOrigin: string | undefined;
  private _pendingTotpSecret: string | undefined;
  private _pending2fa: Pending2faState | null = null;
  private _pendingLabel: string | undefined;

  constructor(config: Config) {
    this.config = config;
  }

  private get activeSession(): Session | null {
    if (!this.activeLabel) return null;
    return this.sessions.get(this.activeLabel) ?? null;
  }

  get origin(): string | undefined {
    return this._pendingOrigin || this.activeSession?.origin || this.config.origin;
  }

  get pendingTwoFa(): Pending2faState | null {
    return this._pending2fa || this.activeSession?.pending2fa || null;
  }

  /**
   * List all saved sessions with their status.
   */
  listSessions(): Array<{ label: string; email: string; origin: string; active: boolean; authenticated: boolean }> {
    const result: Array<{ label: string; email: string; origin: string; active: boolean; authenticated: boolean }> = [];
    for (const [label, session] of this.sessions) {
      result.push({
        label,
        email: session.email,
        origin: session.origin,
        active: label === this.activeLabel,
        authenticated: session.state !== null && Date.now() < session.state.expiresAt - 60_000,
      });
    }
    return result;
  }

  /**
   * Switch the active session by label.
   */
  switchSession(label: string): Session {
    const session = this.sessions.get(label);
    if (!session) {
      const available = [...this.sessions.keys()].join(", ") || "(none)";
      throw new Error(`Session "${label}" not found. Available: ${available}`);
    }
    this.activeLabel = label;
    // Clear any pending state from a different login flow
    this._pending2fa = null;
    this._pendingEmail = undefined;
    this._pendingPassword = undefined;
    this._pendingOrigin = undefined;
    this._pendingTotpSecret = undefined;
    this._pendingLabel = undefined;
    return session;
  }

  /**
   * Get a valid token, auto-refreshing if needed.
   * Throws if not authenticated and no credentials available.
   */
  async getToken(): Promise<string> {
    const session = this.activeSession;
    if (session?.state && Date.now() < session.state.expiresAt - 60_000) {
      return session.state.token;
    }

    // Try auto-login with active session credentials or env config
    const email = session?.email || this.config.email;
    const password = session?.password || this.config.password;
    const origin = session?.origin || this.config.origin;

    if (!email || !password || !origin) {
      throw new Error(
        "Not authenticated. Use the login tool or create_company to authenticate first."
      );
    }

    await this.login();
    const refreshed = this.activeSession;
    if (!refreshed?.state) {
      throw new Error(
        "Authentication requires 2FA. Use setup_2fa or complete_2fa_login tool."
      );
    }
    return refreshed.state.token;
  }

  /**
   * Attempt login with current credentials (active session or env config).
   * If 2FA is required and TOTP secret is available, auto-completes.
   * Otherwise sets pending2fa state.
   */
  async login(): Promise<LoginResponse> {
    const session = this.activeSession;
    const email = this._pendingEmail || session?.email || this.config.email;
    const password = this._pendingPassword || session?.password || this.config.password;
    const origin = this._pendingOrigin || session?.origin || this.config.origin;

    if (!email || !password || !origin) {
      throw new Error(
        "Missing credentials. Provide email, password, and origin."
      );
    }

    const totpSecret = this._pendingTotpSecret || session?.totpSecret || this.config.totpSecret;

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
    const label = this._pendingLabel || email;

    if (data.token) {
      // Full login success — create or update session
      const newSession: Session = {
        label,
        email,
        origin,
        password,
        totpSecret,
        state: null,
        pending2fa: null,
      };
      this.sessions.set(label, newSession);
      this.activeLabel = label;
      this.setTokenFromJwt(data.token);
      this.clearPending();
      return data;
    }

    if (data.require2fa && data.tempToken) {
      // 2FA required — store pending state; session will be created after 2FA
      this._pending2fa = {
        tempToken: data.tempToken,
        twofaBound: data.twofaBound ?? false,
      };
      this._pendingEmail = email;
      this._pendingPassword = password;
      this._pendingOrigin = origin;
      this._pendingTotpSecret = totpSecret;
      this._pendingLabel = label;
      return data;
    }

    throw new Error("Login response missing token");
  }

  private clearPending(): void {
    this._pending2fa = null;
    this._pendingEmail = undefined;
    this._pendingPassword = undefined;
    this._pendingOrigin = undefined;
    this._pendingTotpSecret = undefined;
    this._pendingLabel = undefined;
  }

  /**
   * Login with explicit credentials (from login tool).
   * Label defaults to email but can be overridden for readability.
   */
  async loginWith(
    email: string,
    password: string,
    origin: string,
    totpSecret?: string,
    label?: string
  ): Promise<LoginResponse> {
    this._pendingEmail = email;
    this._pendingPassword = password;
    this._pendingOrigin = origin;
    this._pendingTotpSecret = totpSecret;
    this._pendingLabel = label || email;
    return this.login();
  }

  /**
   * Set auth state directly from a JWT token (e.g. from create_company response).
   * Updates the active session's state.
   */
  setTokenFromJwt(token: string): void {
    // Strip "Bearer " prefix if the API returns it
    const cleanToken = token.startsWith("Bearer ")
      ? token.slice(7)
      : token;

    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT token format");
    }

    const rawPayload = Buffer.from(parts[1], "base64").toString();

    let payload: { exp?: number; userInfo?: { operatorType?: string } };
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      throw new Error("Failed to decode JWT payload");
    }

    if (typeof payload.exp !== "number") {
      throw new Error("JWT payload missing exp claim");
    }

    // Extract int64 IDs as strings via regex to avoid JS number precision loss
    const extractId = (field: string): string => {
      const match = rawPayload.match(new RegExp(`"${field}"\\s*:\\s*(\\d+)`));
      return match ? match[1] : "0";
    };

    const operatorId = extractId("operatorId");
    const operatorContext: OperatorContext = {
      operatorId,
      companyOperatorId: extractId("companyOperatorId"),
      retailerOperatorId: extractId("retailerOperatorId"),
      systemOperatorId: extractId("systemOperatorId"),
      realOperatorId: extractId("realOperatorId") !== "0" ? extractId("realOperatorId") : operatorId,
      operatorType: payload.userInfo?.operatorType ?? "",
    };

    const expiresAt = payload.exp * 1000;
    const authState: AuthState = { token: cleanToken, expiresAt, operatorContext };

    // Update active session if exists
    const session = this.activeSession;
    if (session) {
      session.state = authState;
      session.pending2fa = null;
    } else {
      // No active session — create a temporary one (e.g. from create_company)
      const label = this._pendingLabel || "__default__";
      this.sessions.set(label, {
        label,
        email: this._pendingEmail || this.config.email || "",
        origin: this._pendingOrigin || this.config.origin || "",
        password: this._pendingPassword || this.config.password || "",
        totpSecret: this._pendingTotpSecret || this.config.totpSecret,
        state: authState,
        pending2fa: null,
      });
      this.activeLabel = label;
    }
  }

  /**
   * Set the origin on the active session or pending state.
   */
  setOrigin(origin: string): void {
    const session = this.activeSession;
    if (session) {
      session.origin = origin;
    }
    this._pendingOrigin = origin;
  }

  /**
   * Complete 2FA verification with a TOTP code.
   */
  async verify2fa(totpCode: string): Promise<string> {
    const pending = this.pendingTwoFa;
    if (!pending) {
      throw new Error("No pending 2FA verification");
    }
    if (!pending.twofaBound) {
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
        temp_token: pending.tempToken,
        totp_code: totpCode,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`2FA verification failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { token: string };

    // Create the session now that 2FA is complete
    const label = this._pendingLabel || this._pendingEmail || "__default__";
    if (!this.sessions.has(label)) {
      this.sessions.set(label, {
        label,
        email: this._pendingEmail || "",
        origin: this._pendingOrigin || origin,
        password: this._pendingPassword || "",
        totpSecret: this._pendingTotpSecret,
        state: null,
        pending2fa: null,
      });
    }
    this.activeLabel = label;
    this.setTokenFromJwt(data.token);
    this.clearPending();
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
    const pending = this.pendingTwoFa;
    if (!pending) {
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
        temp_token: pending.tempToken,
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
    const pending = this.pendingTwoFa;
    if (!pending) {
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
        temp_token: pending.tempToken,
        totp_code: totpCode,
        secret,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`2FA binding failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { token: string };

    // Create session now that 2FA binding is complete
    const label = this._pendingLabel || this._pendingEmail || "__default__";
    if (!this.sessions.has(label)) {
      this.sessions.set(label, {
        label,
        email: this._pendingEmail || "",
        origin: this._pendingOrigin || origin,
        password: this._pendingPassword || "",
        totpSecret: secret,
        state: null,
        pending2fa: null,
      });
    } else {
      const s = this.sessions.get(label)!;
      s.totpSecret = secret;
    }
    this.activeLabel = label;
    this.setTokenFromJwt(data.token);
    this.clearPending();
    return data.token;
  }

  /**
   * Get current operator context from JWT.
   */
  getOperatorContext(): OperatorContext | null {
    return this.activeSession?.state?.operatorContext ?? null;
  }

  isAuthenticated(): boolean {
    const session = this.activeSession;
    return session?.state !== null && session?.state !== undefined && Date.now() < session.state.expiresAt - 60_000;
  }

  isPending2fa(): boolean {
    return this.pendingTwoFa !== null;
  }

  /**
   * Get the active session label.
   */
  getActiveLabel(): string | null {
    return this.activeLabel;
  }

  /**
   * Clear all in-memory sessions and reset auth state.
   * Called by the logout MCP tool.
   */
  clearAllSessions(): void {
    this.sessions.clear();
    this.activeLabel = null;
    this.clearPending();
  }
}
