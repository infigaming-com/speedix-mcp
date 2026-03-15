import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  // New operator setup guide
  server.prompt(
    "new_operator_setup",
    "Step-by-step guide for creating and configuring a new operator.",
    {
      company_name: z
        .string()
        .optional()
        .describe("Company name if creating a new company"),
      operator_name: z
        .string()
        .optional()
        .describe("Operator name if creating under existing company"),
    },
    async (params) => {
      const target = params.operator_name
        ? `operator "${params.operator_name}"`
        : params.company_name
          ? `company "${params.company_name}"`
          : "a new operator";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Help me set up ${target} on the Meepo platform. Walk me through the complete setup process step by step:

1. **Create the entity** - Create the company or operator with the required details
2. **Configure currencies** - Set up supported fiat and crypto currencies
3. **Configure games** - Enable game providers and manage game catalog
4. **Configure domains** - Set up frontend and backoffice subdomains
5. **Configure payment methods** - Add payment processors and channels
6. **Configure registration** - Set up player registration flow and requirements
7. **Configure deposit rewards** - Set up welcome bonuses and daily rewards
8. **Review & Go Live** - Final checks before setting status to "live"

For each step, use the available tools to check current state and make changes. Ask me for any required information before proceeding.`,
            },
          },
        ],
      };
    }
  );

  // Operator health check
  server.prompt(
    "operator_health_check",
    "Comprehensive health check for the current operator - reviews balances, game status, payment config, and key metrics.",
    {},
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Perform a comprehensive health check for the current operator. Check the following areas and provide a summary:

1. **Operator Status** - Use get_operator_details to check current status, configuration, and domains
2. **Wallet Balances** - Use get_operator_balances to check if balances are healthy across currencies
3. **Currency Config** - Use list_wallet_currencies to verify all needed currencies are enabled
4. **Game Providers** - Use list_game_providers to check which providers are enabled/disabled
5. **Financial Summary** - Use get_balance_summary to review financial health
6. **Recent Activity** - Use get_report_summary for the last 7 days to check user activity and revenue

Provide a structured report with:
- Overall health status (Healthy / Warning / Critical)
- Summary per category
- Any issues or recommendations
- Key metrics (GGR, active users, deposit volume)`,
            },
          },
        ],
      };
    }
  );

  // Financial review
  server.prompt(
    "financial_review",
    "Generate a financial review report for a specific time period.",
    {
      period: z
        .enum(["last_7_days", "last_30_days", "last_quarter", "custom"])
        .describe("Review period"),
      start_time: z
        .string()
        .optional()
        .describe("Custom start time (ISO date string)"),
      end_time: z
        .string()
        .optional()
        .describe("Custom end time (ISO date string)"),
    },
    async (params) => {
      let timeDesc: string;
      if (params.period === "custom" && params.start_time && params.end_time) {
        timeDesc = `from ${params.start_time} to ${params.end_time}`;
      } else {
        const periodMap = {
          last_7_days: "the last 7 days",
          last_30_days: "the last 30 days",
          last_quarter: "the last quarter (90 days)",
          custom: "the specified period",
        };
        timeDesc = periodMap[params.period];
      }

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Generate a comprehensive financial review report for ${timeDesc}. Include:

1. **Revenue Overview** - Use get_report_summary for total GGR, NGR, and revenue trends
2. **Deposit Analysis** - Use get_deposit_summaries for deposit volume, unique depositors, FTD rate
3. **Withdrawal Analysis** - Use get_withdrawal_summaries for withdrawal patterns
4. **Game Performance** - Use get_game_data_summary for revenue by provider/category
5. **Invoice Status** - Use list_invoices for billing status
6. **Revenue Share** - Use list_revenue_shares for commission tracking
7. **Third-Party Costs** - Use list_third_party_fees for payment processing costs

Present the report with:
- Executive summary (3-5 key takeaways)
- Detailed metrics tables
- Period-over-period comparison where possible
- Recommendations for optimization`,
            },
          },
        ],
      };
    }
  );

  // Operator comparison
  server.prompt(
    "operator_comparison",
    "Compare performance metrics across operators.",
    {},
    async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Help me compare the performance of operators under my account.

1. First, use list_operators or list_bottom_operators to get all operators
2. For each operator, gather key metrics:
   - Current balance status
   - Revenue (GGR/NGR) for the last 30 days
   - Active user count
   - Deposit/withdrawal volumes
3. Present a comparison table with rankings
4. Highlight top performers and underperformers
5. Provide actionable recommendations

Note: You may need to switch operator context for each one, or query aggregate data from the current level.`,
            },
          },
        ],
      };
    }
  );
}
