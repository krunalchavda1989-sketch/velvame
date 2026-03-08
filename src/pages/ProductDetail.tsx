import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, ShoppingCart, Plus, Minus, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        toast.error("Product not found");
      }
      setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const savings = product ? product.retail_price - product.distributor_price : 0;
  const savingsPercent = product ? Math.round((savings / product.retail_price) * 100) : 0;

  const isImageUrl = (url: string) =>
    url?.startsWith("http") || url?.startsWith("/") || url?.startsWith("data:");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !product ? (
          <div className="text-center py-20">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Product not found</h2>
            <p className="text-muted-foreground mb-6">This product may have been removed or doesn't exist.</p>
            <Link to="/shop">
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            {/* Image */}
            <div className="rounded-2xl bg-secondary border border-border overflow-hidden flex items-center justify-center min-h-[320px] lg:min-h-[450px]">
              {isImageUrl(product.image_url) ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain max-h-[450px]"
                />
              ) : (
                <span className="text-8xl">{product.image_url || "📦"}</span>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-muted-foreground border-border">
                  {product.category}
                </Badge>
                {product.stock > 0 ? (
                  <Badge className="bg-success/10 text-success border-success/20">In Stock</Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>

              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(product.rating)
                            ? "text-primary fill-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{product.rating} / 5</span>
                </div>
              )}

              {/* Pricing */}
              <div className="rounded-xl border border-border bg-card p-5 mb-6">
                <div className="flex items-end gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Distributor Price</p>
                    <span className="text-3xl font-display font-bold text-primary">
                      ₹{product.distributor_price}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Retail Price</p>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.retail_price}
                    </span>
                  </div>
                </div>
                {savings > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      You save ₹{savings} ({savingsPercent}% off)
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4 mt-auto pt-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-foreground">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 h-11"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    toast.success(`Added ${qty}x ${product.name} to cart`);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>

              {/* Stock info */}
              <p className="text-xs text-muted-foreground mt-4">
                {product.stock > 0
                  ? `${product.stock} units available`
                  : "Currently out of stock"}
              </p>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
