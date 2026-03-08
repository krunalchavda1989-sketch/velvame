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
  Layers, RefreshCw, GitBranch, Repeat, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays } from "date-fns";
import DateRangeFilter from "@/components/admin/reports/DateRangeFilter";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 43 74% 66%))",
  "hsl(var(--chart-4, 12 76% 61%))",
  "hsl(var(--chart-5, 280 65% 60%))",
];

const toEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

const groupByDate = (items: any[], dateKey: string, from: Date, to: Date) => {
  const days = differenceInDays(to, from);
  let intervals: Date[];
  let fmt: string;
  if (days <= 14) {
    intervals = eachDayOfInterval({ start: from, end: to });
    fmt = "dd MMM";
  } else if (days <= 90) {
    intervals = eachWeekOfInterval({ start: from, end: to });
    fmt = "dd MMM";
  } else {
    intervals = eachMonthOfInterval({ start: from, end: to });
    fmt = "MMM yyyy";
  }
  const buckets = intervals.map((d) => ({ date: d, label: format(d, fmt), count: 0, amount: 0 }));
  items.forEach((item) => {
    const itemDate = new Date(item[dateKey]);
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (itemDate >= buckets[i].date) {
        buckets[i].count += 1;
        buckets[i].amount += Number(item.amount || 0);
        break;
      }
    }
  });
  return buckets;
};

const exportCsv = (columns: string[], rows: string[][], filename: string) => {
  const csv = [columns, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="h-[260px] w-full">{children}</div>
    </CardContent>
  </Card>
);

const AdminCommissions = () => {
  const [from, setFrom] = useState<Date>(startOfMonth(new Date()));
  const [to, setTo] = useState<Date>(new Date());
  const [commissions, setCommissions] = useState<any[]>([]);
  const [binaryPayouts, setBinaryPayouts] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = toEnd(to).toISOString();

    const [commRes, binaryRes, profilesRes] = await Promise.all([
      supabase.from("commissions").select("*").gte("created_at", fromStr).lte("created_at", toStr).order("created_at", { ascending: false }),
      supabase.from("binary_payouts").select("*").gte("created_at", fromStr).lte("created_at", toStr).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, user_id, full_name, referral_code"),
    ]);

    const pMap = new Map<string, any>();
    (profilesRes.data || []).forEach((p) => {
      pMap.set(p.id, p);
      pMap.set(p.user_id, p);
    });
    setProfileMap(pMap);
    setCommissions(commRes.data || []);
    setBinaryPayouts(binaryRes.data || []);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived data
  const levelCommissions = useMemo(() => commissions.filter((c) => c.commission_type === "level"), [commissions]);
  const repurchaseCommissions = useMemo(() => commissions.filter((c) => c.commission_type === "repurchase"), [commissions]);

  const totalAll = commissions.reduce((s, c) => s + Number(c.amount), 0) + binaryPayouts.reduce((s, b) => s + Number(b.matching_amount), 0);
  const totalLevel = levelCommissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalRepurchase = repurchaseCommissions.reduce((s, c) => s + Number(c.amount), 0);
  const totalBinary = binaryPayouts.reduce((s, b) => s + Number(b.matching_amount), 0);
  const totalPending = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0) + binaryPayouts.filter((b) => b.status === "pending").reduce((s, b) => s + Number(b.matching_amount), 0);
  const totalPaid = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0) + binaryPayouts.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.matching_amount), 0);

  const getName = (id: string) => profileMap.get(id)?.full_name || "—";

  const summaryCards = [
    { icon: DollarSign, label: "Total Commissions", value: `₹${totalAll.toLocaleString()}`, color: "text-primary" },
    { icon: Layers, label: "Level Income", value: `₹${totalLevel.toLocaleString()}`, color: "text-blue-500" },
    { icon: Repeat, label: "Repurchase Income", value: `₹${totalRepurchase.toLocaleString()}`, color: "text-emerald-500" },
    { icon: GitBranch, label: "Binary Income", value: `₹${totalBinary.toLocaleString()}`, color: "text-purple-500" },
    { icon: Clock, label: "Pending", value: `₹${totalPending.toLocaleString()}`, color: "text-amber-500" },
    { icon: TrendingUp, label: "Paid Out", value: `₹${totalPaid.toLocaleString()}`, color: "text-green-500" },
  ];

  // Charts
  const typeDistribution = useMemo(() => [
    { name: "Level", value: totalLevel },
    { name: "Repurchase", value: totalRepurchase },
    { name: "Binary", value: totalBinary },
  ].filter((d) => d.value > 0), [totalLevel, totalRepurchase, totalBinary]);

  const statusDistribution = useMemo(() => {
    const pending = totalPending;
    const paid = totalPaid;
    return [
      { name: "Pending", value: pending },
      { name: "Paid", value: paid },
    ].filter((d) => d.value > 0);
  }, [totalPending, totalPaid]);

  const trendData = useMemo(() => {
    const allItems = [
      ...commissions.map((c) => ({ created_at: c.created_at, amount: Number(c.amount) })),
      ...binaryPayouts.map((b) => ({ created_at: b.created_at, amount: Number(b.matching_amount) })),
    ];
    return groupByDate(allItems, "created_at", from, to);
  }, [commissions, binaryPayouts, from, to]);

  const filterAndSearch = (items: any[], emailField: string) => {
    return items.filter((c) => {
      const name = getName(c[emailField])?.toLowerCase() || "";
      const matchSearch = !search || name.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Commission Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed breakdown of all commission types
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Date Range */}
        <DateRangeFilter from={from} to={to} onRangeChange={(f, t) => { setFrom(f); setTo(t); }} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <c.icon className={`h-4 w-4 ${c.color} mb-2`} />
              <div className="text-lg font-display font-bold text-foreground">{c.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{c.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Commission Trend">
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "hsl(var(--border))" }} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
                <Area type="monotone" dataKey="amount" name="Amount" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="By Commission Type">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "hsl(var(--border))" }} formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="By Status">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusDistribution.map((_, i) => <Cell key={i} fill={[CHART_COLORS[1], CHART_COLORS[0]][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "hsl(var(--border))" }} formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for commission types */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="gap-1.5 text-xs">
                <DollarSign className="h-3.5 w-3.5" /> All ({commissions.length + binaryPayouts.length})
              </TabsTrigger>
              <TabsTrigger value="level" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" /> Level Income ({levelCommissions.length})
              </TabsTrigger>
              <TabsTrigger value="repurchase" className="gap-1.5 text-xs">
                <Repeat className="h-3.5 w-3.5" /> Repurchase ({repurchaseCommissions.length})
              </TabsTrigger>
              <TabsTrigger value="binary" className="gap-1.5 text-xs">
                <GitBranch className="h-3.5 w-3.5" /> Binary ({binaryPayouts.length})
              </TabsTrigger>
            </TabsList>

            {/* ALL */}
            <TabsContent value="all">
              <CommissionTable
                data={filterAndSearch(commissions, "beneficiary_id")}
                getName={getName}
                showType
                csvFilename="all_commissions"
              />
            </TabsContent>

            {/* LEVEL */}
            <TabsContent value="level">
              <LevelBreakdown data={filterAndSearch(levelCommissions, "beneficiary_id")} getName={getName} />
            </TabsContent>

            {/* REPURCHASE */}
            <TabsContent value="repurchase">
              <CommissionTable
                data={filterAndSearch(repurchaseCommissions, "beneficiary_id")}
                getName={getName}
                showType={false}
                csvFilename="repurchase_commissions"
              />
            </TabsContent>

            {/* BINARY */}
            <TabsContent value="binary">
              <BinaryTable
                data={binaryPayouts.filter((b) => {
                  const name = getName(b.user_id)?.toLowerCase() || "";
                  const matchSearch = !search || name.includes(search.toLowerCase());
                  const matchStatus = statusFilter === "all" || b.status === statusFilter;
                  return matchSearch && matchStatus;
                })}
                getName={getName}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

/* ─── Level Breakdown with per-level stats ─── */
const LevelBreakdown = ({ data, getName }: { data: any[]; getName: (id: string) => string }) => {
  const levelStats = useMemo(() => {
    const map = new Map<number, { count: number; total: number; paid: number; pending: number }>();
    data.forEach((c) => {
      const prev = map.get(c.level) || { count: 0, total: 0, paid: 0, pending: 0 };
      prev.count += 1;
      prev.total += Number(c.amount);
      if (c.status === "paid") prev.paid += Number(c.amount);
      else prev.pending += Number(c.amount);
      map.set(c.level, prev);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [data]);

  const barData = levelStats.map(([level, s]) => ({
    name: `L${level}`,
    total: s.total,
    paid: s.paid,
    pending: s.pending,
  }));

  return (
    <div className="space-y-4">
      {/* Level stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {levelStats.map(([level, s]) => (
          <div key={level} className="p-3 rounded-xl bg-card border border-border">
            <div className="text-xs text-muted-foreground mb-1">Level {level}</div>
            <div className="text-lg font-display font-bold text-foreground">₹{s.total.toLocaleString()}</div>
            <div className="flex gap-2 mt-1 text-[10px]">
              <span className="text-green-500">{s.count} txns</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-amber-500">₹{s.pending.toLocaleString()} pending</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {barData.length > 0 && (
        <ChartCard title="Commission by Level">
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: "hsl(var(--border))" }} formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
              <Legend />
              <Bar dataKey="paid" name="Paid" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <CommissionTable data={data} getName={getName} showType={false} csvFilename="level_commissions" />
    </div>
  );
};

/* ─── Commission Table (Level / Repurchase / All) ─── */
const CommissionTable = ({
  data, getName, showType, csvFilename,
}: {
  data: any[]; getName: (id: string) => string; showType: boolean; csvFilename: string;
}) => {
  const handleExport = () => {
    const cols = ["Beneficiary", ...(showType ? ["Type"] : []), "Level", "Rate", "Amount", "Status", "Date"];
    const rows = data.map((c) => [
      getName(c.beneficiary_id),
      ...(showType ? [c.commission_type] : []),
      String(c.level),
      `${c.rate}%`,
      `₹${Number(c.amount).toLocaleString()}`,
      c.status,
      format(new Date(c.created_at), "dd MMM yyyy"),
    ]);
    exportCsv(cols, rows, csvFilename);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data.length} record(s)</p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showType ? 8 : 7} className="text-center py-10 text-muted-foreground">
                    No commissions found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((c) => (
                  <TableRow key={c.id} className="hover:bg-secondary/30">
                    <TableCell className="font-medium text-foreground">{getName(c.beneficiary_id)}</TableCell>
                    {showType && (
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {c.commission_type === "level" ? "Level" : c.commission_type === "repurchase" ? "Repurchase" : c.commission_type}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">L{c.level}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.rate}%</TableCell>
                    <TableCell className="font-semibold text-primary">₹{Number(c.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{getName(c.source_user_id)}</TableCell>
                    <TableCell>
                      <Badge className={c.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

/* ─── Binary Payouts Table ─── */
const BinaryTable = ({ data, getName }: { data: any[]; getName: (id: string) => string }) => {
  const totalMatching = data.reduce((s, b) => s + Number(b.matching_amount), 0);
  const totalWeakBV = data.reduce((s, b) => s + Number(b.weak_leg_bv), 0);
  const totalStrongBV = data.reduce((s, b) => s + Number(b.strong_leg_bv), 0);

  const handleExport = () => {
    const cols = ["User", "Weak Leg BV", "Strong Leg BV", "Matching %", "Matching Amount", "Status", "Period", "Date"];
    const rows = data.map((b) => [
      getName(b.user_id),
      String(b.weak_leg_bv),
      String(b.strong_leg_bv),
      `${b.payout_percentage}%`,
      `₹${Number(b.matching_amount).toLocaleString()}`,
      b.status,
      b.period_start && b.period_end ? `${format(new Date(b.period_start), "dd MMM")} - ${format(new Date(b.period_end), "dd MMM")}` : "—",
      format(new Date(b.created_at), "dd MMM yyyy"),
    ]);
    exportCsv(cols, rows, "binary_payouts");
  };

  return (
    <div className="space-y-4">
      {/* Binary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Binary Income</div>
          <div className="text-lg font-display font-bold text-purple-500">₹{totalMatching.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Weak Leg BV</div>
          <div className="text-lg font-display font-bold text-foreground">{totalWeakBV.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Strong Leg BV</div>
          <div className="text-lg font-display font-bold text-foreground">{totalStrongBV.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground mb-1">Total Payouts</div>
          <div className="text-lg font-display font-bold text-foreground">{data.length}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data.length} record(s)</p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Weak Leg BV</TableHead>
                <TableHead>Strong Leg BV</TableHead>
                <TableHead>Matching %</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No binary payouts found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((b) => (
                  <TableRow key={b.id} className="hover:bg-secondary/30">
                    <TableCell className="font-medium text-foreground">{getName(b.user_id)}</TableCell>
                    <TableCell className="text-muted-foreground">{Number(b.weak_leg_bv).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{Number(b.strong_leg_bv).toLocaleString()}</TableCell>
                    <TableCell>{b.payout_percentage}%</TableCell>
                    <TableCell className="font-semibold text-purple-500">₹{Number(b.matching_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={b.status === "paid" ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {b.period_start && b.period_end
                        ? `${format(new Date(b.period_start), "dd MMM")} – ${format(new Date(b.period_end), "dd MMM")}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{format(new Date(b.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminCommissions;
