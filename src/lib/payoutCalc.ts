// Single source of truth for payout figures.
// Used by the admin Payout Report, the Payout Dashboard and the User Detail page
// so all three always show identical Earned / Paid / Pending numbers.

import { addMonths, endOfMonth, isAfter, setDate, startOfDay } from "date-fns";

export interface WalletTxnLike {
  user_id: string;
  amount: number | string;
  type: string;
  balance_type: string | null;
  description: string | null;
}

export interface PayoutRecordLike {
  user_id: string;
  amount: number | string;
  payment_date: string;
}

export interface UserLedgerTotals {
  credits: number;
  reversals: number;
  /** commission wallet spent on orders (real usage) */
  used: number;
  /** ledger mirror rows created by a payout / withdrawal */
  payoutMirrors: number;
}

const emptyTotals = (): UserLedgerTotals => ({ credits: 0, reversals: 0, used: 0, payoutMirrors: 0 });

export const isReversalDesc = (d: string) => /Reversal|Correction|Reprocess/i.test(d);
/**
 * A payout/withdrawal debit is the ledger MIRROR of a payout_transactions row.
 * Counting both would double-count the same payment, which is what made
 * "Total Paid" larger than the money actually sent.
 */
export const isPayoutMirrorDesc = (d: string) => /payout|withdraw/i.test(d);

/** Bucket commission-balance wallet transactions per user. */
export function aggregateLedger(txns: WalletTxnLike[]): Map<string, UserLedgerTotals> {
  const map = new Map<string, UserLedgerTotals>();
  txns.forEach((w) => {
    if (w.balance_type !== "commission") return;
    const amt = Number(w.amount);
    const desc = w.description || "";
    const t = map.get(w.user_id) || emptyTotals();
    if (w.type === "credit") t.credits += amt;
    else if (isReversalDesc(desc)) t.reversals += amt;
    else if (isPayoutMirrorDesc(desc)) t.payoutMirrors += amt;
    else t.used += amt;
    map.set(w.user_id, t);
  });
  return map;
}

export interface PayoutFigures {
  earned: number;
  paid: number;
  pending: number;
  walletUsed: number;
}

/**
 * @param totals        bucketed commission ledger for the user
 * @param payoutTotal   sum of payout_transactions for the user
 * @param commissionsTableTotal fallback: sum of the commissions table
 */
export function computePayoutFigures(
  totals: UserLedgerTotals | undefined,
  payoutTotal: number,
  commissionsTableTotal: number,
): PayoutFigures {
  const t = totals || emptyTotals();
  const netWalletEarned = Math.max(0, t.credits - t.reversals);
  const earned = Math.max(netWalletEarned, commissionsTableTotal);
  // payout records and their ledger mirrors are the SAME money → take the larger
  const payoutsSettled = Math.max(payoutTotal, t.payoutMirrors);
  const paid = Math.min(earned, payoutsSettled + t.used);
  return {
    earned,
    paid,
    pending: Math.max(0, earned - paid),
    walletUsed: t.used,
  };
}

/** Sum payouts per user and track the latest payment date. */
export function aggregatePayouts(rows: PayoutRecordLike[]) {
  const map = new Map<string, { total: number; lastDate: string | null }>();
  rows.forEach((p) => {
    const prev = map.get(p.user_id) || { total: 0, lastDate: null as string | null };
    prev.total += Number(p.amount);
    if (!prev.lastDate || p.payment_date > prev.lastDate) prev.lastDate = p.payment_date;
    map.set(p.user_id, prev);
  });
  return map;
}

/** Next scheduled payout date for a given day-of-month cycle. */
export function nextPayoutDate(dayOfMonth: number, from: Date = new Date()): Date {
  const clamp = (d: Date) => setDate(d, Math.min(Math.max(dayOfMonth, 1), endOfMonth(d).getDate()));
  const thisMonth = clamp(startOfDay(from));
  if (!isAfter(startOfDay(from), thisMonth)) return thisMonth;
  return clamp(addMonths(startOfDay(from), 1));
}
