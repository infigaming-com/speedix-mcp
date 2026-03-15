import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

const operatorIdParam = z
  .number()
  .optional()
  .describe(
    "Target operator ID. Omit to use the current operator. Provide a sub-operator ID when a parent account needs to manage a child operator's VIP config."
  );

export function registerVipTools(server: McpServer, client: MeepoClient) {
  // Get VIP setting
  server.tool(
    "get_vip_setting",
    "Get VIP system settings for the operator, including level config templates and reward settings. Returns both default (inherited from parent) and custom (operator-specific) settings with their templates.",
    {
      currency: z.string().optional().describe("Currency code for currency-specific VIP settings. Defaults to operator's reporting currency if not specified."),
      operator_id: operatorIdParam,
    },
    async (params) => {
      try {
        const { operator_id, ...rest } = params;
        const currency = rest.currency || await client.getReportingCurrency();
        const body: Record<string, unknown> = {
          ...rest,
          currency,
          target_operator_context: client.buildTargetOperatorContext(operator_id),
        };
        const result = await client.request("vip/setting/get", body);
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
              text: `Failed to get VIP setting: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update VIP setting
  server.tool(
    "update_vip_setting",
    "Update VIP system settings for the operator.",
    {
      setting: z
        .string()
        .describe("VIP setting config as JSON string"),
      operator_id: operatorIdParam,
    },
    async (params) => {
      try {
        const settingObj = JSON.parse(params.setting);
        const result = await client.request("vip/setting/update", {
          setting: settingObj,
          target_operator_context: client.buildTargetOperatorContext(params.operator_id),
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
              text: `Failed to update VIP setting: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create VIP level config template
  server.tool(
    "create_vip_level_template",
    "Create a new VIP level config template with reward settings.",
    {
      template: z
        .string()
        .describe("VIP level config template as JSON string"),
      setting_id: z.number().describe("VIP setting ID to attach template to"),
      operator_id: operatorIdParam,
    },
    async (params) => {
      try {
        const templateObj = JSON.parse(params.template);
        const result = await client.request(
          "vip/level-config-template/create",
          {
            template: templateObj,
            setting_id: params.setting_id,
            target_operator_context: client.buildTargetOperatorContext(params.operator_id),
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
              text: `Failed to create VIP level template: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update VIP level config template
  server.tool(
    "update_vip_level_template",
    "Update an existing VIP level config template.",
    {
      template: z
        .string()
        .describe("Updated VIP level config template as JSON string (must include template ID)"),
      operator_id: operatorIdParam,
    },
    async (params) => {
      try {
        const templateObj = JSON.parse(params.template);
        const result = await client.request(
          "vip/level-config-template/update",
          {
            template: templateObj,
            target_operator_context: client.buildTargetOperatorContext(params.operator_id),
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
              text: `Failed to update VIP level template: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Delete VIP level config template
  server.tool(
    "delete_vip_level_template",
    "Delete a VIP level config template.",
    {
      template_id: z.number().describe("Template ID to delete"),
      operator_id: operatorIdParam,
    },
    async (params) => {
      try {
        const result = await client.request(
          "vip/level-config-template/delete",
          {
            template_id: params.template_id,
            target_operator_context: client.buildTargetOperatorContext(params.operator_id),
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
              text: `Failed to delete VIP level template: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Adjust user VIP level
  server.tool(
    "adjust_user_vip_level",
    "Manually adjust a user's VIP level (admin operation).",
    {
      user_id: z.number().describe("User ID"),
      target_level: z.number().describe("Target VIP level"),
      issue_rewards: z
        .boolean()
        .optional()
        .describe("Whether to issue upgrade rewards for crossed levels (default true)"),
      reason: z.string().describe("Reason for the adjustment"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "vip/adjust-user-level",
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
              text: `Failed to adjust user VIP level: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get user VIP level options
  server.tool(
    "get_user_vip_level_options",
    "Get available VIP level options for a user (for admin manual adjustment).",
    {
      user_id: z.number().describe("User ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "vip/user-level-options",
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
              text: `Failed to get user VIP level options: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
