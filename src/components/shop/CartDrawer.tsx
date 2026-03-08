import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";
import { useNavigate } from "react-router-dom";

const CartDrawer = () => {
  const { cartOpen, setCartOpen, cartProducts, totalPrice, updateQty, removeItem, getPrice } = useCart();
  const { currencySymbol } = useLocalization();
  const navigate = useNavigate();

  const fc = (val: number) => formatPrice(val, currencySymbol);

  const handleCheckout = () => {
    setCartOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({cartProducts.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 mt-4">
          {cartProducts.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Your cart is empty</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => { setCartOpen(false); navigate("/shop"); }}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            cartProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image_url?.startsWith("http") ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-2xl">{p.image_url || "📦"}</span>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display font-bold text-foreground">{fc(totalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping, taxes, and discounts calculated at checkout.</p>
            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => { setCartOpen(false); navigate("/shop"); }}>
              Continue Shopping
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
