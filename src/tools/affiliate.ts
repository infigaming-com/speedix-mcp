import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerAffiliateTools(
  server: McpServer,
  client: MeepoClient
) {
  // ============ Commission Plans ============

  server.tool(
    "create_commission_plan",
    "Create a new affiliate commission plan (CPA, RevShare, CPL, CPC, Flat Fee).",
    {
      title: z.string().describe("Plan title"),
      status: z.string().describe("Plan status (active, inactive)"),
      base_currency: z.string().describe("Base currency code"),
      plan_config: z
        .string()
        .describe("Commission plan config as JSON string"),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.plan_config);
        const result = await client.request(
          "affiliate/commission/plan/create",
          {
            title: params.title,
            status: params.status,
            base_currency: params.base_currency,
            plan_config: configObj,
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
              text: `Failed to create commission plan: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_commission_plan",
    "Update an existing affiliate commission plan.",
    {
      commission_plan_id: z.number().describe("Commission plan ID"),
      title: z.string().optional().describe("New title"),
      status: z.string().optional().describe("New status"),
      base_currency: z.string().optional().describe("New base currency"),
      plan_config: z
        .string()
        .optional()
        .describe("Updated plan config as JSON string"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          commission_plan_id: params.commission_plan_id,
        };
        if (params.title) payload.title = params.title;
        if (params.status) payload.status = params.status;
        if (params.base_currency)
          payload.base_currency = params.base_currency;
        if (params.plan_config)
          payload.plan_config = JSON.parse(params.plan_config);
        const result = await client.request(
          "affiliate/commission/plan/update",
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
              text: `Failed to update commission plan: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_commission_plan",
    "Get a specific commission plan by ID.",
    {
      commission_plan_id: z.number().describe("Commission plan ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/commission/plan/get",
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
              text: `Failed to get commission plan: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_commission_plans",
    "List commission plans with optional filters.",
    {
      status: z.string().optional().describe("Filter by status"),
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/commission/plan/list",
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
              text: `Failed to list commission plans: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_commission_plan",
    "Delete a commission plan.",
    {
      commission_plan_id: z.number().describe("Commission plan ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/commission/plan/delete",
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
              text: `Failed to delete commission plan: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Affiliates ============

  server.tool(
    "create_affiliate",
    "Create a new affiliate account.",
    {
      affiliate: z
        .string()
        .describe("Affiliate info as JSON string (name, email, commission_plan_id, etc.)"),
    },
    async (params) => {
      try {
        const affiliateObj = JSON.parse(params.affiliate);
        const result = await client.request("affiliate/create", {
          affiliate: affiliateObj,
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
              text: `Failed to create affiliate: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_affiliate",
    "Update an existing affiliate account.",
    {
      affiliate_id: z.number().describe("Affiliate ID"),
      affiliate: z
        .string()
        .describe("Updated affiliate info as JSON string"),
    },
    async (params) => {
      try {
        const affiliateObj = JSON.parse(params.affiliate);
        const result = await client.request("affiliate/update", {
          affiliate_id: params.affiliate_id,
          affiliate: affiliateObj,
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
              text: `Failed to update affiliate: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_affiliates",
    "List all affiliate accounts with optional filters.",
    {
      status: z
        .string()
        .optional()
        .describe("Filter by status (pending, active, inactive)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("affiliate/list", params);
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
              text: `Failed to list affiliates: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_affiliate_details",
    "Get detailed information about a specific affiliate.",
    {
      affiliate_id: z.number().describe("Affiliate ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/get/details",
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
              text: `Failed to get affiliate details: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_affiliate",
    "Delete an affiliate account.",
    {
      affiliate_id: z.number().describe("Affiliate ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request("affiliate/delete", params);
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
              text: `Failed to delete affiliate: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Affiliate Campaigns ============

  server.tool(
    "create_affiliate_campaign",
    "Create a new affiliate tracking campaign.",
    {
      domain: z.string().describe("Campaign domain"),
      campaign_name: z.string().describe("Campaign name"),
      channel_type: z
        .string()
        .describe("Channel type (facebook, tiktok, kwai, appsflyer, adjust, agency, google_ads)"),
      channel_config: z
        .string()
        .optional()
        .describe("Channel config as JSON string"),
      target_affiliate_id: z
        .number()
        .optional()
        .describe("Target affiliate ID"),
    },
    async (params) => {
      try {
        const campaign: Record<string, unknown> = {
          domain: params.domain,
          campaign_name: params.campaign_name,
          channel_type: params.channel_type,
        };
        if (params.channel_config)
          campaign.channel_config = JSON.parse(params.channel_config);
        const payload: Record<string, unknown> = { campaign };
        if (params.target_affiliate_id)
          payload.target_affiliate_id = params.target_affiliate_id;
        const result = await client.request(
          "affiliate/campaign/create",
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
              text: `Failed to create affiliate campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_affiliate_campaigns",
    "List affiliate tracking campaigns.",
    {
      campaign_name: z.string().optional().describe("Filter by name"),
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      enabled: z.boolean().optional().describe("Filter by enabled status"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/campaign/list",
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
              text: `Failed to list affiliate campaigns: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_affiliate_campaign",
    "Update an affiliate tracking campaign.",
    {
      campaign_id: z.number().describe("Campaign ID"),
      enabled: z.boolean().optional().describe("Enable/disable"),
      campaign: z
        .string()
        .optional()
        .describe("Updated campaign data as JSON string"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          campaign_id: params.campaign_id,
        };
        if (params.enabled !== undefined) payload.enabled = params.enabled;
        if (params.campaign)
          payload.campaign = JSON.parse(params.campaign);
        const result = await client.request(
          "affiliate/campaign/update",
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
              text: `Failed to update affiliate campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_affiliate_campaign",
    "Delete an affiliate tracking campaign.",
    {
      campaign_id: z.number().describe("Campaign ID to delete"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/campaign/delete",
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
              text: `Failed to delete affiliate campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Postbacks ============

  server.tool(
    "list_postbacks",
    "List affiliate postback configurations.",
    {
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      status: z.string().optional().describe("Filter by status (active, inactive)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/postback/list",
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
              text: `Failed to list postbacks: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_postback",
    "Create a new affiliate postback configuration.",
    {
      postback_name: z.string().describe("Postback name"),
      status: z.string().describe("Status (active, inactive)"),
      campaign_ids: z.array(z.number()).describe("Campaign IDs to trigger postback"),
      action_type: z
        .string()
        .describe("Action type (register, deposit, first_deposit, withdrawal, game_start, game_bet)"),
      postback_url: z.string().describe("Postback URL"),
      request_method: z.string().describe("HTTP method (GET, POST)"),
      target_affiliate_id: z.number().optional().describe("Target affiliate ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/postback/create",
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
              text: `Failed to create postback: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_postback_logs",
    "List postback execution logs.",
    {
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      start_time: z.string().optional().describe("Start time (ISO 8601)"),
      end_time: z.string().optional().describe("End time (ISO 8601)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/postback/log/list",
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
              text: `Failed to list postback logs: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Domains ============

  server.tool(
    "list_affiliate_domains",
    "List affiliate tracking domains.",
    {
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/domain/list",
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
              text: `Failed to list affiliate domains: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_affiliate_domain",
    "Set an affiliate tracking domain availability.",
    {
      domain: z.string().describe("Domain name"),
      available_to_all: z
        .boolean()
        .optional()
        .describe("Available to all affiliates"),
      affiliate_ids: z
        .array(z.number())
        .optional()
        .describe("Specific affiliate IDs to grant access"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/domain/set",
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
              text: `Failed to set affiliate domain: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Events & Commissions ============

  server.tool(
    "list_affiliate_events",
    "List affiliate tracking events (registrations, deposits, bets, etc.).",
    {
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      event_types: z
        .array(z.string())
        .optional()
        .describe("Filter by event types"),
      start_time: z.string().optional().describe("Start time (ISO 8601)"),
      end_time: z.string().optional().describe("End time (ISO 8601)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/event/list",
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
              text: `Failed to list affiliate events: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_commissions",
    "List affiliate commission records.",
    {
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      commission_subtypes: z
        .array(z.string())
        .optional()
        .describe("Filter by subtypes (cpa, revshare, cpl, cpc, flat_fee)"),
      status: z
        .string()
        .optional()
        .describe("Filter by status (pending, approved, rejected)"),
      start_time: z.string().optional().describe("Start time (ISO 8601)"),
      end_time: z.string().optional().describe("End time (ISO 8601)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/commission/list",
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
              text: `Failed to list commissions: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Affiliate Users & Bills ============

  server.tool(
    "list_affiliate_users",
    "List users referred by affiliates.",
    {
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/user/list",
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
              text: `Failed to list affiliate users: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_affiliate_bills",
    "List affiliate billing records.",
    {
      affiliate_id: z.number().optional().describe("Filter by affiliate ID"),
      bill_id: z.number().optional().describe("Filter by bill ID"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/bill/list",
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
              text: `Failed to list affiliate bills: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Settings ============

  server.tool(
    "get_affiliate_settings",
    "Get affiliate operator settings.",
    {},
    async () => {
      try {
        const result = await client.request(
          "affiliate/operator/settings/get",
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
              text: `Failed to get affiliate settings: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "update_affiliate_settings",
    "Update affiliate operator settings.",
    {
      settings: z
        .string()
        .describe("Affiliate operator settings as JSON string"),
    },
    async (params) => {
      try {
        const settingsObj = JSON.parse(params.settings);
        const result = await client.request(
          "affiliate/operator/settings/update",
          { operator_settings: settingsObj }
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
              text: `Failed to update affiliate settings: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Referral Plan ============

  server.tool(
    "get_referral_plan",
    "Get referral plan configuration for a currency.",
    {
      currency: z.string().describe("Currency code"),
    },
    async (params) => {
      try {
        const result = await client.request("referral/plan/get", params);
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
              text: `Failed to get referral plan: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_referral_plan",
    "Set referral plan configuration for a currency.",
    {
      currency: z.string().describe("Currency code"),
      enabled: z.boolean().optional().describe("Enable/disable referral plan"),
      follow_parent: z
        .boolean()
        .optional()
        .describe("Follow parent operator's referral plan"),
      max_tier: z.number().optional().describe("Max referral tier level"),
      plan_config: z
        .string()
        .optional()
        .describe("Referral plan config as JSON string"),
      payment_channel_rate: z
        .string()
        .optional()
        .describe("Payment channel rate percentage (e.g. '35' for 35%)"),
      third_party_game_rate: z
        .string()
        .optional()
        .describe("Third-party game rate percentage"),
    },
    async (params) => {
      try {
        const payload: Record<string, unknown> = {
          currency: params.currency,
        };
        if (params.enabled !== undefined) payload.enabled = params.enabled;
        if (params.follow_parent !== undefined)
          payload.follow_parent = params.follow_parent;
        if (params.max_tier !== undefined) payload.max_tier = params.max_tier;
        if (params.plan_config)
          payload.plan_config = JSON.parse(params.plan_config);
        if (params.payment_channel_rate)
          payload.payment_channel_rate = params.payment_channel_rate;
        if (params.third_party_game_rate)
          payload.third_party_game_rate = params.third_party_game_rate;
        const result = await client.request("referral/plan/set", payload);
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
              text: `Failed to set referral plan: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============ Dashboard ============

  server.tool(
    "get_affiliate_dashboard",
    "Get affiliate program dashboard summary.",
    {
      start_time: z.string().describe("Start time (ISO 8601)"),
      end_time: z.string().describe("End time (ISO 8601)"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/dashboard/get",
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
              text: `Failed to get affiliate dashboard: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_affiliate_trend",
    "Get affiliate program trend data over time.",
    {
      start_time: z.string().describe("Start time (ISO 8601)"),
      end_time: z.string().describe("End time (ISO 8601)"),
      group_by: z
        .string()
        .describe("Group by period (day, week, month)"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "affiliate/dashboard/trend/get",
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
              text: `Failed to get affiliate trend: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
