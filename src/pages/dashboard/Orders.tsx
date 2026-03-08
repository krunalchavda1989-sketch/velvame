import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Package, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; image_url: string | null } | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  shipping_method: string | null;
  is_repurchase: boolean;
  created_at: string;
  items: OrderItem[];
}

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("id, total_amount, status, payment_method, shipping_method, is_repurchase, created_at, order_number")
        .eq("user_id", user.id)
        .neq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      const orderList: Order[] = (data || []).map((o: any) => ({ ...o, items: [] }));

      // Fetch items for all orders in one query
      if (orderList.length > 0) {
        const ids = orderList.map((o) => o.id);
        const { data: items } = await supabase
          .from("order_items")
          .select("id, quantity, price, order_id, product_id")
          .in("order_id", ids);

        // Fetch product info
        const productIds = [...new Set((items || []).map((i: any) => i.product_id))];
        const { data: products } = await supabase
          .from("products")
          .select("id, name, image_url")
          .in("id", productIds);

        const productMap = new Map((products || []).map((p: any) => [p.id, p]));

        (items || []).forEach((item: any) => {
          const order = orderList.find((o) => o.id === item.order_id);
          if (order) {
            order.items.push({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              product: productMap.get(item.product_id) || null,
            });
          }
        });
      }

      setOrders(orderList);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    confirmed: { color: "bg-green-500/10 text-green-600 border-green-500/20", icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    pending: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: <Clock className="h-4 w-4 text-yellow-600" /> },
    cancelled: { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: <XCircle className="h-4 w-4 text-red-600" /> },
  };

  const getStatus = (s: string) => statusConfig[s] || statusConfig.pending;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Order History</h1>
          <p className="text-sm text-muted-foreground mt-1">View your past orders and their details</p>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No orders yet. Visit the shop to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const expanded = expandedId === order.id;
              const sc = getStatus(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl bg-card border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {sc.icon}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
                          {formatCurrency(order.total_amount)}
                          {order.is_repurchase && (
                            <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent-foreground border-accent/20">Repurchase</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/orders/${order.id}`); }}
                      >
                        <Eye className="w-3 h-3" /> Details
                      </Button>
                      <Badge variant="outline" className={`text-xs ${sc.color}`}>{order.status}</Badge>
                      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-border px-4 py-3 space-y-2 bg-secondary/30">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.product?.image_url ? (
                              <img src={item.product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-foreground truncate">{item.product?.name || "Unknown product"}</span>
                            <span className="text-muted-foreground">×{item.quantity}</span>
                          </div>
                          <span className="text-foreground font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.payment_method && (
                        <div className="text-xs text-muted-foreground pt-1">Payment: {order.payment_method}</div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
