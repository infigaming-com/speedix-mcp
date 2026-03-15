import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerAuthTools(server: McpServer, client: MeepoClient) {
  // Dynamic login
  server.tool(
    "login",
    "Login to Meepo Backoffice with credentials. Use this to authenticate or switch operator context. If TOTP secret is provided, 2FA is handled automatically.",
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
    },
    async (params) => {
      try {
        const result = await client.auth.loginWith(
          params.email,
          params.password,
          params.origin,
          params.totp_secret
        );

        if (result.token) {
          return {
            content: [
              {
                type: "text",
                text: "Login successful. All API tools are now available.",
              },
            ],
          };
        }

        if (result.require_2fa) {
          const msg = result.twofa_bound
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
                `Secret: ${result.secret}`,
                `QR Code URL: ${result.qr_code_url}`,
                `Issuer: ${result.issuer}`,
                "",
                "Steps:",
                "1. Add this to your authenticator app (scan QR or enter secret manually)",
                "2. Use bind_2fa tool with the 6-digit code from your app",
                "",
                `IMPORTANT: Save this secret as MEEPO_TOTP_SECRET env var for auto-login:`,
                `MEEPO_TOTP_SECRET=${result.secret}`,
              ].join("\n"),
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
                "For future auto-login, add this to your MCP config env:",
                `MEEPO_TOTP_SECRET=${params.secret}`,
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
