import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
// Commission rates
const LEVEL_RATES = [0.05, 0.045, 0.04, 0.035, 0.03, 0.025, 0.02, 0.015, 0.01];
const REPURCHASE_RATES = [0.03, 0.02, 0.01];
const QUALIFICATION_REQUIRED = [1, 3, 3, 3, 3, 6, 6, 6, 6];

async function processCommissions(serviceClient: any, orderId: string) {
  // Idempotency check
  const { data: existing } = await serviceClient
    .from("commissions")
    .select("id")
    .eq("order_id", orderId)
    .limit(1);
  if (existing && existing.length > 0) return;

  const { data: order } = await serviceClient
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const { data: buyerProfile } = await serviceClient
    .from("profiles")
    .select("id, referred_by, user_id")
    .eq("user_id", order.user_id)
    .single();
  if (!buyerProfile?.referred_by) return;

  const isRepurchase = order.is_repurchase;
  const maxLevels = isRepurchase ? 3 : 9;
  const rates = isRepurchase ? REPURCHASE_RATES : LEVEL_RATES;
  const commissionType = isRepurchase ? "repurchase" : "level";

  const commissionsToInsert: Record<string, unknown>[] = [];
  const walletUpdates: { user_id: string; amount: number }[] = [];
  let currentProfileId: string | null = buyerProfile.referred_by;

  for (let level = 1; level <= maxLevels; level++) {
    if (!currentProfileId) break;
    const { data: upline } = await serviceClient
      .from("profiles")
      .select("id, user_id, direct_referral_count, referred_by")
      .eq("id", currentProfileId)
      .single();
    if (!upline) break;

    if (upline.direct_referral_count >= QUALIFICATION_REQUIRED[level - 1]) {
      const rate = rates[level - 1];
      const amount = Math.round(order.total_amount * rate * 100) / 100;
      commissionsToInsert.push({
        order_id: order.id, beneficiary_id: upline.user_id,
        source_user_id: order.user_id, level, rate, amount,
        commission_type: commissionType, status: "pending",
      });
      walletUpdates.push({ user_id: upline.user_id, amount });
    }
    currentProfileId = upline.referred_by ?? null;
  }

  if (commissionsToInsert.length > 0) {
    await serviceClient.from("commissions").insert(commissionsToInsert);
    for (const { user_id, amount } of walletUpdates) {
      const { data: wallet } = await serviceClient
        .from("wallets")
        .select("balance, total_earned")
        .eq("user_id", user_id)
        .single();
      if (wallet) {
        await serviceClient.from("wallets").update({
          balance: Number(wallet.balance) + amount,
          total_earned: Number(wallet.total_earned) + amount,
        }).eq("user_id", user_id);
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
  const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return new Response(JSON.stringify({ error: "Razorpay credentials not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth
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

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create_order") {
      const { amount, purpose, order_ref_id } = body;
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create Razorpay order
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // paise
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      const rzpOrder = await rzpRes.json();
      if (!rzpRes.ok) {
        throw new Error(`Razorpay order creation failed [${rzpRes.status}]: ${JSON.stringify(rzpOrder)}`);
      }

      // Save to payments table
      const { error: insertError } = await supabase.from("payments").insert({
        user_id: userId,
        razorpay_order_id: rzpOrder.id,
        amount,
        purpose: purpose || "subscription",
        order_ref_id: order_ref_id || null,
      });

      if (insertError) throw new Error(`Payment record insert failed: ${insertError.message}`);

      return new Response(
        JSON.stringify({
          order_id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          key_id: RAZORPAY_KEY_ID,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify_payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return new Response(JSON.stringify({ error: "Missing payment details" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify signature using HMAC SHA256
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(RAZORPAY_KEY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signaturePayload));
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== razorpay_signature) {
        // Update payment as failed
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await serviceClient
          .from("payments")
          .update({ status: "failed" })
          .eq("razorpay_order_id", razorpay_order_id);

        return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use service role to update payment & profile
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Update payment record
      await serviceClient
        .from("payments")
        .update({
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
        })
        .eq("razorpay_order_id", razorpay_order_id);

      // Get payment to check purpose
      const { data: payment } = await serviceClient
        .from("payments")
        .select("purpose, user_id")
        .eq("razorpay_order_id", razorpay_order_id)
        .single();

      // If subscription payment, activate user
      if (payment?.purpose === "subscription") {
        await serviceClient
          .from("profiles")
          .update({
            subscription_paid: true,
            subscription_date: new Date().toISOString(),
          })
          .eq("user_id", payment.user_id);
      }

      // If shop payment, update order status and process commissions
      if (payment?.purpose === "shop") {
        const { data: paymentRecord } = await serviceClient
          .from("payments")
          .select("order_ref_id")
          .eq("razorpay_order_id", razorpay_order_id)
          .single();

        if (paymentRecord?.order_ref_id) {
          await serviceClient
            .from("orders")
            .update({ status: "confirmed", payment_method: "razorpay" })
            .eq("id", paymentRecord.order_ref_id);

          // Auto-process commissions for the confirmed order
          try {
            await processCommissions(serviceClient, paymentRecord.order_ref_id);
          } catch (commErr) {
            console.error("Commission processing error (non-fatal):", commErr);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: "paid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Razorpay error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
