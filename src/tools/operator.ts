import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

// Available website templates
const TEMPLATES = [
  { label: "ALL-IN-ONE", value: "mobile-desktop" },
  { label: "ALL-IN-ONE (Mobile Only)", value: "mobile-only" },
  { label: "Sportsbook", value: "sportsbook", disabled: true },
  { label: "Web3", value: "web3", disabled: true },
  { label: "Poker", value: "poker", disabled: true },
] as const;

// Available color schemes
const COLORS = [
  { value: "light", primary: "#6149F7", secondary: "#ffffff" },
  { value: "black", primary: "#6149F7", secondary: "#1C252E" },
  { value: "red-black", primary: "#ed1e49", secondary: "#1C252E" },
  { value: "blue-black", primary: "#00b3f6", secondary: "#1C252E" },
  { value: "green-black", primary: "#34EC7D", secondary: "#242626" },
] as const;

const TEMPLATE_VALUES = ["mobile-desktop", "mobile-only"] as const;
const COLOR_VALUES = ["light", "black", "red-black", "blue-black", "green-black"] as const;

/**
 * Generate site config.json content for an operator.
 */
function generateSiteConfig(params: {
  color: string;
  operatorName: string;
  supportedCurrencies?: string[];
  supportedLanguages?: string[];
}): string {
  const config = {
    default_theme: params.color,
    brand_name: params.operatorName,
    support_email: "",
    loading_type: "loading1",
    license_enable: false,
    license_image: "",
    license_url: "",
    country_config: [
      {
        country: "global",
        defaultCurrency:
          params.supportedCurrencies?.[0] || "USDT",
        defaultLanguage:
          params.supportedLanguages?.[0] || "en",
        supportCurrency: params.supportedCurrencies?.length
          ? params.supportedCurrencies
          : ["USDT"],
        supportLanguage: params.supportedLanguages?.length
          ? params.supportedLanguages
          : ["en"],
        siteTitle: params.operatorName,
        websiteIntroduction: "",
        licenseDescription: "",
      },
    ],
  };
  return JSON.stringify(config, null, 2);
}

/**
 * Generate manifest.json content for an operator (PWA).
 */
function generateManifest(operatorName: string): string {
  const manifest = {
    name: operatorName || " ",
    short_name: operatorName || " ",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/site/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/site/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
  return JSON.stringify(manifest, null, 2);
}

/**
 * Upload config.json and manifest.json to R2 for an operator.
 */
async function uploadSiteConfig(
  client: MeepoClient,
  subdomain: string,
  configJson: string,
  manifestJson: string
): Promise<{ configUploaded: boolean; manifestUploaded: boolean; errors: string[] }> {
  const errors: string[] = [];
  let configUploaded = false;
  let manifestUploaded = false;

  try {
    await client.uploadFile(
      "site/config.json",
      configJson,
      "application/json",
      subdomain,
      "config.json"
    );
    configUploaded = true;
  } catch (e) {
    errors.push(`config.json upload failed: ${(e as Error).message}`);
  }

  try {
    await client.uploadFile(
      "manifest.json",
      manifestJson,
      "application/manifest+json",
      subdomain,
      "manifest.json"
    );
    manifestUploaded = true;
  } catch (e) {
    errors.push(`manifest.json upload failed: ${(e as Error).message}`);
  }

  return { configUploaded, manifestUploaded, errors };
}

export function registerOperatorTools(
  server: McpServer,
  client: MeepoClient
) {
  // ============ Target Operator Context ============

  server.tool(
    "set_target_operator",
    "Set the target operator ID for all subsequent API calls. " +
      "When set, all queries will return data for this specific operator. " +
      "Use this when serving a specific merchant. Set to empty string or '0' to clear (use current account's operator).",
    {
      operator_id: z
        .string()
        .describe(
          "The operator ID to target. All subsequent API calls will include this operator's context. " +
            "Set to empty string to clear and return to current account's operator."
        ),
    },
    async (params) => {
      const opId = params.operator_id.trim();
      if (!opId || opId === "0") {
        client.setTargetOperator(null);
        return {
          content: [
            {
              type: "text" as const,
              text: "Target operator cleared. Using current account's operator context.",
            },
          ],
        };
      }
      client.setTargetOperator(opId);
      // Trigger context fetch so we can return the full context to the caller
      let contextInfo = "";
      try {
        const fullCtx = await (client as any)._fetchTargetOperatorContext();
        if (fullCtx) {
          contextInfo = `\n\nOperator context:\n` +
            `  operatorId: ${fullCtx.operator_id}\n` +
            `  companyOperatorId: ${fullCtx.company_operator_id}\n` +
            `  retailerOperatorId: ${fullCtx.retailer_operator_id}\n` +
            `  systemOperatorId: ${fullCtx.system_operator_id}\n` +
            `  operatorType: ${fullCtx.operator_type}\n` +
            `\nNote: For balance queries, use companyOperatorId (${fullCtx.company_operator_id}) with get_operator_balances.`;
        }
      } catch {
        // Context fetch failed, continue without it
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Target operator set to ${opId}. All subsequent API calls will target this operator.${contextInfo}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_target_operator",
    "Get the currently set target operator ID. Returns null if no target is set (using current account's operator).",
    {},
    async () => {
      const target = client.getTargetOperator();
      return {
        content: [
          {
            type: "text" as const,
            text: target
              ? `Current target operator: ${target}`
              : "No target operator set. Using current account's operator context.",
          },
        ],
      };
    }
  );

  // List available templates and color schemes
  server.tool(
    "list_operator_templates",
    "List available website templates and color schemes for operator creation. " +
      "Returns template options (with availability status) and color schemes (with primary/secondary hex colors).",
    {},
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                templates: TEMPLATES,
                colors: COLORS,
                notes: {
                  templates:
                    "Only 'mobile-desktop' and 'mobile-only' are currently available. Others are coming soon.",
                  colors:
                    "primary = accent color, secondary = background color.",
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Upload/update operator site config
  server.tool(
    "upload_operator_config",
    "Generate and upload site config.json and manifest.json to R2 for an existing operator. " +
      "Use this to update an operator's branding/theme after creation, or to re-upload if the initial upload failed.",
    {
      subdomain: z
        .string()
        .describe(
          "Operator's frontend subdomain (e.g. 'my-site.example.com')"
        ),
      operator_name: z.string().describe("Operator display name (used as brand_name and PWA name)"),
      color: z
        .enum(COLOR_VALUES)
        .describe("Color scheme: light, black, red-black, blue-black, or green-black"),
      supported_currencies: z
        .array(z.string())
        .optional()
        .describe("Supported currencies (e.g. ['USD', 'USDT'])"),
      supported_languages: z
        .array(z.string())
        .optional()
        .describe("Supported languages (e.g. ['en', 'de'])"),
    },
    async (params) => {
      try {
        const configJson = generateSiteConfig({
          color: params.color,
          operatorName: params.operator_name,
          supportedCurrencies: params.supported_currencies,
          supportedLanguages: params.supported_languages,
        });
        const manifestJson = generateManifest(params.operator_name);

        const result = await uploadSiteConfig(
          client,
          params.subdomain,
          configJson,
          manifestJson
        );

        const lines = [];
        if (result.configUploaded) lines.push("config.json uploaded successfully.");
        if (result.manifestUploaded) lines.push("manifest.json uploaded successfully.");
        if (result.errors.length > 0) {
          lines.push("Errors:", ...result.errors);
        }
        lines.push("", "Generated config.json:", configJson);

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
          isError: result.errors.length > 0,
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to upload operator config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
  // Create a company operator
  server.tool(
    "create_company",
    "Create a new company operator with admin account. No authentication required (self-registration). " +
      "This is the starting point for new users who don't have an account yet. " +
      "Step 1: Call without verification_code to send a verification email. " +
      "Step 2: Call again with the verification_code from the email to complete registration. " +
      "Returns JWT token and backoffice subdomain. Automatically logs in after creation.",
    {
      company_name: z.string().describe("Company name"),
      operator_key: z.string().describe("Unique operator key identifier (e.g. 'my-company')"),
      email: z.string().email().describe("Admin email address"),
      password: z.string().describe("Admin password"),
      mobile: z.string().optional().describe("Mobile phone number"),
      contact: z.string().optional().describe("Contact person name"),
      contact_methods: z.string().optional().describe("Contact methods (JSON string)"),
      affiliate: z.string().optional().describe("Affiliate info"),
      verification_code: z.string().optional().describe("Email verification code (omit to send code first)"),
    },
    async (params) => {
      try {
        // Step 1: If no verification code provided, send one first
        if (!params.verification_code) {
          await client.request(
            "accounts/register/verification/send",
            { email: params.email },
            true // skipAuth
          );
          return {
            content: [
              {
                type: "text" as const,
                text: `Verification code sent to ${params.email}. Please check your inbox and call create_company again with all the same parameters plus the verification_code.`,
              },
            ],
          };
        }

        // Step 2: Register with verification code
        const result = await client.request(
          "company/register",
          {
            company_name: params.company_name,
            operator_key: params.operator_key,
            email: params.email,
            password: params.password,
            mobile: params.mobile,
            contact: params.contact,
            contact_methods: params.contact_methods,
            affiliate: params.affiliate,
            verification_code: params.verification_code,
          },
          true // skipAuth - public registration endpoint
        );

        // Auto-login with the returned token and subdomain
        const data = result as {
          token?: string;
          backoffice_subdomain?: string;
        };
        if (data.token) {
          client.auth.setTokenFromJwt(data.token);
        }
        if (data.backoffice_subdomain) {
          client.auth.setOrigin(data.backoffice_subdomain);
        }

        const lines = [
          "Company created successfully!",
          "",
          JSON.stringify(result, null, 2),
          "",
        ];
        if (data.backoffice_subdomain) {
          lines.push(
            `Backoffice subdomain: ${data.backoffice_subdomain}`
          );
        }
        if (data.token) {
          lines.push(
            "Auto-logged in with the returned token.",
            "",
            "Note: First login will require 2FA setup.",
            "After re-login, use setup_2fa → bind_2fa to complete 2FA binding."
          );
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create company: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create an operator under a company
  server.tool(
    "create_operator",
    "Create a new operator under the current company. " +
      "Step 1: Call without verification_code to send a verification email. " +
      "Step 2: Call again with the verification_code from the email to complete creation. " +
      "After creation, automatically uploads site config.json and manifest.json to R2. " +
      "Use list_operator_templates to see available templates and color schemes.",
    {
      operator_name: z.string().describe("Operator display name"),
      operator_key: z.string().describe("Unique operator key"),
      mode: z
        .enum(["individual", "co-operation"])
        .describe("Operator mode: 'individual' or 'co-operation'"),
      reporting_currency: z.string().describe("Reporting currency (e.g. USD)"),
      backoffice_timezone: z
        .string()
        .describe("Timezone (e.g. UTC+0, Europe/London)"),
      operator_admin_email: z
        .string()
        .email()
        .describe("Admin email for the operator"),
      verification_code: z.string().optional().describe("Email verification code (omit to send code first)"),
      supported_languages: z
        .array(z.string())
        .optional()
        .describe("Supported languages (e.g. ['en', 'de'])"),
      supported_currencies: z
        .array(z.string())
        .optional()
        .describe("Supported currencies (e.g. ['USD', 'EUR', 'BTC'])"),
      template_name: z
        .enum(TEMPLATE_VALUES)
        .default("mobile-desktop")
        .describe("Website template: 'mobile-desktop' (ALL-IN-ONE) or 'mobile-only' (Mobile Only)"),
      color: z
        .enum(COLOR_VALUES)
        .default("black")
        .describe("Color scheme: light, black, red-black, blue-black, or green-black"),
    },
    async (params) => {
      try {
        // Step 1: If no verification code provided, send one first
        if (!params.verification_code) {
          await client.request(
            "accounts/register/verification/send",
            { email: params.operator_admin_email }
          );
          return {
            content: [
              {
                type: "text" as const,
                text: `Verification code sent to ${params.operator_admin_email}. Please check your inbox and call create_operator again with all the same parameters plus the verification_code.`,
              },
            ],
          };
        }

        // Step 2: Create operator with verification code
        const { color, ...createParams } = params;
        const result = await client.request("operator/create", createParams);

        const data = result as {
          subdomain?: string;
          backofficeSubdomain?: string;
          operatorAdminEmail?: string;
          password?: string;
        };

        const lines = [
          "Operator created successfully!",
          "",
          JSON.stringify(result, null, 2),
        ];

        // Auto-upload site config if subdomain is available
        if (data.subdomain) {
          const configJson = generateSiteConfig({
            color,
            operatorName: params.operator_name,
            supportedCurrencies: params.supported_currencies,
            supportedLanguages: params.supported_languages,
          });
          const manifestJson = generateManifest(params.operator_name);

          const uploadResult = await uploadSiteConfig(
            client,
            data.subdomain,
            configJson,
            manifestJson
          );

          lines.push("");
          if (uploadResult.configUploaded) {
            lines.push("Site config.json uploaded to R2.");
          }
          if (uploadResult.manifestUploaded) {
            lines.push("PWA manifest.json uploaded to R2.");
          }
          if (uploadResult.errors.length > 0) {
            lines.push(
              "Upload warnings (you can retry with upload_operator_config):",
              ...uploadResult.errors
            );
          }
        } else {
          lines.push(
            "",
            "Note: No subdomain returned. Use upload_operator_config to upload site config later."
          );
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create operator: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List all operators
  server.tool(
    "list_operators",
    "List all operators accessible by the current account.",
    {
      page: z.number().optional().describe("Page number (default 1)"),
      page_size: z.number().optional().describe("Page size (default 20)"),
    },
    async (params) => {
      try {
        const result = await client.request("operator/list/by-parent", params);
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list operators: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List operators by parent
  server.tool(
    "list_operators_by_parent",
    "List operators under a specific parent operator ID.",
    {
      parent_operator_id: z
        .string()
        .describe("Parent operator ID"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("operator/list/by-parent", params);
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list operators by parent: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List company operators
  server.tool(
    "list_company_operators",
    "List company-tier operators (the parent companies themselves, not their child sites). To see player-facing sites under a company, use list_bottom_operators instead.",
    {
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("operator/list/company", { ...params, include_count: true });
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list company operators: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List bottom operators
  server.tool(
    "list_bottom_operators",
    "List all site-level operators (player-facing sites) under the current company. Use this to see how many sites/operators the company owns.",
    {
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("operator/list/bottom", params);
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list bottom operators: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get current operator details
  server.tool(
    "get_operator_details",
    "Get detailed information about the current operator (domains, currencies, status, config, etc.).",
    {},
    async () => {
      try {
        const result = await client.request("operator/current", {});
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get operator details: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update operator status
  server.tool(
    "update_operator_status",
    "Update an operator's status. Valid statuses: pending, live, suspended, request_to_close, closed, maintain.",
    {
      operator_id: z.string().describe("Operator ID to update"),
      status: z
        .enum([
          "pending",
          "live",
          "suspended",
          "request_to_close",
          "closed",
          "maintain",
        ])
        .describe("New status"),
      ip_whitelist: z
        .array(z.string())
        .optional()
        .describe("IP whitelist (for maintain mode)"),
      action_start_at: z
        .number()
        .optional()
        .describe("Action start timestamp (ms)"),
      action_end_at: z
        .number()
        .optional()
        .describe("Action end timestamp (ms)"),
    },
    async (params) => {
      // Map user-friendly status to backend action
      const statusToAction: Record<string, string> = {
        live: "launch",
        suspended: "manual_suspend",
        request_to_close: "manual_request",
        closed: "approved",
        maintain: "maintain",
        pending: "pending",
      };
      const action = statusToAction[params.status];
      if (!action) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown status: ${params.status}`,
            },
          ],
          isError: true,
        };
      }

      try {
        const { status, ...rest } = params;
        const result = await client.request("operator/status/update", {
          ...rest,
          action,
          operator_id: params.operator_id,
          target_operator_context: client.buildTargetOperatorContext(
            params.operator_id
          ),
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update status: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update operator name
  server.tool(
    "update_operator_name",
    "Update an operator's display name.",
    {
      operator_name: z.string().describe("New operator name"),
    },
    async (params) => {
      try {
        const result = await client.request("operator/name/update", params);
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update name: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Manage BYO subdomains
  server.tool(
    "manage_operator_subdomain",
    "Add or delete a custom (BYO) subdomain for the operator's frontend or backoffice.",
    {
      action: z
        .enum(["add_frontend", "delete_frontend", "add_backoffice", "delete_backoffice"])
        .describe("Action to perform"),
      subdomain: z.string().describe("The subdomain to add or remove"),
    },
    async (params) => {
      const pathMap = {
        add_frontend: "operator/byo-subdomains/add",
        delete_frontend: "operator/byo-subdomains/delete",
        add_backoffice: "operator/backoffice-byo-subdomains/add",
        delete_backoffice: "operator/backoffice-byo-subdomains/delete",
      };
      try {
        const result = await client.request(pathMap[params.action], {
          subdomain: params.subdomain,
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to manage subdomain: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get/Set registration config
  server.tool(
    "get_registration_config",
    "Get the operator's registration configuration (required fields, limits per country).",
    {},
    async () => {
      try {
        const result = await client.request(
          "operator/registration-config/get",
          {}
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get registration config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_registration_config",
    "Set the operator's registration configuration (required fields, limits per country).",
    {
      config: z
        .string()
        .describe(
          "Registration config as JSON string (country → field requirements)"
        ),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "operator/registration-config/set",
          configObj
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to set registration config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Notification channels
  server.tool(
    "get_notification_channels",
    "Get the operator's notification channel configuration.",
    {},
    async () => {
      try {
        const result = await client.request(
          "operator/notification-channels/get",
          {}
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get notification channels: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_notification_channels",
    "Update the operator's notification channel configuration (Telegram, Slack, Email, etc.).",
    {
      config: z
        .string()
        .describe("Notification channel config as JSON string"),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "operator/notification-channels/update",
          configObj
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update notification channels: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Account settings
  server.tool(
    "get_account_settings",
    "Get the operator's account settings.",
    {},
    async () => {
      try {
        const result = await client.request(
          "operator/account-settings/get",
          {}
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get account settings: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_account_settings",
    "Update the operator's account settings.",
    {
      settings: z.string().describe("Account settings as JSON string"),
    },
    async (params) => {
      try {
        const settingsObj = JSON.parse(params.settings);
        const result = await client.request(
          "operator/account-settings/update",
          settingsObj
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update account settings: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
