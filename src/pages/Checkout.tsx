import { useState, useEffect } from "react";
import { ShoppingBag, Loader2, Ticket, X, CheckCircle, Wallet, MapPin, Truck, ArrowLeft, ShieldCheck, Lock, CreditCard, Smartphone, Zap, Building2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useBrand } from "@/contexts/BrandContext";
import { useLocalization, formatPrice, taxAmount } from "@/hooks/useLocalization";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { sendOrderEmail } from "@/lib/orderEmail";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number;
  discountAmount: number;
}

interface ShippingMethod {
  key: string;
  label: string;
  cost: number;
}

const Checkout = () => {
  const { user } = useAuth();
  const { cartProducts, totalPrice, clearCart, getPrice, products: allProducts } = useCart();
  const { currencySymbol, taxEnabled, taxRate, taxLabel } = useLocalization();
  const brand = useBrand();
  const navigate = useNavigate();

  // Buy Now mode
  const isBuyNow = new URLSearchParams(window.location.search).get("buyNow") === "1";
  const [buyNowProduct, setBuyNowProduct] = useState<(typeof cartProducts)[0] | null>(null);

  useEffect(() => {
    if (!isBuyNow) return;
    try {
      const raw = sessionStorage.getItem("buyNowItem");
      if (!raw) { navigate("/shop"); return; }
      const { id, qty } = JSON.parse(raw);
      const found = allProducts.find((p) => p.id === id);
      if (found) {
        setBuyNowProduct({ ...found, qty: qty || 1 });
      } else {
        // Product not in cache yet — fetch directly
        supabase.from("products").select("*").eq("id", id).single().then(({ data }) => {
          if (data) setBuyNowProduct({ ...(data as any), qty: qty || 1 });
          else { toast.error("Product not found"); navigate("/shop"); }
        });
      }
    } catch { navigate("/shop"); }
  }, [isBuyNow, allProducts]);

  const clearBuyNow = () => sessionStorage.removeItem("buyNowItem");

  // Unified checkout items
  const checkoutProducts = isBuyNow ? (buyNowProduct ? [buyNowProduct] : []) : cartProducts;
  const checkoutTotal = checkoutProducts.reduce((sum, p) => sum + getPrice(p) * p.qty, 0);

  const [step, setStep] = useState<"information" | "shipping" | "payment" | "processing">("information");
  const [processing, setProcessing] = useState(false);

  // Payment gateways
  const [paymentGateways, setPaymentGateways] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  // Address
  const [address, setAddress] = useState({ name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Wallet
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  // Shipping
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>("");
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState(0);

  const freeShippingEligible = freeShippingMinAmount <= 0 || checkoutTotal >= freeShippingMinAmount;

  const availableShippingMethods = shippingMethods.filter((m) => {
    if (m.key === "free_shipping" && freeShippingMinAmount > 0 && !freeShippingEligible) return false;
    return true;
  });

  useEffect(() => {
    if (freeShippingEligible && availableShippingMethods.find((m) => m.key === "free_shipping")) {
      setSelectedShipping("free_shipping");
    } else if (availableShippingMethods.length > 0 && !availableShippingMethods.find((m) => m.key === selectedShipping)) {
      setSelectedShipping(availableShippingMethods[0].key);
    }
  }, [freeShippingEligible, availableShippingMethods, selectedShipping]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!isBuyNow && cartProducts.length === 0) { navigate("/shop"); return; }

    // Fetch shipping methods
    supabase.from("pages_content").select("content").eq("page_slug", "shipping-methods").maybeSingle().then(({ data }) => {
      const methods: ShippingMethod[] = [];
      let freeShipMinAmt = 0;
      if (data?.content) {
        const c = data.content as any;
        if (c.free_shipping?.enabled) {
          freeShipMinAmt = Number(c.free_shipping.min_amount) || 0;
          methods.push({ key: "free_shipping", label: c.free_shipping.label || "Free Shipping", cost: 0 });
        }
        if (c.flat_rate?.enabled) {
          methods.push({ key: "flat_rate", label: c.flat_rate.label || "Flat Rate", cost: Number(c.flat_rate.cost) || 0 });
        }
      }
      if (methods.length === 0) methods.push({ key: "free_shipping", label: "Free Shipping", cost: 0 });
      setFreeShippingMinAmount(freeShipMinAmt);
      setShippingMethods(methods);
      setSelectedShipping(methods[0]?.key || "");
    });

    // Fetch enabled payment gateways from admin settings
    supabase.from("pages_content").select("content").eq("page_slug", "payment-gateway-settings").maybeSingle().then(({ data }) => {
      if (data?.content) {
        const content = data.content as any;
        const enabled: any[] = [];
        const gatewayMeta: Record<string, { label: string; icon: string; description: string }> = {
          razorpay: { label: "Razorpay", icon: "credit-card", description: "Pay securely via Razorpay" },
          phonepe: { label: "PhonePe", icon: "smartphone", description: "Pay via PhonePe UPI" },
          stripe: { label: "Stripe", icon: "zap", description: "Pay securely via Stripe" },
          paytm: { label: "Paytm", icon: "wallet", description: "Pay via Paytm" },
          instamojo: { label: "Instamojo", icon: "zap", description: "Pay via Instamojo" },
          bank_transfer: { label: "Bank Transfer", icon: "building", description: "Pay via direct bank transfer" },
          cod: { label: "Cash on Delivery", icon: "package", description: "Pay when you receive your order" },
        };
        for (const key of Object.keys(gatewayMeta)) {
          if (content[key]?.enabled) {
            const gw = content[key];
            const meta = gatewayMeta[key];
            // COD: check min/max order amount
            if (key === "cod") {
              const minAmt = Number(gw.fields?.min_order_amount) || 0;
              const maxAmt = Number(gw.fields?.max_order_amount) || 0;
              if (minAmt > 0 && checkoutTotal < minAmt) continue;
              if (maxAmt > 0 && checkoutTotal > maxAmt) continue;
            }
            enabled.push({ key, ...meta, instructions: gw.fields?.instructions || "" });
          }
        }
        setPaymentGateways(enabled);
        if (enabled.length > 0) setSelectedPaymentMethod(enabled[0].key);
      }
    });

    // Fetch wallet
    supabase.from("wallets").select("balance").eq("user_id", user.id).single().then(({ data }) => {
      setWalletBalance(data ? Number(data.balance) : 0);
    });

    // Fetch addresses
    supabase.from("user_addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false }).then(({ data }) => {
      const addrs = (data as any) || [];
      setSavedAddresses(addrs);
      const defaultAddr = addrs.find((a: any) => a.is_default) || addrs[0];
      if (defaultAddr) { setSelectedAddressId(defaultAddr.id); setShowManualForm(false); }
      else setShowManualForm(true);
    });
  }, [user]);

  const fc = (val: number) => formatPrice(val, currencySymbol);

  const calculateDiscount = (coupon: { discount_type: string; discount_value: number; max_discount_amount: number }, subtotal: number) => {
    if (coupon.discount_type === "percentage") {
      const raw = (subtotal * coupon.discount_value) / 100;
      return coupon.max_discount_amount > 0 ? Math.min(raw, coupon.max_discount_amount) : raw;
    }
    return coupon.discount_value;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.from("coupons").select("*").eq("code", couponCode.toUpperCase().trim()).eq("is_active", true).maybeSingle();
      if (error || !data) { toast.error("Invalid coupon code"); setCouponLoading(false); return; }
      const coupon = data as any;
      const now = new Date();
      if (new Date(coupon.start_date) > now || new Date(coupon.end_date) < now) { toast.error("Coupon has expired"); setCouponLoading(false); return; }
      if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) { toast.error("Coupon usage limit reached"); setCouponLoading(false); return; }
      if (coupon.min_order_amount > 0 && checkoutTotal < coupon.min_order_amount) { toast.error(`Minimum order ${fc(coupon.min_order_amount)} required`); setCouponLoading(false); return; }
      const discountAmount = calculateDiscount(coupon, checkoutTotal);
      setAppliedCoupon({ id: coupon.id, code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value, max_discount_amount: coupon.max_discount_amount, discountAmount });
      toast.success(`Coupon applied! You save ${fc(discountAmount)}`);
    } catch { toast.error("Failed to apply coupon"); }
    setCouponLoading(false);
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(""); };

  const activeShipping = availableShippingMethods.find((m) => m.key === selectedShipping);
  const shippingCost = activeShipping?.cost || 0;
  const discountAmount = appliedCoupon ? calculateDiscount(appliedCoupon, checkoutTotal) : 0;
  const afterCoupon = Math.max(0, checkoutTotal - discountAmount);
  const tax = taxAmount(afterCoupon, taxRate, taxEnabled);
  const afterTax = afterCoupon + tax + shippingCost;
  const walletDeduction = useWallet ? Math.min(walletBalance, afterTax) : 0;
  const finalPrice = Math.max(0, afterTax - walletDeduction);
  const isFullWalletPayment = useWallet && finalPrice === 0;
  const freeShippingDelta = freeShippingMinAmount > 0 && !freeShippingEligible ? freeShippingMinAmount - checkoutTotal : 0;

  const getShippingAddress = () => {
    if (showManualForm) return address;
    const saved = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!saved) return null;
    return { name: saved.name, line1: saved.line1, line2: saved.line2 || "", city: saved.city, state: saved.state, pincode: saved.pincode, phone: saved.phone };
  };

  const getPaymentMethodLabel = () => {
    if (isFullWalletPayment) return "wallet";
    if (!selectedPaymentMethod) return "razorpay";
    return useWallet ? `wallet+${selectedPaymentMethod}` : selectedPaymentMethod;
  };

  const handlePlaceOrder = async () => {
    const shippingAddr = getShippingAddress();
    if (!shippingAddr || !shippingAddr.name || !shippingAddr.line1 || !shippingAddr.city || !shippingAddr.state || !shippingAddr.pincode || !shippingAddr.phone) {
      toast.error("Please fill all required address fields");
      setStep("information");
      return;
    }

    if (!isFullWalletPayment && !selectedPaymentMethod && paymentGateways.length > 0) {
      toast.error("Please select a payment method");
      return;
    }

    setProcessing(true);
    setStep("processing");

    const paymentMethod = getPaymentMethodLabel();

    try {
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        user_id: user!.id, total_amount: afterTax, shipping_address: shippingAddr as any,
        shipping_method: selectedShipping, payment_method: paymentMethod, status: "pending",
        wallet_amount_used: walletDeduction,
        razorpay_amount: isFullWalletPayment ? 0 : finalPrice,
      } as any).select().single();
      if (orderError) throw new Error(orderError.message);

      const items = checkoutProducts.map((p) => ({ order_id: order.id, product_id: p.id, quantity: p.qty, price: getPrice(p) }));
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw new Error(itemsError.message);

      if (appliedCoupon) await supabase.rpc("increment_coupon_usage" as any, { _coupon_id: appliedCoupon.id });

      if (useWallet && walletDeduction > 0) {
        const { data: deductResult, error: deductError } = await supabase.rpc("deduct_wallet_balance" as any, {
          _user_id: user!.id,
          _amount: walletDeduction,
        });
        if (deductError || !deductResult?.success) {
          throw new Error(deductResult?.error || deductError?.message || "Wallet deduction failed");
        }
      }

      // Full wallet payment
      if (isFullWalletPayment) {
        await supabase.from("orders").update({ status: "confirmed", payment_method: "wallet" }).eq("id", order.id);
        toast.success("Order placed successfully!");
        if (isBuyNow) clearBuyNow(); else clearCart();
        sendOrderEmail(order.id, "order_success");
        navigate(`/order-success?order_id=${order.id}`);
        return;
      }

      // COD / Bank Transfer — confirm immediately
      if (selectedPaymentMethod === "cod" || selectedPaymentMethod === "bank_transfer") {
        const status = selectedPaymentMethod === "cod" ? "confirmed" : "pending";
        await supabase.from("orders").update({ status, payment_method: paymentMethod }).eq("id", order.id);
        toast.success("Order placed successfully!");
        if (isBuyNow) clearBuyNow(); else clearCart();
        sendOrderEmail(order.id, "order_success");
        navigate(`/order-success?order_id=${order.id}`);
        return;
      }

      // Razorpay payment gateway
      if (selectedPaymentMethod === "razorpay" || (!selectedPaymentMethod && paymentGateways.length === 0)) {
        const { data: rzpData, error: rzpError } = await supabase.functions.invoke("razorpay", {
          body: { action: "create_order", amount: finalPrice, purpose: "shop", order_ref_id: order.id },
        });
        if (rzpError || rzpData?.error) throw new Error(rzpData?.error || rzpError?.message);

        const options = {
          key: rzpData.key_id, amount: rzpData.amount, currency: rzpData.currency,
          name: brand.brand_name || "Store", description: `Order #${order.id.slice(0, 8)}`,
          order_id: rzpData.order_id,
          handler: async (response: any) => {
            try {
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke("razorpay", {
                body: { action: "verify_payment", razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature },
              });
              if (verifyError || verifyData?.error) {
                toast.error("Payment verification failed");
                // Cancel order and refund wallet on verification failure
                await supabase.rpc("cancel_order_and_refund_wallet" as any, { _order_id: order.id, _user_id: user!.id });
                sendOrderEmail(order.id, "order_failed");
                setProcessing(false);
                setStep("payment");
                return;
              }
              await supabase.from("orders").update({ status: "confirmed", payment_method: paymentMethod }).eq("id", order.id);
              toast.success("Order placed successfully!");
              clearCart();
              sendOrderEmail(order.id, "order_success");
              navigate(`/order-success?order_id=${order.id}`);
            } catch {
              toast.error("Payment verification failed");
              await supabase.rpc("cancel_order_and_refund_wallet" as any, { _order_id: order.id, _user_id: user!.id });
              setProcessing(false);
              setStep("payment");
            }
          },
          modal: {
            ondismiss: async () => {
              // User closed Razorpay popup — cancel order and refund wallet
              await supabase.rpc("cancel_order_and_refund_wallet" as any, { _order_id: order.id, _user_id: user!.id });
              setProcessing(false);
              setStep("payment");
              toast.info("Payment cancelled. Wallet balance has been restored.");
            },
          },
          theme: { color: "#333" },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", async () => {
          // Razorpay payment failed event — cancel order and refund wallet
          await supabase.rpc("cancel_order_and_refund_wallet" as any, { _order_id: order.id, _user_id: user!.id });
          toast.error("Payment failed. Wallet balance has been restored.");
          sendOrderEmail(order.id, "order_failed");
          setProcessing(false);
          setStep("payment");
        });
        rzp.open();
        return;
      }

      // Other gateways (phonepe, stripe, paytm, instamojo) — placeholder
      toast.info(`${selectedPaymentMethod} gateway integration coming soon. Order saved as pending.`);
      clearCart();
      navigate(`/order-success?order_id=${order.id}`);
    } catch (error: any) {
      toast.error(error.message || "Checkout failed");
      setStep("payment");
    } finally {
      setProcessing(false);
    }
  };

  if (!user || checkoutProducts.length === 0) return null;

  const stepIndex = step === "information" ? 0 : step === "shipping" ? 1 : step === "payment" ? 2 : 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.brand_name} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-xl font-bold text-gray-900">{brand.brand_name}</span>
            )}
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Breadcrumb Steps */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/shop" className="text-primary hover:underline">Cart</Link>
          <span className="text-gray-400">›</span>
          <button onClick={() => setStep("information")} className={`${stepIndex >= 0 ? "text-gray-900 font-medium" : "text-gray-400"}`}>Information</button>
          <span className="text-gray-400">›</span>
          <button onClick={() => stepIndex >= 1 && setStep("shipping")} className={`${stepIndex >= 1 ? "text-gray-900 font-medium" : "text-gray-400"}`}>Shipping</button>
          <span className="text-gray-400">›</span>
          <span className={`${stepIndex >= 2 ? "text-gray-900 font-medium" : "text-gray-400"}`}>Payment</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-7 space-y-6">
            {step === "processing" && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-gray-600">Processing your order...</p>
              </div>
            )}

            {/* INFORMATION STEP */}
            {step === "information" && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" /> Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedAddresses.length > 0 && !showManualForm && (
                    <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{addr.label}</Badge>
                            {addr.is_default && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Default</Badge>}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{addr.name}</p>
                          <p className="text-sm text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} – {addr.pincode}</p>
                          <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="text-sm gap-1.5 w-full text-primary" onClick={() => { setShowManualForm(true); setSelectedAddressId(null); }}>
                        <MapPin className="h-4 w-4" /> Use a different address
                      </Button>
                    </div>
                  )}

                  {(showManualForm || savedAddresses.length === 0) && (
                    <div className="space-y-4">
                      {savedAddresses.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-sm gap-1.5 text-primary" onClick={() => {
                          setShowManualForm(false);
                          const def = savedAddresses.find((a: any) => a.is_default) || savedAddresses[0];
                          if (def) setSelectedAddressId(def.id);
                        }}>
                          ← Back to saved addresses
                        </Button>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-gray-700">Full Name *</Label>
                        <Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="border-gray-300" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-700">Address Line 1 *</Label>
                        <Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="border-gray-300" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-700">Address Line 2</Label>
                        <Input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="border-gray-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-gray-700">City *</Label>
                          <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="border-gray-300" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-gray-700">State *</Label>
                          <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="border-gray-300" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-gray-700">Pincode *</Label>
                          <Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="border-gray-300" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-gray-700">Phone *</Label>
                          <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "").slice(0, 15) })} className="border-gray-300" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" className="text-gray-600 gap-2" onClick={() => navigate("/shop")}>
                      <ArrowLeft className="h-4 w-4" /> Return to shop
                    </Button>
                    <Button onClick={() => {
                      const addr = getShippingAddress();
                      if (!addr || !addr.name || !addr.line1 || !addr.city || !addr.state || !addr.pincode || !addr.phone) {
                        toast.error("Please fill all required fields");
                        return;
                      }
                      setStep("shipping");
                    }}>
                      Continue to shipping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SHIPPING STEP */}
            {step === "shipping" && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-gray-500" /> Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address summary */}
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                    <p className="text-gray-500 text-xs mb-1">Ship to</p>
                    {(() => {
                      const addr = getShippingAddress();
                      return addr ? <p className="text-gray-900">{addr.name}, {addr.line1}, {addr.city} – {addr.pincode}</p> : null;
                    })()}
                  </div>

                  {availableShippingMethods.length > 0 && (
                    <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping} className="space-y-2">
                      {availableShippingMethods.map((m) => (
                        <label
                          key={m.key}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedShipping === m.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={m.key} id={`ship-${m.key}`} />
                            <span className="text-sm font-medium text-gray-900">{m.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {m.cost === 0 ? "Free" : fc(m.cost)}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}

                  {freeShippingMinAmount > 0 && !freeShippingEligible && (
                    <div className="space-y-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-700">{fc(checkoutTotal)} / {fc(freeShippingMinAmount)}</span>
                        <span className="font-medium text-amber-800">Add {fc(freeShippingDelta)} more for free shipping</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-amber-200 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min((checkoutTotal / freeShippingMinAmount) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {freeShippingMinAmount > 0 && freeShippingEligible && (
                    <p className="text-sm text-green-600 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> Free shipping unlocked!
                    </p>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" className="text-gray-600 gap-2" onClick={() => setStep("information")}>
                      <ArrowLeft className="h-4 w-4" /> Return to information
                    </Button>
                    <Button onClick={() => setStep("payment")}>Continue to payment</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PAYMENT STEP */}
            {step === "payment" && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-gray-500" /> Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address & shipping summary */}
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm space-y-2">
                    <div>
                      <span className="text-gray-500 text-xs">Ship to: </span>
                      {(() => {
                        const addr = getShippingAddress();
                        return addr ? <span className="text-gray-900">{addr.name}, {addr.line1}, {addr.city} – {addr.pincode}</span> : null;
                      })()}
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Method: </span>
                      <span className="text-gray-900">{activeShipping?.label} — {shippingCost === 0 ? "Free" : fc(shippingCost)}</span>
                    </div>
                  </div>

                  {/* Wallet */}
                  {user && walletBalance > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Use Wallet Balance</p>
                          <p className="text-xs text-gray-500">Available: {fc(walletBalance)}{useWallet && walletDeduction > 0 && <span className="text-primary ml-1">(-{fc(walletDeduction)})</span>}</p>
                        </div>
                      </div>
                      <Switch checked={useWallet} onCheckedChange={setUseWallet} />
                    </div>
                  )}

                  {!isFullWalletPayment && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Select Payment Method</p>
                      {paymentGateways.length > 0 ? (
                        <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-2">
                          {paymentGateways.map((gw) => {
                            const iconMap: Record<string, any> = {
                              "credit-card": CreditCard,
                              "smartphone": Smartphone,
                              "zap": Zap,
                              "wallet": Wallet,
                              "building": Building2,
                              "package": Package,
                            };
                            const IconComp = iconMap[gw.icon] || CreditCard;
                            return (
                              <label
                                key={gw.key}
                                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedPaymentMethod === gw.key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value={gw.key} id={`pay-${gw.key}`} />
                                  <IconComp className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{gw.label}</p>
                                    <p className="text-xs text-muted-foreground">{gw.description}</p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      ) : (
                        <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                          <p className="text-sm font-medium text-foreground">Razorpay</p>
                          <p className="text-xs text-muted-foreground mt-1">You'll be redirected to complete payment securely</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" className="text-gray-600 gap-2" onClick={() => setStep("shipping")}>
                      <ArrowLeft className="h-4 w-4" /> Return to shipping
                    </Button>
                    <Button onClick={handlePlaceOrder} disabled={processing} className="min-w-[160px]">
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isFullWalletPayment ? `Pay with Wallet` : `Pay ${fc(finalPrice)}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Order Summary */}
          {step !== "processing" && (
            <div className="lg:col-span-5">
              <div className="sticky top-4">
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-900">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cart items */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {checkoutProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image_url?.startsWith("http") ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <ShoppingBag className="h-5 w-5 text-gray-400" />
                            )}
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-600 text-white text-[10px] flex items-center justify-center font-bold">{p.qty}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 shrink-0">{fc(getPrice(p) * p.qty)}</p>
                        </div>
                      ))}
                    </div>

                    <hr className="border-gray-200" />

                    {/* Coupon */}
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-mono font-bold text-green-700">{appliedCoupon.code}</p>
                            <p className="text-xs text-green-600">-{fc(discountAmount)} off</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={removeCoupon}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input placeholder="Discount code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="pl-9 font-mono text-sm border-gray-300" onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} />
                        </div>
                        <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="border-gray-300 text-gray-700">
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}

                    <hr className="border-gray-200" />

                    {/* Price breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">{fc(checkoutTotal)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Discount</span>
                          <span className="text-green-600 font-medium">-{fc(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-900">{shippingCost === 0 ? "Free" : fc(shippingCost)}</span>
                      </div>
                      {taxEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{taxLabel} ({taxRate}%)</span>
                          <span className="text-gray-900">{fc(tax)}</span>
                        </div>
                      )}
                      {useWallet && walletDeduction > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-primary">Wallet</span>
                          <span className="text-primary font-medium">-{fc(walletDeduction)}</span>
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">{fc(finalPrice)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
