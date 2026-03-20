import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Plus, Minus, Package, Tag, Zap, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";
import SocialShareButtons from "@/components/share/SocialShareButtons";

const ProductShareSection = ({ productName, productId, user }: { productName: string; productId: string; user: any }) => {
  const { data: profile } = useQuery({
    queryKey: ["share-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const baseUrl = `${window.location.origin}/product/${productId}`;
  const shareLink = user && profile?.referral_code
    ? `${baseUrl}?ref=${profile.referral_code}`
    : baseUrl;

  return (
    <div className="flex justify-end mb-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <p className="text-sm font-medium text-foreground mb-3">Share "{productName}"</p>
          <SocialShareButtons
            referralLink={shareLink}
            referralCode={user && profile?.referral_code ? profile.referral_code : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, isMember, getPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currencySymbol, taxEnabled, taxRate, taxLabel } = useLocalization();
  const [product, setProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current) return;
    const rect = imgContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setQty(1);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        toast.error("Product not found");
      }
      setProduct(data);
      setSelectedImage(data?.image_url || null);
      setLoading(false);

      if (data) {
        const { data: images } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", id)
          .order("sort_order");
        const allImages: string[] = [];
        if (data.image_url && isImageUrl(data.image_url)) allImages.push(data.image_url);
        if (images) allImages.push(...images.map((img: any) => img.image_url));
        setProductImages(allImages);
        if (allImages.length > 0) setSelectedImage(allImages[0]);
      }

      if (data) {
        const { data: rec } = await supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .eq("category", data.category)
          .neq("id", id)
          .limit(4);
        
        let items = rec || [];
        if (items.length < 4) {
          const excludeIds = [id, ...items.map((p: any) => p.id)];
          const { data: more } = await supabase
            .from("products")
            .select("*")
            .eq("active", true)
            .not("id", "in", `(${excludeIds.join(",")})`)
            .limit(4 - items.length);
          items = [...items, ...(more || [])];
        }
        setRecommended(items);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const isImageUrl = (url: string) =>
    url?.startsWith("http") || url?.startsWith("/") || url?.startsWith("data:");

  const currentPrice = product ? getPrice(product) : 0;
  const retailPrice = product?.retail_price || 0;
  const distributorPrice = product?.distributor_price || 0;
  const savings = isMember ? retailPrice - distributorPrice : 0;
  const savingsPercent = isMember && retailPrice > 0 ? Math.round((savings / retailPrice) * 100) : 0;

  const fp = (val: number) => formatPrice(val, currencySymbol);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <PageBreadcrumb
          title={product?.name || "Product Details"}
          breadcrumbs={[
            { label: "Shop", href: "/shop" },
            { label: product?.name || "Product" },
          ]}
        />
      </div>
      <div className="container px-4 py-10">

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
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              {/* Image Gallery */}
              <div>
                <div
                  ref={imgContainerRef}
                  className="rounded-2xl bg-secondary border border-border overflow-hidden flex items-center justify-center cursor-crosshair relative"
                  style={{ height: 'auto', maxHeight: '70vh' }}
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                >
                  {selectedImage && isImageUrl(selectedImage) ? (
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-auto object-contain max-h-[70vh] pointer-events-none select-none"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-8xl">{product.image_url || "📦"}</span>
                  )}
                  {isZooming && selectedImage && isImageUrl(selectedImage) && (
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        backgroundImage: `url(${selectedImage})`,
                        backgroundSize: '250%',
                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  )}
                </div>
                {productImages.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {productImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(img)}
                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-colors ${
                          selectedImage === img
                            ? "border-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <ProductShareSection productName={product.name} productId={product.id} user={user} />
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
                  {isMember ? (
                    <>
                      <div className="flex items-end gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Distributor Price</p>
                          <span className="text-3xl font-display font-bold text-primary">
                            {fp(distributorPrice)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Retail Price</p>
                          <span className="text-xl text-muted-foreground line-through">
                            {fp(retailPrice)}
                          </span>
                        </div>
                      </div>
                      {savings > 0 && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium text-success">
                            You save {fp(savings)} ({savingsPercent}% off)
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Retail Price</p>
                        <span className="text-3xl font-display font-bold text-primary">
                          {fp(retailPrice)}
                        </span>
                      </div>
                      {distributorPrice < retailPrice && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <Tag className="h-4 w-4 text-primary" />
                          <span className="text-sm text-primary">
                            Members get this at {fp(distributorPrice)} — <Link to="/dashboard/payment" className="underline font-medium">Subscribe now</Link>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {taxEnabled && (
                    <p className="text-xs text-muted-foreground mt-3">
                      + {taxRate}% {taxLabel} applicable at checkout
                    </p>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                    <div
                      className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </div>
                )}

                {/* Quantity & Add to Cart & Buy Now */}
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
                  <div className="flex-1 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-primary text-primary hover:bg-primary/5"
                      disabled={product.stock <= 0}
                      onClick={() => {
                        addToCart(product.id, qty);
                        toast.success(`Added ${qty}x ${product.name} to cart`);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 h-11"
                      disabled={product.stock <= 0}
                      onClick={() => {
                        sessionStorage.setItem("buyNowItem", JSON.stringify({ id: product.id, qty }));
                        if (!user) {
                          navigate("/login?redirect=/checkout?buyNow=1");
                        } else {
                          navigate("/checkout?buyNow=1");
                        }
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>

                {/* Stock info */}
                <p className="text-xs text-muted-foreground mt-4">
                  {product.stock > 0
                    ? `${product.stock} units available`
                    : "Currently out of stock"}
                </p>
              </div>
            </motion.div>

            {/* Recommended Products */}
            {recommended.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                  Recommended Products
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommended.map((item, i) => {
                    const recPrice = getPrice(item);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          to={`/product/${item.id}`}
                          className="block rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 transition-colors"
                        >
                          <div className="bg-secondary flex items-center justify-center text-5xl">
                            {isImageUrl(item.image_url) ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-auto object-contain" />
                            ) : (
                              item.image_url || "📦"
                            )}
                          </div>
                          <div className="p-4">
                            <div className="text-xs text-muted-foreground mb-1">{item.category}</div>
                            <h3 className="font-display font-semibold text-foreground text-sm mb-2 line-clamp-1">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-display font-bold text-primary">
                                {fp(recPrice)}
                              </span>
                              {isMember && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {fp(item.retail_price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

const ProductShareSection = ({ productName, productId, user }: { productName: string; productId: string; user: any }) => {
  const { data: profile } = useQuery({
    queryKey: ["share-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const baseUrl = `${window.location.origin}/product/${productId}`;
  const shareLink = user && profile?.referral_code
    ? `${baseUrl}?ref=${profile.referral_code}`
    : baseUrl;

  return (
    <div className="flex justify-end mb-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <p className="text-sm font-medium text-foreground mb-3">Share "{productName}"</p>
          <SocialShareButtons
            referralLink={shareLink}
            referralCode={user && profile?.referral_code ? profile.referral_code : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProductDetail;
