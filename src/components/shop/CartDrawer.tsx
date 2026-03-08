import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CartDrawer = () => {
  const { user } = useAuth();
  const { cartOpen, setCartOpen, cartProducts, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<"cart" | "address" | "processing">("cart");
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

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
          total_amount: totalPrice,
          shipping_address: address as any,
          payment_method: "razorpay",
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      const items = cartProducts.map((p) => ({
        order_id: order.id,
        product_id: p.id,
        quantity: p.qty,
        price: p.distributor_price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw new Error(itemsError.message);

      const { data: rzpData, error: rzpError } = await supabase.functions.invoke("razorpay", {
        body: {
          action: "create_order",
          amount: totalPrice,
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
              .update({ status: "confirmed", payment_method: "razorpay" })
              .eq("id", order.id);

            toast.success("Order placed successfully!");
            clearCart();
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
                      <p className="text-sm font-display font-bold text-primary">₹{p.distributor_price}</p>
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-display font-bold text-foreground">₹{totalPrice.toFixed(2)}</span>
                </div>
                <Button className="w-full" onClick={handleCheckout}>
                  Proceed to Checkout
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
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display font-bold text-foreground">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <Button className="w-full" onClick={handlePayment} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Pay ₹{totalPrice.toFixed(2)} with Razorpay
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("cart")}>
                Back to Cart
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Setting up your payment...</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
