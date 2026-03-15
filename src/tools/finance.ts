import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerFinanceTools(server: McpServer, client: MeepoClient) {
  // List invoices
  server.tool(
    "list_invoices",
    "List financial invoices for the operator.",
    {
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("finance/invoices/list", params);
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
              text: `Failed to list invoices: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get invoice detail
  server.tool(
    "get_invoice_detail",
    "Get detailed information about a specific invoice.",
    {
      invoice_id: z.number().describe("Invoice ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "finance/invoice/detail",
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
              text: `Failed to get invoice detail: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List revenue shares
  server.tool(
    "list_revenue_shares",
    "List operator revenue share records.",
    {
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "finance/revenue-shares/list",
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
              text: `Failed to list revenue shares: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List third-party fees
  server.tool(
    "list_third_party_fees",
    "List third-party payment processing fees.",
    {
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "finance/third-party-fees/list",
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
              text: `Failed to list third-party fees: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List adjustments
  server.tool(
    "list_adjustments",
    "List financial adjustments.",
    {
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "finance/adjustments/list",
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
              text: `Failed to list adjustments: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Add adjustment
  server.tool(
    "add_adjustment",
    "Add a financial adjustment to an operator.",
    {
      config: z
        .string()
        .describe(
          "Adjustment config as JSON string (type, amount, currency, description)"
        ),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "finance/adjustment/add",
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
              text: `Failed to add adjustment: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Revenue share rate configs
  server.tool(
    "list_revenue_share_rate_configs",
    "List revenue share rate configurations.",
    {},
    async () => {
      try {
        const result = await client.request(
          "finance/revenue-share-rate-configs/list",
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
              text: `Failed to list rate configs: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Invoice summary
  server.tool(
    "get_invoice_summary",
    "Get invoice summary for the operator.",
    {
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "finance/invoices/summary",
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
              text: `Failed to get invoice summary: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Balance summary
  server.tool(
    "get_balance_summary",
    "Get the operator's financial balance summary.",
    {},
    async () => {
      try {
        const result = await client.request(
          "finance/balance/summary",
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
              text: `Failed to get balance summary: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tax report config
  server.tool(
    "get_tax_report_config",
    "Get the tax report configuration.",
    {},
    async () => {
      try {
        const result = await client.request(
          "finance/tax-report-configs/get",
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
              text: `Failed to get tax report config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List tax reports
  server.tool(
    "list_tax_reports",
    "List generated tax reports.",
    {
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "finance/tax-reports/list",
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
              text: `Failed to list tax reports: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
