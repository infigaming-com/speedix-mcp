import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerNotificationTools(
  server: McpServer,
  client: MeepoClient
) {
  // ============ Notification Channels ============

  server.tool(
    "create_notification_channel",
    "Create a new notification channel (Telegram or Slack).",
    {
      name: z.string().describe("Channel display name"),
      channel_type: z
        .number()
        .describe("Channel type: 1 = Telegram, 2 = Slack"),
      config: z
        .string()
        .describe(
          'Channel config as JSON string. Telegram: {"telegram":{"bot_token":"...","chat_id":"..."}}. Slack: {"slack":{"webhook_url":"..."}}'
        ),
      enabled: z.boolean().optional().describe("Enable immediately"),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "notification/channel/create",
          {
            name: params.name,
            channel_type: params.channel_type,
            config: configObj,
            enabled: params.enabled,
          }
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
              text: `Failed to create notification channel: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_notification_channels",
    "List notification channels.",
    {
      channel_type: z
        .number()
        .optional()
        .describe("Filter by type: 1 = Telegram, 2 = Slack"),
      enabled: z.boolean().optional().describe("Filter by enabled"),
      include_inherited: z
        .boolean()
        .optional()
        .describe("Include channels from parent operators"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "notification/channel/list",
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
              text: `Failed to list notification channels: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_notification_channel",
    "Get a specific notification channel by ID.",
    {
      channel_id: z.string().describe("Channel ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "notification/channel/get",
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
              text: `Failed to get notification channel: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_notification_channel",
    "Update a notification channel.",
    {
      channel_id: z.string().describe("Channel ID"),
      name: z.string().optional().describe("New display name"),
      config: z
        .string()
        .optional()
        .describe("New channel config as JSON string"),
      enabled: z.boolean().optional().describe("Enable/disable"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          channel_id: params.channel_id,
        };
        if (params.name) payload.name = params.name;
        if (params.config) payload.config = JSON.parse(params.config);
        if (params.enabled !== undefined) payload.enabled = params.enabled;
        const result = await client.request(
          "notification/channel/update",
          payload
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
              text: `Failed to update notification channel: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_notification_channel",
    "Delete a notification channel and its rules.",
    {
      channel_id: z.string().describe("Channel ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "notification/channel/delete",
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
              text: `Failed to delete notification channel: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "test_notification_channel",
    "Test a notification channel by sending a test message.",
    {
      channel_id: z.string().describe("Channel ID to test"),
      test_message: z
        .string()
        .optional()
        .describe("Custom test message (default message if empty)"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "notification/channel/test",
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
              text: `Failed to test notification channel: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Notification Rules ============

  server.tool(
    "save_notification_rules",
    "Save all rules for a notification channel (batch create/update/delete). Rules not included are deleted.",
    {
      channel_id: z.string().describe("Channel ID"),
      rules: z
        .string()
        .describe(
          "Rules as JSON string. Array of {id, name, message_type, rule_type, currency_conditions?, enabled}. message_type: 1=withdraw, 2=deposit, 3=large_deposit, 4=large_bet, 5=large_win. rule_type: 1=generic, 2=currency_threshold."
        ),
    },
    async (params) => {
      try {
        const rulesObj = JSON.parse(params.rules);
        const result = await client.request("notification/rule/save", {
          channel_id: params.channel_id,
          rules: rulesObj,
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
              text: `Failed to save notification rules: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_notification_rules",
    "List notification rules with optional filters.",
    {
      channel_id: z.string().optional().describe("Filter by channel ID"),
      message_type: z
        .number()
        .optional()
        .describe("Filter by message type (1-5)"),
      enabled: z.boolean().optional().describe("Filter by enabled"),
      include_inherited: z
        .boolean()
        .optional()
        .describe("Include rules from parent operators"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "notification/rule/list",
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
              text: `Failed to list notification rules: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_notification_message_types",
    "Get supported notification message types for building rules.",
    {},
    async () => {
      try {
        const result = await client.request(
          "notification/message-types",
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
              text: `Failed to get message types: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
