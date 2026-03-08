import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, ShoppingBag, Star, Plus, Users, TrendingUp, Shield,
  ChevronRight, Sparkles, Gift, Zap, Heart, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTASection from "@/components/landing/CTASection";
import MonthlyOffersSection from "@/components/landing/MonthlyOffersSection";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";

interface Category { id: string; name: string; image_url: string; }

const Index = () => {
  const { products, addToCart } = useCart();
  const { currencySymbol } = useLocalization();
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

      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
        {/* Decorative orbs */}
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-[5%] w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="container relative z-10 px-4 pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold tracking-wide text-primary uppercase">Premium Quality Products</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-6">
                Shop Smart,
                <br />
                <span className="text-gradient-gold">Earn Rewards</span>
                <br />
                Every Day
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                Discover premium health & wellness products at exclusive prices.
                Share with friends and earn generous rewards on every purchase.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/shop">
                  <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold text-base px-8 glow-gold hover:opacity-90 h-12">
                    <ShoppingBag className="h-4 w-4 mr-2" /> Explore Products
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold h-12">
                    Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gift className="h-4 w-4 text-primary" />
                  <span>Free Rewards</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>100% Genuine</span>
                </div>
              </div>
            </motion.div>

            {/* Right — Stat Cards */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: "50,000+", sub: "Happy Customers", gradient: "from-blue-500/10 to-purple-500/10", iconColor: "text-blue-500" },
                  { icon: TrendingUp, label: `${currencySymbol}12Cr+`, sub: "Rewards Distributed", gradient: "from-green-500/10 to-emerald-500/10", iconColor: "text-green-500" },
                  { icon: Award, label: "500+", sub: "Premium Products", gradient: "from-amber-500/10 to-orange-500/10", iconColor: "text-amber-500" },
                  { icon: Zap, label: "24/7", sub: "Customer Support", gradient: "from-purple-500/10 to-pink-500/10", iconColor: "text-purple-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`p-6 rounded-2xl bg-gradient-to-br ${stat.gradient} border border-border/50 backdrop-blur-sm hover:border-primary/20 transition-all text-center group hover:shadow-lg`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
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

      {/* ===== Monthly Offers ===== */}
      <MonthlyOffersSection />

      {/* ===== Featured Products ===== */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Featured Products</h2>
                <p className="text-sm text-muted-foreground mt-1">Top selling products at the best prices</p>
              </div>
              <Link to="/shop" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                See All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <Link to={`/product/${product.id}`}>
                    <div className="h-40 bg-secondary flex items-center justify-center overflow-hidden">
                      {product.image_url?.startsWith("http") ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-4xl">{product.image_url || "📦"}</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-display font-semibold text-foreground text-sm truncate hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1 my-1.5">
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      <span className="text-xs text-muted-foreground">{product.rating}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-base font-display font-bold text-primary">
                          {formatPrice(product.distributor_price, currencySymbol)}
                        </span>
                        <span className="text-xs text-muted-foreground line-through ml-1.5">
                          {formatPrice(product.retail_price, currencySymbol)}
                        </span>
                      </div>
                      <Button size="icon" variant="outline" className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-colors"
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
            <p className="text-muted-foreground max-w-lg mx-auto">Three simple steps to start earning rewards</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                step: "01", title: "Create Your Account",
                desc: "Sign up for free and unlock access to exclusive distributor pricing on all our premium products.",
                icon: Users, color: "from-blue-500/10 to-indigo-500/10",
              },
              {
                step: "02", title: "Shop & Share",
                desc: "Buy quality products for yourself and share your unique referral link with friends and family.",
                icon: ShoppingBag, color: "from-amber-500/10 to-orange-500/10",
              },
              {
                step: "03", title: "Earn Rewards",
                desc: "Earn generous rewards on every purchase from your network. The more you share, the more you earn!",
                icon: Gift, color: "from-green-500/10 to-emerald-500/10",
              },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className={`relative p-8 rounded-2xl bg-gradient-to-br ${s.color} border border-border text-center group hover:border-primary/30 hover:shadow-lg transition-all`}
              >
                <div className="text-6xl font-display font-black text-primary/5 absolute top-4 right-4">{s.step}</div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-3">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials / Social Proof ===== */}
      <section className="py-16 bg-secondary/30">
        <div className="container px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              Loved by <span className="text-gradient-gold">Thousands</span>
            </h2>
            <p className="text-muted-foreground">See what our community has to say</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Priya S.", text: "The product quality is outstanding! I've been using their wellness range for 6 months and the results speak for themselves.", rating: 5 },
              { name: "Rahul M.", text: "Not only great products, but the rewards program is incredible. I've earned back more than I've spent!", rating: 5 },
              { name: "Anjali K.", text: "Best customer support and fastest delivery. The whole experience from ordering to receiving is seamless.", rating: 5 },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <CTASection />

      <Footer />
    </div>
  );
};

export default Index;
