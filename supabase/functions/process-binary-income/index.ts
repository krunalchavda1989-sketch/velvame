import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Binary Income Processing
 *
 * Logic:
 * 1. Fetch binary_settings (matching_percentage, cap_amount, min_bv_for_payout)
 * 2. For each user with a binary_position:
 *    - Determine weak leg BV = min(total_left_bv, total_right_bv)
 *    - Determine strong leg BV = max(total_left_bv, total_right_bv)
 *    - If weak leg BV >= min_bv_for_payout → payout = weak_leg_bv * matching_percentage / 100
 *    - Cap payout at cap_amount
 *    - Carry forward: strong_leg carries (strong - weak), weak resets to 0
 *    - Insert binary_payouts record, credit wallet
 *    - Update binary_positions with new carry forward and reset current BV
 */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check — admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin access required");

    // Fetch settings
    const { data: settings } = await supabase
      .from("binary_settings")
      .select("*")
      .limit(1)
      .single();

    if (!settings || !settings.is_active) {
      return new Response(
        JSON.stringify({ success: true, message: "Binary plan is inactive", payouts: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matchingPct = Number(settings.matching_percentage);
    const capAmount = Number(settings.cap_amount);
    const minBv = Number(settings.min_bv_for_payout);

    // Fetch all binary positions
    const { data: positions, error: posErr } = await supabase
      .from("binary_positions")
      .select("*");
    if (posErr) throw posErr;

    const now = new Date().toISOString();
    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const results: any[] = [];

    for (const pos of positions || []) {
      const leftBv = Number(pos.total_left_bv) + Number(pos.carry_forward_left);
      const rightBv = Number(pos.total_right_bv) + Number(pos.carry_forward_right);

      const weakBv = Math.min(leftBv, rightBv);
      const strongBv = Math.max(leftBv, rightBv);

      if (weakBv < minBv) {
        // Not enough BV to qualify — carry forward everything
        await supabase
          .from("binary_positions")
          .update({
            carry_forward_left: leftBv,
            carry_forward_right: rightBv,
            left_bv: 0,
            right_bv: 0,
            total_left_bv: 0,
            total_right_bv: 0,
          })
          .eq("id", pos.id);
        continue;
      }

      let payout = Math.round(weakBv * matchingPct) / 100;
      if (payout > capAmount) payout = capAmount;

      // Carry forward: matched BV resets, excess on strong side carries
      const carryStrong = strongBv - weakBv;
      const isLeftStrong = leftBv >= rightBv;

      await supabase
        .from("binary_positions")
        .update({
          carry_forward_left: isLeftStrong ? carryStrong : 0,
          carry_forward_right: isLeftStrong ? 0 : carryStrong,
          left_bv: 0,
          right_bv: 0,
          total_left_bv: 0,
          total_right_bv: 0,
        })
        .eq("id", pos.id);

      // Insert payout record
      const { error: payErr } = await supabase.from("binary_payouts").insert({
        user_id: pos.user_id,
        weak_leg_bv: weakBv,
        strong_leg_bv: strongBv,
        matching_amount: payout,
        payout_percentage: matchingPct,
        period_start: periodStart,
        period_end: now,
        status: "approved",
      });
      if (payErr) {
        console.error("Payout insert error:", payErr);
        continue;
      }

      // Credit wallet (commission balance bucket)
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance, total_earned, commission_balance")
        .eq("user_id", pos.user_id)
        .single();

      if (wallet) {
        const newBalance = Number(wallet.balance) + payout;
        await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            total_earned: Number(wallet.total_earned) + payout,
            commission_balance: Number(wallet.commission_balance) + payout,
          })
          .eq("user_id", pos.user_id);

        // Log binary income transaction
        await supabase.from("wallet_transactions").insert({
          user_id: pos.user_id,
          type: "credit",
          amount: payout,
          description: "Binary Matching Income",
          closing_balance: newBalance,
          balance_type: "commission",
        });
      }

      results.push({
        user_id: pos.user_id,
        left_bv: leftBv,
        right_bv: rightBv,
        weak_bv: weakBv,
        payout,
        carry_forward: carryStrong,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payouts_processed: results.length,
        total_paid: results.reduce((s, r) => s + r.payout, 0),
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[Binary Income Error]", err);
    const msg = err instanceof Error ? err.message : "Processing failed";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
