import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Package, Truck, CreditCard, MapPin, Clock,
  CheckCircle2, XCircle, CircleDot, User, Hash,
  Copy, ShoppingBag, Printer,
} from "lucide-react";
import { useInvoicePrint } from "./InvoicePrint";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      // Fetch order
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !orderData) {
        toast.error("Order not found");
        navigate(backPath);
        return;
      }
      setOrder(orderData);

      // Fetch items, payment, profile in parallel
      const [itemsRes, paymentRes, profileRes] = await Promise.all([
        supabase.from("order_items").select("id, quantity, price, product_id").eq("order_id", orderId),
        supabase.from("payments").select("*").eq("order_ref_id", orderId).order("created_at", { ascending: false }).limit(1),
        isAdmin
          ? supabase.from("profiles").select("full_name, referral_code, phone, avatar_url").eq("user_id", orderData.user_id).single()
          : Promise.resolve({ data: null }),
      ]);

      // Fetch products for items
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
      setLoading(false);
    };
    fetchOrder();
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

  const { handlePrint } = useInvoicePrint({
    orderId,
    order,
    items,
    payment,
    customerName: profile?.full_name,
    customerPhone: profile?.phone || undefined,
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold text-foreground">Order #{orderId.slice(0, 8).toUpperCase()}</h1>
            <button onClick={copyId} className="text-muted-foreground hover:text-foreground">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Badge variant="outline" className={sc.bg}>{order.status}</Badge>
            {order.is_repurchase && <Badge variant="outline" className="text-xs">Repurchase</Badge>}
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
              {!payment && (
                <p className="text-xs text-muted-foreground">No payment record found</p>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/30">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Shipping
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="text-foreground capitalize">{order.shipping_method || "Free"}</span>
              </div>
              {shippingAddr.name || shippingAddr.address || shippingAddr.city ? (
                <div className="text-sm text-foreground space-y-0.5 pt-1 border-t border-border mt-2">
                  {shippingAddr.name && <p className="font-medium">{shippingAddr.name}</p>}
                  {shippingAddr.address && <p className="text-muted-foreground text-xs">{shippingAddr.address}</p>}
                  {(shippingAddr.city || shippingAddr.state || shippingAddr.pincode) && (
                    <p className="text-muted-foreground text-xs">
                      {[shippingAddr.city, shippingAddr.state, shippingAddr.pincode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {shippingAddr.phone && <p className="text-muted-foreground text-xs">📞 {shippingAddr.phone}</p>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No shipping address provided</p>
              )}
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
    </div>
  );
};

export default OrderDetailView;
