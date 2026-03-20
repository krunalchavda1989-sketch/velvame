import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import OffersCarousel from "@/components/shop/OffersCarousel";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";
import { getProductUrl } from "@/lib/productUrl";


const Shop = () => {
  const { products, addToCart, totalItems, setCartOpen, isMember, getPrice } = useCart();
  const { currencySymbol, taxEnabled, taxLabel } = useLocalization();
  const [filter, setFilter] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("product_categories")
        .select("name")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setCategories(["All", ...data.map((c: any) => c.name)]);
    };
    fetchCategories();
  }, []);

  const filtered = filter === "All" ? products : products.filter((p) => p.category === filter);
  const loading = products.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <PageBreadcrumb
          title="Shop Products"
          subtitle={
            isMember
              ? `Exclusive distributor prices for members${taxEnabled ? ` (Prices excl. ${taxLabel})` : ""}`
              : `Quality products at retail prices${taxEnabled ? ` (Prices excl. ${taxLabel})` : ""}`
          }
        />

        <div className="container px-4 pt-8">
          <OffersCarousel />

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
              {filtered.map((product, i) => {
                const price = getPrice(product);
                const otherPrice = isMember ? product.retail_price : product.distributor_price;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <Link to={getProductUrl(product)}>
                      <div className="bg-secondary flex items-center justify-center text-5xl">
                        {product.image_url?.startsWith("http") ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-auto object-contain" />
                        ) : (
                          product.image_url || "📦"
                        )}
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
                        <h3 className="font-display font-semibold text-foreground text-sm mb-2">{product.name}</h3>
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="h-3 w-3 text-primary fill-primary" />
                          <span className="text-xs text-muted-foreground">{product.rating}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-display font-bold text-primary">
                            {formatPrice(price, currencySymbol)}
                          </div>
                          {isMember && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatPrice(otherPrice, currencySymbol)}
                            </div>
                          )}
                          {!isMember && product.distributor_price < product.retail_price && (
                            <div className="text-xs text-muted-foreground">
                              Member price: {formatPrice(product.distributor_price, currencySymbol)}
                            </div>
                          )}
                        </div>
                        {product.stock <= 0 && !(product as any).allow_backorder ? (
                          <Button size="sm" disabled className="opacity-50 cursor-not-allowed">
                            Out of Stock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => { addToCart(product.id); toast.success(`Added ${product.name} to cart`); }}
                            className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {product.stock <= 0 ? "Pre-Order" : "Add to Cart"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
