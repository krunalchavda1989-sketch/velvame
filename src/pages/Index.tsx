import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShoppingBag,
  Star,
  Users,
  TrendingUp,
  Shield,
  ChevronRight,
  Sparkles,
  Gift,
  Zap,
  Heart,
  Award,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import BannerSlider from "@/components/landing/BannerSlider";

import MonthlyOffersSection from "@/components/landing/MonthlyOffersSection";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { getProductUrl } from "@/lib/productUrl";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";

interface Category {
  id: string;
  name: string;
  image_url: string;
}
interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar_url: string;
}
interface HeroStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  sort_order: number;
}

const iconMap: Record<string, { Icon: LucideIcon; gradient: string; color: string }> = {
  users: { Icon: Users, gradient: "from-blue-500/10 to-purple-500/10", color: "text-blue-500" },
  "trending-up": { Icon: TrendingUp, gradient: "from-green-500/10 to-emerald-500/10", color: "text-green-500" },
  award: { Icon: Award, gradient: "from-amber-500/10 to-orange-500/10", color: "text-amber-500" },
  zap: { Icon: Zap, gradient: "from-purple-500/10 to-pink-500/10", color: "text-purple-500" },
  shield: { Icon: Shield, gradient: "from-sky-500/10 to-blue-500/10", color: "text-sky-500" },
  "shopping-bag": { Icon: ShoppingBag, gradient: "from-rose-500/10 to-pink-500/10", color: "text-rose-500" },
  heart: { Icon: Heart, gradient: "from-red-500/10 to-rose-500/10", color: "text-red-500" },
  gift: { Icon: Gift, gradient: "from-teal-500/10 to-cyan-500/10", color: "text-teal-500" },
  star: { Icon: Star, gradient: "from-yellow-500/10 to-amber-500/10", color: "text-yellow-500" },
  globe: { Icon: Globe, gradient: "from-indigo-500/10 to-violet-500/10", color: "text-indigo-500" },
};

const Index = () => {
  const { products, addToCart } = useCart();
  const { currencySymbol } = useLocalization();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroStats, setHeroStats] = useState<HeroStat[]>([]);
  const [heroSectionEnabled, setHeroSectionEnabled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: reviews }, { data: stats }, { data: bannerSettings }] = await Promise.all([
        supabase
          .from("product_categories")
          .select("id, name, image_url")
          .eq("is_active", true)
          .order("sort_order")
          .limit(6),
        supabase
          .from("testimonials")
          .select("id, name, text, rating, avatar_url")
          .eq("is_active", true)
          .order("sort_order")
          .limit(6),
        supabase
          .from("hero_stats")
          .select("id, label, value, icon, sort_order")
          .eq("is_active", true)
          .order("sort_order")
          .limit(4),
        supabase.from("banner_settings").select("hero_section_enabled").limit(1).single(),
      ]);
      setCategories((cats as unknown as Category[]) || []);
      setTestimonials((reviews as unknown as Testimonial[]) || []);
      setHeroStats((stats as unknown as HeroStat[]) || []);
      setHeroSectionEnabled((bannerSettings as any)?.hero_section_enabled ?? true);
    };
    fetchData();
  }, []);

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16" style={{ paddingTop: "20px !important" }}>
        <BannerSlider />
      </div>

      {/* ===== HERO ===== */}
      {heroSectionEnabled && heroStats.length > 0 && (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
          {/* Decorative orbs */}
          <div className="absolute top-20 right-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-[5%] w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

          <div className="container relative z-10 px-4 pt-24 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                    Premium Quality Products
                  </span>
                </motion.div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-6">
                  Shop Smart,
                  <br />
                  <span className="text-gradient-gold">Earn Rewards</span>
                  <br />
                  Every Day
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                  Discover premium health & wellness products at exclusive prices. Share with friends and earn generous
                  rewards on every purchase.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link to="/shop">
                    <Button
                      size="lg"
                      className="bg-gradient-gold text-primary-foreground font-semibold text-base px-8 glow-gold hover:opacity-90 h-12"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" /> Explore Products
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-border text-foreground hover:bg-secondary font-semibold h-12"
                    >
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
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  {heroStats.map((stat, i) => {
                    const mapped = iconMap[stat.icon] || iconMap["users"];
                    const StatIcon = mapped.Icon;
                    return (
                      <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className={`p-6 rounded-2xl bg-gradient-to-br ${mapped.gradient} border border-border/50 backdrop-blur-sm hover:border-primary/20 transition-all text-center group hover:shadow-lg`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <StatIcon className={`h-5 w-5 ${mapped.color}`} />
                        </div>
                        <span className="text-2xl font-display font-bold text-foreground block">{stat.value}</span>
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-full rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-auto object-cover" />
                      ) : (
                        <div className="w-full aspect-[4/3] bg-primary/5 flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <span className="mt-3 text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors text-center">
                      {cat.name}
                    </span>
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
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <Link to={getProductUrl(product)}>
                    <div className="bg-secondary flex items-center justify-center overflow-hidden">
                      {product.image_url?.startsWith("http") ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl">{product.image_url || "📦"}</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                    <Link to={getProductUrl(product)}>
                      <h3 className="font-display font-semibold text-foreground text-sm truncate hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 my-1.5">
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      <span className="text-xs text-muted-foreground">{product.rating}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {user ? (
                          <>
                            <span className="text-base font-display font-bold text-primary">
                              {formatPrice(product.distributor_price, currencySymbol)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through ml-1.5">
                              {formatPrice(product.retail_price, currencySymbol)}
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-display font-bold text-primary">
                            {formatPrice(product.retail_price, currencySymbol)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          addToCart(product.id);
                          toast.success(`Added ${product.name}`);
                        }}
                      >
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        Add to Cart
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              How It <span className="text-gradient-gold">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Three simple steps to start earning rewards</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Sign up for free and unlock access to exclusive distributor pricing on all our premium products.",
                icon: Users,
                color: "from-blue-500/10 to-indigo-500/10",
              },
              {
                step: "02",
                title: "Shop & Share",
                desc: "Buy quality products for yourself and share your unique referral link with friends and family.",
                icon: ShoppingBag,
                color: "from-amber-500/10 to-orange-500/10",
              },
              {
                step: "03",
                title: "Earn Rewards",
                desc: "Earn generous rewards on every purchase from your network. The more you share, the more you earn!",
                icon: Gift,
                color: "from-green-500/10 to-emerald-500/10",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
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
      {testimonials.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">
                Loved by <span className="text-gradient-gold">Thousands</span>
              </h2>
              <p className="text-muted-foreground">See what our community has to say</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
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
                  <div className="flex items-center gap-2">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {t.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Newsletter / Contact ===== */}
      <section className="py-16">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="p-8 sm:p-12 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">Stay in the Loop</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Get the latest product updates, exclusive offers, and wellness tips delivered to your inbox.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
                  if (!email) return;
                  const { error } = await supabase.from("newsletter_subscribers").insert({ email } as any);
                  if (error) {
                    if (error.code === "23505") {
                      toast.info("You're already subscribed!");
                    } else {
                      toast.error("Something went wrong. Please try again.");
                    }
                  } else {
                    toast.success("Thanks for subscribing!");
                  }
                  form.reset();
                }}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email"
                  className="flex-1 h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <Button
                  type="submit"
                  className="bg-gradient-gold text-primary-foreground font-semibold h-11 px-6 glow-gold hover:opacity-90"
                >
                  Subscribe <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-4">No spam, unsubscribe anytime.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
