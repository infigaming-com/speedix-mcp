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

  // ============ CRM Assets ============

  server.tool(
    "create_asset",
    "Create a new CRM asset (email/push/sms/inbox template) with optional inline versions. Use type: EMAIL (1), SMS (2), PUSH (3), INBOX (4).",
    {
      name: z.string().describe("Asset display name"),
      description: z.string().describe("Asset description"),
      asset_key: z
        .string()
        .optional()
        .describe("Unique key for programmatic lookup (e.g. 'welcome_email')"),
      type: z
        .string()
        .describe(
          "Asset type: 'EMAIL', 'SMS', 'PUSH', or 'INBOX'"
        ),
      metadata: z
        .string()
        .optional()
        .describe(
          "Type-specific config as JSON string. Email: {from_name, from_email, reply_to, track_opens, track_clicks}. Push: {icon, image, action_url, badge_count, sound}."
        ),
      versions: z
        .string()
        .optional()
        .describe(
          'Inline versions as JSON array. Each: {country, subject, content_url, preview_text?, content_type, is_required}. Use "global" as default country.'
        ),
    },
    async (params) => {
      try {
        const typeMap: Record<string, number> = {
          EMAIL: 1,
          SMS: 2,
          PUSH: 3,
          INBOX: 4,
        };
        const payload: Record<string, unknown> = {
          name: params.name,
          description: params.description,
          type: typeMap[params.type.toUpperCase()] ?? 0,
        };
        if (params.asset_key) payload.asset_key = params.asset_key;
        if (params.metadata) payload.metadata = JSON.parse(params.metadata);
        if (params.versions) payload.versions = JSON.parse(params.versions);
        const result = await client.request("crm/asset/create", payload);
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
              text: `Failed to create asset: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_asset",
    "Get a CRM asset by ID, including all its versions.",
    {
      id: z.string().describe("Asset ID"),
    },
    async (params) => {
      try {
        const result = await client.request("crm/asset/get", {
          id: params.id,
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
              text: `Failed to get asset: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_assets",
    "List CRM assets with optional filtering by type and status.",
    {
      type: z
        .string()
        .optional()
        .describe("Filter by type: EMAIL, SMS, PUSH, INBOX"),
      status: z
        .string()
        .optional()
        .describe("Filter by status: DRAFT, ACTIVE, ARCHIVED"),
      include_inherited: z
        .boolean()
        .optional()
        .describe("Include assets from parent operators"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const typeMap: Record<string, number> = {
          EMAIL: 1,
          SMS: 2,
          PUSH: 3,
          INBOX: 4,
        };
        const statusMap: Record<string, number> = {
          DRAFT: 1,
          ACTIVE: 2,
          ARCHIVED: 3,
        };
        const payload: Record<string, unknown> = {};
        if (params.type) payload.type = typeMap[params.type.toUpperCase()];
        if (params.status)
          payload.status = statusMap[params.status.toUpperCase()];
        if (params.include_inherited !== undefined)
          payload.include_inherited = params.include_inherited;
        if (params.page) payload.page = params.page;
        if (params.page_size) payload.page_size = params.page_size;
        const result = await client.request("crm/asset/list", payload);
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
              text: `Failed to list assets: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_asset",
    "Update an existing CRM asset. Only provided fields are modified.",
    {
      id: z.string().describe("Asset ID"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      asset_key: z.string().optional().describe("New unique key"),
      metadata: z.string().optional().describe("Updated metadata as JSON string"),
      versions: z
        .string()
        .optional()
        .describe("Inline versions to upsert as JSON array, matched by country code"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = { id: params.id };
        if (params.name) payload.name = params.name;
        if (params.description) payload.description = params.description;
        if (params.asset_key) payload.asset_key = params.asset_key;
        if (params.metadata) payload.metadata = JSON.parse(params.metadata);
        if (params.versions) payload.versions = JSON.parse(params.versions);
        const result = await client.request("crm/asset/update", payload);
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
              text: `Failed to update asset: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_asset",
    "Delete a CRM asset and all its versions. Must be DRAFT or ARCHIVED.",
    {
      id: z.string().describe("Asset ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request("crm/asset/delete", {
          id: params.id,
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
              text: `Failed to delete asset: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_asset_status",
    "Transition a CRM asset's lifecycle status. Valid: DRAFT→ACTIVE, DRAFT→ARCHIVED, ACTIVE→ARCHIVED, ARCHIVED→DRAFT.",
    {
      id: z.string().describe("Asset ID"),
      status: z
        .string()
        .describe("New status: DRAFT, ACTIVE, or ARCHIVED"),
    },
    async (params) => {
      try {
        const statusMap: Record<string, number> = {
          DRAFT: 1,
          ACTIVE: 2,
          ARCHIVED: 3,
        };
        const result = await client.request("crm/asset/status", {
          id: params.id,
          status: statusMap[params.status.toUpperCase()] ?? 0,
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
              text: `Failed to update asset status: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Asset Content Upload ============

  server.tool(
    "upload_asset_content",
    "Upload HTML/text content to R2 storage for use as asset template. Returns the content_url path to use in create_asset_version. " +
      'The file is uploaded to the path: /static/{domain}/crm/{file_path}. Use domain "default" for system-level assets.',
    {
      content: z
        .string()
        .describe(
          "Template content (HTML or plain text). Supports {{variable_name}} placeholders."
        ),
      file_path: z
        .string()
        .describe(
          'Target file path in R2 (e.g. "email/welcome.html", "push/welcome.txt")'
        ),
      domain: z
        .string()
        .optional()
        .describe(
          'Target domain/subdomain. Use "default" for system-level templates. Defaults to "default".'
        ),
      content_type: z
        .string()
        .optional()
        .describe(
          'MIME type: "text/html" (default) or "text/plain"'
        ),
    },
    async (params) => {
      try {
        const domain = params.domain || "default";
        const contentType = params.content_type || "text/html";
        // The backoffice API prepends "static/{domain}/" to the filePath,
        // so we only need to send "crm/{file_path}" as the filePath.
        const filePath = `crm/${params.file_path}`;
        const fileName = params.file_path.split("/").pop() || "template.html";

        await client.uploadFile(
          filePath,
          params.content,
          contentType,
          domain,
          fileName
        );

        const contentUrl = `/static/${domain}/${filePath}`;
        return {
          content: [
            {
              type: "text",
              text:
                `Asset content uploaded successfully.\n\n` +
                `**content_url:** \`${contentUrl}\`\n` +
                `**domain:** ${domain}\n` +
                `**content_type:** ${contentType}\n\n` +
                `Use this content_url in create_asset_version.`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to upload asset content: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Asset Versions ============

  server.tool(
    "create_asset_version",
    'Create a country-specific version for an existing asset. Use "global" as default fallback country.',
    {
      asset_id: z.string().describe("Parent asset ID"),
      country: z
        .string()
        .describe('ISO country code (e.g. "US", "BR") or "global"'),
      subject: z
        .string()
        .describe("Subject line (email subject / push title). Supports {{variable_name}} syntax."),
      content_url: z
        .string()
        .describe("Path to template content in R2 storage"),
      preview_text: z
        .string()
        .optional()
        .describe("Preview text (email preheader / push subtitle)"),
      content_type: z
        .string()
        .optional()
        .describe('MIME type: "text/html" (default) or "text/plain"'),
      is_required: z
        .boolean()
        .optional()
        .describe("Must be ACTIVE before parent asset can be activated"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          asset_id: params.asset_id,
          country: params.country,
          subject: params.subject,
          content_url: params.content_url,
          content_type: params.content_type || "text/html",
        };
        if (params.preview_text) payload.preview_text = params.preview_text;
        if (params.is_required !== undefined)
          payload.is_required = params.is_required;
        const result = await client.request(
          "crm/asset/version/create",
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
              text: `Failed to create asset version: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_asset_versions",
    "List all versions belonging to a specific asset.",
    {
      asset_id: z.string().describe("Parent asset ID"),
    },
    async (params) => {
      try {
        const result = await client.request("crm/asset/version/list", {
          asset_id: params.asset_id,
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
              text: `Failed to list asset versions: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_asset_version_status",
    "Transition an asset version's lifecycle status. Valid: DRAFT→ACTIVE, DRAFT→ARCHIVED, ACTIVE→ARCHIVED, ARCHIVED→DRAFT.",
    {
      id: z.string().describe("Asset version ID"),
      status: z
        .string()
        .describe("New status: DRAFT, ACTIVE, or ARCHIVED"),
    },
    async (params) => {
      try {
        const statusMap: Record<string, number> = {
          DRAFT: 1,
          ACTIVE: 2,
          ARCHIVED: 3,
        };
        const result = await client.request("crm/asset/version/status", {
          id: params.id,
          status: statusMap[params.status.toUpperCase()] ?? 0,
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
              text: `Failed to update asset version status: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Asset Variables & Rendering ============

  server.tool(
    "list_asset_variables",
    "List all registered template variables for building asset content. Filter by asset type or source.",
    {
      asset_type: z
        .string()
        .optional()
        .describe("Filter by type: EMAIL, SMS, PUSH, INBOX"),
      source: z
        .string()
        .optional()
        .describe("Filter by source: PLAYER, WALLET, CAMPAIGN, CUSTOM"),
    },
    async (params) => {
      try {
        const typeMap: Record<string, number> = {
          EMAIL: 1,
          SMS: 2,
          PUSH: 3,
          INBOX: 4,
        };
        const sourceMap: Record<string, number> = {
          PLAYER: 1,
          WALLET: 2,
          CAMPAIGN: 3,
          CUSTOM: 4,
        };
        const payload: Record<string, unknown> = {};
        if (params.asset_type)
          payload.asset_type = typeMap[params.asset_type.toUpperCase()];
        if (params.source)
          payload.source = sourceMap[params.source.toUpperCase()];
        const result = await client.request("crm/asset/variables", payload);
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
              text: `Failed to list asset variables: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "render_asset",
    "Render an asset version with provided data for preview. Resolves all {{variable_name}} placeholders.",
    {
      asset_id: z.string().describe("Asset ID to render"),
      country: z
        .string()
        .describe('Country code for version selection, or "global"'),
      player_data: z
        .string()
        .optional()
        .describe("Player data as JSON string (e.g. username, email, vip_level)"),
      wallet_data: z
        .string()
        .optional()
        .describe("Wallet data as JSON string (e.g. balance, deposit_amount)"),
      campaign_data: z
        .string()
        .optional()
        .describe("Campaign data as JSON string (e.g. bonus_amount, promo_code)"),
      custom_data: z
        .string()
        .optional()
        .describe("Custom overrides as JSON string (e.g. brand_name, site_url)"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          asset_id: params.asset_id,
          country: params.country,
        };
        if (params.player_data)
          payload.player_data = JSON.parse(params.player_data);
        if (params.wallet_data)
          payload.wallet_data = JSON.parse(params.wallet_data);
        if (params.campaign_data)
          payload.campaign_data = JSON.parse(params.campaign_data);
        if (params.custom_data)
          payload.custom_data = JSON.parse(params.custom_data);
        const result = await client.request("crm/asset/render", payload);
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
              text: `Failed to render asset: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Campaign Fork ============
  // Fork a system-owned campaign into an operator-owned copy. The fork is
  // independent: system edits to the original don't propagate, and it starts
  // in DRAFT for the operator to customize before activating.

  server.tool(
    "fork_crm_campaign",
    "Fork a system-owned campaign into an editable operator-owned copy. Caller must be operator-level (target_operator_id set in session). Fork starts in DRAFT; original asset references are preserved (no asset deep-copy). NOTE: once the fork activates, both the system original and the fork fire against the operator's users (the trigger handler does not know they're related). To avoid double-fire, either keep the fork in DRAFT or coordinate with the system admin to scope the original campaign's audience.",
    {
      campaign_id: z
        .string()
        .describe("ID of the system-owned campaign to fork"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "crm/campaign/fork",
          { campaign_id: params.campaign_id }
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
              text: `Failed to fork CRM campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
