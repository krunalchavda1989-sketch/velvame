import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Star, Plus, Users, TrendingUp, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MLMStructure from "@/components/landing/MLMStructure";
import CTASection from "@/components/landing/CTASection";
import OffersCarousel from "@/components/shop/OffersCarousel";
import MonthlyOffersSection from "@/components/landing/MonthlyOffersSection";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";

interface Category { id: string; name: string; image_url: string; }

const Index = () => {
  const { products, addToCart } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from("product_categories").select("id, name, image_url").eq("is_active", true).order("sort_order").limit(6);
      setCategories((data as unknown as Category[]) || []);
    };
    fetchCats();
  }, []);

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ===== HERO: Split — Products left, MLM right ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="container relative z-10 px-4 pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Ecommerce */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 mb-6">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Premium Products at Distributor Prices</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                Shop, Share & <span className="text-gradient-gold">Earn</span> with Every Purchase
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mb-8">
                Quality health & wellness products at unbeatable distributor prices.
                Build your network and earn commissions across 9 levels.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/shop">
                  <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold text-base px-8 glow-gold hover:opacity-90">
                    <ShoppingBag className="h-4 w-4 mr-2" /> Shop Now
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold">
                    Join as Distributor <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right — Stats */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: "50,000+", sub: "Active Members", accent: "bg-primary/10 text-primary" },
                  { icon: TrendingUp, label: "₹12Cr+", sub: "Commissions Paid", accent: "bg-primary/10 text-primary" },
                  { icon: Shield, label: "100%", sub: "Secure Payments", accent: "bg-primary/10 text-primary" },
                  { icon: ShoppingBag, label: "500+", sub: "Quality Products", accent: "bg-primary/10 text-primary" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-center"
                  >
                    <div className={`w-10 h-10 rounded-lg ${stat.accent} flex items-center justify-center mx-auto mb-3`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-display font-bold text-foreground block">{stat.label}</span>
                    <span className="text-xs text-muted-foreground">{stat.sub}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Offers Banner ===== */}
      <section className="py-8">
        <div className="container px-4">
          <OffersCarousel />
        </div>
      </section>

      {/* ===== Shop by Category ===== */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Shop by Category</h2>
                <p className="text-sm text-muted-foreground mt-1">Browse our curated collections</p>
              </div>
              <Link to="/shop" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className="flex flex-col items-center p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-10 h-10 object-contain rounded" />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground text-center">{cat.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Featured Products ===== */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Featured Products</h2>
                <p className="text-sm text-muted-foreground mt-1">Top selling products at distributor prices</p>
              </div>
              <Link to="/shop" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                See All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 transition-colors"
                >
                  <Link to={`/product/${product.id}`}>
                    <div className="h-36 bg-secondary flex items-center justify-center">
                      {product.image_url?.startsWith("http") ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-4xl">{product.image_url || "📦"}</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-display font-semibold text-foreground text-sm truncate hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1 my-1">
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      <span className="text-xs text-muted-foreground">{product.rating}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-base font-display font-bold text-primary">₹{product.distributor_price}</span>
                        <span className="text-xs text-muted-foreground line-through ml-1.5">₹{product.retail_price}</span>
                      </div>
                      <Button size="icon" variant="outline" className="h-8 w-8"
                        onClick={() => { addToCart(product.id); toast.success(`Added ${product.name}`); }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== How It Works ===== */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              How It <span className="text-gradient-gold">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Three simple steps to start earning</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Join & Subscribe", desc: "Pay one-time ₹2,800 for lifetime membership and get access to distributor pricing on all products." },
              { step: "02", title: "Shop & Share", desc: "Buy quality products for yourself and share your unique referral link with friends and family." },
              { step: "03", title: "Earn Commissions", desc: "Earn up to 5% on direct referral purchases and commissions across 9 levels of your network." },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl bg-card border border-border text-center group hover:border-primary/30 transition-all"
              >
                <div className="text-5xl font-display font-black text-primary/10 absolute top-4 right-4">{s.step}</div>
                <div className="relative z-10">
                  <h3 className="font-display font-bold text-foreground text-lg mb-3">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MLM Income Structure ===== */}
      <MLMStructure />

      {/* ===== CTA ===== */}
      <CTASection />

      <Footer />
    </div>
  );
};

export default Index;
