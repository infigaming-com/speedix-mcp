import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MeepoClient } from "./client/api.js";
import type { Config } from "./config.js";
import { registerAuthTools } from "./tools/auth.js";
import { registerOperatorTools } from "./tools/operator.js";
import { registerGameTools } from "./tools/game.js";
import { registerWalletTools } from "./tools/wallet.js";
import { registerFinanceTools } from "./tools/finance.js";
import { registerReportTools } from "./tools/report.js";
import { registerPaymentTools } from "./tools/payment.js";
import { registerVipTools } from "./tools/vip.js";
import { registerAffiliateTools } from "./tools/affiliate.js";
import { registerCrmTools } from "./tools/crm.js";
import { registerAccountTools } from "./tools/account.js";
import { registerNotificationTools } from "./tools/notification.js";
import { registerUserTools } from "./tools/user.js";
import { registerPrompts } from "./prompts/templates.js";

export function createServer(config: Config): {
  server: McpServer;
  client: MeepoClient;
} {
  const server = new McpServer({
    name: "speedix-mcp",
    version: "0.2.0",
  });

  const client = new MeepoClient(config);

  // Register all tool modules (auth first for bootstrap flow)
  registerAuthTools(server, client);
  registerOperatorTools(server, client);
  registerGameTools(server, client);
  registerWalletTools(server, client);
  registerFinanceTools(server, client);
  registerReportTools(server, client);
  registerPaymentTools(server, client);
  registerVipTools(server, client);
  registerAffiliateTools(server, client);
  registerCrmTools(server, client);
  registerAccountTools(server, client);
  registerNotificationTools(server, client);
  registerUserTools(server, client);

  // Register prompts
  registerPrompts(server);

  return { server, client };
}
