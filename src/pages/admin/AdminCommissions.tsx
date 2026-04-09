import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DollarSign, TrendingUp, Clock, Download, Search, CheckCircle,
  Layers, RefreshCw, Repeat, BarChart3, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays } from "date-fns";
import DateRangeFilter from "@/components/admin/reports/DateRangeFilter";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import { VIBRANT_COLORS, ChartGradients, chartTooltipStyle, axisTick } from "@/components/admin/ChartStyles";

const CHART_COLORS = VIBRANT_COLORS;

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
    <CardContent className="pt-0"><div className="h-[260px] w-full">{children}</div></CardContent>
  </Card>
);

const toEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

const groupByDate = (items: any[], dateKey: string, from: Date, to: Date) => {
  const days = differenceInDays(to, from);
  let intervals: Date[];
  let fmt: string;
  if (days <= 14) { intervals = eachDayOfInterval({ start: from, end: to }); fmt = "dd MMM"; }
  else if (days <= 90) { intervals = eachWeekOfInterval({ start: from, end: to }); fmt = "dd MMM"; }
  else { intervals = eachMonthOfInterval({ start: from, end: to }); fmt = "MMM yyyy"; }
  const buckets = intervals.map((d) => ({ date: d, label: format(d, fmt), count: 0, amount: 0 }));
  items.forEach((item) => {
    const itemDate = new Date(item[dateKey]);
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (itemDate >= buckets[i].date) { buckets[i].count += 1; buckets[i].amount += Number(item.amount || 0); break; }
    }
  });
  return buckets;
};

const exportCsv = (columns: string[], rows: string[][], filename: string) => {
  const csv = [columns, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

// ChartCard moved to top with imports

const AdminCommissions = () => {
  const [from, setFrom] = useState<Date>(startOfMonth(new Date()));
  const [to, setTo] = useState<Date>(new Date());
  const [commissions, setCommissions] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedComm, setSelectedComm] = useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = useState<"commission" | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillDialog, setBackfillDialog] = useState(false);

  const handleBackfillAll = async () => {
    setBackfillRunning(true);
    setBackfillDialog(false);
    let offset = 0;
    let totalProcessed = 0;
    let totalSkipped = 0;
    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke("process-commissions", {
          body: { action: "backfill_all", batch_size: 10, offset },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Backfill failed");
        totalProcessed += data.processed || 0;
        totalSkipped += data.skipped || 0;
        toast.info(`Processing... ${offset + (data.processed || 0) + (data.skipped || 0)} / ${data.total_orders} orders`);
        if (!data.has_more) break;
        offset = data.next_offset;
      }
      toast.success(`Backfill complete: ${totalProcessed} orders reprocessed, ${totalSkipped} skipped`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Backfill failed");
    }
    setBackfillRunning(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = toEnd(to).toISOString();
    const [commRes, profilesRes] = await Promise.all([
      supabase.from("commissions").select("*").gte("created_at", fromStr).lte("created_at", toStr).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, user_id, full_name, referral_code"),
    ]);
    const pMap = new Map<string, any>();
    (profilesRes.data || []).forEach((p) => { pMap.set(p.id, p); pMap.set(p.user_id, p); });
    setProfileMap(pMap);
    setCommissions(commRes.data || []);
    setSelectedComm(new Set());
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const bulkApproveCommissions = async () => {
    setBulkUpdating(true);
    const ids = Array.from(selectedComm);
    const { error } = await supabase.from("commissions").update({ status: "paid" }).in("id", ids);
    setBulkUpdating(false);
    setBulkDialog(null);
    if (error) { toast.error("Failed to update commissions"); }
    else { toast.success(`${ids.length} commission(s) marked as paid`); fetchData(); }
  };

  // Derived
  const levelCommissions = useMemo(() => commissions.filter((c) => c.commission_type === "level"), [commissions]);
  const repurchaseCommissions = useMemo(() => commissions.filter((c) => c.commission_type === "repurchase"), [commissions]);

  const totalAll = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalLevel = levelCommissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalRepurchase = repurchaseCommissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalPending = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
  const totalPaid = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);

  const getName = (id: string) => profileMap.get(id)?.full_name || "—";

  const typeDistribution = useMemo(() => [
    { name: "Level", value: totalLevel }, { name: "Repurchase", value: totalRepurchase },
  ].filter((d) => d.value > 0), [totalLevel, totalRepurchase]);

  const statusDistribution = useMemo(() => [
    { name: "Pending", value: totalPending }, { name: "Paid", value: totalPaid },
  ].filter((d) => d.value > 0), [totalPending, totalPaid]);

  const trendData = useMemo(() => {
    const allItems = commissions.map((c) => ({ created_at: c.created_at, amount: Number(c.amount) }));
    return groupByDate(allItems, "created_at", from, to);
  }, [commissions, from, to]);

  const topEarners = useMemo(() => {
    const earnerMap = new Map<string, { level: number; repurchase: number; total: number }>();
    commissions.forEach((c) => {
      const prev = earnerMap.get(c.beneficiary_id) || { level: 0, repurchase: 0, total: 0 };
      const amt = Number(c.amount);
      if (c.commission_type === "level") prev.level += amt;
      else if (c.commission_type === "repurchase") prev.repurchase += amt;
      prev.total += amt;
      earnerMap.set(c.beneficiary_id, prev);
    });
    return Array.from(earnerMap.entries())
      .map(([id, stats]) => ({ id, name: getName(id), ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [commissions, profileMap]);

  const filterAndSearch = (items: any[], idField: string) =>
    items.filter((c) => {
      const name = getName(c[idField])?.toLowerCase() || "";
      return (!search || name.includes(search.toLowerCase())) && (statusFilter === "all" || c.status === statusFilter);
    });

  const pendingSelectedComm = Array.from(selectedComm).filter((id) => commissions.find((c) => c.id === id)?.status === "pending").length;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Commission Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Detailed breakdown of all commission types</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBackfillDialog(true)} disabled={backfillRunning}>
              {backfillRunning ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Layers className="h-4 w-4 mr-1.5" />}
              {backfillRunning ? "Processing..." : "Reprocess All Commissions"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        <DateRangeFilter from={from} to={to} onRangeChange={(f, t) => { setFrom(f); setTo(t); }} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: DollarSign, label: "Total Commissions", value: `₹${totalAll.toLocaleString()}`, gradient: "from-blue-500 to-blue-600" },
            { icon: Layers, label: "Level Income", value: `₹${totalLevel.toLocaleString()}`, gradient: "from-emerald-500 to-emerald-600" },
            { icon: Repeat, label: "Repurchase Income", value: `₹${totalRepurchase.toLocaleString()}`, gradient: "from-purple-500 to-purple-600" },
            { icon: Clock, label: "Pending", value: `₹${totalPending.toLocaleString()}`, gradient: "from-amber-500 to-amber-600" },
            { icon: TrendingUp, label: "Paid Out", value: `₹${totalPaid.toLocaleString()}`, gradient: "from-green-500 to-green-600" },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`p-4 rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-80">{c.label}</span>
                <c.icon className="h-4 w-4 opacity-80" />
              </div>
              <div className="text-lg font-bold">{c.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Commission Trend">
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs><ChartGradients /></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
                <Area type="monotone" dataKey="amount" name="Amount" stroke="#6366f1" fill="url(#grad-indigo)" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="By Commission Type">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={800}>
                  {typeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`]} /><Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="By Status">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={800}>
                  {statusDistribution.map((_, i) => <Cell key={i} fill={[CHART_COLORS[1], CHART_COLORS[0]][i]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`]} /><Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top Earners Leaderboard */}
        {topEarners.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Top Earners Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Level</TableHead>
                        <TableHead className="text-right">Repurchase</TableHead>
                        <TableHead className="text-right">Total Earned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topEarners.map((earner, i) => (
                        <TableRow key={earner.id} className="hover:bg-secondary/30">
                          <TableCell className="text-center">
                            {i === 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold">1</span>
                            ) : i === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">2</span>
                            ) : i === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/15 text-orange-600 text-xs font-bold">3</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{i + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{earner.name}</TableCell>
                          <TableCell className="text-right text-muted-foreground">₹{earner.level.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-muted-foreground">₹{earner.repurchase.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-primary">₹{earner.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="gap-1.5 text-xs"><DollarSign className="h-3.5 w-3.5" /> All ({commissions.length})</TabsTrigger>
              <TabsTrigger value="level" className="gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" /> Level Income ({levelCommissions.length})</TabsTrigger>
              <TabsTrigger value="repurchase" className="gap-1.5 text-xs"><Repeat className="h-3.5 w-3.5" /> Repurchase ({repurchaseCommissions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <CommissionTable
                data={filterAndSearch(commissions, "beneficiary_id")} getName={getName} showType csvFilename="all_commissions"
                selected={selectedComm} setSelected={setSelectedComm}
                onBulkApprove={pendingSelectedComm > 0 ? () => setBulkDialog("commission") : undefined}
                pendingCount={pendingSelectedComm}
              />
            </TabsContent>
            <TabsContent value="level">
              <LevelBreakdown
                data={filterAndSearch(levelCommissions, "beneficiary_id")} getName={getName}
                selected={selectedComm} setSelected={setSelectedComm}
                onBulkApprove={pendingSelectedComm > 0 ? () => setBulkDialog("commission") : undefined}
                pendingCount={pendingSelectedComm}
              />
            </TabsContent>
            <TabsContent value="repurchase">
              <CommissionTable
                data={filterAndSearch(repurchaseCommissions, "beneficiary_id")} getName={getName} showType={false} csvFilename="repurchase_commissions"
                selected={selectedComm} setSelected={setSelectedComm}
                onBulkApprove={pendingSelectedComm > 0 ? () => setBulkDialog("commission") : undefined}
                pendingCount={pendingSelectedComm}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Bulk Approve Dialog */}
        <AlertDialog open={!!bulkDialog} onOpenChange={(open) => !open && setBulkDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark{" "}
                <span className="font-semibold text-foreground">{pendingSelectedComm}</span>{" "}
                pending commission(s) as paid? This action will update their status immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkUpdating}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={bulkUpdating} onClick={bulkApproveCommissions}>
                {bulkUpdating ? "Updating..." : "Mark as Paid"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Backfill Confirmation Dialog */}
        <AlertDialog open={backfillDialog} onOpenChange={setBackfillDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reprocess All Commissions</AlertDialogTitle>
              <AlertDialogDescription>
                This will find all orders with under-distributed commissions, reverse the old entries, and reprocess them with the current commission level settings. This may take a moment. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBackfillAll}>
                Yes, Reprocess All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

/* ─── Format rate: stored as decimal (0.05) → display as 5% ─── */
const formatRate = (rate: number) => {
  const pct = rate < 1 ? rate * 100 : rate;
  return `${parseFloat(pct.toFixed(2))}%`;
};

const LEVEL_CARD_GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-orange-500 to-orange-600",
];

/* ─── Level Breakdown ─── */
const LevelBreakdown = ({ data, getName, selected, setSelected, onBulkApprove, pendingCount }: {
  data: any[]; getName: (id: string) => string;
  selected: Set<string>; setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  onBulkApprove?: () => void; pendingCount: number;
}) => {
  const levelStats = useMemo(() => {
    const map = new Map<number, { count: number; total: number; paid: number; pending: number }>();
    data.forEach((c) => {
      const prev = map.get(c.level) || { count: 0, total: 0, paid: 0, pending: 0 };
      prev.count += 1; prev.total += Number(c.amount);
      if (c.status === "paid") prev.paid += Number(c.amount); else prev.pending += Number(c.amount);
      map.set(c.level, prev);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [data]);

  const barData = levelStats.map(([level, s]) => ({ name: `L${level}`, total: s.total, paid: s.paid, pending: s.pending }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {levelStats.map(([level, s], i) => (
          <motion.div key={level} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${LEVEL_CARD_GRADIENTS[i % LEVEL_CARD_GRADIENTS.length]} text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-80">Level {level}</span>
              <Layers className="h-4 w-4 opacity-80" />
            </div>
            <div className="text-lg font-display font-bold">₹{s.total.toLocaleString()}</div>
            <div className="flex gap-2 mt-1 text-[10px]">
              <span className="opacity-90">{s.count} txns</span>
              <span className="opacity-60">·</span>
              <span className="opacity-90">₹{s.pending.toLocaleString()} pending</span>
            </div>
          </motion.div>
        ))}
      </div>
      {barData.length > 0 && (
        <ChartCard title="Commission by Level">
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "hsl(var(--border))" }} formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
              <Legend />
              <Bar dataKey="paid" name="Paid" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      <CommissionTable data={data} getName={getName} showType={false} csvFilename="level_commissions" selected={selected} setSelected={setSelected} onBulkApprove={onBulkApprove} pendingCount={pendingCount} />
    </div>
  );
};

const PAGE_SIZE = 25;

/* ─── Commission Table ─── */
const CommissionTable = ({
  data, getName, showType, csvFilename, selected, setSelected, onBulkApprove, pendingCount,
}: {
  data: any[]; getName: (id: string) => string; showType: boolean; csvFilename: string;
  selected: Set<string>; setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  onBulkApprove?: () => void; pendingCount: number;
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when data changes
  useEffect(() => { setPage(1); }, [data.length]);

  const allSelected = pagedData.length > 0 && pagedData.every((c) => selected.has(c.id));
  const toggleAll = () => {
    if (allSelected) { setSelected((prev) => { const n = new Set(prev); pagedData.forEach((c) => n.delete(c.id)); return n; }); }
    else { setSelected((prev) => { const n = new Set(prev); pagedData.forEach((c) => n.add(c.id)); return n; }); }
  };
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const handleExport = () => {
    const cols = ["Beneficiary", ...(showType ? ["Type"] : []), "Level", "Rate", "Amount", "Status", "Date"];
    const rows = data.map((c) => [
      getName(c.beneficiary_id),
      ...(showType ? [c.commission_type] : []),
      String(c.level),
      formatRate(Number(c.rate)),
      String(Number(c.amount).toFixed(2)),
      c.status,
      format(new Date(c.created_at), "dd MMM yyyy"),
    ]);
    exportCsv(cols, rows, csvFilename);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <p className="text-sm text-muted-foreground">{data.length} record(s){selected.size > 0 && ` · ${selected.size} selected`}</p>
        <div className="flex items-center gap-2">
          {onBulkApprove && (
            <Button size="sm" onClick={onBulkApprove} className="gap-1.5">
              <CheckCircle className="h-4 w-4" /> Mark as Paid ({pendingCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" /> Export CSV</Button>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" /></TableHead>
                <TableHead>Beneficiary</TableHead>
                {showType && <TableHead>Type</TableHead>}
                <TableHead>Level</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.length === 0 ? (
                <TableRow><TableCell colSpan={showType ? 9 : 8} className="text-center py-10 text-muted-foreground">No commissions found</TableCell></TableRow>
              ) : (
                pagedData.map((c) => (
                  <TableRow key={c.id} className={`hover:bg-secondary/30 ${selected.has(c.id) ? "bg-primary/5" : ""}`}>
                    <TableCell><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} /></TableCell>
                    <TableCell className="font-medium text-foreground">{getName(c.beneficiary_id)}</TableCell>
                    {showType && (
                      <TableCell><Badge variant="outline" className="capitalize text-[10px]">{c.commission_type === "level" ? "Level" : c.commission_type === "repurchase" ? "Repurchase" : c.commission_type}</Badge></TableCell>
                    )}
                    <TableCell><Badge variant="secondary" className="text-[10px]">L{c.level}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatRate(Number(c.rate))}</TableCell>
                    <TableCell className="font-semibold text-primary">₹{Number(c.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{getName(c.source_user_id)}</TableCell>
                    <TableCell>
                      <Badge className={c.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <Button key={p} variant={p === currentPage ? "default" : "outline"} size="sm" className="min-w-[32px] h-8 text-xs" onClick={() => setPage(p as number)}>
                    {p}
                  </Button>
                )
              )}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommissions;
