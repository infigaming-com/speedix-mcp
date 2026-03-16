import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerCrmTools(server: McpServer, client: MeepoClient) {
  // ============ CRM Campaigns ============

  server.tool(
    "create_crm_campaign",
    "Create a new CRM marketing campaign in DRAFT status.",
    {
      name: z.string().describe("Campaign display name"),
      description: z.string().describe("Campaign description"),
      campaign_key: z
        .string()
        .optional()
        .describe("Unique key for programmatic lookup (e.g. 'deposit_bonus_2024')"),
      start_at: z
        .string()
        .optional()
        .describe("Campaign start time (ISO 8601)"),
      end_at: z
        .string()
        .optional()
        .describe("Campaign end time (ISO 8601)"),
      metadata: z
        .string()
        .optional()
        .describe("Custom metadata as JSON string"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          name: params.name,
          description: params.description,
        };
        if (params.campaign_key) payload.campaign_key = params.campaign_key;
        if (params.start_at) payload.start_at = params.start_at;
        if (params.end_at) payload.end_at = params.end_at;
        if (params.metadata) payload.metadata = JSON.parse(params.metadata);
        const result = await client.request(
          "crm/campaign/create",
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
              text: `Failed to create CRM campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_crm_campaign",
    "Update an existing CRM campaign. Only provided fields are modified.",
    {
      id: z.string().describe("Campaign ID"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      start_at: z.string().optional().describe("New start time (ISO 8601)"),
      end_at: z.string().optional().describe("New end time (ISO 8601)"),
      metadata: z
        .string()
        .optional()
        .describe("Updated metadata as JSON string"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = { id: params.id };
        if (params.name) payload.name = params.name;
        if (params.description) payload.description = params.description;
        if (params.start_at) payload.start_at = params.start_at;
        if (params.end_at) payload.end_at = params.end_at;
        if (params.metadata) payload.metadata = JSON.parse(params.metadata);
        const result = await client.request(
          "crm/campaign/update",
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
              text: `Failed to update CRM campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_crm_campaign",
    "Get a specific CRM campaign by ID.",
    {
      id: z.string().describe("Campaign ID"),
      include_workflow: z
        .boolean()
        .optional()
        .describe("Include workflow definition in response"),
    },
    async (params) => {
      try {
        const result = await client.request("crm/campaign/get", params);
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
              text: `Failed to get CRM campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_crm_campaigns",
    "List CRM campaigns with optional filters.",
    {
      status: z
        .string()
        .optional()
        .describe("Filter by status (DRAFT, ACTIVE, PAUSED, ARCHIVED, COMPLETED)"),
      include_inherited: z
        .boolean()
        .optional()
        .describe("Include campaigns from parent operators"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/list",
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
              text: `Failed to list CRM campaigns: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_crm_campaign",
    "Delete a CRM campaign. Must be in DRAFT or ARCHIVED status.",
    {
      id: z.string().describe("Campaign ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/delete",
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
              text: `Failed to delete CRM campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Campaign Workflow ============

  server.tool(
    "set_crm_campaign_workflow",
    "Set or replace the workflow definition for a CRM campaign (YAML-based DAG).",
    {
      campaign_id: z.string().describe("Campaign ID"),
      workflow_yaml: z
        .string()
        .describe("Workflow YAML definition (triggers, nodes, edges)"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/workflow/set",
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
              text: `Failed to set campaign workflow: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_crm_campaign_workflow",
    "Get the current workflow definition for a CRM campaign.",
    {
      campaign_id: z.string().describe("Campaign ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/workflow/get",
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
              text: `Failed to get campaign workflow: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "validate_crm_campaign_workflow",
    "Validate a workflow YAML without saving. Returns validation errors if any.",
    {
      workflow_yaml: z.string().describe("Workflow YAML to validate"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/workflow/validate",
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
              text: `Failed to validate workflow: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_crm_workflow_schema",
    "Get available triggers, actions, operators, and data sources for building workflows.",
    {},
    async () => {
      try {
        const result = await client.request(
          "crm/campaign/workflow/schema",
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
              text: `Failed to get workflow schema: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Campaign Lifecycle ============

  server.tool(
    "activate_crm_campaign",
    "Activate a DRAFT CRM campaign. Requires valid workflow.",
    {
      id: z.string().describe("Campaign ID to activate"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/activate",
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
              text: `Failed to activate campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "pause_crm_campaign",
    "Pause an ACTIVE CRM campaign. In-flight executions continue.",
    {
      id: z.string().describe("Campaign ID to pause"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/pause",
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
              text: `Failed to pause campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "trigger_crm_campaign",
    "Manually trigger a CRM campaign for specific users.",
    {
      campaign_id: z.string().describe("Campaign ID to trigger"),
      user_ids: z.array(z.string()).describe("User IDs to trigger for"),
      campaign_data: z
        .string()
        .optional()
        .describe("Campaign-specific data as JSON string"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          campaign_id: params.campaign_id,
          user_ids: params.user_ids,
        };
        if (params.campaign_data)
          payload.campaign_data = JSON.parse(params.campaign_data);
        const result = await client.request(
          "crm/campaign/trigger",
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
              text: `Failed to trigger campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Campaign Executions ============

  server.tool(
    "list_crm_campaign_executions",
    "List CRM campaign execution records.",
    {
      campaign_id: z.string().optional().describe("Filter by campaign ID"),
      user_id: z.string().optional().describe("Filter by user ID"),
      status: z
        .string()
        .optional()
        .describe("Filter by status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/execution/list",
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
              text: `Failed to list campaign executions: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_crm_campaign_execution_steps",
    "Get step-by-step execution log for a specific campaign execution.",
    {
      execution_id: z.string().describe("Execution ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/execution/steps",
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
              text: `Failed to get execution steps: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ CRM Segments ============

  server.tool(
    "create_segment",
    "Create a new user segment with rule-based membership. Rules use AND/OR logic with field conditions.",
    {
      segment_key: z
        .string()
        .describe("Unique key (e.g. 'high_vip_users')"),
      name: z.string().describe("Display name"),
      description: z.string().optional().describe("Description"),
      type: z.string().optional().describe("Segment type category"),
      rules: z
        .string()
        .describe(
          "Segment rules as JSON string. Tree of logic groups (AND/OR) and conditions (field, operator, value). Fields: vip_level, deposit_amount, registration_date, country, etc."
        ),
      enabled: z
        .boolean()
        .optional()
        .describe("Enable immediately (triggers async calculation)"),
    },
    async (params) => {
      try {
        const rulesObj = JSON.parse(params.rules);
        const payload: Record<string, unknown> = {
          segment_key: params.segment_key,
          name: params.name,
          rules: rulesObj,
        };
        if (params.description) payload.description = params.description;
        if (params.type) payload.type = params.type;
        if (params.enabled !== undefined) payload.enabled = params.enabled;
        const result = await client.request(
          "crm/segment/create",
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
              text: `Failed to create segment: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_segment",
    "Update an existing segment. Only provided fields are modified.",
    {
      id: z.string().describe("Segment ID"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      rules: z
        .string()
        .optional()
        .describe("Updated rules as JSON string"),
      enabled: z.boolean().optional().describe("Enable/disable"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = { id: params.id };
        if (params.name) payload.name = params.name;
        if (params.description) payload.description = params.description;
        if (params.rules) payload.rules = JSON.parse(params.rules);
        if (params.enabled !== undefined) payload.enabled = params.enabled;
        const result = await client.request(
          "crm/segment/update",
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
              text: `Failed to update segment: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_segment",
    "Get a specific segment by ID, including current user count.",
    {
      id: z.string().describe("Segment ID"),
    },
    async (params) => {
      try {
        const result = await client.request("crm/segment/get", params);
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
              text: `Failed to get segment: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_segments",
    "List user segments with optional filters.",
    {
      type: z.string().optional().describe("Filter by segment type"),
      enabled: z.boolean().optional().describe("Filter by enabled status"),
      include_inherited: z
        .boolean()
        .optional()
        .describe("Include segments from parent operators"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/segment/list",
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
              text: `Failed to list segments: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_segment",
    "Delete a segment and all related data.",
    {
      id: z.string().describe("Segment ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/segment/delete",
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
              text: `Failed to delete segment: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "calculate_segment",
    "Manually trigger batch calculation for a segment (re-evaluate membership).",
    {
      id: z.string().describe("Segment ID to calculate"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/segment/calculate",
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
              text: `Failed to calculate segment: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_segment_users",
    "Get paginated list of users in a segment.",
    {
      segment_id: z.string().describe("Segment ID"),
      only_current_members: z
        .boolean()
        .optional()
        .describe("Only return current members"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/segment/users",
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
              text: `Failed to get segment users: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_user_segments",
    "Get all segments a specific user belongs to.",
    {
      user_id: z.string().describe("User ID"),
      only_current_memberships: z
        .boolean()
        .optional()
        .describe("Only return current memberships"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/user/segments",
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
              text: `Failed to get user segments: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_segment_field_schema",
    "Get available fields, operators, and value constraints for building segment rules.",
    {},
    async () => {
      try {
        const result = await client.request(
          "crm/segment/schema",
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
              text: `Failed to get segment schema: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
