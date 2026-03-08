import { useState, useEffect, useCallback } from "react";
import { startOfMonth } from "date-fns";
import { Users, DollarSign, Package, ShoppingCart, Truck, Loader2, Download, TrendingUp, TrendingDown } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DateRangeFilter from "@/components/admin/reports/DateRangeFilter";

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
const StatCard = ({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: any; trend?: "up" | "down" | null }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
      <div>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {label}
          {trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
        </p>
      </div>
    </CardContent>
  </Card>
);

/* ─── User Report ─── */
const UserReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).toISOString();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, referral_code, title, subscription_paid, created_at, direct_referral_count")
      .gte("created_at", fromStr)
      .lte("created_at", toStr)
      .order("created_at", { ascending: false })
      .limit(200);

    if (profiles) {
      setData(profiles);
      setStats({
        total: profiles.length,
        active: profiles.filter((p) => p.subscription_paid).length,
        inactive: profiles.filter((p) => !p.subscription_paid).length,
      });
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total New Users" value={stats.total} icon={Users} />
        <StatCard label="Active (Subscribed)" value={stats.active} icon={Users} trend="up" />
        <StatCard label="Inactive" value={stats.inactive} icon={Users} trend="down" />
      </div>
      <ReportTable
        columns={["Name", "Referral Code", "Title", "Status", "Referrals", "Joined"]}
        csvFilename="user_report"
        csvRows={data.map((p) => [
          p.full_name || "—", p.referral_code, p.title,
          p.subscription_paid ? "Active" : "Inactive",
          String(p.direct_referral_count),
          new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
        rows={data.map((p) => [
          p.full_name || "—",
          p.referral_code,
          p.title,
          p.subscription_paid ? <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>,
          String(p.direct_referral_count),
          new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
};

/* ─── Income Report ─── */
const IncomeReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCommissions: 0, totalWithdrawals: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).toISOString();

    const { data: commissions } = await supabase
      .from("commissions")
      .select("id, amount, commission_type, level, status, created_at, beneficiary_id")
      .gte("created_at", fromStr)
      .lte("created_at", toStr)
      .order("created_at", { ascending: false })
      .limit(200);

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

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Commissions" value={`₹${stats.totalCommissions.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Paid Out" value={`₹${stats.totalWithdrawals.toLocaleString()}`} icon={DollarSign} trend="up" />
        <StatCard label="Pending" value={`₹${stats.pending.toLocaleString()}`} icon={DollarSign} />
      </div>
      <ReportTable
        columns={["User", "Type", "Level", "Amount", "Status", "Date"]}
        csvFilename="income_report"
        csvRows={data.map((c) => [
          c.user_name, c.commission_type, String(c.level),
          `₹${Number(c.amount).toLocaleString()}`, c.status,
          new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
        rows={data.map((c) => [
          c.user_name,
          c.commission_type,
          String(c.level),
          `₹${Number(c.amount).toLocaleString()}`,
          c.status === "paid" ? <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Paid</Badge> : <Badge variant="outline" className="text-[10px]">{c.status}</Badge>,
          new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
};

/* ─── Product Report ─── */
const ProductReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, category, retail_price, distributor_price, stock, active, created_at")
      .order("created_at", { ascending: false });

    // Get order items in range to calculate sales per product
    const fromStr = from.toISOString();
    const toStr = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).toISOString();

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, price, created_at")
      .gte("created_at", fromStr)
      .lte("created_at", toStr);

    const salesMap = new Map<string, { qty: number; revenue: number }>();
    orderItems?.forEach((item) => {
      const prev = salesMap.get(item.product_id) || { qty: 0, revenue: 0 };
      salesMap.set(item.product_id, { qty: prev.qty + item.quantity, revenue: prev.revenue + Number(item.price) * item.quantity });
    });

    if (products) {
      setData(products.map((p) => ({
        ...p,
        sold: salesMap.get(p.id)?.qty || 0,
        revenue: salesMap.get(p.id)?.revenue || 0,
      })));
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <LoadingState />;

  const totalRevenue = data.reduce((s, p) => s + p.revenue, 0);
  const totalSold = data.reduce((s, p) => s + p.sold, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Products" value={data.length} icon={Package} />
        <StatCard label="Units Sold (Period)" value={totalSold} icon={ShoppingCart} trend="up" />
        <StatCard label="Revenue (Period)" value={`₹${totalRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>
      <ReportTable
        columns={["Product", "Category", "Retail Price", "Stock", "Units Sold", "Revenue", "Status"]}
        rows={data.map((p) => [
          p.name,
          p.category,
          `₹${Number(p.retail_price).toLocaleString()}`,
          String(p.stock),
          String(p.sold),
          `₹${p.revenue.toLocaleString()}`,
          p.active ? <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>,
        ])}
      />
    </div>
  );
};

/* ─── Sales Report ─── */
const SalesReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, confirmed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).toISOString();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, status, payment_method, shipping_method, created_at")
      .gte("created_at", fromStr)
      .lte("created_at", toStr)
      .order("created_at", { ascending: false })
      .limit(200);

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

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total} icon={ShoppingCart} />
        <StatCard label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={DollarSign} trend="up" />
        <StatCard label="Confirmed" value={stats.confirmed} icon={ShoppingCart} />
        <StatCard label="Pending" value={stats.pending} icon={ShoppingCart} />
      </div>
      <ReportTable
        columns={["Order ID", "Customer", "Amount", "Status", "Payment", "Date"]}
        rows={data.map((o) => [
          o.id.slice(0, 8) + "...",
          o.customer,
          `₹${Number(o.total_amount).toLocaleString()}`,
          <StatusBadge status={o.status} key={o.id} />,
          o.payment_method || "—",
          new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
};

/* ─── Shipping Report ─── */
const ShippingReport = ({ from, to }: ReportProps) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, shipped: 0, delivered: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromStr = from.toISOString();
    const toStr = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).toISOString();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, status, shipping_method, shipping_address, created_at")
      .gte("created_at", fromStr)
      .lte("created_at", toStr)
      .order("created_at", { ascending: false })
      .limit(200);

    if (orders) {
      const userIds = [...new Set(orders.map((o) => o.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      setData(orders.map((o) => {
        const addr = o.shipping_address as any;
        return {
          ...o,
          customer: nameMap.get(o.user_id) || "Unknown",
          city: addr?.city || "—",
          state: addr?.state || "—",
        };
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

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total} icon={Truck} />
        <StatCard label="Shipped" value={stats.shipped} icon={Truck} trend="up" />
        <StatCard label="Delivered" value={stats.delivered} icon={Truck} />
        <StatCard label="Pending Shipment" value={stats.pending} icon={Truck} />
      </div>
      <ReportTable
        columns={["Order ID", "Customer", "City", "State", "Shipping Method", "Status", "Date"]}
        rows={data.map((o) => [
          o.id.slice(0, 8) + "...",
          o.customer,
          o.city,
          o.state,
          o.shipping_method || "Free",
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

const ReportTable = ({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) => {
  if (rows.length === 0) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No data found for the selected period.</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((c) => <TableHead key={c} className="text-xs font-semibold">{c}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => <TableCell key={j} className="text-sm">{cell}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminReports;
