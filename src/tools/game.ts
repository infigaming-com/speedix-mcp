import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerGameTools(server: McpServer, client: MeepoClient) {
  // List game providers
  server.tool(
    "list_game_providers",
    "List all game providers available to the current operator.",
    {
      with_detail: z
        .boolean()
        .optional()
        .describe("Include provider details (game counts, status)"),
    },
    async (params) => {
      try {
        const path = params.with_detail
          ? "game/providers-with-detail/list"
          : "game/providers/list";
        const result = await client.request(path, {});
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
              text: `Failed to list providers: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List games
  server.tool(
    "list_games",
    "List games with optional filters (provider, category, name, status).",
    {
      provider_id: z.string().optional().describe("Filter by provider ID"),
      category: z.string().optional().describe("Filter by category"),
      name: z.string().optional().describe("Search by game name"),
      enabled: z.boolean().optional().describe("Filter by enabled status"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("game/list", params);
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
              text: `Failed to list games: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List game categories
  server.tool(
    "list_game_categories",
    "List all game categories.",
    {},
    async () => {
      try {
        const result = await client.request("game/categories/list", {});
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
              text: `Failed to list categories: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update game (enable/disable)
  server.tool(
    "update_game",
    "Enable or disable a specific game for the current operator.",
    {
      game_id: z.string().describe("Game ID"),
      enabled: z.boolean().describe("Whether the game is enabled"),
    },
    async (params) => {
      try {
        const result = await client.request("game/update", params);
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
              text: `Failed to update game: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update provider (enable/disable)
  server.tool(
    "update_game_provider",
    "Enable or disable a game provider for the current operator.",
    {
      provider_id: z.string().describe("Provider ID"),
      enabled: z.boolean().describe("Whether the provider is enabled"),
    },
    async (params) => {
      try {
        const result = await client.request("game/provider/update", params);
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
              text: `Failed to update provider: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List provider rates
  server.tool(
    "list_provider_rates",
    "List fee/commission rates for game providers.",
    {
      provider_id: z.string().optional().describe("Filter by provider ID"),
    },
    async (params) => {
      try {
        const result = await client.request(
          "game/provider/rates/list",
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
              text: `Failed to list provider rates: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List game tags
  server.tool(
    "list_game_tags",
    "List game tags for the operator. Tags are used to categorize and organize games on the frontend.",
    {},
    async () => {
      try {
        const result = await client.request("game/tags/list", {});
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
              text: `Failed to list game tags: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create game tag
  server.tool(
    "create_game_tag",
    "Create a new game tag for organizing games on the frontend.",
    {
      name: z.string().describe("Tag name"),
      icon: z.string().optional().describe("Tag icon URL"),
    },
    async (params) => {
      try {
        const result = await client.request("game/tags/create", params);
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
              text: `Failed to create game tag: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // List bets
  server.tool(
    "list_bets",
    "List game bet records with optional filters.",
    {
      user_id: z.number().optional().describe("Filter by user ID"),
      provider_id: z.string().optional().describe("Filter by provider"),
      game_id: z.string().optional().describe("Filter by game"),
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const result = await client.request("game/bets/list", params);
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
              text: `Failed to list bets: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get bet by ID
  server.tool(
    "get_bet",
    "Get detailed information about a specific bet.",
    {
      bet_id: z.string().describe("Bet ID"),
    },
    async (params) => {
      try {
        const result = await client.request("game/bets/get", params);
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
              text: `Failed to get bet: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
