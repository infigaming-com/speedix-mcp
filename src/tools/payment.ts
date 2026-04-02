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
        const result = await client.request("payment/method/list", {});
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
          "payment/supportedmethod/list",
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
    "List payment transaction history (deposits and withdrawals). Supports filtering by transaction ID, user ID, currency, and more.",
    {
      transaction_id: z
        .string()
        .optional()
        .describe("Filter by transaction ID (exact match)"),
      user_id: z
        .string()
        .optional()
        .describe("Filter by user ID"),
      currency: z.string().optional().describe("Filter by currency code"),
      type: z
        .enum(["deposit", "withdrawal"])
        .optional()
        .describe("Transaction type filter"),
      status: z
        .enum(["processing", "successful", "failed"])
        .optional()
        .describe("Status filter"),
      payment_method: z
        .string()
        .optional()
        .describe("Filter by payment method"),
      payment_channel: z
        .string()
        .optional()
        .describe("Filter by payment channel"),
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      min_amount: z
        .string()
        .optional()
        .describe("Minimum transaction amount"),
      max_amount: z
        .string()
        .optional()
        .describe("Maximum transaction amount"),
      pa_transaction_ids: z
        .array(z.string())
        .optional()
        .describe("Filter by PA (payment aggregator) transaction IDs"),
      gateway_transaction_ids: z
        .array(z.string())
        .optional()
        .describe("Filter by gateway transaction IDs"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        // Map friendly enum values to proto enum values
        const typeMap: Record<string, string> = {
          deposit: "TRANSACTION_TYPE_DEPOSIT",
          withdrawal: "TRANSACTION_TYPE_WITHDRAW",
        };
        const statusMap: Record<string, string> = {
          processing: "TRANSACTION_STATUS_PROCESSING",
          successful: "TRANSACTION_STATUS_SUCCESSFUL",
          failed: "TRANSACTION_STATUS_FAILED",
        };

        const payload: Record<string, unknown> = {};
        if (params.transaction_id)
          payload.transaction_id = params.transaction_id;
        if (params.user_id) payload.user_id = params.user_id;
        if (params.currency) payload.currency = params.currency;
        if (params.type) payload.type = typeMap[params.type];
        if (params.status) payload.status = statusMap[params.status];
        if (params.payment_method)
          payload.payment_method = params.payment_method;
        if (params.payment_channel)
          payload.payment_channel = params.payment_channel;
        if (params.start_time) payload.start_time = params.start_time;
        if (params.end_time) payload.end_time = params.end_time;
        if (params.min_amount) payload.min_amount = params.min_amount;
        if (params.max_amount) payload.max_amount = params.max_amount;
        if (params.pa_transaction_ids)
          payload.pa_transaction_ids = params.pa_transaction_ids;
        if (params.gateway_transaction_ids)
          payload.gateway_transaction_ids = params.gateway_transaction_ids;
        if (params.page) payload.page = params.page;
        if (params.page_size) payload.page_size = params.page_size;

        const result = await client.request(
          "payment/transaction/page",
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
              text: `Failed to list transactions: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get payment transaction detail by ID
  server.tool(
    "get_payment_transaction",
    "Get detailed information about a specific payment transaction by its ID.",
    {
      transaction_id: z
        .string()
        .describe("The payment transaction ID to look up"),
    },
    async (params) => {
      try {
        const result = await client.request("payment/transaction/detail", {
          transaction_id: params.transaction_id,
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
              text: `Failed to get transaction detail: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List payment channels
  server.tool(
    "list_payment_channels",
    "List payment channels (deposit/withdrawal) configured for the operator. Shows channel details including fees, limits, and status.",
    {
      type: z
        .enum(["all", "deposit", "withdrawal"])
        .optional()
        .describe("Channel type filter (default: all)"),
      currency: z.string().optional().describe("Filter by currency code"),
      payment_method: z
        .string()
        .optional()
        .describe("Filter by payment method"),
      category: z.string().optional().describe("Filter by category"),
      protocol: z.string().optional().describe("Filter by crypto protocol"),
      network: z.string().optional().describe("Filter by crypto network"),
      country: z.string().optional().describe("Filter by country"),
      enable: z.boolean().optional().describe("Filter by enabled status"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const typeMap: Record<string, string> = {
          all: "CHANNEL_TYPE_ALL",
          deposit: "CHANNEL_TYPE_DEPOSIT",
          withdrawal: "CHANNEL_TYPE_WITHDRAW",
        };

        const payload: Record<string, unknown> = {};
        if (params.type) payload.type = typeMap[params.type];
        if (params.currency) payload.currency = params.currency;
        if (params.payment_method)
          payload.payment_method = params.payment_method;
        if (params.category) payload.category = params.category;
        if (params.protocol) payload.protocol = params.protocol;
        if (params.network) payload.network = params.network;
        if (params.country) payload.country = params.country;
        if (params.enable !== undefined) payload.enable = params.enable;
        if (params.page) payload.page = params.page;
        if (params.page_size) payload.page_size = params.page_size;

        const result = await client.request(
          "payment/channel/page",
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
              text: `Failed to list payment channels: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create payment channel
  server.tool(
    "create_payment_channel",
    "Create a new payment channel for the operator.",
    {
      config: z
        .string()
        .describe(
          "Payment channel config as JSON string (merchant_id, payment_method_id, contact, fixed_fee, fee_rate, min_fee, user_fixed_fee, user_fee_rate, user_min_fee, min_amount, max_amount, key, remark, sort_order)"
        ),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "payment/channel/create",
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
              text: `Failed to create payment channel: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update payment channel
  server.tool(
    "update_payment_channel",
    "Update an existing payment channel's configuration (fees, limits, status).",
    {
      payment_channel_id: z
        .string()
        .describe("The payment channel ID to update"),
      config: z
        .string()
        .describe(
          "Update fields as JSON string (fixed_fee, fee_rate, min_fee, user_fixed_fee, user_fee_rate, user_min_fee, min_amount, max_amount, enable, key, remark, sort_order)"
        ),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request("payment/channel/update", {
          payment_channel_id: params.payment_channel_id,
          ...configObj,
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
              text: `Failed to update payment channel: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
