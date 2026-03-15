import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerWalletTools(server: McpServer, client: MeepoClient) {
  // List wallet currencies
  server.tool(
    "list_wallet_currencies",
    "List all currencies configured for the operator's wallet.",
    {},
    async () => {
      try {
        const result = await client.request("wallet/currencies/list", {});
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
              text: `Failed to list currencies: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Add wallet currency
  server.tool(
    "add_wallet_currency",
    "Add a new currency to the operator's wallet.",
    {
      currency: z.string().describe("Currency code (e.g. USD, BTC)"),
      currency_type: z
        .enum(["fiat", "crypto"])
        .describe("Currency type"),
      enabled: z.boolean().optional().describe("Enable immediately (default true)"),
    },
    async (params) => {
      try {
        const result = await client.request("wallet/currencies/add", params);
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
              text: `Failed to add currency: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update wallet currency
  server.tool(
    "update_wallet_currency",
    "Update a currency's settings (enable/disable, visibility).",
    {
      currency: z.string().describe("Currency code"),
      enabled: z.boolean().optional().describe("Enable/disable"),
      hidden: z.boolean().optional().describe("Hide from player view"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/currencies/update",
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
              text: `Failed to update currency: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get operator balances
  server.tool(
    "get_operator_balances",
    "Get the operator's cash balances across all currencies.",
    {},
    async () => {
      try {
        const result = await client.request(
          "wallet/operator/balances/list",
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
              text: `Failed to get balances: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get single operator balance
  server.tool(
    "get_operator_balance",
    "Get the operator's balance for a specific currency.",
    {
      currency: z.string().describe("Currency code"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/operator/balance/get",
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
              text: `Failed to get balance: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Operator transfer
  server.tool(
    "operator_transfer",
    "Transfer funds between operators. Only USD/USDT/USDC (1:1 exchange) are supported.",
    {
      to_operator_id: z.number().describe("Target operator ID"),
      currency: z.string().describe("Currency (USD, USDT, or USDC)"),
      amount: z.string().describe("Amount to transfer"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/operator/transfer",
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
              text: `Failed to transfer: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Operator swap
  server.tool(
    "operator_swap",
    "Swap funds between different currencies within the same operator.",
    {
      from_currency: z.string().describe("Source currency"),
      to_currency: z.string().describe("Target currency"),
      amount: z.string().describe("Amount to swap"),
    },
    async (params) => {
      try {
        const result = await client.request("wallet/operator/swap", params);
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
              text: `Failed to swap: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List operator transactions
  server.tool(
    "list_operator_transactions",
    "List the operator's balance transaction history.",
    {
      currency: z.string().optional().describe("Filter by currency"),
      transaction_type: z
        .string()
        .optional()
        .describe("Filter by type (transfer, swap, freeze, settle)"),
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/operator/transactions/list",
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

  // Get exchange rates
  server.tool(
    "get_exchange_rates",
    "Get current exchange rates between currencies.",
    {},
    async () => {
      try {
        const result = await client.request(
          "wallet/exchange-rates/get",
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
              text: `Failed to get exchange rates: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Deposit reward config
  server.tool(
    "get_deposit_reward_config",
    "Get the deposit reward (welcome bonus / daily bonus) configuration.",
    {},
    async () => {
      try {
        const result = await client.request(
          "wallet/deposit-reward/config/get",
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
              text: `Failed to get deposit reward config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_deposit_reward_sequences",
    "Set deposit reward sequences (welcome bonus tiers, daily bonus config).",
    {
      config: z
        .string()
        .describe("Deposit reward config as JSON string"),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "wallet/deposit-reward/sequences/set",
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
              text: `Failed to set deposit rewards: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Promo code management
  server.tool(
    "list_promo_campaigns",
    "List promo code campaigns.",
    {
      status: z
        .string()
        .optional()
        .describe("Filter by status (active, paused, disabled)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/promo-code/campaigns/list",
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
              text: `Failed to list promo campaigns: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_promo_campaign",
    "Create a new promo code campaign.",
    {
      config: z
        .string()
        .describe(
          "Campaign config as JSON string (name, type, limits, rewards, dates)"
        ),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "wallet/promo-code/campaign/create",
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
              text: `Failed to create promo campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Generate promo codes
  server.tool(
    "generate_promo_codes",
    "Generate promo codes for an existing campaign.",
    {
      campaign_id: z.number().describe("Campaign ID to generate codes for"),
      quantity: z.number().describe("Number of codes to generate"),
      prefix: z.string().optional().describe("Code prefix (e.g. 'WELCOME')"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/promo-code/generate",
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
              text: `Failed to generate promo codes: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // FICA threshold config
  server.tool(
    "get_fica_config",
    "Get FICA (KYC/AML) threshold configuration.",
    {},
    async () => {
      try {
        const result = await client.request("wallet/fica/config/get", {});
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
              text: `Failed to get FICA config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "set_fica_config",
    "Set FICA (KYC/AML) threshold configuration for financial transaction limits.",
    {
      config: z.string().describe("FICA config as JSON string"),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "wallet/fica/config/set",
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
              text: `Failed to set FICA config: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
