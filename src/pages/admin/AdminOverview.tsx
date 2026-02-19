import AdminLayout from "@/components/admin/AdminLayout";
import { motion } from "framer-motion";
import { Users, Package, ShoppingCart, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const AdminOverview = () => {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    commissions: 0,
    activeProducts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, productsRes, ordersRes, commissionsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount"),
        supabase.from("commissions").select("amount"),
      ]);

      const revenue = (ordersRes.data || []).reduce((s, o) => s + Number(o.total_amount), 0);
      const commTotal = (commissionsRes.data || []).reduce((s, c) => s + Number(c.amount), 0);

      setStats({
        users: profilesRes.count || 0,
        products: productsRes.count || 0,
        orders: ordersRes.data?.length || 0,
        revenue,
        commissions: commTotal,
        activeProducts: productsRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { icon: Users, label: "Total Users", value: stats.users, href: "/admin/users", color: "text-primary" },
    { icon: Package, label: "Products", value: stats.products, href: "/admin/products", color: "text-primary" },
    { icon: ShoppingCart, label: "Orders", value: stats.orders, href: "/admin/orders", color: "text-primary" },
    { icon: DollarSign, label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, href: "/admin/orders", color: "text-success" },
    { icon: TrendingUp, label: "Commissions Paid", value: `₹${stats.commissions.toLocaleString()}`, href: "/admin/commissions", color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Admin Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <Link to={c.href} key={c.label}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <c.icon className={`h-5 w-5 ${c.color} mb-3`} />
                <div className="text-2xl font-display font-bold text-foreground">{c.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
