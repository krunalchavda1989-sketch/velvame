import { useState, useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, Loader2, Ticket, X, CheckCircle, Wallet, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLocalization, formatPrice, taxAmount } from "@/hooks/useLocalization";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

const CartDrawer = () => {
  const { user } = useAuth();
  const { cartOpen, setCartOpen, cartProducts, totalPrice, updateQty, removeItem, clearCart, getPrice } = useCart();
  const { currencySymbol, taxEnabled, taxRate, taxLabel } = useLocalization();
  const navigate = useNavigate();
  const [step, setStep] = useState<"cart" | "address" | "processing">("cart");
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState({
    name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "",
  });

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (!user || !cartOpen) return;
    supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setWalletBalance(data ? Number(data.balance) : 0);
      });
    // Fetch saved addresses
    supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const addrs = (data as any) || [];
        setSavedAddresses(addrs);
        const defaultAddr = addrs.find((a: any) => a.is_default) || addrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setShowManualForm(false);
        } else {
          setShowManualForm(true);
        }
      });
  }, [user, cartOpen]);

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
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        toast.error("Invalid coupon code");
        setCouponLoading(false);
        return;
      }

      const coupon = data as any;
      const now = new Date();
      if (new Date(coupon.start_date) > now || new Date(coupon.end_date) < now) {
        toast.error("Coupon has expired");
        setCouponLoading(false);
        return;
      }
      if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
        toast.error("Coupon usage limit reached");
        setCouponLoading(false);
        return;
      }
      if (coupon.min_order_amount > 0 && totalPrice < coupon.min_order_amount) {
        toast.error(`Minimum order ${fc(coupon.min_order_amount)} required`);
        setCouponLoading(false);
        return;
      }

      const discountAmount = calculateDiscount(coupon, totalPrice);
      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
        discountAmount,
      });
      toast.success(`Coupon applied! You save ${fc(discountAmount)}`);
    } catch {
      toast.error("Failed to apply coupon");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const discountAmount = appliedCoupon ? calculateDiscount(appliedCoupon, totalPrice) : 0;
  const afterCoupon = Math.max(0, totalPrice - discountAmount);
  const tax = taxAmount(afterCoupon, taxRate, taxEnabled);
  const afterTax = afterCoupon + tax;
  const walletDeduction = useWallet ? Math.min(walletBalance, afterTax) : 0;
  const finalPrice = Math.max(0, afterTax - walletDeduction);
  const isFullWalletPayment = useWallet && finalPrice === 0;

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }
    if (cartProducts.length === 0) return;
    setStep("address");
  };

  const handlePayment = async () => {
    if (!address.name || !address.line1 || !address.city || !address.state || !address.pincode || !address.phone) {
      toast.error("Please fill all required address fields");
      return;
    }

    setProcessing(true);
    setStep("processing");

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          total_amount: afterTax,
          shipping_address: address as any,
          payment_method: isFullWalletPayment ? "wallet" : useWallet ? "wallet+razorpay" : "razorpay",
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      const items = cartProducts.map((p) => ({
        order_id: order.id,
        product_id: p.id,
        quantity: p.qty,
        price: getPrice(p),
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw new Error(itemsError.message);

      if (appliedCoupon) {
        await supabase.rpc("increment_coupon_usage" as any, { _coupon_id: appliedCoupon.id });
      }

      if (useWallet && walletDeduction > 0) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user!.id)
          .single();

        if (wallet) {
          const newBalance = Math.max(0, Number(wallet.balance) - walletDeduction);
          await supabase
            .from("wallets")
            .update({ balance: newBalance })
            .eq("user_id", user!.id);
          setWalletBalance(newBalance);
        }
      }

      if (isFullWalletPayment) {
        await supabase
          .from("orders")
          .update({ status: "confirmed", payment_method: "wallet" })
          .eq("id", order.id);

        toast.success("Order placed successfully using wallet balance!");
        clearCart();
        setAppliedCoupon(null);
        setCouponCode("");
        setUseWallet(false);
        setStep("cart");
        setCartOpen(false);
        setProcessing(false);
        return;
      }

      const { data: rzpData, error: rzpError } = await supabase.functions.invoke("razorpay", {
        body: {
          action: "create_order",
          amount: finalPrice,
          purpose: "shop",
          order_ref_id: order.id,
        },
      });

      if (rzpError || rzpData?.error) throw new Error(rzpData?.error || rzpError?.message);

      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: "NexaMarket",
        description: `Order #${order.id.slice(0, 8)}`,
        order_id: rzpData.order_id,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("razorpay", {
              body: {
                action: "verify_payment",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            if (verifyError || verifyData?.error) {
              toast.error("Payment verification failed");
              return;
            }

            await supabase
              .from("orders")
              .update({ status: "confirmed", payment_method: useWallet ? "wallet+razorpay" : "razorpay" })
              .eq("id", order.id);

            toast.success("Order placed successfully!");
            clearCart();
            setAppliedCoupon(null);
            setCouponCode("");
            setUseWallet(false);
            setStep("cart");
            setCartOpen(false);
          } catch {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setStep("address");
            toast.info("Payment cancelled");
          },
        },
        theme: { color: "#333" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Checkout failed");
      setStep("cart");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-5 w-5" />
            {step === "cart" ? "Your Cart" : step === "address" ? "Shipping Address" : "Processing"}
          </SheetTitle>
        </SheetHeader>

        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 mt-4">
              {cartProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">Your cart is empty</p>
              ) : (
                cartProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center text-2xl shrink-0">
                      {p.image_url?.startsWith("http") ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-contain rounded" />
                      ) : (
                        p.image_url || "📦"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-sm font-display font-bold text-primary">{fc(getPrice(p))}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(p.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{p.qty}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(p.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            {cartProducts.length > 0 && (
              <div className="border-t border-border pt-4 space-y-3">
                {/* Coupon Section */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-mono font-bold text-primary">{appliedCoupon.code}</p>
                        <p className="text-xs text-muted-foreground">-{fc(discountAmount)} off</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={removeCoupon}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="pl-9 font-mono text-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}

                {/* Wallet Section */}
                {user && walletBalance > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-accent-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Use Wallet Balance</p>
                        <p className="text-xs text-muted-foreground">
                          Available: {fc(walletBalance)}
                          {useWallet && walletDeduction > 0 && (
                            <span className="text-primary ml-1">(-{fc(walletDeduction)})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Switch checked={useWallet} onCheckedChange={setUseWallet} />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{fc(totalPrice)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary">Coupon Discount</span>
                      <span className="text-primary font-medium">-{fc(discountAmount)}</span>
                    </div>
                  )}
                  {taxEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{taxLabel} ({taxRate}%)</span>
                      <span className="text-foreground">+{fc(tax)}</span>
                    </div>
                  )}
                  {useWallet && walletDeduction > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary">Wallet</span>
                      <span className="text-primary font-medium">-{fc(walletDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="font-display text-foreground">{fc(finalPrice)}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={handleCheckout}>
                  {isFullWalletPayment ? "Place Order (Wallet)" : "Proceed to Checkout"}
                </Button>
              </div>
            )}
          </>
        )}

        {step === "address" && (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 1 *</Label>
                <Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pincode *</Label>
                  <Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{fc(afterCoupon)}</span>
                </div>
                {taxEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{taxLabel} ({taxRate}%)</span>
                    <span className="text-foreground">+{fc(tax)}</span>
                  </div>
                )}
                {useWallet && walletDeduction > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary">Wallet</span>
                    <span className="text-primary font-medium">-{fc(walletDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Pay Now</span>
                  <span className="font-display text-foreground">{fc(finalPrice)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("cart")}>Back</Button>
                <Button className="flex-1" onClick={handlePayment} disabled={processing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isFullWalletPayment ? "Confirm Order" : "Pay Now"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Processing your order...</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
