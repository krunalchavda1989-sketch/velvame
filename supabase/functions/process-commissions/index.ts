import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Core commission processing for a single order.
 *  Returns { distributed, total, breakdown } or null if skipped. */
async function processOrderCommissions(
  supabase: any,
  orderId: string,
  opts: { force?: boolean } = {}
) {
  // Idempotency — unless force mode (backfill)
  if (!opts.force) {
    const { data: existing } = await supabase
      .from("commissions")
      .select("id")
      .eq("order_id", orderId)
      .limit(1);
    if (existing && existing.length > 0) return null;
  }

  // If force mode, delete existing commissions and reverse wallet credits
  if (opts.force) {
    const { data: existingComm } = await supabase
      .from("commissions")
      .select("id, beneficiary_id, amount")
      .eq("order_id", orderId);

    if (existingComm && existingComm.length > 0) {
      // Reverse wallet credits for each existing commission
      for (const comm of existingComm) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance, total_earned, commission_balance")
          .eq("user_id", comm.beneficiary_id)
          .single();

        if (wallet) {
          const newBal = Math.max(0, Number(wallet.balance) - Number(comm.amount));
          await supabase
            .from("wallets")
            .update({
              balance: newBal,
              total_earned: Math.max(0, Number(wallet.total_earned) - Number(comm.amount)),
              commission_balance: Math.max(0, Number(wallet.commission_balance) - Number(comm.amount)),
            })
            .eq("user_id", comm.beneficiary_id);

          // Log the reversal
          await supabase.from("wallet_transactions").insert({
            user_id: comm.beneficiary_id,
            type: "debit",
            amount: Number(comm.amount),
            description: "Commission Reversal (System Reprocess)",
            closing_balance: newBal,
            balance_type: "commission",
          });
        }
      }

      // Delete old commissions
      await supabase.from("commissions").delete().eq("order_id", orderId);
    }
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (!order) return null;

  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("id, referred_by, user_id")
    .eq("user_id", order.user_id)
    .single();
  if (!buyerProfile?.referred_by) return null;

  const isRepurchase = order.is_repurchase;
  const commissionType = isRepurchase ? "repurchase" : "level";

  // Fetch dynamic commission levels from DB
  const { data: dbLevels } = await supabase
    .from("commission_levels")
    .select("level, rate, min_referrals, is_active, commission_type")
    .eq("commission_type", commissionType)
    .eq("is_active", true)
    .order("level", { ascending: true });

  if (!dbLevels || dbLevels.length === 0) return null;

  const levelConfigs = dbLevels.map((l: any) => ({
    rate: Number(l.rate) / 100,
    min_referrals: Number(l.min_referrals),
  }));
  const maxLevels = levelConfigs.length;

  // Fetch min monthly purchase for repurchase
  let minMonthlyPurchase = 1000;
  if (isRepurchase) {
    const { data: commSettings } = await supabase
      .from("commission_settings")
      .select("min_monthly_purchase")
      .limit(1)
      .single();
    if (commSettings?.min_monthly_purchase != null) {
      minMonthlyPurchase = Number(commSettings.min_monthly_purchase);
    }
  }

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
    return (data || []).reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);
  };

  if (isRepurchase && minMonthlyPurchase > 0) {
    const buyerMonthlyTotal = await getMonthlyPurchase(order.user_id);
    if (buyerMonthlyTotal < minMonthlyPurchase) return null;
  }

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

    const config = levelConfigs[level - 1];
    const isQualified = upline.direct_referral_count >= config.min_referrals;

    let beneficiaryPurchaseOk = true;
    if (isRepurchase && isQualified && minMonthlyPurchase > 0) {
      const uplineMonthlyTotal = await getMonthlyPurchase(upline.user_id);
      beneficiaryPurchaseOk = uplineMonthlyTotal >= minMonthlyPurchase;
    }

    if (isQualified && beneficiaryPurchaseOk) {
      const rate = config.rate;
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

    for (const { user_id, amount } of walletUpdates) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance, total_earned, commission_balance")
        .eq("user_id", user_id)
        .single();

      if (wallet) {
        const newBalance = Number(wallet.balance) + amount;
        await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            total_earned: Number(wallet.total_earned) + amount,
            commission_balance: Number(wallet.commission_balance) + amount,
          })
          .eq("user_id", user_id);

        await supabase.from("wallet_transactions").insert({
          user_id,
          type: "credit",
          amount,
          description: `${isRepurchase ? "Repurchase" : "Level"} Commission Earned`,
          closing_balance: newBalance,
          balance_type: "commission",
        });
      }
    }
  }

  const totalDistributed = commissionsToInsert.reduce(
    (sum, c) => sum + (c.amount as number),
    0
  );

  return {
    distributed: commissionsToInsert.length,
    total: Math.round(totalDistributed * 100) / 100,
    breakdown: commissionsToInsert.map((c) => ({
      level: c.level,
      rate: `${((c.rate as number) * 100).toFixed(1)}%`,
      amount: c.amount,
      beneficiary_id: c.beneficiary_id,
    })),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const body = await req.json();
    const action = body.action || "process_single";

    // ── ACTION: backfill_all ──
    // Processes orders in batches to avoid timeouts.
    // Accepts optional offset parameter for pagination.
    if (action === "backfill_all") {
      const batchSize = body.batch_size || 10;
      const offset = body.offset || 0;

      // Get qualifying orders (paginated)
      const { data: allOrders, error: ordersErr } = await supabase
        .from("orders")
        .select("id, order_number, user_id, total_amount, is_repurchase, status")
        .in("status", ["confirmed", "delivered", "shipped"])
        .order("created_at", { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (ordersErr) throw ordersErr;

      // Get total count for progress
      const { count: totalCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "delivered", "shipped"]);

      // Get current commission level counts
      const { data: levelLevels } = await supabase
        .from("commission_levels")
        .select("id")
        .eq("commission_type", "level")
        .eq("is_active", true);
      const { data: repurchaseLevels } = await supabase
        .from("commission_levels")
        .select("id")
        .eq("commission_type", "repurchase")
        .eq("is_active", true);

      const expectedLevelCount = levelLevels?.length || 0;
      const expectedRepurchaseCount = repurchaseLevels?.length || 0;

      const results: any[] = [];
      let processed = 0;
      let skipped = 0;

      for (const order of allOrders || []) {
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("referred_by")
          .eq("user_id", order.user_id)
          .single();

        if (!buyerProfile?.referred_by) {
          skipped++;
          continue;
        }

        const { count: existingCount } = await supabase
          .from("commissions")
          .select("id", { count: "exact", head: true })
          .eq("order_id", order.id);

        const expectedMax = order.is_repurchase
          ? expectedRepurchaseCount
          : expectedLevelCount;

        if ((existingCount || 0) >= expectedMax) {
          skipped++;
          continue;
        }

        try {
          const result = await processOrderCommissions(supabase, order.id, {
            force: true,
          });
          if (result && result.distributed > 0) {
            processed++;
            results.push({
              order_id: order.id,
              order_number: order.order_number,
              old_commissions: existingCount || 0,
              new_commissions: result.distributed,
              total_amount: result.total,
            });
          } else {
            skipped++;
          }
        } catch (err) {
          console.error(`Error processing order ${order.id}:`, err);
          results.push({
            order_id: order.id,
            order_number: order.order_number,
            error: String(err),
          });
        }
      }

      const hasMore = (allOrders?.length || 0) === batchSize;
      const nextOffset = hasMore ? offset + batchSize : null;

      return new Response(
        JSON.stringify({
          success: true,
          action: "backfill_all",
          total_orders: totalCount || 0,
          batch_offset: offset,
          batch_size: batchSize,
          processed,
          skipped,
          has_more: hasMore,
          next_offset: nextOffset,
          details: results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: process_single (default) ──
    const { order_id } = body;
    if (!order_id || typeof order_id !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "order_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(order_id)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order_id format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await processOrderCommissions(supabase, order_id);

    if (!result) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Already processed or no eligible upline",
          commissions_distributed: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        commissions_distributed: result.distributed,
        total_distributed: result.total,
        breakdown: result.breakdown,
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

    return new Response(
      JSON.stringify({ success: false, error: clientMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
