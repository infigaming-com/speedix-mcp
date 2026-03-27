import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerAuthTools(server: McpServer, client: MeepoClient) {
  // Dynamic login
  server.tool(
    "login",
    "Login to Meepo Backoffice with credentials. Use this to authenticate or switch operator context. If TOTP secret is provided, 2FA is handled automatically. Supports multiple concurrent sessions via the label parameter.",
    {
      email: z.string().email().describe("Account email"),
      password: z.string().describe("Account password"),
      origin: z
        .string()
        .describe(
          "Backoffice origin URL (the subdomain assigned to this operator, e.g. https://bo.example.com)"
        ),
      totp_secret: z
        .string()
        .optional()
        .describe(
          "TOTP secret (base32) for auto 2FA. If not provided and 2FA is required, use setup_2fa or complete_2fa_login."
        ),
      label: z
        .string()
        .optional()
        .describe(
          "Session label for multi-account management (e.g. 'system', 'company'). Defaults to email. Use switch_account to switch between sessions."
        ),
    },
    async (params) => {
      try {
        const result = await client.auth.loginWith(
          params.email,
          params.password,
          params.origin,
          params.totp_secret,
          params.label
        );

        const sessionLabel = params.label || params.email;

        if (result.token) {
          return {
            content: [
              {
                type: "text",
                text: `Login successful (session: "${sessionLabel}"). All API tools are now available. Use switch_account to switch between sessions.`,
              },
            ],
          };
        }

        if (result.require2fa) {
          const msg = result.twofaBound
            ? "2FA verification required. Use complete_2fa_login tool with your authenticator app code."
            : "2FA setup required (first login). Use setup_2fa tool to generate and bind 2FA.";
          return {
            content: [{ type: "text", text: msg }],
          };
        }

        return {
          content: [
            { type: "text", text: "Login returned unexpected response." },
          ],
          isError: true,
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Login failed: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List all sessions
  server.tool(
    "list_sessions",
    "List all logged-in sessions. Shows label, email, origin, active status, and authentication status for each session.",
    {},
    async () => {
      const sessions = client.auth.listSessions();
      if (sessions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No sessions. Use the login tool to authenticate.",
            },
          ],
        };
      }

      const lines = sessions.map(
        (s) =>
          `${s.active ? "→ " : "  "}[${s.label}] ${s.email} (${s.origin}) — ${s.authenticated ? "authenticated" : "expired/pending"}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Sessions (${sessions.length}):\n${lines.join("\n")}`,
          },
        ],
      };
    }
  );

  // Switch active session
  server.tool(
    "switch_account",
    "Switch the active session to a different logged-in account. Use list_sessions to see available sessions.",
    {
      label: z
        .string()
        .describe("Session label to switch to (as shown in list_sessions)"),
    },
    async (params) => {
      try {
        const session = client.auth.switchSession(params.label);
        // Clear cached reporting currency when switching
        client.clearReportingCurrencyCache();
        return {
          content: [
            {
              type: "text",
              text: `Switched to session "${session.label}" (${session.email}). All API calls now use this account.`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Switch failed: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Setup 2FA (first-time binding)
  server.tool(
    "setup_2fa",
    "Generate 2FA secret and QR code for first-time binding. After scanning the QR code with your authenticator app, use bind_2fa to complete.",
    {},
    async () => {
      try {
        const result = await client.auth.generate2fa();
        return {
          content: [
            {
              type: "text",
              text: [
                "2FA Setup Generated:",
                "",
                `QR Code URL: ${result.qrCodeUrl}`,
                `Issuer: ${result.issuer}`,
                "",
                "Steps:",
                "1. Scan the QR code with your authenticator app",
                "2. Use bind_2fa tool with the 6-digit code from your app and the secret below",
                "",
                "IMPORTANT: The TOTP secret has been returned separately.",
                "Save it as MEEPO_TOTP_SECRET in your MCP config env for auto-login.",
              ].join("\n"),
            },
            {
              type: "text",
              text: `[SENSITIVE] TOTP Secret: ${result.secret}`,
              // Separated so AI clients can avoid logging this
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to generate 2FA: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Bind 2FA (complete first-time setup)
  server.tool(
    "bind_2fa",
    "Complete 2FA binding with the TOTP code from your authenticator app. Must call setup_2fa first.",
    {
      totp_code: z
        .string()
        .describe("6-digit TOTP code from authenticator app"),
      secret: z
        .string()
        .describe("The secret returned by setup_2fa"),
    },
    async (params) => {
      try {
        await client.auth.bind2fa(params.totp_code, params.secret);
        return {
          content: [
            {
              type: "text",
              text: [
                "2FA bound successfully. You are now fully authenticated.",
                "",
                "For future auto-login, set MEEPO_TOTP_SECRET in your MCP config env",
                "to the secret you received from setup_2fa.",
              ].join("\n"),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to bind 2FA: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Logout — clears in-memory sessions and notifies keeper to remove stored credentials
  server.tool(
    "logout",
    "Log out and clear all authentication sessions. Notifies the session manager to remove stored credentials so the next login starts fresh.",
    {},
    async () => {
      try {
        // Clear in-memory AuthManager state
        client.auth.clearAllSessions();

        // Notify keeper to clear stored credentials via HTTP callback
        const keeperUrl = process.env.KEEPER_API_URL;
        const keeperKey = process.env.KEEPER_API_KEY;
        const chatId    = process.env.KEEPER_CHAT_ID;

        if (keeperUrl && chatId) {
          const headers: Record<string, string> = {};
          if (keeperKey) headers["X-API-Key"] = keeperKey;

          const res = await fetch(`${keeperUrl}/chat/${chatId}/credentials`, {
            method: "DELETE",
            headers,
          });

          if (!res.ok) {
            const body = await res.text();
            return {
              content: [{
                type: "text" as const,
                text: `Session cleared locally, but failed to sync with session manager (${res.status}): ${body}. Use /logout command to fully log out.`,
              }],
            };
          }
        }

        return {
          content: [{ type: "text" as const, text: "Logged out successfully. All sessions cleared." }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Logout failed: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // Complete 2FA login (for users who already have 2FA bound)
  server.tool(
    "complete_2fa_login",
    "Complete login by providing the 2FA code. Use when login returns '2FA verification required'.",
    {
      totp_code: z
        .string()
        .describe("6-digit TOTP code from authenticator app"),
    },
    async (params) => {
      try {
        await client.auth.verify2fa(params.totp_code);
        return {
          content: [
            {
              type: "text",
              text: "2FA verified. Login complete. All API tools are now available.",
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `2FA verification failed: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
