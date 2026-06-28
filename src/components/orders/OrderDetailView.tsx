import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Package, Truck, CreditCard, MapPin, Clock,
  CheckCircle2, XCircle, CircleDot, User, Hash,
  Copy, ShoppingBag, Printer, KeyRound, ShieldCheck,
} from "lucide-react";
import { useInvoicePrint } from "./InvoicePrint";
import OrderActivityTimeline from "./OrderActivityTimeline";
import { toast } from "sonner";

interface OrderDetailData {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  shipping_method: string | null;
  shipping_address: any;
  is_repurchase: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  wallet_amount_used?: number;
  razorpay_amount?: number;
  is_first_order?: boolean;
  price_type_used?: string;
  delivery_method?: string | null;
  pickup_location_id?: string | null;
  shipping_charge?: number | null;
  pickup_code?: string | null;
  pickup_verified?: boolean;
  picked_up_at?: string | null;
}

interface OrderItemData {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; image_url: string | null; category: string } | null;
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  purpose: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
}

interface ProfileData {
  full_name: string;
  referral_code: string;
  phone: string | null;
  avatar_url: string | null;
}

const statusTimeline = ["pending", "confirmed", "shipped", "delivered"];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  pending: { color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700", icon: <Clock className="h-4 w-4" /> },
  confirmed: { color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20 text-blue-700", icon: <CheckCircle2 className="h-4 w-4" /> },
  shipped: { color: "text-purple-600", bg: "bg-purple-500/10 border-purple-500/20 text-purple-700", icon: <Truck className="h-4 w-4" /> },
  delivered: { color: "text-green-600", bg: "bg-green-500/10 border-green-500/20 text-green-700", icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { color: "text-red-600", bg: "bg-red-500/10 border-red-500/20 text-red-700", icon: <XCircle className="h-4 w-4" /> },
};

interface OrderDetailViewProps {
  orderId: string;
  isAdmin?: boolean;
  backPath: string;
}

const OrderDetailView = ({ orderId, isAdmin = false, backPath }: OrderDetailViewProps) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [items, setItems] = useState<OrderItemData[]>([]);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [pickupLoc, setPickupLoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pickupLogs, setPickupLogs] = useState<Array<{ id: string; admin_id: string | null; admin_name: string; code_entered: string; success: boolean; reason: string | null; created_at: string; ip_address: string | null; user_agent: string | null }>>([]);
  const [pickupLogFilter, setPickupLogFilter] = useState<"all" | "success" | "failed">("all");

  const loadPickupLogs = async () => {
    if (!isAdmin) return;
    const { data: logs } = await (supabase.from as any)("pickup_verification_logs")
      .select("id, admin_id, code_entered, success, reason, created_at, ip_address, user_agent")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    const rows = (logs || []) as any[];
    const adminIds = [...new Set(rows.map((r) => r.admin_id).filter(Boolean))];
    let nameMap = new Map<string, string>();
    if (adminIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, referral_code").in("user_id", adminIds);
      nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name || p.referral_code || "Admin"]));
    }
    setPickupLogs(rows.map((r) => ({ ...r, admin_name: r.admin_id ? (nameMap.get(r.admin_id) || "Admin") : "Unknown" })));
  };

  const refreshOrder = async () => {
    const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (data) setOrder(data as any);
  };

  const handleVerifyPickup = async () => {
    if (verifyCode.trim().length !== 6) {
      toast.error("Enter the 6-digit pickup code");
      return;
    }
    setVerifying(true);
    let ip: string | null = null;
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      if (r.ok) ip = (await r.json())?.ip || null;
    } catch { /* ignore */ }
    const { data, error } = await (supabase.rpc as any)("admin_verify_pickup_code", {
      _order_id: orderId,
      _code: verifyCode.trim(),
      _ip_address: ip,
      _user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    setVerifying(false);
    if (error) { toast.error(error.message); return; }
    const res = data as { success: boolean; error?: string };
    if (!res?.success) { toast.error(res?.error || "Verification failed"); await loadPickupLogs(); return; }
    toast.success("Pickup verified. Order marked as delivered.");
    setVerifyOpen(false);
    setVerifyCode("");
    await refreshOrder();
    await loadPickupLogs();
  };


  const { handlePrint } = useInvoicePrint({
    orderId,
    order: order || { id: orderId, total_amount: 0, status: "", payment_method: null, shipping_address: {}, created_at: "", is_repurchase: false },
    items,
    payment,
    customerName: profile?.full_name,
    customerPhone: profile?.phone || undefined,
  });

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error || !orderData) {
        toast.error("Order not found");
        navigate(backPath);
        return;
      }
      setOrder(orderData);

      const [itemsRes, paymentRes, profileRes] = await Promise.all([
        supabase.from("order_items").select("id, quantity, price, product_id").eq("order_id", orderId),
        supabase.from("payments").select("*").eq("order_ref_id", orderId).order("created_at", { ascending: false }).limit(1),
        isAdmin
          ? supabase.from("profiles").select("full_name, referral_code, phone, avatar_url").eq("user_id", orderData.user_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const productIds = [...new Set((itemsRes.data || []).map((i: any) => i.product_id))];
      let productMap = new Map();
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name, image_url, category")
          .in("id", productIds);
        productMap = new Map((products || []).map((p: any) => [p.id, p]));
      }

      setItems(
        (itemsRes.data || []).map((item: any) => ({
          ...item,
          product: productMap.get(item.product_id) || null,
        }))
      );
      setPayment(paymentRes.data?.[0] || null);
      if (profileRes.data) setProfile(profileRes.data as ProfileData);
      if ((orderData as any).pickup_location_id) {
        const { data: loc } = await supabase.from("pickup_locations" as any).select("*").eq("id", (orderData as any).pickup_location_id).maybeSingle();
        if (loc) setPickupLoc(loc as any);
      }
      setLoading(false);
    };
    fetchOrder();
    loadPickupLogs();
  }, [orderId]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const copyId = () => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const sc = statusConfig[order.status] || statusConfig.pending;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentStepIndex = statusTimeline.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const shippingAddr = order.shipping_address || {};

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold text-foreground">Order #{(order as any).order_number || orderId.slice(0, 8).toUpperCase()}</h1>
            <button onClick={copyId} className="text-muted-foreground hover:text-foreground">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Badge variant="outline" className={sc.bg}>{order.status}</Badge>
            {order.is_repurchase && <Badge variant="outline" className="text-xs">Repurchase</Badge>}
            {order.price_type_used && (
              <Badge variant="outline" className="text-xs capitalize">
                {order.price_type_used === "retail" ? "Retail Price" : "Distributor Price"}
              </Badge>
            )}
            {order.is_first_order && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">First Order</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 flex-shrink-0">
          <Printer className="h-4 w-4" />
          Invoice
        </Button>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="rounded-xl bg-card border border-border p-5 mb-5">
          <div className="flex items-center justify-between relative">
            {/* Connection line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStepIndex / (statusTimeline.length - 1)) * 100)}%` }}
            />
            {statusTimeline.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent
                        ? "bg-primary border-primary text-primary-foreground scale-110"
                        : isActive
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                  </div>
                  <span className={`text-[11px] mt-1.5 capitalize font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 mb-5 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">This order has been cancelled</p>
            <p className="text-xs text-muted-foreground mt-0.5">Updated on {formatDate(order.updated_at)}</p>
          </div>
        </div>
      )}

      {/* Pickup Code Card — only for self-pickup orders */}
      {(order as any).delivery_method === "pickup" && (order as any).pickup_code && !isCancelled && (
        <div className={`rounded-xl mb-5 p-5 border-2 ${
          (order as any).pickup_verified
            ? "bg-green-500/5 border-green-500/30"
            : "bg-gradient-to-br from-primary/5 to-amber-500/5 border-primary/30"
        }`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                (order as any).pickup_verified ? "bg-green-500/15 text-green-600" : "bg-primary/15 text-primary"
              }`}>
                {(order as any).pickup_verified ? <ShieldCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {(order as any).pickup_verified ? "Pickup Verified" : (isAdmin ? "Customer's Pickup Code" : "Your Pickup Code")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(order as any).pickup_verified
                    ? `Collected on ${formatDate((order as any).picked_up_at || order.updated_at)}`
                    : isAdmin
                      ? "Ask the customer for this 6-digit code at pickup and click Verify."
                      : "Show this code at the pickup counter to collect your order."}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2">
                  <span className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
                    {(order as any).pickup_code}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText((order as any).pickup_code); toast.success("Code copied"); }}
                    className="text-muted-foreground hover:text-foreground ml-1"
                    title="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            {isAdmin && !(order as any).pickup_verified && (
              <Button onClick={() => setVerifyOpen(true)} className="gap-2 flex-shrink-0">
                <ShieldCheck className="h-4 w-4" />
                Verify Pickup
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pickup Verification Audit Log — admin only */}
      {isAdmin && (order as any).delivery_method === "pickup" && pickupLogs.length > 0 && (() => {
        const successCount = pickupLogs.filter((l) => l.success).length;
        const failedCount = pickupLogs.length - successCount;
        const visibleLogs = pickupLogs.filter((l) =>
          pickupLogFilter === "all" ? true : pickupLogFilter === "success" ? l.success : !l.success
        );
        const chip = (key: typeof pickupLogFilter, label: string, count: number, activeCls: string) => (
          <button
            key={key}
            onClick={() => setPickupLogFilter(key)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              pickupLogFilter === key ? activeCls : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label} <span className="opacity-70">({count})</span>
          </button>
        );
        return (
          <div className="rounded-xl bg-card border border-border overflow-hidden mb-5">
            <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center gap-2 flex-wrap">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Pickup Verification Log</h2>
              <div className="flex items-center gap-1.5 ml-auto">
                {chip("all", "All", pickupLogs.length, "bg-primary/10 border-primary/30 text-primary")}
                {chip("success", "Success", successCount, "bg-green-500/10 border-green-500/30 text-green-700")}
                {chip("failed", "Failed", failedCount, "bg-red-500/10 border-red-500/30 text-red-700")}
              </div>
            </div>
            <div className="divide-y divide-border">
              {visibleLogs.length === 0 && (
                <div className="px-5 py-6 text-center text-xs text-muted-foreground">No attempts match this filter.</div>
              )}
              {visibleLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3 flex-wrap">
                  <Badge variant="outline" className={log.success ? "bg-green-500/10 text-green-700 border-green-500/30 mt-0.5" : "bg-red-500/10 text-red-700 border-red-500/30 mt-0.5"}>
                    {log.success ? "Success" : "Failed"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{log.admin_name}</span>
                      <span className="text-muted-foreground"> entered </span>
                      <span className="font-mono">{log.code_entered || "—"}</span>
                    </p>
                    {!log.success && log.reason && (
                      <p className="text-xs text-red-600 mt-0.5">{log.reason}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {log.ip_address && (
                        <span><span className="opacity-70">IP:</span> <span className="font-mono">{log.ip_address}</span></span>
                      )}
                      {log.user_agent && (
                        <span className="truncate max-w-[420px]" title={log.user_agent}>
                          <span className="opacity-70">UA:</span> {log.user_agent}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}





      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column — Items + Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items Card */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/30">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Items ({items.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-lg bg-secondary border border-border flex-shrink-0 overflow-hidden">
                    {item.product?.image_url ? (
                      <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.product?.name || "Unknown Product"}
                    </p>
                    {item.product?.category && (
                      <p className="text-xs text-muted-foreground">{item.product.category}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="px-5 py-4 border-t border-border bg-secondary/20 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <OrderActivityTimeline
            orderId={orderId}
            isAdmin={isAdmin}
            orderCreatedAt={order.created_at}
            orderStatus={order.status}
            orderUpdatedAt={order.updated_at}
            paymentStatus={payment?.status}
          />
        </div>

        {/* Right Column — Info Cards */}
        <div className="space-y-5">
          {/* Customer (admin only) */}
          {isAdmin && profile && (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-secondary/30">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Customer
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.referral_code}</p>
                  </div>
                </div>
                {profile.phone && (
                  <p className="text-xs text-muted-foreground">📞 {profile.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/30">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="text-foreground capitalize">{order.payment_method || "—"}</span>
              </div>

              {/* Payment Breakdown */}
              {((order as any).wallet_amount_used > 0 || (order as any).razorpay_amount > 0) && (
                <div className="pt-2 mt-2 border-t border-border space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Breakdown</p>
                  {(order as any).wallet_amount_used > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Wallet Balance Used</span>
                      <span className="text-foreground font-medium">{formatCurrency((order as any).wallet_amount_used)}</span>
                    </div>
                  )}
                  {(order as any).razorpay_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid via Gateway</span>
                      <span className="text-foreground font-medium">{formatCurrency((order as any).razorpay_amount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              )}

              {payment && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className="text-xs capitalize">{payment.status}</Badge>
                  </div>
                  {payment.razorpay_payment_id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Txn ID</span>
                      <span className="text-xs font-mono text-foreground">{payment.razorpay_payment_id.slice(0, 18)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                </>
              )}
              {!payment && !((order as any).wallet_amount_used > 0) && (
                <p className="text-xs text-muted-foreground">No payment record found</p>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/30">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {(order as any).delivery_method === "pickup" ? <MapPin className="h-4 w-4 text-muted-foreground" /> : <Truck className="h-4 w-4 text-muted-foreground" />}
                {(order as any).delivery_method === "pickup" ? "Self Pickup" : "Shipping"}
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="text-foreground capitalize">
                  {(order as any).delivery_method === "pickup" ? "Self Pickup" : "Courier Delivery"}
                </span>
              </div>
              {(order as any).shipping_charge !== null && (order as any).shipping_charge !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping Charge</span>
                  <span className="text-foreground">{Number((order as any).shipping_charge) === 0 ? "Free" : formatCurrency(Number((order as any).shipping_charge))}</span>
                </div>
              )}

              {(order as any).delivery_method === "pickup" && pickupLoc && (
                <div className="text-sm text-foreground space-y-0.5 pt-2 border-t border-border mt-2">
                  <p className="font-medium">{pickupLoc.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {pickupLoc.address_line1}{pickupLoc.address_line2 ? `, ${pickupLoc.address_line2}` : ""}, {pickupLoc.city}{pickupLoc.state ? `, ${pickupLoc.state}` : ""}{pickupLoc.pincode ? ` – ${pickupLoc.pincode}` : ""}
                  </p>
                  {pickupLoc.phone && <p className="text-muted-foreground text-xs">📞 {pickupLoc.phone}</p>}
                  {pickupLoc.hours && <p className="text-muted-foreground text-xs">🕒 {pickupLoc.hours}</p>}
                </div>
              )}

              {(order as any).delivery_method !== "pickup" && (shippingAddr.name || shippingAddr.line1 || shippingAddr.city) ? (
                <div className="text-sm text-foreground space-y-0.5 pt-1 border-t border-border mt-2">
                  {shippingAddr.name && <p className="font-medium">{shippingAddr.name}</p>}
                  {(shippingAddr.line1 || shippingAddr.address) && <p className="text-muted-foreground text-xs">{shippingAddr.line1 || shippingAddr.address}</p>}
                  {shippingAddr.line2 && <p className="text-muted-foreground text-xs">{shippingAddr.line2}</p>}
                  {(shippingAddr.city || shippingAddr.state || shippingAddr.pincode) && (
                    <p className="text-muted-foreground text-xs">
                      {[shippingAddr.city, shippingAddr.state, shippingAddr.pincode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {shippingAddr.phone && <p className="text-muted-foreground text-xs">📞 {shippingAddr.phone}</p>}
                </div>
              ) : (order as any).delivery_method !== "pickup" ? (
                <p className="text-xs text-muted-foreground">No shipping address provided</p>
              ) : null}
            </div>
          </div>

          {/* Order Info */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/30">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Order Info
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="text-xs font-mono text-foreground">{orderId.slice(0, 12)}…</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Placed</span>
                <span className="text-xs text-foreground">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-xs text-foreground">{formatDate(order.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Verify Pickup Dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verify Pickup
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Ask the customer for the 6-digit pickup code shown on their order or sent to their email, and enter it below.
            </p>
            <Input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              inputMode="numeric"
              className="text-center font-mono text-2xl tracking-[0.4em] h-14"
              maxLength={6}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)} disabled={verifying}>Cancel</Button>
            <Button onClick={handleVerifyPickup} disabled={verifying || verifyCode.length !== 6}>
              {verifying ? "Verifying..." : "Confirm Pickup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailView;
