import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MeepoClient } from "../client/api.js";

export function registerReviewTools(server: McpServer, client: MeepoClient) {
  // List withdrawal review tickets
  server.tool(
    "list_tickets",
    "List withdrawal review tickets. Use this to look up tickets by ticket_id, user_id, status, or time range.",
    {
      ticket_id: z.string().optional().describe("Filter by ticket ID"),
      user_id: z.string().optional().describe("Filter by user ID"),
      status: z
        .string()
        .optional()
        .describe(
          "Filter by status: pending, approved, rejected, manual_payout, paying, paid, failed"
        ),
      currency: z.string().optional().describe("Filter by currency"),
      start_time: z.number().optional().describe("Start timestamp (ms)"),
      end_time: z.number().optional().describe("End timestamp (ms)"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Page size"),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {};
        if (params.ticket_id) body.ticket_id = Number(params.ticket_id);
        if (params.user_id) body.user_id = Number(params.user_id);
        if (params.status) body.status = params.status;
        if (params.currency) body.currency = params.currency;
        if (params.start_time)
          body.start_time = { seconds: Math.floor(params.start_time / 1000) };
        if (params.end_time)
          body.end_time = { seconds: Math.floor(params.end_time / 1000) };
        if (params.page) body.page = params.page;
        if (params.page_size) body.page_size = params.page_size;

        const result = await client.request("review/tickets/list", body);
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
              text: `Failed to list tickets: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get ticket details
  server.tool(
    "get_ticket",
    "Get detailed information about a specific withdrawal review ticket, including payment info, wallet balances, and comments.",
    {
      ticket_id: z.string().describe("Ticket ID"),
      include_comments: z
        .boolean()
        .optional()
        .describe("Include comments in the response (default: true)"),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          ticket_id: Number(params.ticket_id),
          include_comments: params.include_comments ?? true,
        };

        const result = await client.request("review/tickets/get", body);
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
              text: `Failed to get ticket: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Review (approve/reject) a ticket
  server.tool(
    "review_ticket",
    "Approve, reject, or manually pay out a withdrawal ticket.",
    {
      ticket_id: z.string().describe("Ticket ID"),
      action: z
        .enum(["approve", "reject", "manual_payout"])
        .describe("Review action"),
      review_comment: z
        .string()
        .optional()
        .describe("Review comment / reason"),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          ticket_id: Number(params.ticket_id),
          action: params.action,
        };
        if (params.review_comment)
          body.review_comment = params.review_comment;

        const result = await client.request("review/tickets/review", body);
        return {
          content: [
            {
              type: "text",
              text: `Ticket ${params.ticket_id} ${params.action}d successfully.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to review ticket: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Cancel a ticket
  server.tool(
    "cancel_ticket",
    "Cancel a pending withdrawal ticket.",
    {
      ticket_id: z.string().describe("Ticket ID"),
    },
    async (params) => {
      try {
        const result = await client.request("review/tickets/cancel", {
          ticket_id: Number(params.ticket_id),
        });
        return {
          content: [
            {
              type: "text",
              text: `Ticket ${params.ticket_id} cancelled successfully.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to cancel ticket: ${(e as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
