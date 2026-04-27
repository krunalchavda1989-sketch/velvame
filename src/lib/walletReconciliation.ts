// Helpers to classify wallet transactions and produce reconciliation summaries.
import * as XLSX from "xlsx";

export type LedgerCategory =
  | "earn"
  | "reversal"
  | "correction"
  | "repurchase"
  | "withdrawal"
  | "refund"
  | "subscription"
  | "other";

export interface RawWalletTxn {
  id: string;
  user_id: string;
  type: "credit" | "debit";
  amount: number;
  description: string | null;
  balance_type: string | null;
  closing_balance: number | null;
  order_id: string | null;
  created_at: string;
}

export interface ReconciliationRow extends RawWalletTxn {
  category: LedgerCategory;
  category_label: string;
  signed_amount: number;
}

export const CATEGORY_LABELS: Record<LedgerCategory, string> = {
  earn: "Commission Earned",
  reversal: "Reversal",
  correction: "Correction / Audit",
  repurchase: "Repurchase Deduction",
  withdrawal: "Withdrawal",
  refund: "Refund",
  subscription: "Subscription",
  other: "Other",
};

export const CATEGORY_COLORS: Record<LedgerCategory, string> = {
  earn: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  reversal: "bg-red-500/10 text-red-700 border-red-500/20",
  correction: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  repurchase: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  withdrawal: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  refund: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  subscription: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  other: "bg-muted text-muted-foreground border-border",
};

export function classifyTransaction(tx: RawWalletTxn): LedgerCategory {
  const d = (tx.description || "").toLowerCase();
  if (tx.balance_type === "subscription") {
    if (d.includes("withdraw")) return "withdrawal";
    if (d.includes("refund") || d.includes("cancel")) return "refund";
    return "subscription";
  }
  if (d.includes("reversal")) return "reversal";
  if (d.includes("correction") || d.includes("audit")) return "correction";
  if (d.includes("withdraw")) return "withdrawal";
  if (d.includes("refund") || d.includes("cancel")) return "refund";
  if (d.includes("repurchase") && tx.type === "debit") return "repurchase";
  if (d.includes("order payment") && tx.type === "debit") return "repurchase";
  if (tx.type === "credit" && (d.includes("commission") || d.includes("level") || d.includes("earn"))) return "earn";
  return "other";
}

export function enrichTransactions(rows: RawWalletTxn[]): ReconciliationRow[] {
  return rows.map((r) => {
    const category = classifyTransaction(r);
    return {
      ...r,
      category,
      category_label: CATEGORY_LABELS[category],
      signed_amount: r.type === "credit" ? Number(r.amount) : -Number(r.amount),
    };
  });
}

export interface ReconciliationSummary {
  grossEarn: number;
  reversals: number;
  corrections: number;
  repurchaseDeductions: number;
  withdrawals: number;
  refunds: number;
  subscriptionCredits: number;
  subscriptionDebits: number;
  finalBalance: number;
  computedNet: number;
  totalCredits: number;
  totalDebits: number;
}

export function summarize(rows: ReconciliationRow[]): ReconciliationSummary {
  const s: ReconciliationSummary = {
    grossEarn: 0,
    reversals: 0,
    corrections: 0,
    repurchaseDeductions: 0,
    withdrawals: 0,
    refunds: 0,
    subscriptionCredits: 0,
    subscriptionDebits: 0,
    finalBalance: 0,
    computedNet: 0,
    totalCredits: 0,
    totalDebits: 0,
  };
  rows.forEach((r) => {
    const amt = Number(r.amount);
    if (r.type === "credit") s.totalCredits += amt;
    else s.totalDebits += amt;
    switch (r.category) {
      case "earn": s.grossEarn += amt; break;
      case "reversal": s.reversals += amt; break;
      case "correction": s.corrections += amt; break;
      case "repurchase": s.repurchaseDeductions += amt; break;
      case "withdrawal": s.withdrawals += amt; break;
      case "refund": s.refunds += r.type === "credit" ? amt : -amt; break;
      case "subscription":
        if (r.type === "credit") s.subscriptionCredits += amt;
        else s.subscriptionDebits += amt;
        break;
    }
  });
  s.computedNet = s.totalCredits - s.totalDebits;
  s.finalBalance = s.computedNet;
  return s;
}

const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN");

export function downloadCSV(rows: ReconciliationRow[], filename: string) {
  const headers = ["Date", "Type", "Category", "Description", "Balance Bucket", "Amount", "Signed Amount", "Closing Balance", "Order Ref"];
  const csv = [
    headers.join(","),
    ...rows.map((r) => [
      fmtDate(r.created_at),
      r.type,
      r.category_label,
      `"${(r.description || "").replace(/"/g, '""')}"`,
      r.balance_type || "",
      r.amount,
      r.signed_amount,
      r.closing_balance ?? "",
      r.order_id || "",
    ].join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadXLSX(
  rows: ReconciliationRow[],
  summary: ReconciliationSummary,
  reprocessRuns: any[],
  filename: string,
) {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Wallet Reconciliation Summary"],
    [],
    ["Metric", "Amount (INR)"],
    ["Gross Commission Earned", summary.grossEarn],
    ["Reversals", -summary.reversals],
    ["Corrections / Audits", -summary.corrections],
    ["Repurchase Deductions", -summary.repurchaseDeductions],
    ["Withdrawals", -summary.withdrawals],
    ["Refunds (net)", summary.refunds],
    ["Subscription Credits", summary.subscriptionCredits],
    ["Subscription Debits", -summary.subscriptionDebits],
    [],
    ["Total Credits", summary.totalCredits],
    ["Total Debits", -summary.totalDebits],
    ["Net (Credits - Debits)", summary.computedNet],
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  const ledgerData = [
    ["Date", "Type", "Category", "Description", "Bucket", "Amount", "Signed", "Closing Balance", "Order Ref"],
    ...rows.map((r) => [
      fmtDate(r.created_at),
      r.type,
      r.category_label,
      r.description || "",
      r.balance_type || "",
      Number(r.amount),
      r.signed_amount,
      r.closing_balance ?? "",
      r.order_id || "",
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ledgerData), "Ledger");

  if (reprocessRuns?.length) {
    const runsData = [
      ["Run Date", "Label", "Affected Users", "Credits", "Debits", "Net Change", "Rows"],
      ...reprocessRuns.map((r) => [
        fmtDate(r.bucket_start || r.started_at),
        r.run_label || r.reason || "",
        r.affected_users ?? r.total_users_affected ?? 1,
        Number(r.total_credits || 0),
        Number(r.total_debits || 0),
        Number(r.net_change || 0),
        r.row_count ?? "",
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(runsData), "Reprocess Runs");
  }

  XLSX.writeFile(wb, filename);
}
