import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
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
  Truck,
  Eye,
  BadgeCheck,
  MapPin,
  Quote,
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
interface FeaturedSection {
  id: string;
  title: string;
  selection_type: string;
  category_filter: string;
  bg_color: string;
  sort_order: number;
  product_ids: string[];
}

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  "trending-up": TrendingUp,
  award: Award,
  zap: Zap,
  shield: Shield,
  "shopping-bag": ShoppingBag,
  heart: Heart,
  gift: Gift,
  star: Star,
  globe: Globe,
};

const Index = () => {
  const { products, addToCart } = useCart();
  const { currencySymbol } = useLocalization();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroStats, setHeroStats] = useState<HeroStat[]>([]);
  const [heroSectionEnabled, setHeroSectionEnabled] = useState(false);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const [testimonialBgColor, setTestimonialBgColor] = useState('#ffffff');
  const [featuredSections, setFeaturedSections] = useState<FeaturedSection[]>([]);
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  const [newsletterSettings, setNewsletterSettings] = useState<{ bg_color: string; heading: string; subtext: string; button_text: string }>({
    bg_color: '#e8e0f0', heading: 'Stay in the Loop', subtext: 'No spam. Only useful tips, exclusive offers, and friendly reminders delivered to your inbox.', button_text: 'Sign up',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: reviews }, { data: stats }, { data: bannerSettings }, { data: nlSettings }, { data: tBgSetting }, { data: fSections }] = await Promise.all([
        supabase.from("product_categories").select("id, name, image_url").eq("is_active", true).order("sort_order").limit(6),
        supabase.from("testimonials").select("id, name, text, rating, avatar_url").eq("is_active", true).order("sort_order").limit(6),
        supabase.from("hero_stats").select("id, label, value, icon, sort_order").eq("is_active", true).order("sort_order").limit(4),
        supabase.from("banner_settings").select("hero_section_enabled").limit(1).single(),
        supabase.from("newsletter_settings" as any).select("bg_color, heading, subtext, button_text").limit(1).single(),
        supabase.from("site_settings").select("value").eq("key", "testimonial_section_bg_color").single(),
        supabase.from("featured_sections" as any).select("*").eq("is_active", true).order("sort_order"),
      ]);
      setCategories((cats as unknown as Category[]) || []);
      setTestimonials((reviews as unknown as Testimonial[]) || []);
      setHeroStats((stats as unknown as HeroStat[]) || []);
      setHeroSectionEnabled((bannerSettings as any)?.hero_section_enabled ?? true);
      if (nlSettings) setNewsletterSettings(nlSettings as any);
      if (tBgSetting) setTestimonialBgColor((tBgSetting as any).value as string);

      // Fetch featured section products
      const sectionsData = (fSections as any[] || []) as FeaturedSection[];
      if (sectionsData.length > 0) {
        const { data: sectionProducts } = await supabase
          .from("featured_section_products" as any)
          .select("section_id, product_id, sort_order")
          .in("section_id", sectionsData.map((s) => s.id))
          .order("sort_order");
        sectionsData.forEach((s) => {
          s.product_ids = ((sectionProducts as any[]) || [])
            .filter((sp: any) => sp.section_id === s.id)
            .map((sp: any) => sp.product_id);
        });
      }
      setFeaturedSections(sectionsData);
    };
    fetchData();
  }, []);

  // Helper to get products for a section
  const getSectionProducts = (section: FeaturedSection) => {
    if (section.selection_type === "category") {
      return products.filter((p) => p.category === section.category_filter);
    }
    return section.product_ids
      .map((pid) => products.find((p) => p.id === pid))
      .filter(Boolean) as typeof products;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div>
        <BannerSlider />
      </div>

      {/* ===== HERO SECTION ===== */}
      {heroSectionEnabled && heroStats.length > 0 && (
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${heroBg})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-secondary/50" />

          <div className="container relative z-10 px-4 py-20 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left — Content */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-4"
                >
                  Discover Premium Products
                </motion.p>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-bold leading-[1.1] text-foreground mb-6">
                  Shop Smart,{" "}
                  <span className="text-gradient-gold">Earn Rewards</span> Every Day
                </h1>

                <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                  Discover premium health & wellness products at exclusive prices. Share with friends and earn generous rewards on every purchase.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <Link to="/shop">
                    <Button size="lg" className="bg-foreground text-background font-semibold text-sm px-8 h-12 hover:bg-foreground/90 rounded-full">
                      Explore Collection
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="border-border text-foreground font-semibold h-12 rounded-full">
                      Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                {/* Inline stat highlight */}
                {heroStats.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border"
                  >
                    <span className="text-2xl font-display font-bold text-foreground">{heroStats[0].value}</span>
                    <span className="text-sm text-muted-foreground">{heroStats[0].label}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Right — Hero Image placeholder with stat overlay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-gradient-to-br from-secondary to-muted">
                  <img src={heroBg} alt="Premium products" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />

                  {/* Floating info card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-background/90 backdrop-blur-md border border-border"
                  >
                    <p className="text-xs text-muted-foreground mb-2">
                      Premium products crafted with natural ingredients and dermatologically tested formulas.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ===== HERO STATS BAR ===== */}
          <div className="relative z-10 border-y border-border bg-card/50 backdrop-blur-sm">
            <div className="container px-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
                {heroStats.map((stat, i) => {
                  const StatIcon = iconMap[stat.icon] || Users;
                  return (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-3 py-6 px-4 lg:px-6"
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <StatIcon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <span className="text-lg font-display font-bold text-foreground block leading-tight">{stat.value}</span>
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Shop by Category ===== */}
      {categories.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Shop by Category</h2>
              <p className="text-sm text-muted-foreground mt-2">Browse our curated collections</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center group">
                    <div className="w-full aspect-square rounded-[2rem] overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all bg-secondary">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <span className="mt-3 text-sm font-display font-semibold text-foreground group-hover:text-primary transition-colors text-center">
                      {cat.name}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Scrolling Marquee Banner ===== */}
      <div className="border-y border-border bg-card overflow-hidden py-3">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              Get up to 25% OFF <span className="text-primary">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ===== Monthly Offers ===== */}
      <MonthlyOffersSection />

      {/* ===== Why Choose Us ===== */}
      <section className="py-16 lg:py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Why Choose Our Products</h2>
            <p className="text-sm text-muted-foreground mt-2">Quality you can trust, rewards you'll love</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Truck, title: "Fast Delivery", desc: "Quick & reliable shipping straight to your doorstep." },
              { icon: Eye, title: "Transparency", desc: "Honest ingredients and clear product details you can trust." },
              { icon: BadgeCheck, title: "Affordable", desc: "Premium products at prices that suit every budget." },
              { icon: MapPin, title: "Trusted Worldwide", desc: "Trusted by customers across multiple countries." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Dynamic Featured Sections ===== */}
      {featuredSections.map((section) => {
        const sectionProducts = getSectionProducts(section);
        if (sectionProducts.length === 0) return null;
        const perPage = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 5;
        const currentPage = sectionPages[section.id] || 0;
        const totalPages = Math.ceil(sectionProducts.length / perPage);
        const visibleProducts = sectionProducts.slice(currentPage * perPage, currentPage * perPage + perPage);

        return (
          <section key={section.id} className="py-16 lg:py-20" style={{ backgroundColor: section.bg_color }}>
            <div className="container px-4">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{section.title}</h2>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSectionPages((prev) => ({ ...prev, [section.id]: Math.max(0, currentPage - 1) }))}
                      disabled={currentPage === 0}
                      className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSectionPages((prev) => ({ ...prev, [section.id]: Math.min(totalPages - 1, currentPage + 1) }))}
                      disabled={currentPage === totalPages - 1}
                      className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                {visibleProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl bg-card border border-border overflow-hidden group hover:shadow-lg transition-all"
                  >
                    <Link to={getProductUrl(product)}>
                      <div className="bg-secondary aspect-square flex items-center justify-center overflow-hidden">
                        {product.image_url?.startsWith("http") ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <span className="text-4xl">{product.image_url || "📦"}</span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={getProductUrl(product)}>
                        <h3 className="font-display font-semibold text-foreground text-sm truncate hover:text-primary transition-colors">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-1 my-1.5">
                        <Star className="h-3 w-3 text-primary fill-primary" />
                        <span className="text-xs text-muted-foreground">{product.rating}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {user ? (
                            <>
                              <span className="text-base font-display font-bold text-foreground">{formatPrice(product.distributor_price, currencySymbol)}</span>
                              <span className="text-xs text-muted-foreground line-through ml-1.5">{formatPrice(product.retail_price, currencySymbol)}</span>
                            </>
                          ) : (
                            <span className="text-base font-display font-bold text-foreground">{formatPrice(product.retail_price, currencySymbol)}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-medium h-9"
                        onClick={() => {
                          addToCart(product.id);
                          toast.success(`Added ${product.name}`);
                        }}
                      >
                        <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                        Add to Cart
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
              How It <span className="text-gradient-gold">Works</span>
            </h2>
            <p className="text-sm text-muted-foreground">Three simple steps to start earning rewards</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up for free and unlock exclusive distributor pricing on all products.", icon: Users },
              { step: "02", title: "Shop & Share", desc: "Buy quality products and share your unique referral link with friends.", icon: ShoppingBag },
              { step: "03", title: "Earn Rewards", desc: "Earn generous rewards on every purchase from your network.", icon: Gift },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl bg-card border border-border text-center group hover:shadow-lg transition-all"
              >
                <div className="text-5xl font-display font-black text-muted/50 absolute top-3 right-4">{s.step}</div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <s.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials Carousel ===== */}
      {testimonials.length > 0 && (() => {
        const perPage = typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 3;
        const totalPages = Math.ceil(testimonials.length / perPage);
        const visibleTestimonials = testimonials.slice(testimonialPage * perPage, testimonialPage * perPage + perPage);

        return (
          <section className="py-16 lg:py-20" style={{ backgroundColor: testimonialBgColor }}>
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-10"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1">Customer Testimonials</h2>
                  <p className="text-sm text-muted-foreground">See what our community has to say</p>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTestimonialPage((p) => Math.max(0, p - 1))}
                      disabled={testimonialPage === 0}
                      className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setTestimonialPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={testimonialPage === totalPages - 1}
                      className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {visibleTestimonials.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between"
                  >
                    <div>
                      <Quote className="h-8 w-8 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4">
                      <div className="flex items-center gap-2.5">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                            {t.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="text-sm font-medium text-foreground">{t.rating}.0</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ===== Scrolling Marquee Banner (bottom) ===== */}
      <div className="border-y border-border bg-card overflow-hidden py-3">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              Get up to 25% OFF <span className="text-primary">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ===== Newsletter – Full Width ===== */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: newsletterSettings.bg_color }}>
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
                {newsletterSettings.heading}
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">
                {newsletterSettings.subtext}
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
                  if (!email) return;
                  const { error } = await supabase.from("newsletter_subscribers").insert({ email } as any);
                  if (error) {
                    if (error.code === "23505") toast.info("You're already subscribed!");
                    else toast.error("Something went wrong. Please try again.");
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
                  placeholder="Your e-mail address"
                  className="flex-1 h-12 px-5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <Button type="submit" className="h-12 px-8 rounded-lg font-semibold">
                  {newsletterSettings.button_text}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
