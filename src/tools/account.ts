import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerAccountTools(
  server: McpServer,
  client: MeepoClient
) {
  // ============ Account Management ============

  server.tool(
    "add_account",
    "Add a new backoffice sub-account.",
    {
      username: z.string().describe("Account username"),
      email: z.string().describe("Account email"),
      password: z.string().describe("Account password"),
      role_id: z.string().describe("Role ID to assign"),
      mobile: z.string().optional().describe("Mobile number"),
    },
    async (params) => {
      try {
        const result = await client.request("accounts/add", params);
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
              text: `Failed to add account: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_accounts",
    "List backoffice accounts with optional filters.",
    {
      user_id: z.string().optional().describe("Filter by user ID"),
      role_id: z.string().optional().describe("Filter by role ID"),
      enabled: z.boolean().optional().describe("Filter by enabled status"),
      email: z.string().optional().describe("Filter by email"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("accounts/list", params);
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
              text: `Failed to list accounts: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_account_detail",
    "Get detailed information about a backoffice account.",
    {
      user_id: z.string().describe("User ID"),
    },
    async (params) => {
      try {
        const result = await client.request("accounts/detail", params);
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
              text: `Failed to get account detail: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_account",
    "Update a backoffice account (enable/disable, change role, lock/unlock).",
    {
      user_id: z.string().describe("User ID to update"),
      enabled: z.boolean().optional().describe("Enable/disable account"),
      role_id: z.string().optional().describe("New role ID"),
      username: z.string().optional().describe("New username"),
      email: z.string().optional().describe("New email"),
      mobile: z.string().optional().describe("New mobile"),
      locked: z.boolean().optional().describe("Lock/unlock account"),
    },
    async (params) => {
      try {
        const result = await client.request("accounts/update", params);
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
              text: `Failed to update account: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_account_info",
    "Get current logged-in account info.",
    {},
    async () => {
      try {
        const result = await client.request("accounts/info", {});
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
              text: `Failed to get account info: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "admin_reset_password",
    "Admin: reset another user's password.",
    {
      user_id: z.string().describe("Target user ID"),
      new_password: z.string().describe("New password to set"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "accounts/password/admin-reset",
          params
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
              text: `Failed to reset password: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "admin_reset_2fa",
    "Admin: reset another user's 2FA binding.",
    {
      target_user_id: z.string().describe("Target user ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "accounts/2fa/admin-reset",
          params
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
              text: `Failed to reset 2FA: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Role Management ============

  server.tool(
    "create_role",
    "Create a new access control role with permissions.",
    {
      name: z.string().describe("Role name"),
      permissions: z
        .string()
        .describe(
          "Permissions as JSON string, array of {module, actions[]}. Modules: dashboard, game list, user list, etc. Actions: read, write, delete."
        ),
    },
    async (params) => {
      try {
        const permissionsObj = JSON.parse(params.permissions);
        const result = await client.request("accounts/role/create", {
          name: params.name,
          permissions: permissionsObj,
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
              text: `Failed to create role: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_roles",
    "List all access control roles.",
    {
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "accounts/role/list",
          params
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
              text: `Failed to list roles: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_role",
    "Update an existing access control role.",
    {
      role_id: z.string().describe("Role ID to update"),
      name: z.string().describe("Updated role name"),
      permissions: z
        .string()
        .describe("Updated permissions as JSON string"),
    },
    async (params) => {
      try {
        const permissionsObj = JSON.parse(params.permissions);
        const result = await client.request("accounts/role/update", {
          role_id: params.role_id,
          name: params.name,
          permissions: permissionsObj,
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
              text: `Failed to update role: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_role",
    "Delete an access control role.",
    {
      role_id: z.string().describe("Role ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "accounts/role/delete",
          params
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
              text: `Failed to delete role: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
