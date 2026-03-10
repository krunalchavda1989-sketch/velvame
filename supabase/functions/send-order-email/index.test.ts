import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-order-email`;

Deno.test("Rejects request with no Authorization header", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ order_id: "test", email_type: "order_success" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("Rejects request with invalid Bearer token", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer invalid-token-12345",
    },
    body: JSON.stringify({ order_id: "test", email_type: "order_success" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("CORS preflight returns 200", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
    },
  });
  await res.text();
  assertEquals(res.status, 200);
});
