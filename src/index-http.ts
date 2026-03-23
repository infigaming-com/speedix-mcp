#!/usr/bin/env node
/**
 * HTTP entry point for speedix-mcp.
 *
 * Exposes the MCP server over a single POST endpoint (Streamable HTTP,
 * MCP SDK ≥ 1.12) so it can be deployed as a K8s service and used by
 * Dify Agent nodes.
 *
 * Endpoints:
 *   POST /mcp    — initialize a new session OR call a tool on an existing one
 *   GET  /health — liveness / readiness probe
 *
 * Session lifecycle:
 *   1. Client sends  POST /mcp  { method: "initialize", ... }
 *      → Server creates a new session, returns mcp-session-id in response header
 *   2. Client sends  POST /mcp  (header: mcp-session-id: <id>) for tool calls
 *   3. Session is cleaned up automatically when the transport closes
 *
 * Environment variables:
 *   PORT               — HTTP listen port (default: 3000)
 *   MEEPO_EMAIL        — Meepo backoffice login email
 *   MEEPO_PASSWORD     — Meepo backoffice login password
 *   MEEPO_TOTP_SECRET  — (optional) TOTP secret for automatic 2FA login
 *   MEEPO_API_BASE_URL — (optional) API base URL (default: https://apiport.xyz)
 *   MEEPO_ORIGIN       — (optional) Backoffice origin header
 */

import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const config = loadConfig();

interface Session {
  transport: StreamableHTTPServerTransport;
}

// In-memory session registry.
// NOTE: single-replica only — a pod restart clears all sessions (clients
// will simply reinitialize on the next request, which is fine for Dify).
const sessions = new Map<string, Session>();

// ─── helpers ─────────────────────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function jsonReply(
  res: http.ServerResponse,
  status: number,
  body: unknown
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

// ─── POST /mcp ───────────────────────────────────────────────────────────────

async function handlePost(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const raw = await readBody(req);
  let body: { method?: string; [k: string]: unknown };
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    jsonReply(res, 400, { error: "Invalid JSON body" });
    return;
  }

  // ── initialize: create a brand-new McpServer + transport pair ────────────
  if (body.method === "initialize") {
    const sessionId = randomUUID();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    transport.onclose = () => {
      sessions.delete(sessionId);
      console.error(`[speedix-mcp-http] session closed: ${sessionId}`);
    };

    const { server, client } = createServer(config);

    // Attempt initial auth — non-fatal, retried automatically on first API call.
    client.connect().catch((e: Error) => {
      console.error(`[speedix-mcp-http] initial login warning: ${e.message}`);
    });

    await server.connect(transport);
    sessions.set(sessionId, { transport });
    console.error(`[speedix-mcp-http] session initialized: ${sessionId}`);

    await transport.handleRequest(req, res, body);
    return;
  }

  // ── tool call / other: route to an existing session ──────────────────────
  const sessionId =
    (req.headers["mcp-session-id"] as string | undefined) ?? "";
  const sess = sessions.get(sessionId);

  if (!sess) {
    jsonReply(res, 400, {
      error: "No valid session — send an initialize request first.",
    });
    return;
  }

  await sess.transport.handleRequest(req, res, body);
}

// ─── HTTP server ─────────────────────────────────────────────────────────────

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/health" && req.method === "GET") {
      jsonReply(res, 200, { status: "ok", sessions: sessions.size });
      return;
    }

    if (url.pathname === "/mcp" && req.method === "POST") {
      await handlePost(req, res);
      return;
    }

    jsonReply(res, 404, { error: "Not found" });
  } catch (e) {
    console.error("[speedix-mcp-http] unhandled error:", e);
    if (!res.headersSent) {
      jsonReply(res, 500, { error: "Internal server error" });
    }
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.error(`[speedix-mcp-http] listening on port ${PORT}`);
  console.error(
    `[speedix-mcp-http] MCP endpoint → POST http://0.0.0.0:${PORT}/mcp`
  );
});
