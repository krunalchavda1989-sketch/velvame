import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Coins, RefreshCw, Eye, ShoppingBag, AlertTriangle, Search,
  Package, XCircle, Truck, PackageCheck, Clock, CheckCircle, Archive, CalendarDays,
  CalendarIcon, RotateCcw, Download, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOrderEmail } from "@/lib/orderEmail";
import type { OrderEmailType } from "@/lib/orderEmail";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subMonths, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const datePresets = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Half Year", value: "half_year" },
  { label: "Year to Date", value: "ytd" },
  { label: "Custom", value: "custom" },
];

const getDateStart = (preset: string): Date | null => {
  const now = new Date();
  switch (preset) {
    case "today": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "quarter": return startOfQuarter(now);
    case "half_year": return subMonths(now, 6);
    case "ytd": return startOfYear(now);
    default: return null;
  }
};

const statCards = [
  { key: "total", label: "Total Orders", icon: Package, color: "#4f46e5" },
  { key: "pending", label: "Pending", icon: Clock, color: "#f59e0b" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle, color: "#10b981" },
  { key: "dispatched", label: "Dispatched", icon: Archive, color: "#6366f1" },
  { key: "shipped", label: "Shipped", icon: Truck, color: "#3b82f6" },
  { key: "delivered", label: "Delivered", icon: PackageCheck, color: "#059669" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "#ef4444" },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; orderNumber: string; userName: string; walletUsed: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const navigate = useNavigate();

  const resetFilters = () => {
    setSearchQuery("");
    setDatePreset("all");
    setStatusFilter("all");
    setCustomFrom(undefined);
    setCustomTo(undefined);
  };

  const hasActiveFilters = searchQuery.trim() !== "" || datePreset !== "all" || statusFilter !== "all";

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from("orders").select("*").order("created_at", { ascending: false });

    const { data: profilesData } = await supabase
      .from("profiles").select("user_id, full_name, referral_code");
    const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p]));

    const { data: commData } = await supabase.from("commissions").select("order_id");
    const processedOrderIds = new Set((commData || []).map((c) => c.order_id));

    const orderIds = (ordersData || []).map((o) => o.id);
    const { data: orderItemsData } = orderIds.length > 0
      ? await supabase.from("order_items").select("order_id, product_id").in("order_id", orderIds)
      : { data: [] };

    const productIds = [...new Set((orderItemsData || []).map((i: any) => i.product_id))];
    let productMap = new Map<string, any>();
    if (productIds.length > 0) {
      const { data: productsData } = await supabase.from("products").select("id, name, image_url").in("id", productIds);
      productMap = new Map((productsData || []).map((p: any) => [p.id, p]));
    }

    const orderItemsMap = new Map<string, any[]>();
    (orderItemsData || []).forEach((item: any) => {
      const existing = orderItemsMap.get(item.order_id) || [];
      const product = productMap.get(item.product_id);
      if (product) existing.push(product);
      orderItemsMap.set(item.order_id, existing);
    });

    const enriched = (ordersData || []).map((o) => ({
      ...o,
      profile: profileMap.get(o.user_id) || null,
      commissions_processed: processedOrderIds.has(o.id),
      products: orderItemsMap.get(o.id) || [],
    }));

    setOrders(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Date filter
    if (datePreset === "custom") {
      if (customFrom) result = result.filter((o) => new Date(o.created_at) >= startOfDay(customFrom));
      if (customTo) {
        const endOfTo = new Date(customTo);
        endOfTo.setHours(23, 59, 59, 999);
        result = result.filter((o) => new Date(o.created_at) <= endOfTo);
      }
    } else {
      const dateStart = getDateStart(datePreset);
      if (dateStart) {
        result = result.filter((o) => new Date(o.created_at) >= dateStart);
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) =>
        (o.order_number || "").toLowerCase().includes(q) ||
        (o.profile?.full_name || "").toLowerCase().includes(q) ||
        (o.profile?.referral_code || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, datePreset, statusFilter, searchQuery, customFrom, customTo]);

  // Status counts (from filtered-by-date orders, not status-filtered)
  const counts = useMemo(() => {
    let base = orders;
    if (datePreset === "custom") {
      if (customFrom) base = base.filter((o) => new Date(o.created_at) >= startOfDay(customFrom));
      if (customTo) {
        const endOfTo = new Date(customTo);
        endOfTo.setHours(23, 59, 59, 999);
        base = base.filter((o) => new Date(o.created_at) <= endOfTo);
      }
    } else {
      const dateStart = getDateStart(datePreset);
      if (dateStart) base = base.filter((o) => new Date(o.created_at) >= dateStart);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter((o) =>
        (o.order_number || "").toLowerCase().includes(q) ||
        (o.profile?.full_name || "").toLowerCase().includes(q) ||
        (o.profile?.referral_code || "").toLowerCase().includes(q)
      );
    }
    return {
      total: base.length,
      pending: base.filter((o) => o.status === "pending").length,
      confirmed: base.filter((o) => o.status === "confirmed").length,
      dispatched: base.filter((o) => o.status === "dispatched").length,
      shipped: base.filter((o) => o.status === "shipped").length,
      delivered: base.filter((o) => o.status === "delivered").length,
      cancelled: base.filter((o) => o.status === "cancelled").length,
    };
  }, [orders, datePreset, searchQuery, customFrom, customTo]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { data: result, error } = await supabase.rpc("admin_cancel_order_and_refund" as any, { _order_id: orderId });
      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Cancel failed");
      if (result.refunded > 0) {
        toast.success(`Order cancelled. ₹${result.refunded} refunded to wallet.`);
      } else {
        toast.success(`Order cancelled. ${result.message || "No wallet refund needed."}`);
      }
    } catch (err: any) {
      toast.error(`Cancel failed: ${err.message}`);
    } finally {
      fetchOrders();
    }
  };

  const confirmCancelOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setCancelTarget({
      id: orderId,
      orderNumber: order.order_number || orderId.slice(0, 8),
      userName: order.profile?.full_name || "Unknown",
      walletUsed: order.wallet_amount_used || 0,
    });
    setCancelDialogOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    if (status === "cancelled") { confirmCancelOrder(id); return; }
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order status updated to ${status}`);
    const emailMap: Record<string, OrderEmailType> = {
      confirmed: "order_confirmed", shipped: "order_shipped", delivered: "order_delivered",
    };
    if (emailMap[status]) sendOrderEmail(id, emailMap[status]);
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
          `✅ ${result.commissions_distributed} commission${result.commissions_distributed > 1 ? "s" : ""} distributed — ₹${result.total_distributed}`
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
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Order Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">Commissions are auto-processed when an order is confirmed.</p>
          </div>
          <Badge variant="outline" className="text-muted-foreground">{filteredOrders.length} orders</Badge>
        </div>

        {/* Colorful Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {statCards.map((card) => {
            const count = counts[card.key as keyof typeof counts] ?? 0;
            const isActive = statusFilter === (card.key === "total" ? "all" : card.key);
            return (
              <button
                key={card.key}
                onClick={() => setStatusFilter(card.key === "total" ? "all" : card.key)}
                className={`relative overflow-hidden rounded-xl p-4 text-white text-left transition-all hover:scale-[1.03] active:scale-[0.98] ${isActive ? "ring-2 ring-offset-2 ring-offset-background" : ""}`}
                style={{
                  background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)`,
                  boxShadow: `0 6px 20px -4px ${card.color}44`,
                  ...(isActive ? { ringColor: card.color } : {}),
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20" style={{ background: "white", transform: "translate(30%, -30%)" }} />
                <card.icon className="h-5 w-5 mb-2 opacity-90" />
                <div className="text-2xl font-bold leading-none">{count}</div>
                <div className="text-[11px] mt-1 opacity-85 font-medium">{card.label}</div>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, order number, or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {hasActiveFilters && (
              <Button size="sm" variant="destructive" className="h-9 text-xs gap-1.5" onClick={resetFilters}>
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {datePresets.map((dp) => (
              <Button
                key={dp.value}
                size="sm"
                variant={datePreset === dp.value ? "default" : "outline"}
                className={`h-9 text-xs ${datePreset === dp.value ? "" : "border-border text-muted-foreground"}`}
                onClick={() => setDatePreset(dp.value)}
              >
                {dp.value !== "all" && dp.value !== "custom" && <CalendarDays className="h-3 w-3 mr-1" />}
                {dp.value === "custom" && <CalendarIcon className="h-3 w-3 mr-1" />}
                {dp.label}
              </Button>
            ))}
            {datePreset === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-1.5", !customFrom && "text-muted-foreground")}>
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {customFrom ? format(customFrom, "dd MMM yyyy") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-xs">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-1.5", !customTo && "text-muted-foreground")}>
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {customTo ? format(customTo, "dd MMM yyyy") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground rounded-xl border border-border bg-card">No orders found.</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">Order #</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Products</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Repurchase</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Commissions</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Update</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-foreground font-medium">{o.order_number || o.id.slice(0, 8)}</td>
                      <td className="p-3">
                        {o.order_source === "manual" ? (
                          <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent-foreground border-accent/20">Manual</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">User</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center -space-x-2">
                          {(o.products || []).slice(0, 3).map((p: any, idx: number) => (
                            <div key={idx} className="w-8 h-8 rounded-md border-2 border-background bg-secondary overflow-hidden flex-shrink-0">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                          {(o.products || []).length > 3 && (
                            <div className="w-8 h-8 rounded-md border-2 border-background bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                              +{o.products.length - 3}
                            </div>
                          )}
                          {(o.products || []).length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
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
                            <Coins className="w-3.5 h-3.5" /> Distributed
                          </div>
                        ) : o.status === "cancelled" ? (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10" disabled={processingId === o.id} onClick={() => processCommissions(o.id)}>
                            {processingId === o.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
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
                      <td className="p-3">
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          onClick={() => navigate(`/admin/orders/${o.id}`)}
                        >
                          <Eye className="w-3.5 h-3.5" /> View Order
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Cancel Order?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-muted-foreground">
                <p>Are you sure you want to cancel order <strong className="text-foreground">{cancelTarget?.orderNumber}</strong> for <strong className="text-foreground">{cancelTarget?.userName}</strong>?</p>
                {cancelTarget && cancelTarget.walletUsed > 0 && (
                  <p className="text-sm bg-accent/50 border border-accent rounded-lg p-2">
                    ₹{cancelTarget.walletUsed.toFixed(2)} wallet balance will be refunded automatically.
                  </p>
                )}
                <p className="text-xs">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Keep Order</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (!cancelTarget) return;
                  await handleCancelOrder(cancelTarget.id);
                  sendOrderEmail(cancelTarget.id, "order_cancelled");
                  setCancelTarget(null);
                }}
              >
                Yes, Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
