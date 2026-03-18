import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

/**
 * Build operator_context_filters from an operator_id.
 * Used by company/retailer accounts to query sub-operator data.
 */
function buildOperatorContextFilters(operatorId: string) {
  return {
    operator_contexts: [{ operator_id: operatorId }],
  };
}

/**
 * Build a TimeRange object from ms timestamps.
 * The backoffice report API expects { type, start_time, end_time } with ISO 8601 strings.
 */
function buildTimeRange(startMs: number, endMs: number) {
  return {
    type: "day",
    start_time: new Date(startMs).toISOString().slice(0, 10),
    end_time: new Date(endMs).toISOString().slice(0, 10),
  };
}

/**
 * Build the common report request body from params.
 * Extracts start_time, end_time, operator_id and converts to the expected format.
 */
function buildReportBody(params: {
  start_time: number;
  end_time: number;
  operator_id?: string;
  currency?: string;
  [key: string]: unknown;
}) {
  const { start_time, end_time, operator_id, currency, ...rest } = params;
  const body: Record<string, unknown> = {
    time_range: buildTimeRange(start_time, end_time),
    ...rest,
  };
  if (operator_id) {
    body.operator_context_filters = buildOperatorContextFilters(operator_id);
  }
  if (currency) {
    body.currencies = [currency];
  }
  return body;
}

export function registerReportTools(server: McpServer, client: MeepoClient) {
  // Get summary report
  server.tool(
    "get_report_summary",
    "Get aggregated summary report (users, revenue, GGR, NGR, deposits, withdrawals). Use operator_id to query a specific sub-operator's data.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request("report/summary/get", body);
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
              text: `Failed to get summary: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List summary reports (daily breakdown)
  server.tool(
    "list_report_summaries",
    "List summary reports with daily/period breakdown.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request("report/summary/list", body);
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
              text: `Failed to list summaries: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Game data summary
  server.tool(
    "get_game_data_summary",
    "Get game performance summary (bets, wins, GGR by provider/category).",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      provider_id: z.string().optional().describe("Filter by provider"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request("report/game-data/get", body);
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
              text: `Failed to get game data summary: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List game data (detailed breakdown)
  server.tool(
    "list_game_data",
    "List detailed game data breakdown by provider/game.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      provider_id: z.string().optional().describe("Filter by provider"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request("report/game-data/list", body);
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
              text: `Failed to list game data: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Deposit summaries
  server.tool(
    "get_deposit_summaries",
    "Get deposit summary report (total deposits, unique depositors, FTD conversion).",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request(
          "report/deposit-summaries/get",
          body
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
              text: `Failed to get deposit summaries: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Deposit details
  server.tool(
    "list_deposit_details",
    "List detailed deposit records.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request(
          "report/deposit-details/list",
          body
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
              text: `Failed to list deposit details: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Withdrawal summaries
  server.tool(
    "get_withdrawal_summaries",
    "Get withdrawal summary report.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request(
          "report/withdraw-summaries/get",
          body
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
              text: `Failed to get withdrawal summaries: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Withdrawal details
  server.tool(
    "list_withdrawal_details",
    "List detailed withdrawal records.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request(
          "report/withdraw-details/list",
          body
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
              text: `Failed to list withdrawal details: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Player retention
  server.tool(
    "list_player_retention",
    "List player registration retention data.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request(
          "report/register-retention/list",
          body
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
              text: `Failed to list retention data: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Player game data
  server.tool(
    "get_player_game_data",
    "Get player-level game data summary.",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      user_id: z.string().optional().describe("Filter by user ID"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const body = buildReportBody(params);
        const result = await client.request(
          "report/player-game-data/list",
          body
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
              text: `Failed to get player game data: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Customer record
  server.tool(
    "get_customer_record",
    "Get detailed customer record report for a specific user.",
    {
      user_id: z.string().describe("User ID"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      try {
        const { operator_id, ...rest } = params;
        const body: Record<string, unknown> = { ...rest };
        if (operator_id) {
          body.operator_context_filters = buildOperatorContextFilters(operator_id);
        }
        const result = await client.request(
          "report/customer-record/get",
          body
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
              text: `Failed to get customer record: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Referral VTG report
  server.tool(
    "list_referral_report",
    "List referral program report data (VTG, snapshot, contribution, or lifetime).",
    {
      report_type: z
        .enum(["vtg", "snapshot", "contribution", "lifetime"])
        .describe("Report type"),
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      const { report_type, ...rest } = params;
      const body = buildReportBody(rest);
      try {
        const result = await client.request(
          `report/referral/${report_type}/list`,
          body
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
              text: `Failed to list referral report: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Affiliate report
  server.tool(
    "list_affiliate_report",
    "List affiliate program report data (VTG or snapshot).",
    {
      report_type: z
        .enum(["vtg", "snapshot"])
        .describe("Report type"),
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
      operator_id: z.string().optional().describe("Target operator ID (for company/retailer accounts to query sub-operator data)"),
    },
    async (params) => {
      const { report_type, ...rest } = params;
      const body = buildReportBody(rest);
      try {
        const result = await client.request(
          `report/affiliate/${report_type}/list`,
          body
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
              text: `Failed to list affiliate report: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
