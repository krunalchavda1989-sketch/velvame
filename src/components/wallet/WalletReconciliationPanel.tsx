import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { AlertTriangle, Calendar as CalendarIcon, CheckCircle2, FileSpreadsheet, FileText, Filter, History, Info, RefreshCw, Wallet as WalletIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  downloadCSV,
  downloadXLSX,
  enrichTransactions,
  LedgerCategory,
  RawWalletTxn,
  ReconciliationRow,
  summarize,
} from "@/lib/walletReconciliation";

interface Props {
  userId: string;
  /** Optional: when admin views another user, pass referral code for filename */
  fileSuffix?: string;
  /** Currently displayed wallet balance (commission bucket) — used by the reconciliation checker. */
  displayedBalance?: number;
  /** Label for the displayed balance shown in the checker. Defaults to "Wallet Balance". */
  displayedBalanceLabel?: string;
}

const CATEGORIES: { key: LedgerCategory | "all"; label: string }[] = [
  { key: "all", label: "All types" },
  { key: "earn", label: "Earnings" },
  { key: "reversal", label: "Reversals" },
  { key: "correction", label: "Corrections" },
  { key: "repurchase", label: "Repurchase" },
  { key: "withdrawal", label: "Withdrawals" },
  { key: "refund", label: "Refunds" },
  { key: "subscription", label: "Subscription" },
];

const fmt = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString("en-IN")}`;

export default function WalletReconciliationPanel({ userId, fileSuffix, displayedBalance, displayedBalanceLabel = "Wallet Balance" }: Props) {
  const [from, setFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [to, setTo] = useState<Date | undefined>(new Date());
  const [filter, setFilter] = useState<LedgerCategory | "all">("all");
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [reprocess, setReprocess] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allTimeNet, setAllTimeNet] = useState<number | null>(null);
  const [allTimeLoading, setAllTimeLoading] = useState(false);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    const startISO = from ? new Date(from.setHours(0, 0, 0, 0)).toISOString() : undefined;
    const endISO = to ? new Date(new Date(to).setHours(23, 59, 59, 999)).toISOString() : undefined;

    let q = supabase
      .from("wallet_transactions")
      .select("id,user_id,type,amount,description,balance_type,closing_balance,order_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (startISO) q = q.gte("created_at", startISO);
    if (endISO) q = q.lte("created_at", endISO);

    const [txnRes, runsRes, runsTableRes] = await Promise.all([
      q,
      supabase.rpc("get_derived_reprocess_runs" as any, { _user_id: userId }),
      supabase.from("commission_reprocess_runs" as any).select("*").or(`affected_user_id.eq.${userId},scope.eq.global`).order("started_at", { ascending: false }).limit(50),
    ]);

    setRows(enrichTransactions((txnRes.data as RawWalletTxn[]) || []));

    const derived = ((runsRes.data as any[]) || []).map((r) => ({ ...r, source: "derived" }));
    const stored = ((runsTableRes.data as any[]) || []).map((r) => ({
      bucket_start: r.started_at,
      run_label: r.run_label || r.reason || "Reprocess",
      affected_users: r.total_users_affected || 1,
      total_credits: r.total_credits,
      total_debits: r.total_debits,
      net_change: r.net_change,
      row_count: null,
      source: "logged",
    }));
    setReprocess([...stored, ...derived]);
    setLoading(false);
  };

  // Fetch ALL-TIME net movement (commission bucket) so we can compare against the displayed wallet balance.
  const fetchAllTimeNet = async () => {
    if (!userId) return;
    setAllTimeLoading(true);
    let net = 0;
    const pageSize = 1000;
    let offset = 0;
    // Pull only commission-bucket entries — that's what `commission_balance` reflects.
    // Fall back to "all" if no bucket is set on historical rows.
    while (true) {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("type,amount,balance_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error || !data || data.length === 0) break;
      for (const r of data) {
        if (r.balance_type && r.balance_type !== "commission") continue;
        const amt = Number(r.amount) || 0;
        net += r.type === "credit" ? amt : -amt;
      }
      if (data.length < pageSize) break;
      offset += pageSize;
    }
    setAllTimeNet(net);
    setAllTimeLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchAllTimeNet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, from, to]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.category === filter)),
    [rows, filter],
  );
  const summary = useMemo(() => summarize(rows), [rows]);

  // Reconciliation check: ledger all-time net should equal displayed wallet balance (within ₹0.01 tolerance).
  const reconciliation = useMemo(() => {
    if (displayedBalance == null || allTimeNet == null) return null;
    const diff = Math.round((allTimeNet - displayedBalance) * 100) / 100;
    const ok = Math.abs(diff) < 0.01;
    return { ok, diff, ledger: allTimeNet, displayed: displayedBalance };
  }, [displayedBalance, allTimeNet]);

  const fname = (ext: string) =>
    `wallet-reconciliation${fileSuffix ? `-${fileSuffix}` : ""}-${format(from || new Date(), "yyyyMMdd")}-${format(to || new Date(), "yyyyMMdd")}.${ext}`;

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Wallet Reconciliation</h2>
            <Tooltip>
              <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-xs">
                Itemized ledger of every credit and debit affecting your wallet, including reversals, corrections, repurchase deductions and withdrawals. Use this to reconcile your displayed balance.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DatePick value={from} onChange={setFrom} placeholder="From" />
            <DatePick value={to} onChange={setTo} placeholder="To" />
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-[160px] h-9"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => downloadCSV(filtered, fname("csv"))}>
              <FileText className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadXLSX(filtered, summary, reprocess, fname("xlsx"))}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-secondary/30">
          <Stat label="Gross Earned" value={summary.grossEarn} color="text-emerald-600" tip="Sum of every commission credit (Level / Repurchase / Manual). Before any reversals or audits." />
          <Stat label="Reversals + Corrections" value={-(summary.reversals + summary.corrections)} color="text-red-600" tip="System reprocess reversals and audit corrections that reduced your commission balance." />
          <Stat label="Repurchase + Withdrawals" value={-(summary.repurchaseDeductions + summary.withdrawals)} color="text-orange-600" tip="Money leaving the wallet: repurchase order payments using commission balance + bank withdrawals." />
          <Stat label="Computed Net" value={summary.computedNet} color="text-primary" tip="Credits − Debits across this date range. This is the true ledger movement and should reconcile with your wallet balance changes." bold />
        </div>

        <Tabs defaultValue="ledger" className="w-full">
          <TabsList className="mx-4 mt-3">
            <TabsTrigger value="ledger">Itemized Ledger</TabsTrigger>
            <TabsTrigger value="reprocess"><History className="h-3.5 w-3.5 mr-1" />Reprocess Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="ledger" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Closing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions in this range.</TableCell></TableRow>
                  ) : filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.created_at), "dd MMM yyyy, HH:mm")}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[r.category])}>{CATEGORY_LABELS[r.category]}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[260px] truncate" title={r.description || ""}>{r.description}</TableCell>
                      <TableCell className="text-xs">{r.balance_type}</TableCell>
                      <TableCell className={cn("text-right text-sm font-medium tabular-nums", r.type === "credit" ? "text-emerald-600" : "text-red-600")}>
                        {r.type === "credit" ? "+" : "−"}{fmt(Number(r.amount))}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{r.closing_balance != null ? fmt(Number(r.closing_balance)) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="reprocess" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Debits</TableHead>
                    <TableHead className="text-right">Net Change</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reprocess.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No commission reprocess events found.</TableCell></TableRow>
                  ) : reprocess.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.bucket_start), "dd MMM yyyy, HH:mm")}</TableCell>
                      <TableCell className="text-xs">{r.run_label}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{r.source === "logged" ? "Logged" : "Derived"}</Badge></TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-emerald-600">+{fmt(Number(r.total_credits || 0))}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-red-600">−{fmt(Number(r.total_debits || 0))}</TableCell>
                      <TableCell className={cn("text-right text-xs tabular-nums font-medium", Number(r.net_change) >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(Number(r.net_change || 0))}</TableCell>
                      <TableCell className="text-right text-xs">{r.row_count ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function Stat({ label, value, color, tip, bold }: { label: string; value: number; color: string; tip: string; bold?: boolean }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        <Tooltip>
          <TooltipTrigger asChild><Info className="h-3 w-3 cursor-help" /></TooltipTrigger>
          <TooltipContent className="max-w-[260px] text-xs">{tip}</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn("mt-1 tabular-nums", color, bold ? "text-xl font-display font-bold" : "text-base font-semibold")}>{fmt(value)}</div>
    </div>
  );
}

function DatePick({ value, onChange, placeholder }: { value?: Date; onChange: (d?: Date) => void; placeholder: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal h-9", !value && "text-muted-foreground")}>
          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
          {value ? format(value, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}
