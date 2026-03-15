#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

async function main() {
  const config = loadConfig();
  const { server, client } = createServer(config);

  // Validate credentials at startup
  try {
    await client.connect();
    console.error("[speedix-mcp] Connected to Meepo API");
  } catch (e) {
    console.error(
      `[speedix-mcp] Warning: Initial login failed: ${(e as Error).message}`
    );
    console.error("[speedix-mcp] Will retry on first API call");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[speedix-mcp] Server started");
}

main().catch((e) => {
  console.error(`[speedix-mcp] Fatal error: ${(e as Error).message}`);
  process.exit(1);
});
