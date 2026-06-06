// Master Admin AI Assistant — chat that can read and modify system data via tool calls.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const MASTER_ADMIN_EMAIL = "shweta1112025@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

// ---- SQL safety helpers ----
function stripSqlComments(sql: string) {
  return sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim().replace(/;+\s*$/g, "");
}
function isSingleStatement(sql: string) {
  return !stripSqlComments(sql).includes(";");
}
const FORBIDDEN_TABLES = /\b(auth\.|storage\.|vault\.|user_roles|admin_sub_users|pg_|information_schema)\b/i;

function validateSelect(sql: string): string | null {
  const s = stripSqlComments(sql);
  if (!isSingleStatement(s)) return "Only one statement allowed.";
  if (!/^\s*(select|with)\b/i.test(s)) return "Only SELECT or WITH queries allowed.";
  if (/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke)\b/i.test(s)) return "Mutations not allowed in query.";
  if (FORBIDDEN_TABLES.test(s)) return "Access to restricted schema/table denied.";
  return null;
}
function validateMutation(sql: string): string | null {
  const s = stripSqlComments(sql);
  if (!isSingleStatement(s)) return "Only one statement allowed.";
  if (!/^\s*(update|insert|delete)\b/i.test(s)) return "Only UPDATE/INSERT/DELETE allowed here.";
  if (/^\s*(update|delete)\b/i.test(s) && !/\bwhere\b/i.test(s)) return "UPDATE/DELETE require a WHERE clause.";
  if (/\b(drop|alter|create|truncate|grant|revoke)\b/i.test(s)) return "DDL not allowed.";
  if (FORBIDDEN_TABLES.test(s)) return "Access to restricted schema/table denied.";
  return null;
}

async function runRawSql(sql: string) {
  // Use PostgREST RPC-style via PG over service role using the REST endpoint is not available for raw SQL.
  // Fall back to the database fetch using PostgREST's "rpc" is not available either — use the SQL endpoint via pg:
  // Supabase exposes PostgREST only. We use the admin REST query via the "pg-meta" not available.
  // Workaround: use the Deno postgres driver.
  const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  const client = new Client(dbUrl);
  await client.connect();
  try {
    const res = await client.queryObject(sql);
    return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
  } finally {
    await client.end();
  }
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "run_query",
      description: "Run a read-only SQL SELECT (or WITH) query against the public schema to inspect system data. Returns up to 100 rows. Use this to look up users, orders, commissions, products, etc.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "A single SELECT or WITH statement. Add LIMIT 100 or smaller." },
          reason: { type: "string", description: "Short reason this query is needed." },
        },
        required: ["sql"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_mutation",
      description: "Run a single INSERT, UPDATE, or DELETE statement on a public-schema table to correct or update data. UPDATE/DELETE must include a WHERE clause. Only call after confirming the change with the user.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "Single INSERT/UPDATE/DELETE statement with a WHERE clause where applicable. Use RETURNING * when useful." },
          reason: { type: "string", description: "Why this change is being made." },
        },
        required: ["sql", "reason"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are the Master Admin AI Assistant for the Velvame MLM + e-commerce platform.

You have direct, read/write access to the application's Postgres database via two tools:
- run_query(sql): read-only SELECT/WITH on the public schema
- execute_mutation(sql): a single INSERT/UPDATE/DELETE with WHERE clause

Key tables you may use: profiles, wallets, wallet_transactions, orders, order_items, products, product_variations, commissions, payments, withdrawals, kyc_documents, notifications, coupons, categories, banners, reviews, addresses, subscriptions.

Rules:
1. Always investigate with run_query first. Read actual rows before suggesting fixes.
2. Before any execute_mutation, summarize the change in plain English and ask the user to confirm with "yes" / "confirm". Do NOT call execute_mutation until the user explicitly confirms in the current conversation.
3. Never touch auth, storage, vault, user_roles, or admin_sub_users tables.
4. Prefer surgical updates with id-based WHERE clauses. Use RETURNING * to verify.
5. When a user references a VM ID like VM518, look up profiles.referral_code first to get the user_id.
6. Money columns are numeric INR. Wallet has subscription_balance + commission_balance = balance.
7. Use markdown tables for query results. Be concise.
8. If a request is ambiguous or risky, ask a clarifying question first.`;

interface ChatMsg { role: "system" | "user" | "assistant" | "tool"; content: string; tool_calls?: any; tool_call_id?: string; name?: string; }

async function callGateway(messages: ChatMsg[]) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${t}`);
  }
  return await resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Missing token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (userData.user.email !== MASTER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Master admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const incoming: ChatMsg[] = body.messages || [];

    const messages: ChatMsg[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...incoming.map((m) => ({ role: m.role, content: m.content, ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}), ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}) })),
    ];

    // Tool-call loop (max 6 iterations)
    const toolLog: Array<{ tool: string; sql: string; ok: boolean; result?: any; error?: string }> = [];

    for (let i = 0; i < 6; i++) {
      const data = await callGateway(messages);
      const choice = data.choices?.[0];
      if (!choice) break;
      const msg = choice.message;
      messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return new Response(JSON.stringify({ reply: msg.content || "", toolLog }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (const tc of msg.tool_calls) {
        const fnName = tc.function?.name;
        let args: any = {};
        try { args = JSON.parse(tc.function?.arguments || "{}"); } catch {}
        const sql = String(args.sql || "");
        let toolResult: any;

        try {
          if (fnName === "run_query") {
            const err = validateSelect(sql);
            if (err) throw new Error(err);
            const r = await runRawSql(sql);
            toolResult = { ok: true, rowCount: r.rowCount, rows: r.rows.slice(0, 100) };
            toolLog.push({ tool: "run_query", sql, ok: true, result: { rowCount: r.rowCount } });
          } else if (fnName === "execute_mutation") {
            const err = validateMutation(sql);
            if (err) throw new Error(err);
            const r = await runRawSql(sql);
            toolResult = { ok: true, rowCount: r.rowCount, rows: r.rows.slice(0, 20) };
            toolLog.push({ tool: "execute_mutation", sql, ok: true, result: { rowCount: r.rowCount } });
          } else {
            throw new Error(`Unknown tool ${fnName}`);
          }
        } catch (e: any) {
          toolResult = { ok: false, error: e?.message || String(e) };
          toolLog.push({ tool: fnName, sql, ok: false, error: toolResult.error });
        }

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: fnName,
          content: JSON.stringify(toolResult).slice(0, 12000),
        });
      }
    }

    return new Response(JSON.stringify({ reply: "I hit the tool-call limit. Please try a simpler request.", toolLog }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("admin-ai-assistant error", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
