import { useState, useEffect, useCallback, useMemo } from "react";
import { startOfMonth, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays } from "date-fns";
import { Users, DollarSign, Package, ShoppingCart, Truck, Loader2, Download, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DateRangeFilter from "@/components/admin/reports/DateRangeFilter";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import { VIBRANT_COLORS, ChartGradients, chartTooltipStyle, axisTick } from "@/components/admin/ChartStyles";
import PayoutReport from "@/components/admin/reports/PayoutReport";
const CHART_COLORS = VIBRANT_COLORS;

// ─── Helpers ───
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
        buckets[i].amount += Number(item.amount || item.total_amount || 0);
        break;
      }
    }
  });

  return buckets;
};

// ─── Main ───
const AdminReports = () => {
  const [from, setFrom] = useState<Date>(startOfMonth(new Date()));
  const [to, setTo] = useState<Date>(new Date());
  const handleRangeChange = (f: Date, t: Date) => { setFrom(f); setTo(t); };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View detailed reports across all business areas</p>
        </div>

        <div className="mb-6">
          <DateRangeFilter from={from} to={to} onRangeChange={handleRangeChange} />
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> User Report</TabsTrigger>
            <TabsTrigger value="income" className="gap-1.5 text-xs"><DollarSign className="h-3.5 w-3.5" /> Income Report</TabsTrigger>
            <TabsTrigger value="product" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" /> Product Report</TabsTrigger>
            <TabsTrigger value="sales" className="gap-1.5 text-xs"><ShoppingCart className="h-3.5 w-3.5" /> Sales Report</TabsTrigger>
            <TabsTrigger value="shipping" className="gap-1.5 text-xs"><Truck className="h-3.5 w-3.5" /> Shipping Report</TabsTrigger>
          </TabsList>

          <TabsContent value="users"><UserReport from={from} to={to} /></TabsContent>
          <TabsContent value="income"><IncomeReport from={from} to={to} /></TabsContent>
          <TabsContent value="product"><ProductReport from={from} to={to} /></TabsContent>
          <TabsContent value="sales"><SalesReport from={from} to={to} /></TabsContent>
          <TabsContent value="shipping"><ShippingReport from={from} to={to} /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

interface ReportProps { from: Date; to: Date; }

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

/* ─── Stat Card ─── */
const STAT_GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
];
let _statIdx = 0;
const StatCard = ({ label, value, icon: Icon, gradient }: { label: string; value: string | number; icon: any; trend?: "up" | "down" | null; gradient?: string }) => {
  const g = gradient || STAT_GRADIENTS[_statIdx++ % STAT_GRADIENTS.length];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl bg-gradient-to-br ${g} p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs opacity-80">{label}</span>
        <Icon className="h-4 w-4 opacity-80" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  );
};

/* ─── Chart Card wrapper ─── */
const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="h-[260px] w-full">{children}</div>
    </CardContent>
  </Card>
);

/* ═══════════════════════════════════════
   USER REPORT
   ═══════════════════════════════════════ */
const UserReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = toEnd(to).toISOString();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, referral_code, title, subscription_paid, created_at, direct_referral_count")
      .gte("created_at", fromStr).lte("created_at", toStr)
      .order("created_at", { ascending: false }).limit(200);
    if (profiles) {
      setData(profiles);
      setStats({ total: profiles.length, active: profiles.filter((p) => p.subscription_paid).length, inactive: profiles.filter((p) => !p.subscription_paid).length });
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  const trendData = useMemo(() => groupByDate(data, "created_at", from, to), [data, from, to]);
  const pieData = useMemo(() => [
    { name: "Active", value: stats.active },
    { name: "Inactive", value: stats.inactive },
  ].filter((d) => d.value > 0), [stats]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total New Users" value={stats.total} icon={Users} />
        <StatCard label="Active (Subscribed)" value={stats.active} icon={Users} trend="up" />
        <StatCard label="Inactive" value={stats.inactive} icon={Users} trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="New User Registrations">
          <ResponsiveContainer>
            <AreaChart data={trendData}>
              <defs><ChartGradients /></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area type="monotone" dataKey="count" name="Users" stroke="#6366f1" fill="url(#grad-indigo)" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="User Status Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={800}>
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ReportTable
        columns={["Name", "Referral Code", "Title", "Status", "Referrals", "Joined"]}
        csvFilename="user_report"
        csvRows={data.map((p) => [p.full_name || "—", p.referral_code, p.title, p.subscription_paid ? "Active" : "Inactive", String(p.direct_referral_count), new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })])}
        rows={data.map((p) => [
          p.full_name || "—", p.referral_code, p.title,
          p.subscription_paid ? <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>,
          String(p.direct_referral_count),
          new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
};

/* ═══════════════════════════════════════
   INCOME REPORT
   ═══════════════════════════════════════ */
const IncomeReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCommissions: 0, totalWithdrawals: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = toEnd(to).toISOString();
    const { data: commissions } = await supabase
      .from("commissions")
      .select("id, amount, commission_type, level, status, created_at, beneficiary_id")
      .gte("created_at", fromStr).lte("created_at", toStr)
      .order("created_at", { ascending: false }).limit(200);
    if (commissions) {
      const userIds = [...new Set(commissions.map((c) => c.beneficiary_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      setData(commissions.map((c) => ({ ...c, user_name: nameMap.get(c.beneficiary_id) || "Unknown" })));
      setStats({
        totalCommissions: commissions.reduce((s, c) => s + Number(c.amount), 0),
        totalWithdrawals: commissions.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0),
        pending: commissions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0),
      });
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  const trendData = useMemo(() => groupByDate(data, "created_at", from, to), [data, from, to]);
  const typeData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((c) => map.set(c.commission_type, (map.get(c.commission_type) || 0) + Number(c.amount)));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [data]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Commissions" value={`₹${stats.totalCommissions.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Paid Out" value={`₹${stats.totalWithdrawals.toLocaleString()}`} icon={DollarSign} trend="up" />
        <StatCard label="Pending" value={`₹${stats.pending.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Commission Earnings Over Time">
          <ResponsiveContainer>
            <AreaChart data={trendData}>
              <defs><ChartGradients /></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
              <Area type="monotone" dataKey="amount" name="Amount" stroke="#10b981" fill="url(#grad-emerald)" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Commission by Type">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={800}>
                {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ReportTable
        columns={["User", "Type", "Level", "Amount", "Status", "Date"]}
        csvFilename="income_report"
        csvRows={data.map((c) => [c.user_name, c.commission_type, String(c.level), `₹${Number(c.amount).toLocaleString()}`, c.status, new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })])}
        rows={data.map((c) => [
          c.user_name, c.commission_type, String(c.level), `₹${Number(c.amount).toLocaleString()}`,
          c.status === "paid" ? <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Paid</Badge> : <Badge variant="outline" className="text-[10px]">{c.status}</Badge>,
          new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
};

/* ═══════════════════════════════════════
   PRODUCT REPORT
   ═══════════════════════════════════════ */
const ProductReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, category, retail_price, distributor_price, stock, active, created_at")
      .order("created_at", { ascending: false });
    const fromStr = from.toISOString();
    const toStr = toEnd(to).toISOString();
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, price, created_at")
      .gte("created_at", fromStr).lte("created_at", toStr);
    const salesMap = new Map<string, { qty: number; revenue: number }>();
    orderItems?.forEach((item) => {
      const prev = salesMap.get(item.product_id) || { qty: 0, revenue: 0 };
      salesMap.set(item.product_id, { qty: prev.qty + item.quantity, revenue: prev.revenue + Number(item.price) * item.quantity });
    });
    if (products) {
      setData(products.map((p) => ({ ...p, sold: salesMap.get(p.id)?.qty || 0, revenue: salesMap.get(p.id)?.revenue || 0 })));
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalRevenue = data.reduce((s, p) => s + p.revenue, 0);
  const totalSold = data.reduce((s, p) => s + p.sold, 0);

  const topProducts = useMemo(() =>
    [...data].sort((a, b) => b.sold - a.sold).slice(0, 8).map((p) => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, sold: p.sold, revenue: p.revenue })),
    [data]
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + p.revenue));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [data]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Products" value={data.length} icon={Package} />
        <StatCard label="Units Sold (Period)" value={totalSold} icon={ShoppingCart} trend="up" />
        <StatCard label="Revenue (Period)" value={`₹${totalRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top Selling Products">
          <ResponsiveContainer>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
              <defs>
                <linearGradient id="barProdGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} width={90} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="sold" name="Units Sold" fill="url(#barProdGrad)" radius={[0, 6, 6, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue by Category">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={800}>
                {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ReportTable
        columns={["Product", "Category", "Retail Price", "Stock", "Units Sold", "Revenue", "Status"]}
        csvFilename="product_report"
        csvRows={data.map((p) => [p.name, p.category, `₹${Number(p.retail_price).toLocaleString()}`, String(p.stock), String(p.sold), `₹${p.revenue.toLocaleString()}`, p.active ? "Active" : "Inactive"])}
        rows={data.map((p) => [
          p.name, p.category, `₹${Number(p.retail_price).toLocaleString()}`, String(p.stock), String(p.sold), `₹${p.revenue.toLocaleString()}`,
          p.active ? <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>,
        ])}
      />
    </div>
  );
};

/* ═══════════════════════════════════════
   SALES REPORT
   ═══════════════════════════════════════ */
const SalesReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, confirmed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = toEnd(to).toISOString();
    const { data: orders } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, status, payment_method, shipping_method, created_at")
      .gte("created_at", fromStr).lte("created_at", toStr)
      .order("created_at", { ascending: false }).limit(200);
    if (orders) {
      const userIds = [...new Set(orders.map((o) => o.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      setData(orders.map((o) => ({ ...o, customer: nameMap.get(o.user_id) || "Unknown" })));
      setStats({
        total: orders.length,
        revenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
        confirmed: orders.filter((o) => o.status === "confirmed" || o.status === "delivered").length,
        pending: orders.filter((o) => o.status === "pending").length,
      });
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  const trendData = useMemo(() => groupByDate(data, "created_at", from, to), [data, from, to]);
  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((o) => map.set(o.status, (map.get(o.status) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [data]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total} icon={ShoppingCart} />
        <StatCard label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={DollarSign} trend="up" />
        <StatCard label="Confirmed" value={stats.confirmed} icon={ShoppingCart} />
        <StatCard label="Pending" value={stats.pending} icon={ShoppingCart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Sales Revenue Trend">
          <ResponsiveContainer>
            <AreaChart data={trendData}>
              <defs><ChartGradients /></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "4 4" }} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="amount" name="Revenue" stroke="#f59e0b" fill="url(#grad-amber)" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Order Status Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={800}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ReportTable
        columns={["Order ID", "Customer", "Amount", "Status", "Payment", "Date"]}
        csvFilename="sales_report"
        csvRows={data.map((o) => [o.id.slice(0, 8), o.customer, `₹${Number(o.total_amount).toLocaleString()}`, o.status, o.payment_method || "—", new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })])}
        rows={data.map((o) => [
          o.id.slice(0, 8) + "...", o.customer, `₹${Number(o.total_amount).toLocaleString()}`,
          <StatusBadge status={o.status} key={o.id} />, o.payment_method || "—",
          new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
};

/* ═══════════════════════════════════════
   SHIPPING REPORT
   ═══════════════════════════════════════ */
const ShippingReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, shipped: 0, delivered: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = toEnd(to).toISOString();
    const { data: orders } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, status, shipping_method, shipping_address, created_at")
      .gte("created_at", fromStr).lte("created_at", toStr)
      .order("created_at", { ascending: false }).limit(200);
    if (orders) {
      const userIds = [...new Set(orders.map((o) => o.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      setData(orders.map((o) => {
        const addr = o.shipping_address as any;
        return { ...o, customer: nameMap.get(o.user_id) || "Unknown", city: addr?.city || "—", state: addr?.state || "—" };
      }));
      setStats({
        total: orders.length,
        shipped: orders.filter((o) => o.status === "shipped").length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        pending: orders.filter((o) => o.status === "pending" || o.status === "confirmed").length,
      });
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((o) => map.set(o.status, (map.get(o.status) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [data]);

  const methodData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((o) => map.set(o.shipping_method || "Free", (map.get(o.shipping_method || "Free") || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [data]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total} icon={Truck} />
        <StatCard label="Shipped" value={stats.shipped} icon={Truck} trend="up" />
        <StatCard label="Delivered" value={stats.delivered} icon={Truck} />
        <StatCard label="Pending Shipment" value={stats.pending} icon={Truck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Shipment Status Breakdown">
          <ResponsiveContainer>
            <BarChart data={statusData}>
              <defs>
                <linearGradient id="barShipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="value" name="Orders" fill="url(#barShipGrad)" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Shipping Method Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={methodData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} animationDuration={800}>
                {methodData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ReportTable
        columns={["Order ID", "Customer", "City", "State", "Shipping Method", "Status", "Date"]}
        csvFilename="shipping_report"
        csvRows={data.map((o) => [o.id.slice(0, 8), o.customer, o.city, o.state, o.shipping_method || "Free", o.status, new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })])}
        rows={data.map((o) => [
          o.id.slice(0, 8) + "...", o.customer, o.city, o.state, o.shipping_method || "Free",
          <StatusBadge status={o.status} key={o.id} />,
          new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
};

/* ─── Shared Components ─── */
const LoadingState = () => (
  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { class: string; label: string }> = {
    confirmed: { class: "bg-success/15 text-success border-success/30", label: "Confirmed" },
    delivered: { class: "bg-success/15 text-success border-success/30", label: "Delivered" },
    shipped: { class: "bg-primary/15 text-primary border-primary/30", label: "Shipped" },
    pending: { class: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "Pending" },
    cancelled: { class: "bg-destructive/15 text-destructive border-destructive/30", label: "Cancelled" },
  };
  const s = map[status] || { class: "", label: status };
  return <Badge variant="outline" className={`text-[10px] ${s.class}`}>{s.label}</Badge>;
};

const ROWS_PER_PAGE = 15;

const ReportTable = ({ columns, rows, csvFilename, csvRows }: { columns: string[]; rows: React.ReactNode[][]; csvFilename?: string; csvRows?: string[][] }) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const paginatedRows = rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  if (rows.length === 0) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No data found for the selected period.</CardContent></Card>;
  }

  return (
    <Card>
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs text-muted-foreground">{rows.length} records</p>
        {csvFilename && csvRows && (
          <Button variant="outline" size="sm" className="text-xs" onClick={() => exportCsv(columns, csvRows, csvFilename)}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
        )}
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((c) => <TableHead key={c} className="text-xs font-semibold">{c}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => <TableCell key={j} className="text-sm">{cell}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="text-xs h-8 px-2.5" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`e${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="text-xs h-8 w-8 p-0" onClick={() => setPage(p as number)}>
                      {p}
                    </Button>
                  )
                )}
              <Button variant="outline" size="sm" className="text-xs h-8 px-2.5" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminReports;
