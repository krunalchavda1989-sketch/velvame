import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";
import { getProductUrl } from "@/lib/productUrl";

interface ProductCardProps {
  product: any;
  index?: number;
  showAddToCart?: boolean;
}

const ProductCard = ({ product, index = 0, showAddToCart = true }: ProductCardProps) => {
  const { addToCart, isMember, getPrice } = useCart();
  const { user } = useAuth();
  const { currencySymbol } = useLocalization();

  const price = getPrice(product);
  const otherPrice = isMember ? product.retail_price : product.distributor_price;
  const isImageUrl = (url: string) =>
    url?.startsWith("http") || url?.startsWith("/") || url?.startsWith("data:");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all"
      style={{ backgroundColor: "#ffffff" }}
    >
      <Link to={getProductUrl(product)}>
        <div className="bg-secondary aspect-square flex items-center justify-center overflow-hidden">
          {product.image_url && isImageUrl(product.image_url) ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-4xl">{product.image_url || "📦"}</span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
        <Link to={getProductUrl(product)}>
          <h3 className="font-display font-semibold text-foreground text-sm mb-1.5 truncate hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 text-primary fill-primary" />
            <span className="text-xs text-muted-foreground">{product.rating}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-display font-bold text-primary">
            {formatPrice(price, currencySymbol)}
          </span>
          {isMember && otherPrice > price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(otherPrice, currencySymbol)}
            </span>
          )}
        </div>
        {!isMember && !!user && product.distributor_price < product.retail_price && (
          <p className="text-xs text-muted-foreground mb-3">
            Member price: {formatPrice(product.distributor_price, currencySymbol)}
          </p>
        )}
        {showAddToCart && (
          <>
            {product.stock <= 0 && !product.allow_backorder ? (
              <Button size="sm" disabled className="w-full rounded-full opacity-50 cursor-not-allowed h-9 text-xs">
                Out of Stock
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-medium h-9"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product.id);
                  toast.success(`Added ${product.name}`);
                }}
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                {product.stock <= 0 ? "Pre-Order" : "Add to Cart"}
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
