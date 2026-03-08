import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 9-level commission rates (first-purchase / level income)
const LEVEL_RATES = [0.05, 0.045, 0.04, 0.035, 0.03, 0.025, 0.02, 0.015, 0.01];

// 3-level commission rates (repurchase income)
const REPURCHASE_RATES = [0.03, 0.02, 0.01];

// Minimum direct referrals required to qualify for each level
// L1: 1, L2-L5: 3, L6-L9: 6
const QUALIFICATION_REQUIRED = [1, 3, 3, 3, 3, 6, 6, 6, 6];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for elevated DB access (wallet updates, etc.)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) throw new Error("Forbidden: admin access required");

    const { order_id } = await req.json();
    if (!order_id || typeof order_id !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(order_id)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderError || !order) throw new Error("Order not found");

    // Idempotency check — don't process twice
    const { data: existing } = await supabase
      .from("commissions")
      .select("id")
      .eq("order_id", order_id)
      .limit(1);
    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Already processed", commissions_distributed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch buyer profile
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("id, referred_by, user_id")
      .eq("user_id", order.user_id)
      .single();

    if (!buyerProfile?.referred_by) {
      return new Response(
        JSON.stringify({ success: true, message: "No upline — no commissions distributed", commissions_distributed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isRepurchase = order.is_repurchase;
    const maxLevels = isRepurchase ? 3 : 9;
    const rates = isRepurchase ? REPURCHASE_RATES : LEVEL_RATES;
    const commissionType = isRepurchase ? "repurchase" : "level";

    // Fetch dynamic min monthly purchase from settings
    let minMonthlyPurchase = 1000; // fallback default
    if (isRepurchase) {
      const { data: bSettings } = await supabase
        .from("binary_settings")
        .select("min_monthly_purchase")
        .limit(1)
        .single();
      if (bSettings?.min_monthly_purchase != null) {
        minMonthlyPurchase = Number(bSettings.min_monthly_purchase);
      }
    }

    // Helper: get total purchase amount for a user in the current month
    const getMonthlyPurchase = async (userId: string): Promise<number> => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { data } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("user_id", userId)
        .gte("created_at", monthStart)
        .lt("created_at", monthEnd)
        .in("status", ["confirmed", "delivered", "shipped", "pending"]);
      return (data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
    };

    // For repurchase income, verify the buyer (source) meets minimum monthly purchase
    if (isRepurchase && minMonthlyPurchase > 0) {
      const buyerMonthlyTotal = await getMonthlyPurchase(order.user_id);
      if (buyerMonthlyTotal < minMonthlyPurchase) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Buyer monthly purchase ₹${buyerMonthlyTotal} is below minimum ₹${minMonthlyPurchase} — no repurchase commissions`,
            commissions_distributed: 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Walk up the upline chain level by level
    const commissionsToInsert: Record<string, unknown>[] = [];
    const walletUpdates: { user_id: string; amount: number }[] = [];

    let currentProfileId: string | null = buyerProfile.referred_by;

    for (let level = 1; level <= maxLevels; level++) {
      if (!currentProfileId) break;

      const { data: upline } = await supabase
        .from("profiles")
        .select("id, user_id, direct_referral_count, referred_by")
        .eq("id", currentProfileId)
        .single();

      if (!upline) break;

      const minReferrals = isRepurchase ? 1 : QUALIFICATION_REQUIRED[level - 1];
      const isQualified = upline.direct_referral_count >= minReferrals;

      // For repurchase income, also check that the beneficiary has min monthly purchase
      let beneficiaryPurchaseOk = true;
      if (isRepurchase && isQualified) {
        const uplineMonthlyTotal = await getMonthlyPurchase(upline.user_id);
        beneficiaryPurchaseOk = uplineMonthlyTotal >= MIN_MONTHLY_PURCHASE;
      }

      if (isQualified && beneficiaryPurchaseOk) {
        const rate = rates[level - 1];
        const amount = Math.round(order.total_amount * rate * 100) / 100;

        commissionsToInsert.push({
          order_id: order.id,
          beneficiary_id: upline.user_id,
          source_user_id: order.user_id,
          level,
          rate,
          amount,
          commission_type: commissionType,
          status: "pending",
        });

        walletUpdates.push({ user_id: upline.user_id, amount });
      }

      currentProfileId = upline.referred_by ?? null;
    }

    // Insert commission records
    if (commissionsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from("commissions")
        .insert(commissionsToInsert);
      if (insertErr) throw insertErr;

      // Update each beneficiary's wallet
      for (const { user_id, amount } of walletUpdates) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance, total_earned")
          .eq("user_id", user_id)
          .single();

        if (wallet) {
          await supabase
            .from("wallets")
            .update({
              balance: Number(wallet.balance) + amount,
              total_earned: Number(wallet.total_earned) + amount,
            })
            .eq("user_id", user_id);
        }
      }
    }

    const totalDistributed = commissionsToInsert.reduce(
      (sum, c) => sum + (c.amount as number),
      0
    );

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        is_repurchase: isRepurchase,
        commission_type: commissionType,
        commissions_distributed: commissionsToInsert.length,
        total_distributed: Math.round(totalDistributed * 100) / 100,
        breakdown: commissionsToInsert.map((c) => ({
          level: c.level,
          rate: `${((c.rate as number) * 100).toFixed(1)}%`,
          amount: c.amount,
          beneficiary_id: c.beneficiary_id,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[Commission Processing Error]", err);

    let clientMessage = "Commission processing failed";
    if (err instanceof Error) {
      const msg = err.message;
      if (msg === "Unauthorized" || msg === "Missing Authorization header") {
        clientMessage = "Authentication required";
      } else if (msg.includes("admin access required")) {
        clientMessage = "Insufficient permissions";
      } else if (msg.includes("Order not found")) {
        clientMessage = "Order not found";
      }
    }

    return new Response(JSON.stringify({ success: false, error: clientMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
