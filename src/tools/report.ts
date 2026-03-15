import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerReportTools(server: McpServer, client: MeepoClient) {
  // Get summary report
  server.tool(
    "get_report_summary",
    "Get aggregated summary report (users, revenue, GGR, NGR, deposits, withdrawals).",
    {
      start_time: z.number().describe("Start timestamp (ms)"),
      end_time: z.number().describe("End timestamp (ms)"),
      currency: z.string().optional().describe("Filter by currency"),
    },
    async (params) => {
      try {
        const result = await client.request("report/summary/get", params);
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
    },
    async (params) => {
      try {
        const result = await client.request("report/summary/list", params);
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
    },
    async (params) => {
      try {
        const result = await client.request("report/game-data/get", params);
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
    },
    async (params) => {
      try {
        const result = await client.request("report/game-data/list", params);
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
    },
    async (params) => {
      try {
        const result = await client.request(
          "report/deposit-summaries/get",
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
    },
    async (params) => {
      try {
        const result = await client.request(
          "report/deposit-details/list",
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
    },
    async (params) => {
      try {
        const result = await client.request(
          "report/withdraw-summaries/get",
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
    },
    async (params) => {
      try {
        const result = await client.request(
          "report/withdraw-details/list",
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
    },
    async (params) => {
      try {
        const result = await client.request(
          "report/register-retention/list",
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
      user_id: z.number().optional().describe("Filter by user ID"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "report/player-game-data/list",
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
      user_id: z.number().describe("User ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "report/customer-record/get",
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
    },
    async (params) => {
      const { report_type, ...rest } = params;
      try {
        const result = await client.request(
          `report/referral/${report_type}/list`,
          rest
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
    },
    async (params) => {
      const { report_type, ...rest } = params;
      try {
        const result = await client.request(
          `report/affiliate/${report_type}/list`,
          rest
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
