import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerOperatorTools(
  server: McpServer,
  client: MeepoClient
) {
  // Create a company operator
  server.tool(
    "create_company",
    "Create a new company operator with admin account. No authentication required (self-registration). Returns JWT token and backoffice subdomain. Automatically logs in after creation.",
    {
      company_name: z.string().describe("Company name"),
      email: z.string().email().describe("Admin email address"),
      password: z.string().describe("Admin password"),
      mobile: z.string().optional().describe("Mobile phone number"),
      operator_key: z.string().optional().describe("Unique operator key identifier"),
      contact: z.string().optional().describe("Contact person name"),
      contact_methods: z.string().optional().describe("Contact methods (JSON string)"),
      affiliate: z.string().optional().describe("Affiliate info"),
      verification_code: z.string().optional().describe("Email verification code"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "company/register",
          {
            company_name: params.company_name,
            email: params.email,
            password: params.password,
            mobile: params.mobile,
            operator_key: params.operator_key,
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
    "Create a new operator under the current company. Requires email verification.",
    {
      operator_name: z.string().describe("Operator display name"),
      operator_key: z.string().describe("Unique operator key"),
      mode: z
        .enum(["individual", "cooperation"])
        .describe("Operator mode: 'individual' or 'cooperation'"),
      reporting_currency: z.string().describe("Reporting currency (e.g. USD)"),
      backoffice_timezone: z
        .string()
        .describe("Timezone (e.g. UTC+0, Europe/London)"),
      operator_admin_email: z
        .string()
        .email()
        .describe("Admin email for the operator"),
      verification_code: z.string().optional().describe("Email verification code"),
      supported_languages: z
        .array(z.string())
        .optional()
        .describe("Supported languages (e.g. ['en', 'de'])"),
      supported_currencies: z
        .array(z.string())
        .optional()
        .describe("Supported currencies (e.g. ['USD', 'EUR', 'BTC'])"),
      template_name: z
        .string()
        .optional()
        .describe("Branding template name"),
    },
    async (params) => {
      try {
        const result = await client.request("operator/create", params);
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
        const result = await client.request("operator/list/all", params);
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
        .number()
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
    "List all company-level operators.",
    {
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("operator/list/company", params);
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
    "List all bottom-level (player-facing) operators.",
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
      operator_id: z.number().describe("Operator ID to update"),
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
      try {
        const result = await client.request("operator/status/update", params);
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
