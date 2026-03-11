import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Package, ArrowRight, ShoppingBag, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);
  const brand = useBrand();
  const { currencySymbol } = useLocalization();
  const fc = (val: number) => formatPrice(val, currencySymbol);

  useEffect(() => {
    if (!orderId) return;
    supabase
      .from("orders")
      .select("id, order_number, total_amount, status, created_at, payment_method")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data);
      });
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-2">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.brand_name} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-xl font-bold text-foreground">{brand.brand_name}</span>
            )}
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold text-foreground">Order Placed Successfully!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {order && (
            <Card className="text-left">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Order Number</span>
                  <span className="text-sm font-bold font-mono">{order.order_number || order.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-sm font-bold">{fc(Number(order.total_amount))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                  <span className="text-sm capitalize">{order.payment_method?.replace(/_/g, " ") || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-green-600 capitalize">{order.status}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard/orders">
                <Package className="h-4 w-4" /> View My Orders
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/shop">
                <ShoppingBag className="h-4 w-4" /> Continue Shopping
              </Link>
            </Button>
          </div>

          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
