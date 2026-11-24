import { PASS_CLAIMS } from "@/lib/pass-claims";
import { SCOPE_INFO, SCOPES } from "@/lib/scopes";
import { env } from "../env";
import { discoveryDocument } from "../oidc/provider";
import { checkPass } from "../passes";
import { corpusSize, searchDocs } from "./search";

/**
 * AmarID's Model Context Protocol server.
 *
 * It gives AI agents the same things a developer or a verifier gets from the
 * public site, and nothing more: documentation search, the integration facts,
 * and the public pass check. Every tool is read-only and none of them can see
 * a person's record, so the server needs no credentials.
 *
 * Transport: Streamable HTTP in its stateless form (one JSON-RPC message per
 * POST, one JSON response). There are no server-initiated messages, so no
 * session or event stream is needed.
 */

export const SERVER_INFO = { name: "amarid", title: "AmarID", version: "1.0.0" };
const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

type Json = Record<string, unknown>;
type Tool = { name: string; title: string; description: string; inputSchema: Json; run: (args: Json) => Promise<unknown> | unknown };

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const tools: Tool[] = [
  {
    name: "search_docs",
    title: "Search AmarID documentation",
    description:
      "Search AmarID's architecture, security and integration documentation. Returns the best-matching passages with their section headings. Use it to answer how AmarID works, what it stores, what is simulated in the sandbox, and how to integrate.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What you want to know, in plain words.", minLength: 2, maxLength: 300 },
        limit: { type: "integer", description: "How many passages to return (1-8).", minimum: 1, maximum: 8, default: 4 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    run: (args) => {
      const query = typeof args.query === "string" ? args.query.slice(0, 300) : "";
      if (query.trim().length < 2) throw new ToolError("`query` must be a string of at least 2 characters.");
      const limit = typeof args.limit === "number" ? Math.floor(args.limit) : 4;
      const hits = searchDocs(query, limit);
      return { query, passages: hits, note: hits.length === 0 ? "No passage matched. Try different words." : undefined };
    },
  },
  {
    name: "verify_pass",
    title: "Check a verification pass",
    description:
      "Check an AmarID verification pass: a signed token a person shares to prove facts such as 'real person' or 'over 18' without showing a document. Returns whether it is valid, the facts it carries and when it expires. It never returns a name unless the person put it in the pass.",
    inputSchema: {
      type: "object",
      properties: { token: { type: "string", description: "The pass token (a JWT).", minLength: 20, maxLength: 4000 } },
      required: ["token"],
      additionalProperties: false,
    },
    run: async (args) => {
      const token = typeof args.token === "string" ? args.token.trim() : "";
      if (token.length < 20 || token.length > 4000) throw new ToolError("`token` must be a pass token.");
      return checkPass(token);
    },
  },
  {
    name: "list_scopes",
    title: "List what a partner can ask for",
    description: "List the OpenID Connect scopes AmarID supports, the claims each one releases, and which are limited to regulated partners. Also lists the facts a verification pass can carry.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => ({
      scopes: SCOPES.map((scope) => ({
        scope,
        claims: SCOPE_INFO[scope].claims,
        required: !!SCOPE_INFO[scope].required,
        reveals_personal_attribute: SCOPE_INFO[scope].personal,
        regulated_partners_only: !!SCOPE_INFO[scope].regulated,
      })),
      pass_facts: PASS_CLAIMS,
      never_released: ["NID or passport number", "document image", "face image or template", "fingerprint", "Universal ID"],
    }),
  },
  {
    name: "get_openid_configuration",
    title: "Get the OpenID Connect configuration",
    description: "Return AmarID's OpenID Connect discovery document: issuer, endpoints, supported scopes, claims and algorithms. Use it to configure a relying party.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => ({ ...discoveryDocument(), sandbox: env().sandbox }),
  },
];

class ToolError extends Error {}

const resources = [
  { uri: "amarid://openid-configuration", name: "OpenID Connect configuration", mimeType: "application/json", read: () => JSON.stringify({ ...discoveryDocument(), sandbox: env().sandbox }, null, 2) },
  {
    uri: "amarid://scopes",
    name: "Scopes and claims",
    mimeType: "application/json",
    read: () => JSON.stringify(Object.fromEntries(SCOPES.map((s) => [s, SCOPE_INFO[s]])), null, 2),
  },
];

const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });

/** Handles one JSON-RPC message. Returns null for notifications, which get no reply. */
export async function handleMessage(message: unknown): Promise<Json | null> {
  if (!message || typeof message !== "object" || Array.isArray(message)) return rpcError(null, -32600, "Invalid request");
  const { id, method, params } = message as { id?: unknown; method?: unknown; params?: Json };
  if (typeof method !== "string") return rpcError(id, -32600, "Invalid request");
  if (id === undefined || id === null) return null; // a notification, such as notifications/initialized

  switch (method) {
    case "initialize": {
      const requested = typeof params?.protocolVersion === "string" ? params.protocolVersion : "";
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {}, resources: {} },
        serverInfo: SERVER_INFO,
        instructions: `AmarID is a privacy-first digital identity provider for Bangladesh. Use search_docs (${corpusSize()} passages) for how it works and what is simulated, list_scopes and get_openid_configuration to integrate sign-in, and verify_pass to check a pass someone shared. All tools are read-only. This server cannot look up a person.`,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: tools.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema, annotations: { title, ...readOnly } })) });
    case "tools/call": {
      const tool = tools.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${String(params?.name)}`);
      const args = params?.arguments && typeof params.arguments === "object" ? (params.arguments as Json) : {};
      try {
        const output = await tool.run(args);
        return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(output, null, 2) }], structuredContent: output, isError: false });
      } catch (error) {
        // Tool failures are reported in the result so the model can read and correct them.
        const text = error instanceof ToolError ? error.message : "The tool failed. Try again later.";
        if (!(error instanceof ToolError)) console.error("[amarid mcp] tool failed:", tool.name, error);
        return rpcResult(id, { content: [{ type: "text", text }], isError: true });
      }
    }
    case "resources/list":
      return rpcResult(id, { resources: resources.map(({ uri, name, mimeType }) => ({ uri, name, mimeType })) });
    case "resources/read": {
      const resource = resources.find((r) => r.uri === params?.uri);
      if (!resource) return rpcError(id, -32002, "Resource not found");
      return rpcResult(id, { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: resource.read() }] });
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export const toolNames = () => tools.map((t) => t.name);
