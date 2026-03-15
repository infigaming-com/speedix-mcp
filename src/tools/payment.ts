import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerPaymentTools(server: McpServer, client: MeepoClient) {
  // List payment methods
  server.tool(
    "list_payment_methods",
    "List configured payment methods for the operator.",
    {},
    async () => {
      try {
        const result = await client.request("payment/methods/list", {});
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
              text: `Failed to list payment methods: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List supported payment methods
  server.tool(
    "list_supported_payment_methods",
    "List all payment methods/processors supported by the platform.",
    {},
    async () => {
      try {
        const result = await client.request(
          "payment/supported-methods/list",
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
              text: `Failed to list supported methods: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create payment method
  server.tool(
    "create_payment_method",
    "Add a new payment method/processor to the operator.",
    {
      config: z
        .string()
        .describe(
          "Payment method config as JSON string (method type, credentials, settings)"
        ),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "payment/method/create",
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
              text: `Failed to create payment method: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List payment transactions
  server.tool(
    "list_payment_transactions",
    "List payment transaction history (deposits and withdrawals).",
    {
      type: z
        .enum(["deposit", "withdrawal"])
        .optional()
        .describe("Transaction type filter"),
      status: z.string().optional().describe("Status filter"),
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "payment/transactions/list",
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
              text: `Failed to list transactions: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
