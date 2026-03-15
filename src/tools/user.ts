import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerUserTools(server: McpServer, client: MeepoClient) {
  // ============ User Management ============

  server.tool(
    "list_users",
    "List platform users with optional filters (VIP, country, deposit, etc.).",
    {
      user_id: z.number().optional().describe("Filter by user ID"),
      email: z.string().optional().describe("Filter by email"),
      mobile: z.string().optional().describe("Filter by mobile"),
      vip_level: z.string().optional().describe("Filter by VIP level"),
      country: z.string().optional().describe("Filter by country code"),
      kyc_level: z.number().optional().describe("Filter by KYC level"),
      online: z.boolean().optional().describe("Filter by online status"),
      enabled: z.boolean().optional().describe("Filter by enabled status"),
      ban_login: z.boolean().optional().describe("Filter by login ban"),
      ban_game: z.boolean().optional().describe("Filter by game ban"),
      ban_withdraw: z.boolean().optional().describe("Filter by withdraw ban"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("user/list", params);
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
              text: `Failed to list users: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_user_overview",
    "Get user financial and gaming overview (balances, deposits, GGR, etc.).",
    {
      user_id: z.number().describe("User ID"),
      filter: z
        .string()
        .optional()
        .describe("Time filter: today, this_week, this_month, recent_24h, recent_30d"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/overview/get",
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
              text: `Failed to get user overview: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_user_profile",
    "Get user profile with registration info, login history, and tags.",
    {
      user_id: z.number().describe("User ID"),
      login_page: z.number().optional().describe("Login history page"),
      login_page_size: z
        .number()
        .optional()
        .describe("Login history page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/profile/get",
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
              text: `Failed to get user profile: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_user",
    "Update a platform user (nickname, bans, KYC, contact info, etc.).",
    {
      user_id: z.number().describe("User ID"),
      nickname: z.string().optional().describe("New nickname"),
      ban_login: z.boolean().optional().describe("Ban/unban login"),
      ban_game: z.boolean().optional().describe("Ban/unban game access"),
      ban_withdraw: z.boolean().optional().describe("Ban/unban withdrawals"),
      locked: z.boolean().optional().describe("Lock/unlock account"),
      enabled: z.boolean().optional().describe("Enable/disable account"),
      email: z.string().optional().describe("New email"),
      mobile: z.string().optional().describe("New mobile"),
      firstname: z.string().optional().describe("First name"),
      lastname: z.string().optional().describe("Last name"),
    },
    async (params) => {
      try {
        const result = await client.request("user/update", params);
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
              text: `Failed to update user: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ User Comments ============

  server.tool(
    "add_user_comment",
    "Add a comment/note to a user's profile.",
    {
      user_id: z.number().describe("User ID"),
      content: z.string().describe("Comment content"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/comments/add",
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
              text: `Failed to add user comment: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_user_comments",
    "List comments/notes on a user's profile.",
    {
      user_id: z.number().describe("User ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/comments/list",
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
              text: `Failed to list user comments: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ User Tags ============

  server.tool(
    "get_user_tags",
    "Get all active tags associated with a user.",
    {
      user_id: z.number().describe("User ID"),
    },
    async (params) => {
      try {
        const result = await client.request("user/tags/get", params);
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
              text: `Failed to get user tags: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_user_tags",
    "Set tags for a user.",
    {
      user_id: z.number().describe("User ID"),
      tags: z.array(z.string()).describe("Tags to set"),
    },
    async (params) => {
      try {
        const result = await client.request("user/tags/set", params);
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
              text: `Failed to set user tags: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Operator Tags ============

  server.tool(
    "get_operator_tags",
    "Get all tags defined for the current operator.",
    {},
    async () => {
      try {
        const result = await client.request(
          "user/operator-tags/get",
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
              text: `Failed to get operator tags: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_operator_tags",
    "Set tags for an operator (defines available tags for users).",
    {
      operator_id: z.number().describe("Operator ID"),
      tags: z.array(z.string()).describe("Tags to set"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/operator-tags/set",
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
              text: `Failed to set operator tags: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_operator_tags_config",
    "Get operator tags configuration (follow_parent flag).",
    {
      operator_id: z.number().describe("Operator ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/operator-tags/config/get",
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
              text: `Failed to get operator tags config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_operator_tags_config",
    "Set operator tags configuration (follow_parent flag).",
    {
      operator_id: z.number().describe("Operator ID"),
      follow_parent: z
        .boolean()
        .describe("Whether to follow parent operator's tags"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/operator-tags/config/set",
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
              text: `Failed to set operator tags config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Session Activities ============

  server.tool(
    "list_user_session_activities",
    "List user session activities (login, game, payment events).",
    {
      user_id: z.number().describe("User ID"),
      event_type: z.string().optional().describe("Filter by event type"),
      start_time: z.string().optional().describe("Start time (ISO 8601)"),
      end_time: z.string().optional().describe("End time (ISO 8601)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/session-activities/list",
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
              text: `Failed to list session activities: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Identity / KYC ============

  server.tool(
    "list_user_identities",
    "List user identity verification records (KYC submissions).",
    {
      user_id: z.number().optional().describe("Filter by user ID"),
      status: z
        .string()
        .optional()
        .describe("Filter by status (pending, approved, declined)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/identity/list/get",
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
              text: `Failed to list user identities: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "audit_user_identity",
    "Approve or decline a user identity verification request.",
    {
      id: z.number().describe("Identity record ID"),
      audit: z
        .string()
        .describe("Audit result: 'approved' or 'declined'"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/identity/set",
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
              text: `Failed to audit user identity: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Pre-launch Check ============

  server.tool(
    "pre_launch_check",
    "Run pre-launch readiness check for the operator (validates configuration before going live).",
    {},
    async () => {
      try {
        const result = await client.request(
          "user/operator/prelaunch/check",
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
              text: `Failed to run pre-launch check: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Responsible Gambling ============

  server.tool(
    "get_user_responsible_gambling_config",
    "Get a user's responsible gambling configuration (self-exclusion, time limits, etc.).",
    {
      user_id: z.number().describe("User ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/responsible-gambling/config/get",
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
              text: `Failed to get responsible gambling config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_user_responsible_gambling_config",
    "Delete a user's responsible gambling configuration (admin override).",
    {
      user_id: z.number().describe("User ID"),
      limit_type: z
        .string()
        .describe("Limit type to delete: self_exclusion, break_in_play, time_limits"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "user/responsible-gambling/config/delete",
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
              text: `Failed to delete responsible gambling config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
