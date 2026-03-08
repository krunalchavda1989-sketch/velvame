import AdminLayout from "@/components/admin/AdminLayout";
import { motion } from "framer-motion";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const AdminOverview = () => {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0, commissions: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [commissionBreakdown, setCommissionBreakdown] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, productsRes, ordersRes, commissionsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at", { count: "exact" }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("id, total_amount, status, created_at, user_id, order_number"),
        supabase.from("commissions").select("amount, commission_type, created_at"),
      ]);

      const allOrders = ordersRes.data || [];
      const commissions = commissionsRes.data || [];
      const profiles = profilesRes.data || [];

      // Only count successful orders (not pending or cancelled)
      const successStatuses = ["confirmed", "shipped", "delivered"];
      const orders = allOrders.filter((o) => successStatuses.includes(o.status));
      const revenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const commTotal = commissions.reduce((s, c) => s + Number(c.amount), 0);

      setStats({
        users: profilesRes.count || 0,
        products: productsRes.count || 0,
        orders: orders.length,
        revenue,
        commissions: commTotal,
      });

      // Revenue trend (last 6 months)
      const months: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const label = format(d, "MMM yyyy");
        const rev = orders
          .filter((o) => new Date(o.created_at) >= start && new Date(o.created_at) <= end)
          .reduce((s, o) => s + Number(o.total_amount), 0);
        const comm = commissions
          .filter((c) => new Date(c.created_at) >= start && new Date(c.created_at) <= end)
          .reduce((s, c) => s + Number(c.amount), 0);
        months.push({ month: format(d, "MMM"), revenue: rev, commissions: comm });
      }
      setRevenueData(months);

      // User growth (last 6 months)
      const ug: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const count = profiles.filter(
          (p) => new Date(p.created_at) >= start && new Date(p.created_at) <= end
        ).length;
        ug.push({ month: format(d, "MMM"), users: count });
      }
      setUserGrowth(ug);

      // Commission breakdown by type
      const typeMap: Record<string, number> = {};
      commissions.forEach((c) => {
        const t = c.commission_type === "level" ? "Level Income" : c.commission_type === "repurchase" ? "Repurchase" : c.commission_type;
        typeMap[t] = (typeMap[t] || 0) + Number(c.amount);
      });
      setCommissionBreakdown(Object.entries(typeMap).map(([name, value]) => ({ name, value: Math.round(value) })));

      // Order status distribution (show all for context)
      const statusMap: Record<string, number> = {};
      allOrders.forEach((o) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      setOrderStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Recent orders (successful only)
      setRecentOrders(
        orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      );

      // Top earners
      const { data: topComm } = await supabase
        .from("commissions")
        .select("beneficiary_id, amount");
      const earnerMap: Record<string, number> = {};
      (topComm || []).forEach((c) => {
        earnerMap[c.beneficiary_id] = (earnerMap[c.beneficiary_id] || 0) + Number(c.amount);
      });
      const sorted = Object.entries(earnerMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (sorted.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, referral_code")
          .in("user_id", sorted.map((s) => s[0]));
        const profMap = Object.fromEntries((profs || []).map((p) => [p.user_id, p]));
        setTopUsers(
          sorted.map(([uid, earned]) => ({
            name: profMap[uid]?.full_name || "User",
            code: profMap[uid]?.referral_code || "",
            earned: Math.round(earned),
          }))
        );
      }
    };
    fetchAll();
  }, []);

  const cards = [
    { icon: Users, label: "Total Users", value: stats.users, href: "/admin/users", color: "text-primary" },
    { icon: Package, label: "Products", value: stats.products, href: "/admin/products", color: "text-chart-2" },
    { icon: ShoppingCart, label: "Orders", value: stats.orders, href: "/admin/orders", color: "text-chart-3" },
    { icon: DollarSign, label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, href: "/admin/orders", color: "text-chart-4" },
    { icon: TrendingUp, label: "Commissions", value: `₹${stats.commissions.toLocaleString()}`, href: "/admin/commissions", color: "text-chart-5" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((c, i) => (
            <Link to={c.href} key={c.label}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <c.icon className={`h-5 w-5 ${c.color} mb-2`} />
                <div className="text-xl font-display font-bold text-foreground">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue & Commission Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" name="Revenue (₹)" />
                  <Area type="monotone" dataKey="commissions" stroke="hsl(var(--chart-2))" fill="url(#commGrad)" name="Commissions (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Commission Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Commission Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {commissionBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={commissionBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {commissionBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center text-muted-foreground text-sm">No data yet</div>
              )}
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {orderStatusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center text-muted-foreground text-sm">No data yet</div>
              )}
            </CardContent>
          </Card>

          {/* Top Earners */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Earners</CardTitle>
            </CardHeader>
            <CardContent>
              {topUsers.length > 0 ? (
                <div className="space-y-3">
                  {topUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.code}</div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">₹{u.earned.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 font-medium">Order ID</th>
                      <th className="text-left py-2 font-medium">Amount</th>
                      <th className="text-left py-2 font-medium">Status</th>
                      <th className="text-left py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-2 font-mono text-xs">{o.order_number || o.id.slice(0, 8)}</td>
                        <td className="py-2">₹{Number(o.total_amount).toLocaleString()}</td>
                        <td className="py-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{o.status}</span>
                        </td>
                        <td className="py-2 text-muted-foreground">{format(new Date(o.created_at), "dd MMM yyyy")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">No orders yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
