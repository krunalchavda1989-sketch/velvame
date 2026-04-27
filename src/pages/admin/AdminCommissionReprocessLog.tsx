import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download, FileSpreadsheet, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface RunRow {
  bucket_start: string;
  run_label: string;
  affected_users: number;
  total_credits: number;
  total_debits: number;
  net_change: number;
  row_count: number | null;
  source: "logged" | "derived";
  reason?: string;
  triggered_by?: string | null;
}

const fmt = (n: number) => `₹${(Math.round(Number(n) * 100) / 100).toLocaleString("en-IN")}`;

export default function AdminCommissionReprocessLog() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    const [derivedRes, loggedRes] = await Promise.all([
      supabase.rpc("get_derived_reprocess_runs" as any, { _user_id: null }),
      supabase.from("commission_reprocess_runs" as any).select("*").order("started_at", { ascending: false }).limit(200),
    ]);
    const derived: RunRow[] = ((derivedRes.data as any[]) || []).map((r) => ({
      bucket_start: r.bucket_start,
      run_label: r.run_label,
      affected_users: r.affected_users,
      total_credits: Number(r.total_credits),
      total_debits: Number(r.total_debits),
      net_change: Number(r.net_change),
      row_count: r.row_count,
      source: "derived",
    }));
    const logged: RunRow[] = ((loggedRes.data as any[]) || []).map((r) => ({
      bucket_start: r.started_at,
      run_label: r.run_label,
      affected_users: r.total_users_affected,
      total_credits: Number(r.total_credits),
      total_debits: Number(r.total_debits),
      net_change: Number(r.net_change),
      row_count: null,
      source: "logged",
      reason: r.reason,
      triggered_by: r.triggered_by,
    }));
    setRuns([...logged, ...derived].sort((a, b) => new Date(b.bucket_start).getTime() - new Date(a.bucket_start).getTime()));
    setLoading(false);
  };

  useEffect(() => { fetchRuns(); }, []);

  const totals = useMemo(() => runs.reduce((acc, r) => ({
    credits: acc.credits + r.total_credits,
    debits: acc.debits + r.total_debits,
    net: acc.net + r.net_change,
    users: Math.max(acc.users, r.affected_users || 0),
  }), { credits: 0, debits: 0, net: 0, users: 0 }), [runs]);

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ["When", "Run", "Source", "Affected Users", "Credits", "Debits", "Net Change", "Rows", "Reason"],
      ...runs.map((r) => [
        format(new Date(r.bucket_start), "yyyy-MM-dd HH:mm"),
        r.run_label,
        r.source,
        r.affected_users,
        r.total_credits,
        r.total_debits,
        r.net_change,
        r.row_count ?? "",
        r.reason || "",
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Reprocess Runs");
    XLSX.writeFile(wb, `commission-reprocess-log-${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  const exportCSV = () => {
    const headers = ["When", "Run", "Source", "Affected Users", "Credits", "Debits", "Net Change", "Rows"];
    const csv = [headers.join(","), ...runs.map((r) => [
      format(new Date(r.bucket_start), "yyyy-MM-dd HH:mm"),
      `"${r.run_label}"`,
      r.source,
      r.affected_users,
      r.total_credits,
      r.total_debits,
      r.net_change,
      r.row_count ?? "",
    ].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `commission-reprocess-log-${format(new Date(), "yyyyMMdd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <History className="h-6 w-6 text-primary" /> Commission Reprocess Audit Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every commission reversal, correction and audit batch — derived from historical wallet activity and from logged future runs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchRuns}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
            <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
            <Button size="sm" variant="outline" onClick={exportXLSX}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Total Runs" value={String(runs.length)} color="from-indigo-500 to-indigo-600" />
          <SummaryCard label="Total Credits" value={fmt(totals.credits)} color="from-emerald-500 to-emerald-600" />
          <SummaryCard label="Total Debits" value={fmt(totals.debits)} color="from-red-500 to-red-600" />
          <SummaryCard label="Net Change" value={fmt(totals.net)} color="from-amber-500 to-amber-600" />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader><CardTitle className="text-base">Reprocess Runs</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Debits</TableHead>
                    <TableHead className="text-right">Net Change</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
                  ) : runs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No reprocess events found.</TableCell></TableRow>
                  ) : runs.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.bucket_start), "dd MMM yyyy, HH:mm")}</TableCell>
                      <TableCell className="text-xs">{r.run_label}{r.reason ? <span className="block text-[10px] text-muted-foreground">{r.reason}</span> : null}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{r.source}</Badge></TableCell>
                      <TableCell className="text-right text-xs">{r.affected_users}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-emerald-600">+{fmt(r.total_credits)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-red-600">−{fmt(r.total_debits)}</TableCell>
                      <TableCell className={cn("text-right text-xs tabular-nums font-medium", r.net_change >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(r.net_change)}</TableCell>
                      <TableCell className="text-right text-xs">{r.row_count ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={cn("rounded-xl p-4 text-white shadow-lg bg-gradient-to-br", color)}>
      <div className="text-xs opacity-85">{label}</div>
      <div className="text-2xl font-display font-bold mt-1 tabular-nums">{value}</div>
    </div>
  );
}
