import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import CartDrawer, { type CartItem } from "@/components/shop/CartDrawer";

const Shop = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at");
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Load Razorpay SDK
  useEffect(() => {
    if (!document.getElementById("razorpay-sdk")) {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const categories = ["All", ...new Set(products.map((p) => p.category))];
  const filtered = filter === "All" ? products : products.filter((p) => p.category === filter);

  const addToCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { id, qty: 1 }];
    });
    toast.success("Added to cart");
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Shop Products</h1>
            <p className="text-sm text-muted-foreground mt-1">Quality products at distributor prices</p>
          </div>
          <Button variant="outline" className="relative border-border" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 transition-colors"
              >
                <div className="h-40 bg-secondary flex items-center justify-center text-5xl">
                  {product.image_url || "📦"}
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
                  <h3 className="font-display font-semibold text-foreground text-sm mb-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-display font-bold text-primary">₹{product.distributor_price}</div>
                      <div className="text-xs text-muted-foreground line-through">₹{product.retail_price}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToCart(product.id)}
                      className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        setCart={setCart}
        products={products}
      />
    </div>
  );
};

export default Shop;
