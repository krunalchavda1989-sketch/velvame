import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  aggregateLedger,
  aggregatePayouts,
  computePayoutFigures,
  nextPayoutDate,
} from "@/lib/payoutCalc";

export interface PayoutHistoryEntry {
  id: string;
  amount: number;
  payment_mode: string | null;
  transaction_ref: string | null;
  payment_date: string;
  note: string | null;
  status: string | null;
  created_at: string;
}

/** Day-of-month payout cycle configured by the admin. */
export function usePayoutSettings() {
  return useQuery({
    queryKey: ["payout-settings"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("payout_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      return (data || { payout_day_of_month: 5, min_payout_amount: 0 }) as {
        id?: string;
        payout_day_of_month: number;
        min_payout_amount: number;
      };
    },
    staleTime: 60_000,
  });
}

/**
 * Earned / Paid / Pending for ONE user, computed with exactly the same rules as
 * the admin Payout Report so the two screens can never disagree.
 */
export function usePayoutSummary(userId?: string) {
  const { data: settings } = usePayoutSettings();

  const query = useQuery({
    queryKey: ["payout-summary", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [ledgerRes, payoutRes, commRes] = await Promise.all([
        supabase
          .from("wallet_transactions")
          .select("user_id, amount, type, balance_type, description")
          .eq("user_id", userId!),
        (supabase as any)
          .from("payout_transactions")
          .select("*")
          .eq("user_id", userId!)
          .order("payment_date", { ascending: false }),
        supabase.from("commissions").select("amount").eq("beneficiary_id", userId!),
      ]);

      const payouts = (payoutRes.data || []) as PayoutHistoryEntry[];
      const commissionsTotal = (commRes.data || []).reduce(
        (s: number, c: any) => s + Number(c.amount),
        0,
      );
      const paidInfo = aggregatePayouts(payouts.map((p) => ({ ...p, user_id: userId! })) as any).get(
        userId!,
      ) || { total: 0, lastDate: null };

      const figures = computePayoutFigures(
        aggregateLedger((ledgerRes.data || []) as any).get(userId!),
        paidInfo.total,
        commissionsTotal,
      );

      return { ...figures, lastPaidDate: paidInfo.lastDate, history: payouts };
    },
  });

  return {
    ...query,
    settings,
    nextPayoutDate: nextPayoutDate(settings?.payout_day_of_month ?? 5),
  };
}
