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

  // Reference month for eligibility = the month the ORDER was placed (not now())
  // This makes processing timing-agnostic: upline can repurchase earlier OR later
  // in the same calendar month and still qualify when the order is (re)processed.
  const orderDate = new Date(order.created_at);
  const refMonthStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).toISOString();
  const refMonthEnd = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 1).toISOString();

  const getMonthlyPurchase = async (userId: string): Promise<number> => {
    const { data } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("user_id", userId)
      .gte("created_at", refMonthStart)
      .lt("created_at", refMonthEnd)
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
    if (isRepurchase && isQualified) {
      // Beneficiary must have made a repurchase order in the same month as the ORDER
      const { count: repurchaseCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", upline.user_id)
        .eq("is_repurchase", true)
        .gte("created_at", refMonthStart)
        .lt("created_at", refMonthEnd)
        .in("status", ["confirmed", "delivered", "shipped", "pending"]);

      if (!repurchaseCount || repurchaseCount === 0) {
        currentProfileId = upline.referred_by ?? null;
        continue;
      }

      if (minMonthlyPurchase > 0) {
        const uplineMonthlyTotal = await getMonthlyPurchase(upline.user_id);
        beneficiaryPurchaseOk = uplineMonthlyTotal >= minMonthlyPurchase;
      }
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

    const body = await req.json();
    const action = body.action || "process_single";

    // Special path: scheduled end-of-month repurchase distribution.
    // No admin auth required, but guarded by server-side date check:
    // only runs if today is the last day of the current month.
    let user: any = null;
    const isScheduledEom =
      action === "process_monthly_repurchase" && body.eom_only === true;

    if (isScheduledEom) {
      const today = new Date();
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const isLastDayOfMonth = tomorrow.getDate() === 1;
      if (!isLastDayOfMonth) {
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "Not end of month" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Verify caller is an admin (or service role)
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Missing Authorization header");

      const token = authHeader.replace("Bearer ", "");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const isServiceRole = token === serviceRoleKey;

      if (!isServiceRole) {
        const { data: { user: authedUser }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authedUser) throw new Error("Unauthorized");
        user = authedUser;

        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleRow) throw new Error("Forbidden: admin access required");
      }
    }

    // ── ACTION: fix_rates ──
    // Corrects stored rates & amounts in all commission records to match current commission_levels config
    if (action === "fix_rates") {
      const { data: levelConfigs } = await supabase
        .from("commission_levels")
        .select("level, rate, commission_type")
        .eq("is_active", true);

      if (!levelConfigs || levelConfigs.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "No commission levels configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build rate lookup: "level|repurchase" => decimal rate
      const rateMap: Record<string, number> = {};
      for (const lc of levelConfigs) {
        // For repurchase, levels are stored as 101+ in config but 1+ in commissions
        const commLevel = lc.commission_type === "repurchase" ? lc.level - 100 : lc.level;
        rateMap[`${commLevel}|${lc.commission_type}`] = Number(lc.rate) / 100;
      }

      // Fetch ALL commissions with order amounts
      const { data: allComm, error: commErr } = await supabase
        .from("commissions")
        .select("id, level, rate, amount, commission_type, order_id, beneficiary_id");
      if (commErr) throw commErr;

      // Fetch all relevant orders
      const orderIds = [...new Set((allComm || []).map((c: any) => c.order_id))];
      const orderAmounts: Record<string, number> = {};
      for (let i = 0; i < orderIds.length; i += 50) {
        const batch = orderIds.slice(i, i + 50);
        const { data: orders } = await supabase
          .from("orders")
          .select("id, total_amount")
          .in("id", batch);
        for (const o of orders || []) {
          orderAmounts[o.id] = Number(o.total_amount);
        }
      }

      let fixed = 0;
      const walletAdjustments: Record<string, number> = {};

      for (const c of allComm || []) {
        const key = `${c.level}|${c.commission_type}`;
        const correctRate = rateMap[key];
        if (correctRate === undefined) continue;

        const orderAmt = orderAmounts[c.order_id];
        if (!orderAmt) continue;

        const correctAmount = Math.round(orderAmt * correctRate * 100) / 100;
        const currentAmount = Number(c.amount);
        const currentRate = Number(c.rate);

        if (Math.abs(currentRate - correctRate) > 0.0001 || Math.abs(currentAmount - correctAmount) > 0.01) {
          await supabase
            .from("commissions")
            .update({ rate: correctRate, amount: correctAmount })
            .eq("id", c.id);

          const diff = currentAmount - correctAmount;
          if (Math.abs(diff) > 0.001) {
            walletAdjustments[c.beneficiary_id] = (walletAdjustments[c.beneficiary_id] || 0) + diff;
          }
          fixed++;
        }
      }

      // Adjust wallets
      for (const [userId, adjustment] of Object.entries(walletAdjustments)) {
        if (Math.abs(adjustment) < 0.01) continue;

        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance, total_earned, commission_balance")
          .eq("user_id", userId)
          .single();

        if (wallet) {
          const newBalance = Math.max(0, Number(wallet.balance) - adjustment);
          const newTotalEarned = Math.max(0, Number(wallet.total_earned) - adjustment);
          const newCommBalance = Math.max(0, Number(wallet.commission_balance) - adjustment);

          await supabase
            .from("wallets")
            .update({ balance: newBalance, total_earned: newTotalEarned, commission_balance: newCommBalance })
            .eq("user_id", userId);

          await supabase.from("wallet_transactions").insert({
            user_id: userId,
            type: adjustment > 0 ? "debit" : "credit",
            amount: Math.abs(Math.round(adjustment * 100) / 100),
            description: "Commission Rate Correction (System Audit)",
            closing_balance: newBalance,
            balance_type: "commission",
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: "fix_rates",
          records_fixed: fixed,
          wallet_adjustments: Object.keys(walletAdjustments).length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // ── ACTION: process_monthly_repurchase ──
    // Designed to run on the last date of each month via pg_cron.
    // Reprocesses every repurchase order for the target month so that uplines who
    // qualified later in the month (e.g. last-date repurchase) get their commissions.
    // Body params (optional): { year, month } — month is 1-12. Defaults to current month.
    if (action === "process_monthly_repurchase") {
      const now = new Date();
      const year = Number(body.year) || now.getFullYear();
      const month = Number(body.month) || now.getMonth() + 1; // 1-12
      const monthStart = new Date(year, month - 1, 1).toISOString();
      const monthEnd = new Date(year, month, 1).toISOString();

      const { data: monthOrders, error: moErr } = await supabase
        .from("orders")
        .select("id, order_number, user_id, total_amount, is_repurchase, status, created_at")
        .eq("is_repurchase", true)
        .in("status", ["confirmed", "delivered", "shipped", "pending"])
        .gte("created_at", monthStart)
        .lt("created_at", monthEnd)
        .order("created_at", { ascending: true });
      if (moErr) throw moErr;

      const results: any[] = [];
      let processed = 0, skipped = 0, totalDistributed = 0;

      for (const o of monthOrders || []) {
        try {
          const r = await processOrderCommissions(supabase, o.id, { force: true });
          if (r && r.distributed > 0) {
            processed++;
            totalDistributed += r.total;
            results.push({ order_number: o.order_number, distributed: r.distributed, total: r.total });
          } else {
            skipped++;
          }
        } catch (e) {
          results.push({ order_number: o.order_number, error: String(e) });
        }
      }

      // Log the run
      await supabase.from("commission_reprocess_runs").insert({
        run_label: `Monthly Repurchase Reprocess ${year}-${String(month).padStart(2, "0")}`,
        scope: "global",
        triggered_by: user?.id ?? null,
        reason: "Scheduled end-of-month repurchase commission distribution",
        total_users_affected: processed,
        total_credits: totalDistributed,
        total_debits: 0,
        net_change: totalDistributed,
        completed_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: "process_monthly_repurchase",
          year, month,
          orders_scanned: monthOrders?.length || 0,
          processed, skipped,
          total_distributed: Math.round(totalDistributed * 100) / 100,
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
