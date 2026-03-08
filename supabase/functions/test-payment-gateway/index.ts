import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // Check admin role
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { gateway } = await req.json();

    // Load saved gateway settings
    const { data: settingsData } = await serviceClient
      .from("pages_content")
      .select("content")
      .eq("page_slug", "payment-gateway-settings")
      .single();

    if (!settingsData?.content) {
      return new Response(
        JSON.stringify({ success: false, error: "No payment gateway settings found. Please save your settings first." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allSettings = settingsData.content as Record<string, any>;
    const gwSettings = allSettings[gateway];

    if (!gwSettings?.fields) {
      return new Response(
        JSON.stringify({ success: false, error: `No ${gateway} credentials found. Please save your settings first.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fields = gwSettings.fields;
    const isSandbox = gwSettings.sandbox || false;

    if (gateway === "razorpay") {
      const keyId = fields.key_id;
      const keySecret = fields.key_secret;
      if (!keyId || !keySecret) {
        return new Response(
          JSON.stringify({ success: false, error: "Razorpay Key ID and Key Secret are required" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
        headers: {
          Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        },
      });
      const body = await res.text();

      if (res.ok) {
        return new Response(
          JSON.stringify({ success: true, message: `Razorpay connection successful${isSandbox ? " (Sandbox)" : ""}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: `Razorpay authentication failed (${res.status})` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (gateway === "stripe") {
      const secretKey = fields.secret_key;
      if (!secretKey) {
        return new Response(
          JSON.stringify({ success: false, error: "Stripe Secret Key is required" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });
      const body = await res.text();

      if (res.ok) {
        return new Response(
          JSON.stringify({ success: true, message: `Stripe connection successful${isSandbox ? " (Test Mode)" : ""}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: `Stripe authentication failed (${res.status})` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (gateway === "phonepe") {
      const merchantId = fields.merchant_id;
      const saltKey = fields.salt_key;
      if (!merchantId || !saltKey) {
        return new Response(
          JSON.stringify({ success: false, error: "PhonePe Merchant ID and Salt Key are required" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // PhonePe doesn't have a simple ping endpoint; validate credentials format
      const isValidMerchant = merchantId.length >= 4;
      const isValidSalt = saltKey.length >= 8;

      if (isValidMerchant && isValidSalt) {
        return new Response(
          JSON.stringify({ success: true, message: `PhonePe credentials validated${isSandbox ? " (Sandbox)" : ""}. Full verification will occur on first transaction.` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "PhonePe credentials appear invalid. Merchant ID must be 4+ chars, Salt Key must be 8+ chars." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown gateway: ${gateway}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
