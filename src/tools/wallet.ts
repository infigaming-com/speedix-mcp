import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

const operatorIdParam = z
  .string()
  .optional()
  .describe(
    "Target operator ID. Omit to use the current operator. Provide a sub-operator ID when a parent account needs to manage a child operator's deposit reward config."
  );

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
      to_operator_id: z.string().describe("Target operator ID"),
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
    {
      operator_id: operatorIdParam,
      currency: z
        .string()
        .optional()
        .describe(
          "Currency code for currency-specific deposit reward settings. Defaults to operator's reporting currency if not specified."
        ),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/deposit-reward/config/get",
          {
            currency: params.currency,
            target_operator_context:
              client.buildTargetOperatorContext(params.operator_id),
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
      operator_id: operatorIdParam,
      currency: z
        .string()
        .optional()
        .describe("Currency code for the deposit reward sequences."),
      config: z
        .string()
        .describe("Deposit reward config as JSON string"),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "wallet/deposit-reward/sequences/set",
          {
            ...configObj,
            currency: params.currency,
            target_operator_context:
              client.buildTargetOperatorContext(params.operator_id),
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
              text: `Failed to set deposit rewards: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Wallet gamification config (per-currency bonus/withdrawal limits)
  server.tool(
    "get_wallet_gamification_config",
    "Get wallet gamification configuration including per-currency bonus bet limits, cash withdrawal wagering requirements, bonus enabled status, and global wallet settings (deduction type, cash/bonus ratio, clear bonus on withdrawal).",
    {
      operator_id: operatorIdParam,
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/gamification/get",
          {
            target_operator_context:
              client.buildTargetOperatorContext(params.operator_id),
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
              text: `Failed to get wallet gamification config: ${(e as Error).message}`,
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
      code_type: z
        .string()
        .optional()
        .describe("Filter by code type (one_time, universal)"),
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

  // Generate one-time promo codes
  server.tool(
    "generate_promo_codes",
    "Generate promo codes for a one_time campaign. For universal campaigns, use generate_universal_promo_codes instead.",
    {
      campaign_id: z.string().describe("Campaign ID to generate codes for"),
      count: z.number().describe("Number of codes to generate"),
      code_length: z
        .number()
        .optional()
        .describe("Length of generated codes"),
      code_format: z
        .string()
        .optional()
        .describe("Code format (e.g. alphanumeric)"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/promo-code/one-time/codes/generate",
          {
            campaignId: params.campaign_id,
            count: params.count,
            codeLength: params.code_length,
            codeFormat: params.code_format,
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
              text: `Failed to generate promo codes: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Generate universal promo codes
  server.tool(
    "generate_universal_promo_codes",
    "Generate codes for a universal campaign by providing custom code strings.",
    {
      campaign_id: z.string().describe("Campaign ID to generate codes for"),
      codes: z
        .array(z.string())
        .describe("Array of custom code strings (e.g. ['WELCOME2026', 'VIP50'])"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/promo-code/universal/codes/generate",
          {
            campaignId: params.campaign_id,
            codes: params.codes,
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
              text: `Failed to generate universal promo codes: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get promo campaign details (codes for one_time, usages for universal)
  server.tool(
    "get_promo_campaign_details",
    "Get details of a promo campaign — lists generated codes (for one_time) or usages (for universal).",
    {
      campaign_id: z.string().describe("Campaign ID"),
      user_id: z.string().optional().describe("Filter by user ID"),
      status: z.string().optional().describe("Filter by code status"),
      code: z.string().optional().describe("Filter by specific code"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/promo-code/campaign/details",
          {
            campaignId: params.campaign_id,
            userId: params.user_id,
            status: params.status,
            code: params.code,
            page: params.page,
            pageSize: params.page_size,
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
              text: `Failed to get campaign details: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update promo campaign
  server.tool(
    "update_promo_campaign",
    "Update an existing promo code campaign (cannot change status or code_type — use update_promo_campaign_status for status).",
    {
      campaign_id: z.string().describe("Campaign ID"),
      config: z
        .string()
        .describe(
          "Update fields as JSON string (name, maxUsageLimit, startTime, endTime, rewardConditions, rewardConfigs)"
        ),
    },
    async (params) => {
      try {
        const configObj = JSON.parse(params.config);
        const result = await client.request(
          "wallet/promo-code/campaign/update",
          {
            campaignId: params.campaign_id,
            ...configObj,
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
              text: `Failed to update promo campaign: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update promo campaign status
  server.tool(
    "update_promo_campaign_status",
    "Update the status of a promo code campaign.",
    {
      campaign_id: z.string().describe("Campaign ID"),
      status: z
        .enum(["active", "paused", "disabled"])
        .describe("New status"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/promo-code/campaign/status/update",
          {
            campaignId: params.campaign_id,
            status: params.status,
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
              text: `Failed to update campaign status: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List universal code usages
  server.tool(
    "list_universal_code_usages",
    "List the usages of a universal promo code campaign.",
    {
      campaign_id: z.string().describe("Campaign ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "wallet/promo-code/universal/usages/list",
          {
            campaignId: params.campaign_id,
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
              text: `Failed to list universal code usages: ${(e as Error).message}`,
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
