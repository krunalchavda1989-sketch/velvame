import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Send, ShoppingBag, RefreshCw, Wallet, Ticket, X, Check } from "lucide-react";

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  variation_id: string;
  variation_label: string;
}

interface WalletData {
  balance: number;
  subscription_balance: number;
  commission_balance: number;
}

const AdminManualOrder = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [variationsMap, setVariationsMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [sendPaymentLink, setSendPaymentLink] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [userWallet, setUserWallet] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, productsRes, variationsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, referral_code"),
        supabase.from("products").select("id, name, retail_price, distributor_price, stock, image_url").eq("active", true),
        supabase.from("product_variations").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setUsers(usersRes.data || []);
      setProducts(productsRes.data || []);

      const vMap: Record<string, any[]> = {};
      (variationsRes.data || []).forEach((v: any) => {
        if (!vMap[v.product_id]) vMap[v.product_id] = [];
        vMap[v.product_id].push(v);
      });
      setVariationsMap(vMap);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Fetch wallet when user changes
  useEffect(() => {
    if (!selectedUserId) {
      setUserWallet(null);
      return;
    }
    const fetchWallet = async () => {
      setWalletLoading(true);
      const { data } = await supabase
        .from("wallets")
        .select("balance, subscription_balance, commission_balance")
        .eq("user_id", selectedUserId)
        .maybeSingle();
      setUserWallet(data || null);
      setWalletLoading(false);
    };
    fetchWallet();
  }, [selectedUserId]);

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1, price: 0, variation_id: "", variation_label: "" }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].price = product.retail_price;
        updated[index].variation_id = "";
        updated[index].variation_label = "";
      }
    }
    if (field === "variation_id") {
      const vars = variationsMap[updated[index].product_id] || [];
      const selectedVar = vars.find((v: any) => v.id === value);
      if (selectedVar) {
        const product = products.find((p) => p.id === updated[index].product_id);
        const basePrice = product?.retail_price || 0;
        updated[index].price = basePrice + Number(selectedVar.price_adjustment);
        updated[index].variation_label = `${selectedVar.attribute_name}: ${selectedVar.attribute_value}`;
      }
    }
    setOrderItems(updated);
  };

  const subtotalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Coupon discount calculation
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.min(
          (subtotalAmount * appliedCoupon.discount_value) / 100,
          appliedCoupon.max_discount_amount > 0 ? appliedCoupon.max_discount_amount : Infinity
        )
      : appliedCoupon.discount_value
    : 0;

  const totalAmount = Math.max(0, subtotalAmount - couponDiscount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) { setCouponError("Invalid coupon code"); setCouponLoading(false); return; }

      // Validate dates
      const now = new Date();
      if (new Date(data.start_date) > now) { setCouponError("Coupon not yet active"); setCouponLoading(false); return; }
      if (new Date(data.end_date) < now) { setCouponError("Coupon has expired"); setCouponLoading(false); return; }

      // Validate uses
      if (data.max_uses && data.max_uses > 0 && data.used_count >= data.max_uses) {
        setCouponError("Coupon usage limit reached"); setCouponLoading(false); return;
      }

      // Validate min order
      if (data.min_order_amount && subtotalAmount < data.min_order_amount) {
        setCouponError(`Minimum order ₹${data.min_order_amount} required`); setCouponLoading(false); return;
      }

      setAppliedCoupon(data);
      setCouponError("");
      toast.success(`Coupon "${data.code}" applied!`);
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    if (orderItems.length === 0 || orderItems.some((i) => !i.product_id)) {
      toast.error("Please add at least one product");
      return;
    }

    // Wallet balance validation
    if (paymentMethod === "wallet") {
      if (!userWallet || userWallet.balance < totalAmount) {
        toast.error(`Insufficient wallet balance. Available: ₹${userWallet?.balance?.toFixed(2) || "0.00"}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const walletAmountUsed = paymentMethod === "wallet" ? totalAmount : 0;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: selectedUserId,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: paymentMethod === "wallet" || paymentMethod === "cod" || paymentMethod === "manual" ? "confirmed" : "pending",
          shipping_address: {},
          wallet_amount_used: walletAmountUsed,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        variation_id: item.variation_id || null,
        variation_label: item.variation_label || "",
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      // Deduct wallet balance if wallet payment
      if (paymentMethod === "wallet") {
        const { data: deductResult, error: deductError } = await supabase.rpc("deduct_wallet_balance", {
          _user_id: selectedUserId,
          _amount: totalAmount,
        });

        if (deductError) throw deductError;
        const result = deductResult as any;
        if (!result?.success) {
          throw new Error(result?.error || "Failed to deduct wallet balance");
        }

        // Update the wallet transaction records with the order_id
        await supabase
          .from("wallet_transactions")
          .update({ order_id: order.id })
          .eq("user_id", selectedUserId)
          .eq("type", "debit")
          .is("order_id", null)
          .order("created_at", { ascending: false })
          .limit(2);

        // Refresh wallet display
        const { data: updatedWallet } = await supabase
          .from("wallets")
          .select("balance, subscription_balance, commission_balance")
          .eq("user_id", selectedUserId)
          .maybeSingle();
        setUserWallet(updatedWallet || null);
      }

      if (sendPaymentLink && paymentMethod === "razorpay") {
        try {
          await supabase.functions.invoke("send-payment-link", {
            body: {
              order_id: order.id,
              user_id: selectedUserId,
              amount: totalAmount,
            },
          });
          toast.success("Payment link sent to user's email!");
        } catch {
          toast.warning("Order created but payment link could not be sent.");
        }
      }

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await supabase.rpc("increment_coupon_usage", { _coupon_id: appliedCoupon.id });
      }

      toast.success(`Order created successfully! ID: ${order.id.slice(0, 8)}…`);

      setSelectedUserId("");
      setOrderItems([]);
      setPaymentMethod("razorpay");
      setSendPaymentLink(false);
      removeCoupon();
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Create Manual Order</h1>
            <p className="text-sm text-muted-foreground">Create an order on behalf of a user</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* User Selection */}
          <div className="p-4 sm:p-6 rounded-xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-foreground">Select User</h2>
            <Select value={selectedUserId} onValueChange={(v) => { setSelectedUserId(v); setPaymentMethod("razorpay"); }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60">
                {users.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.full_name || "Unnamed"} ({u.referral_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Wallet Balance Display */}
            {selectedUserId && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">User Wallet Balance</span>
                </div>
                {walletLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : userWallet ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Balance</p>
                      <p className="text-sm font-bold text-foreground">₹{userWallet.balance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Subscription</p>
                      <p className="text-sm font-semibold text-foreground">₹{userWallet.subscription_balance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Commission</p>
                      <p className="text-sm font-semibold text-foreground">₹{userWallet.commission_balance.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No wallet found</p>
                )}
              </div>
            )}
          </div>

          {/* Products */}
          <div className="p-4 sm:p-6 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Order Items</h2>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </div>

            {orderItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No products added yet.</p>
            )}

            {orderItems.map((item, index) => {
              const productVariations = item.product_id ? (variationsMap[item.product_id] || []) : [];
              return (
                <div key={index} className="p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const selectedProduct = products.find((p) => p.id === item.product_id);
                      return selectedProduct?.image_url ? (
                        <div className="w-14 h-14 rounded-lg border border-border bg-background overflow-hidden flex-shrink-0 mt-5">
                          <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                        </div>
                      ) : item.product_id ? (
                        <div className="w-14 h-14 rounded-lg border border-border bg-secondary flex items-center justify-center flex-shrink-0 mt-5">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ) : null;
                    })()}
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Product</Label>
                        <Select value={item.product_id} onValueChange={(v) => updateItem(index, "product_id", v)}>
                          <SelectTrigger className="bg-background border-border mt-1">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border max-h-60">
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — ₹{p.retail_price} (Stock: {p.stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {productVariations.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Variation / Attribute</Label>
                          <Select value={item.variation_id} onValueChange={(v) => updateItem(index, "variation_id", v)}>
                            <SelectTrigger className="bg-background border-border mt-1">
                              <SelectValue placeholder="Select variation (optional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {productVariations.map((v: any) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.attribute_name}: {v.attribute_value}
                                  {v.price_adjustment !== 0 && ` (${v.price_adjustment > 0 ? "+" : ""}₹${v.price_adjustment})`}
                                  {v.sku && ` — SKU: ${v.sku}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.variation_label && (
                            <Badge variant="secondary" className="mt-1.5 text-xs">{item.variation_label}</Badge>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive mt-5" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {orderItems.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex justify-end">
                  <span className="text-sm text-muted-foreground mr-2">Subtotal:</span>
                  <span className="font-medium text-foreground">₹{subtotalAmount.toFixed(2)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-end">
                    <span className="text-sm text-green-600 mr-2">Coupon ({appliedCoupon.code}):</span>
                    <span className="font-medium text-green-600">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-end">
                  <span className="text-sm text-muted-foreground mr-2">Total:</span>
                  <span className="font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Coupon Code */}
          <div className="p-4 sm:p-6 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Coupon Code</h2>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="font-mono font-bold text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                  <span className="text-sm text-green-600">
                    ({appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}% off` : `₹${appliedCoupon.discount_value} off`})
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-destructive h-7 px-2">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    className="font-mono bg-secondary border-border"
                  />
                  <Button
                    variant="outline"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim() || orderItems.length === 0}
                    className="shrink-0"
                  >
                    {couponLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {couponError && <p className="text-xs text-destructive">{couponError}</p>}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="p-4 sm:p-6 rounded-xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-foreground">Payment Method</h2>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="razorpay">Razorpay (Online)</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="manual">Manual / Cash</SelectItem>
                {selectedUserId && userWallet && userWallet.balance > 0 && (
                  <SelectItem value="wallet">
                    Wallet Balance (₹{userWallet.balance.toFixed(2)})
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {paymentMethod === "wallet" && userWallet && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Wallet Payment</span>
                  </div>
                  {totalAmount > userWallet.balance ? (
                    <Badge variant="destructive" className="text-xs">Insufficient Balance</Badge>
                  ) : (
                    <Badge className="text-xs bg-green-600 hover:bg-green-700">Sufficient Balance</Badge>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Available Balance:</span>
                    <span className="font-medium text-foreground">₹{userWallet.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Total:</span>
                    <span className="font-medium text-foreground">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1">
                    <span>Remaining After Order:</span>
                    <span className={`font-bold ${userWallet.balance - totalAmount >= 0 ? "text-green-600" : "text-destructive"}`}>
                      ₹{(userWallet.balance - totalAmount).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Subscription balance will be used first, then commission balance.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === "razorpay" && (
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="sendLink"
                  checked={sendPaymentLink}
                  onChange={(e) => setSendPaymentLink(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="sendLink" className="text-sm text-foreground cursor-pointer">
                  Send payment link to user's email
                </Label>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedUserId || orderItems.length === 0 || (paymentMethod === "wallet" && (!userWallet || userWallet.balance < totalAmount))}
            className="w-full bg-primary text-primary-foreground font-semibold h-12"
          >
            {submitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : paymentMethod === "wallet" ? (
              <Wallet className="h-4 w-4 mr-2" />
            ) : sendPaymentLink ? (
              <Send className="h-4 w-4 mr-2" />
            ) : (
              <ShoppingBag className="h-4 w-4 mr-2" />
            )}
            {submitting
              ? "Creating order..."
              : paymentMethod === "wallet"
                ? `Create Order (Pay from Wallet) — ₹${totalAmount.toFixed(2)}`
                : sendPaymentLink
                  ? `Create Order & Send Payment Link — ₹${totalAmount.toFixed(2)}`
                  : `Create Order — ₹${totalAmount.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminManualOrder;
