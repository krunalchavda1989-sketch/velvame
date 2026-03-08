import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Coins, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, referral_code");
    const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p]));

    // Check which orders already have commissions processed
    const { data: commData } = await supabase
      .from("commissions")
      .select("order_id");
    const processedOrderIds = new Set((commData || []).map((c) => c.order_id));

    const enriched = (ordersData || []).map((o) => ({
      ...o,
      profile: profileMap.get(o.user_id) || null,
      commissions_processed: processedOrderIds.has(o.id),
    }));

    setOrders(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order status updated to ${status}`);

    // Auto-process commissions when order is confirmed
    if (status === "confirmed") {
      await processCommissions(id, true);
    } else {
      fetchOrders();
    }
  };

  const processCommissions = async (orderId: string, silent = false) => {
    setProcessingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-commissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ order_id: orderId }),
        }
      );

      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      if (result.message === "Already processed") {
        if (!silent) toast.info("Commissions were already processed for this order.");
      } else if (result.commissions_distributed === 0) {
        if (!silent) toast.info("No upline found — no commissions distributed.");
        else toast.info("Order confirmed. No referral chain found.");
      } else {
        toast.success(
          `✅ ${result.commissions_distributed} commission${result.commissions_distributed > 1 ? "s" : ""} distributed — ₹${result.total_distributed} across ${result.commissions_distributed} level${result.commissions_distributed > 1 ? "s" : ""}`
        );
      }
    } catch (err: any) {
      toast.error(`Commission processing failed: ${err.message}`);
    } finally {
      setProcessingId(null);
      fetchOrders();
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "delivered": return "bg-success text-success-foreground";
      case "shipped": return "bg-primary text-primary-foreground";
      case "confirmed": return "bg-accent text-accent-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Order Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Commissions are auto-processed when an order is confirmed.
            </p>
          </div>
          <Badge variant="outline" className="text-muted-foreground">{orders.length} orders</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground rounded-xl border border-border bg-card">No orders yet.</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">Order ID</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Repurchase</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Commissions</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                          <Eye className="w-3 h-3" /> View
                        </Button>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</td>
                      <td className="p-3 text-foreground">{o.profile?.full_name || "—"}</td>
                      <td className="p-3 font-medium text-primary">₹{o.total_amount}</td>
                      <td className="p-3">
                        {o.is_repurchase ? (
                          <Badge className="bg-accent text-accent-foreground">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={statusColor(o.status)}>{o.status}</Badge>
                      </td>
                      <td className="p-3">
                        {o.commissions_processed ? (
                          <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                            <Coins className="w-3.5 h-3.5" />
                            Distributed
                          </div>
                        ) : o.status === "cancelled" ? (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                            disabled={processingId === o.id}
                            onClick={() => processCommissions(o.id)}
                          >
                            {processingId === o.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Coins className="w-3 h-3" />
                            )}
                            {processingId === o.id ? "Processing…" : "Process"}
                          </Button>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                          <SelectTrigger className="w-[130px] h-8 bg-background border-border text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
