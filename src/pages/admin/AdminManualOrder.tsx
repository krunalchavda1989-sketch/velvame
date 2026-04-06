import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingBag, RefreshCw, Wallet, Ticket, X, Check, MapPin, Percent, Lock, Search, Banknote, Building2, HandCoins, Save } from "lucide-react";
import CouponRecommendations from "@/components/shop/CouponRecommendations";

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
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [userWallet, setUserWallet] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [useWallet, setUseWallet] = useState(true);
  const [paymentNote, setPaymentNote] = useState("");

  // First order & pricing state
  const [isUserFirstOrder, setIsUserFirstOrder] = useState(true);
  const [isUserSubscriber, setIsUserSubscriber] = useState(false);
  const [priceType, setPriceType] = useState<"retail" | "distributor">("retail");

  // Admin discount state
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [manualAddress, setManualAddress] = useState({
    name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "",
  });

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

  // Fetch wallet, addresses, and first-order status when user changes
  useEffect(() => {
    if (!selectedUserId) {
      setUserWallet(null);
      setSavedAddresses([]);
      setSelectedAddressId(null);
      setShowManualAddress(false);
      setIsUserFirstOrder(true);
      setIsUserSubscriber(false);
      setPriceType("retail");
      setOrderItems([]);
      return;
    }
    const fetchUserData = async () => {
      setWalletLoading(true);
      const [walletRes, addressRes, orderCountRes, profileRes] = await Promise.all([
        supabase.from("wallets").select("balance, subscription_balance, commission_balance").eq("user_id", selectedUserId).maybeSingle(),
        supabase.from("user_addresses").select("*").eq("user_id", selectedUserId).order("is_default", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", selectedUserId).not("status", "in", '("cancelled","failed")'),
        supabase.from("profiles").select("subscription_paid, membership_source").eq("user_id", selectedUserId).single(),
      ]);
      setUserWallet(walletRes.data || null);
      const addrs = (addressRes.data as any[]) || [];
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a: any) => a.is_default) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
        setShowManualAddress(false);
      } else {
        setSelectedAddressId(null);
        setShowManualAddress(true);
      }

      // Determine first order and pricing
      const hasOrders = (orderCountRes.count ?? 0) > 0;
      const isFirstOrder = !hasOrders;
      const isSub = !!profileRes.data?.subscription_paid;
      const isPaidSub = isSub && profileRes.data?.membership_source === "paid";

      setIsUserFirstOrder(isFirstOrder);
      setIsUserSubscriber(isSub);

      // First order of paid subscriber → retail, otherwise subscriber with prior orders → distributor
      let newPriceType: "retail" | "distributor" = "retail";
      if (isSub && !isFirstOrder) {
        newPriceType = "distributor";
      } else if (isPaidSub && isFirstOrder) {
        newPriceType = "retail";
      }
      setPriceType(newPriceType);

      // Clear order items since price type changed
      setOrderItems([]);

      setWalletLoading(false);
    };
    fetchUserData();
  }, [selectedUserId]);

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1, price: 0, variation_id: "", variation_label: "" }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Helper to get the correct base price based on user's pricing tier
  const getBasePrice = (product: any) => {
    if (!product) return 0;
    return priceType === "distributor" ? (product.distributor_price || product.retail_price) : product.retail_price;
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].price = getBasePrice(product);
        updated[index].variation_id = "";
        updated[index].variation_label = "";
      }
    }
    if (field === "variation_id") {
      const vars = variationsMap[updated[index].product_id] || [];
      const selectedVar = vars.find((v: any) => v.id === value);
      if (selectedVar) {
        const product = products.find((p) => p.id === updated[index].product_id);
        const basePrice = getBasePrice(product);
        updated[index].price = basePrice + Number(selectedVar.price_adjustment);
        updated[index].variation_label = `${selectedVar.attribute_name}: ${selectedVar.attribute_value}`;
      }
    }
    setOrderItems(updated);
  };

  const subtotalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Admin discount calculation
  const adminDiscount = discountValue > 0
    ? discountType === "percentage"
      ? Math.min((subtotalAmount * discountValue) / 100, subtotalAmount)
      : Math.min(discountValue, subtotalAmount)
    : 0;

  const afterAdminDiscount = Math.max(0, subtotalAmount - adminDiscount);

  // Coupon discount calculation (applied after admin discount)
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.min(
          (afterAdminDiscount * appliedCoupon.discount_value) / 100,
          appliedCoupon.max_discount_amount > 0 ? appliedCoupon.max_discount_amount : Infinity
        )
      : Math.min(appliedCoupon.discount_value, afterAdminDiscount)
    : 0;

  const totalAmount = Math.max(0, afterAdminDiscount - couponDiscount);

  // Wallet usage calculation
  const walletAmountToUse = useWallet && userWallet
    ? Math.min(userWallet.balance, totalAmount)
    : 0;
  const remainingAmount = totalAmount - walletAmountToUse;

  const getShippingAddress = () => {
    if (showManualAddress) return manualAddress;
    const saved = savedAddresses.find((a: any) => a.id === selectedAddressId);
    if (!saved) return null;
    return { name: saved.name, line1: saved.line1, line2: saved.line2 || "", city: saved.city, state: saved.state, pincode: saved.pincode, phone: saved.phone };
  };

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

    // Address validation
    const shippingAddr = getShippingAddress();
    if (!shippingAddr || !shippingAddr.name || !shippingAddr.line1 || !shippingAddr.city || !shippingAddr.state || !shippingAddr.pincode || !shippingAddr.phone) {
      toast.error("Please fill all required shipping address fields");
      return;
    }

    // Payment note is compulsory when payment method is shown
    if (remainingAmount > 0 && !paymentNote.trim()) {
      toast.error("Payment note is required");
      return;
    }

    // If wallet covers everything, no payment method needed; otherwise require one
    if (remainingAmount > 0 && !paymentMethod) {
      toast.error("Please select a payment method for the remaining amount");
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const effectivePaymentMethod = walletAmountToUse > 0 && remainingAmount <= 0 
        ? "wallet" 
        : remainingAmount <= 0 && walletAmountToUse === 0 
          ? (paymentMethod || "free") 
          : paymentMethod;
      const isConfirmed = effectivePaymentMethod === "wallet" || effectivePaymentMethod === "free" || effectivePaymentMethod === "cod" || effectivePaymentMethod === "manual" || effectivePaymentMethod === "bank_transfer";


      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: selectedUserId,
          total_amount: totalAmount,
          payment_method: effectivePaymentMethod,
          status: isConfirmed ? "confirmed" : "pending",
          shipping_address: shippingAddr as any,
          wallet_amount_used: walletAmountToUse,
          price_type_used: priceType,
          is_first_order: isUserFirstOrder,
          is_repurchase: !isUserFirstOrder,
          order_source: "manual",
        } as any)
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

      // Deduct wallet balance if used
      if (walletAmountToUse > 0) {
        const { data: deductResult, error: deductError } = await supabase.rpc("deduct_wallet_balance", {
          _user_id: selectedUserId,
          _amount: walletAmountToUse,
          _order_id: order.id,
        });

        if (deductError) throw deductError;
        const result = deductResult as any;
        if (!result?.success) {
          throw new Error(result?.error || "Failed to deduct wallet balance");
        }

        const { data: updatedWallet } = await supabase
          .from("wallets")
          .select("balance, subscription_balance, commission_balance")
          .eq("user_id", selectedUserId)
          .maybeSingle();
        setUserWallet(updatedWallet || null);
      }

      // Add payment note as order note if provided
      if (paymentNote.trim() && ["manual", "bank_transfer", "cod"].includes(effectivePaymentMethod)) {
        await supabase.from("order_notes").insert({
          order_id: order.id,
          content: `Payment Note (${effectivePaymentMethod}): ${paymentNote.trim()}`,
          note_type: "payment",
          is_internal: true,
        });
      }

      // Save manual address to user_addresses if entered manually
      if (showManualAddress && manualAddress.name && manualAddress.line1 && saveNewAddress) {
        const isFirst = savedAddresses.length === 0;
        await supabase.from("user_addresses").insert({
          user_id: selectedUserId,
          label: "Other",
          name: manualAddress.name,
          line1: manualAddress.line1,
          line2: manualAddress.line2,
          city: manualAddress.city,
          state: manualAddress.state,
          pincode: manualAddress.pincode,
          phone: manualAddress.phone,
          is_default: isFirst,
        });
      }

      if (appliedCoupon) {
        await supabase.rpc("increment_coupon_usage", { _coupon_id: appliedCoupon.id });
      }

      toast.success(`Order created successfully! ID: ${order.id.slice(0, 8)}…`);

      setSelectedUserId("");
      setOrderItems([]);
      setPaymentMethod("cod");
      setUseWallet(true);
      setPaymentNote("");
      setManualAddress({ name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" });
      removeCoupon();
      setDiscountType("percentage");
      setDiscountValue(0);
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Create Manual Order</h1>
            <p className="text-sm text-muted-foreground">Create an order on behalf of a user</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-3 space-y-6">
          {/* User Selection */}
          <div className="p-4 sm:p-6 rounded-xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-foreground">Select User</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or referral code..."
                value={userSearchQuery}
                onChange={(e) => { setUserSearchQuery(e.target.value); setUserDropdownOpen(true); }}
                onFocus={() => setUserDropdownOpen(true)}
                className="pl-9 bg-secondary border-border"
              />
              {selectedUserId && (
                <button
                  type="button"
                  onClick={() => { setSelectedUserId(""); setUserSearchQuery(""); setPaymentMethod("cod"); setUseWallet(true); setPaymentNote(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {userDropdownOpen && !selectedUserId && (
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {users
                  .filter((u) => {
                    if (!userSearchQuery.trim()) return true;
                    const q = userSearchQuery.toLowerCase();
                    return (u.full_name || "").toLowerCase().includes(q) || (u.referral_code || "").toLowerCase().includes(q);
                  })
                  .slice(0, 50)
                  .map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.user_id);
                        setUserSearchQuery(`${u.full_name || "Unnamed"} (${u.referral_code})`);
                        setUserDropdownOpen(false);
                        setPaymentMethod("cod");
                        setUseWallet(true);
                        setPaymentNote("");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/80 transition-colors flex items-center justify-between"
                    >
                      <span className="text-foreground">{u.full_name || "Unnamed"}</span>
                      <Badge variant="outline" className="text-xs ml-2">{u.referral_code}</Badge>
                    </button>
                  ))}
                {users.filter((u) => {
                  if (!userSearchQuery.trim()) return true;
                  const q = userSearchQuery.toLowerCase();
                  return (u.full_name || "").toLowerCase().includes(q) || (u.referral_code || "").toLowerCase().includes(q);
                }).length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">No users found</div>
                )}
              </div>
            )}

            {/* Pricing Type Indicator */}
            {selectedUserId && !walletLoading && (
              <div className="p-3 rounded-lg bg-accent/30 border border-accent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-accent-foreground" />
                    <span className="text-sm font-medium text-accent-foreground">
                      Price Type: <span className="font-bold">{priceType === "distributor" ? "Distributor Price" : "Retail Price"}</span>
                    </span>
                  </div>
                  <Badge variant={priceType === "distributor" ? "default" : "secondary"} className="text-xs">
                    {isUserFirstOrder ? "1st Order" : "Repeat Order"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isUserFirstOrder
                    ? "First order — Retail pricing applied"
                    : isUserSubscriber
                      ? "Returning subscriber — Distributor pricing applied"
                      : "Non-subscriber — Retail pricing applied"}
                </p>
              </div>
            )}

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
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            Price (₹) <Lock className="h-3 w-3 text-muted-foreground" />
                          </Label>
                          <Input
                            type="number"
                            value={item.price}
                            disabled
                            className="mt-1 bg-muted border-border cursor-not-allowed opacity-70"
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
                {adminDiscount > 0 && (
                  <div className="flex justify-end">
                    <span className="text-sm text-accent-foreground mr-2">
                      Admin Discount ({discountType === "percentage" ? `${discountValue}%` : `₹${discountValue}`}):
                    </span>
                    <span className="font-medium text-accent-foreground">-₹{adminDiscount.toFixed(2)}</span>
                  </div>
                )}
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

          {/* Admin Discount */}
          <div className="p-4 sm:p-6 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Admin Discount</h2>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Discount Type</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "amount")}>
                  <SelectTrigger className="bg-secondary border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="amount">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">
                  {discountType === "percentage" ? "Percentage" : "Amount (₹)"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={discountType === "percentage" ? 100 : undefined}
                  step={discountType === "percentage" ? 1 : 0.01}
                  value={discountValue || ""}
                  placeholder="0"
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              {discountValue > 0 && (
                <Button variant="ghost" size="icon" className="text-destructive h-9 w-9" onClick={() => setDiscountValue(0)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {adminDiscount > 0 && (
              <div className="p-2.5 rounded-lg bg-accent/50 border border-accent">
                <p className="text-sm font-medium text-accent-foreground">
                  Discount: ₹{adminDiscount.toFixed(2)} off
                  {discountType === "percentage" && ` (${discountValue}% of ₹${subtotalAmount.toFixed(2)})`}
                </p>
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
                <CouponRecommendations
                  appliedCode={appliedCoupon?.code}
                  onSelect={(code) => { setCouponCode(code); setCouponError(""); }}
                />
              </div>
            )}
          </div>

          {/* Shipping Address */}
          {selectedUserId && (
            <div className="p-4 sm:p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Shipping Address</h2>
              </div>

              {savedAddresses.length > 0 && !showManualAddress && (
                <div className="space-y-3">
                  {savedAddresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{addr.label || "Address"}</Badge>
                        {addr.is_default && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Default</Badge>}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{addr.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                      <p className="text-sm text-muted-foreground">📞 {addr.phone}</p>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm gap-1.5 w-full text-primary"
                    onClick={() => { setShowManualAddress(true); setSelectedAddressId(null); }}
                  >
                    <MapPin className="h-4 w-4" /> Use a different address
                  </Button>
                </div>
              )}

              {(showManualAddress || savedAddresses.length === 0) && (
                <div className="space-y-3">
                  {savedAddresses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm gap-1.5 text-primary"
                      onClick={() => {
                        setShowManualAddress(false);
                        const def = savedAddresses.find((a: any) => a.is_default) || savedAddresses[0];
                        if (def) setSelectedAddressId(def.id);
                      }}
                    >
                      ← Back to saved addresses
                    </Button>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Full Name *</Label>
                    <Input value={manualAddress.name} onChange={(e) => setManualAddress({ ...manualAddress, name: e.target.value })} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Address Line 1 *</Label>
                    <Input value={manualAddress.line1} onChange={(e) => setManualAddress({ ...manualAddress, line1: e.target.value })} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Address Line 2</Label>
                    <Input value={manualAddress.line2} onChange={(e) => setManualAddress({ ...manualAddress, line2: e.target.value })} className="bg-secondary border-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">City *</Label>
                      <Input value={manualAddress.city} onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">State *</Label>
                      <Input value={manualAddress.state} onChange={(e) => setManualAddress({ ...manualAddress, state: e.target.value })} className="bg-secondary border-border" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Pincode *</Label>
                      <Input value={manualAddress.pincode} onChange={(e) => setManualAddress({ ...manualAddress, pincode: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">Phone *</Label>
                      <Input value={manualAddress.phone} onChange={(e) => setManualAddress({ ...manualAddress, phone: e.target.value.replace(/\D/g, "").slice(0, 15) })} className="bg-secondary border-border" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={saveNewAddress} onCheckedChange={setSaveNewAddress} />
                    <Label className="text-sm text-muted-foreground cursor-pointer" onClick={() => setSaveNewAddress(!saveNewAddress)}>
                      Save this address to user's profile
                    </Label>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-4 space-y-4">
              {/* Wallet Toggle (like user panel) */}
              {selectedUserId && userWallet && userWallet.balance > 0 && (
                <div className="p-4 rounded-xl bg-card border-2 border-primary/20 shadow-lg shadow-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Use Wallet Balance</h3>
                        <p className="text-sm text-muted-foreground">Total: ₹{userWallet.balance.toFixed(2)}</p>
                      </div>
                    </div>
                    <Switch
                      checked={useWallet}
                      onCheckedChange={setUseWallet}
                    />
                  </div>
                  {useWallet && (
                    <div className="text-xs space-y-1 pl-[52px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Subscription:</span>
                        <span className="font-medium text-foreground">₹{userWallet.subscription_balance.toFixed(2)}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">orders only</Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Commission:</span>
                        <span className="font-medium text-foreground">₹{userWallet.commission_balance.toFixed(2)}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">withdrawable</Badge>
                      </div>
                      {walletAmountToUse > 0 && (
                        <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm">
                          <span className="text-muted-foreground">Wallet amount to use:</span>
                          <span className="font-bold text-primary">-₹{walletAmountToUse.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method */}
              <div className="p-4 rounded-xl bg-card border-2 border-primary/20 shadow-lg shadow-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Payment Method</h2>
                  {remainingAmount < totalAmount && remainingAmount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Remaining: ₹{remainingAmount.toFixed(2)}
                    </Badge>
                  )}
                </div>

                {remainingAmount <= 0 ? (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Full amount covered by wallet balance
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "cod", label: "Cash on Delivery", icon: <Banknote className="h-5 w-5" /> },
                        { value: "bank_transfer", label: "Bank Transfer", icon: <Building2 className="h-5 w-5" /> },
                        { value: "manual", label: "Manual / Cash", icon: <HandCoins className="h-5 w-5" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setPaymentMethod(opt.value); }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                            paymentMethod === opt.value
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/40"
                          }`}
                        >
                          {opt.icon}
                          <span className="text-xs font-medium leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Payment Note <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        placeholder={
                          paymentMethod === "bank_transfer"
                            ? "e.g., Transaction ID, bank name, transfer date..."
                            : paymentMethod === "cod"
                              ? "e.g., Expected delivery date, collection notes..."
                              : "e.g., Cash received by, receipt number..."
                        }
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        className={`bg-secondary border-border resize-none ${!paymentNote.trim() ? "border-destructive/50" : ""}`}
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Order Summary */}
              {orderItems.length > 0 && (
                <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/30 shadow-lg shadow-primary/5 space-y-2">
                  <h2 className="font-semibold text-foreground mb-3">Order Summary</h2>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{subtotalAmount.toFixed(2)}</span>
                  </div>
                  {adminDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-accent-foreground">Admin Discount</span>
                      <span className="text-accent-foreground">-₹{adminDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Coupon ({appliedCoupon.code})</span>
                      <span className="text-green-600">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {walletAmountToUse > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary">Wallet Balance</span>
                      <span className="text-primary">-₹{walletAmountToUse.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-primary/20 pt-2 mt-2">
                    <span className="text-foreground">{remainingAmount > 0 ? "Amount to Pay" : "Total"}</span>
                    <span className="text-primary text-lg">₹{remainingAmount > 0 ? remainingAmount.toFixed(2) : "0.00"}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedUserId || orderItems.length === 0}
                className="w-full bg-primary text-primary-foreground font-semibold h-12"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : remainingAmount <= 0 && useWallet ? (
                  <Wallet className="h-4 w-4 mr-2" />
                ) : (
                  <ShoppingBag className="h-4 w-4 mr-2" />
                )}
                {submitting
                  ? "Creating order..."
                  : remainingAmount <= 0 && useWallet
                    ? `Create Order (Wallet) — ₹${totalAmount.toFixed(2)}`
                    : `Create Order — ₹${remainingAmount > 0 ? remainingAmount.toFixed(2) : totalAmount.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminManualOrder;
