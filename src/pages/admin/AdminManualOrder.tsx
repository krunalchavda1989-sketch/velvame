import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Send, ShoppingBag, RefreshCw } from "lucide-react";

const AdminManualOrder = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [sendPaymentLink, setSendPaymentLink] = useState(false);
  const [orderItems, setOrderItems] = useState<{ product_id: string; quantity: number; price: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, productsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, referral_code"),
        supabase.from("products").select("id, name, retail_price, distributor_price, stock, image_url").eq("active", true),
      ]);
      setUsers(usersRes.data || []);
      setProducts(productsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1, price: 0 }]);
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
      }
    }
    setOrderItems(updated);
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    if (orderItems.length === 0 || orderItems.some((i) => !i.product_id)) {
      toast.error("Please add at least one product");
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: selectedUserId,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: paymentMethod === "cod" ? "confirmed" : "pending",
          shipping_address: {},
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const items = orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      // Send payment link if requested
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

      toast.success(`Order created successfully! ID: ${order.id.slice(0, 8)}…`);

      // Reset form
      setSelectedUserId("");
      setOrderItems([]);
      setPaymentMethod("razorpay");
      setSendPaymentLink(false);
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
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Create Manual Order</h1>
            <p className="text-sm text-muted-foreground">Create an order on behalf of a user</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* User Selection */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-foreground">Select User</h2>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
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
          </div>

          {/* Products */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Order Items</h2>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </div>

            {orderItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No products added yet.</p>
            )}

            {orderItems.map((item, index) => (
              <div key={index} className="flex items-end gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1">
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
                <div className="w-20">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    className="mt-1 bg-background border-border"
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs text-muted-foreground">Price</Label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                    className="mt-1 bg-background border-border"
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {orderItems.length > 0 && (
              <div className="flex justify-end pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground mr-2">Total:</span>
                <span className="font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
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
              </SelectContent>
            </Select>

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
            disabled={submitting || !selectedUserId || orderItems.length === 0}
            className="w-full bg-primary text-primary-foreground font-semibold h-12"
          >
            {submitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : sendPaymentLink ? (
              <Send className="h-4 w-4 mr-2" />
            ) : (
              <ShoppingBag className="h-4 w-4 mr-2" />
            )}
            {submitting
              ? "Creating order..."
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
