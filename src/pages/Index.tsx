import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, ShoppingBag, Star, Users, TrendingUp, Shield,
  Gift, Zap, Heart, Award, Globe, Truck, Eye, BadgeCheck,
  MapPin, Quote, Package, Smartphone, Lock, Clock, ThumbsUp, Sparkles, Leaf, Gem,
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

interface Category { id: string; name: string; image_url: string; }
interface Testimonial { id: string; name: string; text: string; rating: number; avatar_url: string; }
interface HeroStat { id: string; label: string; value: string; icon: string; sort_order: number; }
interface FeaturedSection { id: string; title: string; selection_type: string; category_filter: string; bg_color: string; sort_order: number; product_ids: string[]; }
interface SectionOrder { section_key: string; sort_order: number; is_visible: boolean; }

const iconMap: Record<string, LucideIcon> = {
  users: Users, "trending-up": TrendingUp, award: Award, zap: Zap, shield: Shield,
  "shopping-bag": ShoppingBag, heart: Heart, gift: Gift, star: Star, globe: Globe,
  truck: Truck, eye: Eye, "badge-check": BadgeCheck, "map-pin": MapPin, package: Package,
  smartphone: Smartphone, lock: Lock, clock: Clock, "thumbs-up": ThumbsUp,
  sparkles: Sparkles, leaf: Leaf, gem: Gem,
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
  const [categoryPage, setCategoryPage] = useState(0);
  const [catSettings, setCatSettings] = useState<any>({
    title: 'Shop by Category', subtitle: 'Browse our curated collections', bg_color: '#ffffff', bg_image_url: '', display_count: 6, image_style: 'rounded', hover_effect: 'zoom', is_active: true, cat_name_font: 'inherit', cat_name_size: 14, cat_name_color: '#000000', title_alignment: 'left',
  });
  const [newsletterSettings, setNewsletterSettings] = useState<any>({
    bg_color: '#e8e0f0', heading: 'Stay in the Loop', subtext: 'No spam. Only useful tips, exclusive offers, and friendly reminders delivered to your inbox.', button_text: 'Sign up',
  });
  const [whySettings, setWhySettings] = useState<any>(null);
  const [whyItems, setWhyItems] = useState<any[]>([]);
  const [hiwSettings, setHiwSettings] = useState<any>(null);
  const [hiwItems, setHiwItems] = useState<any[]>([]);
  const [sectionOrder, setSectionOrder] = useState<SectionOrder[]>([]);
  const [marqueeData, setMarqueeData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: reviews }, { data: stats }, { data: bannerSettings }, { data: nlSettings }, { data: tBgSetting }, { data: fSections }, { data: catSectionSettings }, { data: wcSettings }, { data: wcItems }, { data: hiwS }, { data: hiwI }, { data: orderData }, { data: marqueeSections }, { data: marqueeItems }] = await Promise.all([
        supabase.from("product_categories").select("id, name, image_url").eq("is_active", true).order("sort_order").limit(20),
        supabase.from("testimonials").select("id, name, text, rating, avatar_url").eq("is_active", true).order("sort_order").limit(6),
        supabase.from("hero_stats").select("id, label, value, icon, sort_order").eq("is_active", true).order("sort_order").limit(4),
        supabase.from("banner_settings").select("hero_section_enabled").limit(1).single(),
        supabase.from("newsletter_settings" as any).select("bg_color, heading, subtext, button_text").limit(1).single(),
        supabase.from("site_settings").select("value").eq("key", "testimonial_section_bg_color").single(),
        supabase.from("featured_sections" as any).select("*").eq("is_active", true).order("sort_order"),
        supabase.from("category_section_settings" as any).select("*").limit(1).single(),
        supabase.from("why_choose_settings" as any).select("*").limit(1).single(),
        supabase.from("why_choose_items" as any).select("*").eq("is_active", true).order("sort_order"),
        supabase.from("how_it_works_settings" as any).select("*").limit(1).single(),
        supabase.from("how_it_works_items" as any).select("*").eq("is_active", true).order("sort_order"),
        supabase.from("landing_section_order" as any).select("section_key, sort_order, is_visible").order("sort_order"),
        supabase.from("marquee_sections" as any).select("*").eq("is_active", true).order("sort_order"),
        supabase.from("marquee_items" as any).select("*").eq("is_active", true).order("sort_order"),
      ]);
      setCategories((cats as unknown as Category[]) || []);
      setTestimonials((reviews as unknown as Testimonial[]) || []);
      setHeroStats((stats as unknown as HeroStat[]) || []);
      setHeroSectionEnabled((bannerSettings as any)?.hero_section_enabled ?? true);
      if (nlSettings) setNewsletterSettings(nlSettings as any);
      if (tBgSetting) setTestimonialBgColor((tBgSetting as any).value as string);
      if (catSectionSettings) setCatSettings(catSectionSettings as any);
      if (wcSettings) setWhySettings(wcSettings as any);
      if (wcItems) setWhyItems(wcItems as any);
      if (hiwS) setHiwSettings(hiwS as any);
      if (hiwI) setHiwItems(hiwI as any);
      if (orderData) setSectionOrder(orderData as any);
      // Build marquee data with items attached
      const mSections = ((marqueeSections as any[]) || []).map((ms: any) => ({
        ...ms,
        items: ((marqueeItems as any[]) || []).filter((mi: any) => mi.marquee_id === ms.id),
      }));
      setMarqueeData(mSections);

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

  const getSectionProducts = (section: FeaturedSection) => {
    if (section.selection_type === "category") {
      return products.filter((p) => p.category === section.category_filter);
    }
    return section.product_ids.map((pid) => products.find((p) => p.id === pid)).filter(Boolean) as typeof products;
  };

  // Build ordered section renderers
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    banner: () => <div key="banner"><BannerSlider /></div>,

    hero_stats: () => {
      if (!heroSectionEnabled || heroStats.length === 0) return null;
      return (
        <section key="hero_stats" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${heroBg})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-secondary/50" />
          <div className="container relative z-10 px-4 py-20 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-4">Discover Premium Products</motion.p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-bold leading-[1.1] text-foreground mb-6">
                  Shop Smart, <span className="text-gradient-gold">Earn Rewards</span> Every Day
                </h1>
                <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">Discover premium health & wellness products at exclusive prices. Share with friends and earn generous rewards on every purchase.</p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <Link to="/shop"><Button size="lg" className="bg-foreground text-background font-semibold text-sm px-8 h-12 hover:bg-foreground/90 rounded-full">Explore Collection</Button></Link>
                  <Link to="/register"><Button size="lg" variant="outline" className="border-border text-foreground font-semibold h-12 rounded-full">Get Started Free <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
                </div>
                {heroStats.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border">
                    <span className="text-2xl font-display font-bold text-foreground">{heroStats[0].value}</span>
                    <span className="text-sm text-muted-foreground">{heroStats[0].label}</span>
                  </motion.div>
                )}
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-gradient-to-br from-secondary to-muted">
                  <img src={heroBg} alt="Premium products" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-background/90 backdrop-blur-md border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Premium products crafted with natural ingredients and dermatologically tested formulas.</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
          <div className="relative z-10 border-y border-border bg-card/50 backdrop-blur-sm">
            <div className="container px-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
                {heroStats.map((stat, i) => {
                  const StatIcon = iconMap[stat.icon] || Users;
                  return (
                    <motion.div key={stat.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-center gap-3 py-6 px-4 lg:px-6">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><StatIcon className="h-4 w-4 text-foreground" /></div>
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
      );
    },

    category: () => {
      if (!catSettings.is_active || categories.length === 0) return null;
      const displayCats = categories.slice(0, catSettings.display_count);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
      const perPage = isMobile ? 2 : isTablet ? 3 : displayCats.length >= 5 ? 5 : displayCats.length >= 4 ? 4 : displayCats.length;
      const totalPages = Math.ceil(displayCats.length / perPage);
      const visibleCats = displayCats.slice(categoryPage * perPage, categoryPage * perPage + perPage);
      const imageShapeClass = catSettings.image_style === "full-round" ? "rounded-full aspect-square" : catSettings.image_style === "square" ? "rounded-none aspect-square" : catSettings.image_style === "adaptive" ? "rounded-2xl aspect-[3/4]" : "rounded-[2rem] aspect-square";
      const hoverImageClass = catSettings.hover_effect === "zoom" ? "group-hover:scale-105" : "";
      const hoverCardClass = catSettings.hover_effect === "lift" ? "hover:-translate-y-2" : catSettings.hover_effect === "glow" ? "hover:ring-4 hover:ring-primary/30" : catSettings.hover_effect === "grayscale" ? "grayscale hover:grayscale-0" : "";

      return (
        <section key="category" className="py-16 lg:py-20" style={{ backgroundColor: catSettings.bg_color, backgroundImage: catSettings.bg_image_url ? `url(${catSettings.bg_image_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="container px-4">
            <div className="flex items-center justify-between mb-10">
              <div style={{ textAlign: catSettings.title_alignment as any }} className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{catSettings.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{catSettings.subtitle}</p>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCategoryPage(Math.max(0, categoryPage - 1))} disabled={categoryPage === 0} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                  <button onClick={() => setCategoryPage(Math.min(totalPages - 1, categoryPage + 1))} disabled={categoryPage === totalPages - 1} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                </div>
              )}
            </div>
            <div className={`grid gap-5 ${perPage === 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : perPage === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : perPage === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
              {visibleCats.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} className={`flex flex-col items-center group ${hoverCardClass} transition-all duration-300`}>
                    <div className={`w-full ${imageShapeClass} overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all bg-secondary`}>
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className={`w-full h-full object-cover ${hoverImageClass} transition-transform duration-500`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-12 w-12 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <span className="mt-3 font-semibold group-hover:text-primary transition-colors text-center" style={{ fontFamily: catSettings.cat_name_font, fontSize: `${catSettings.cat_name_size}px`, color: catSettings.cat_name_color }}>{cat.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      );
    },

    marquee_top: () => {
      const topMarquees = marqueeData.length > 0 ? [marqueeData[0]] : [];
      if (topMarquees.length === 0) return null;
      return (
        <div key="marquee_top">
          {topMarquees.map((m: any) => (
            <div key={m.id} className="overflow-hidden border-y border-border" style={{ backgroundColor: m.bg_color, height: `${m.height}px` }}>
              <motion.div
                animate={{ x: m.direction === "right" ? [-1200, 0] : [0, -1200] }}
                transition={{ duration: Math.max(5, 40 - m.speed), repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-10 whitespace-nowrap h-full"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const item = m.items[i % Math.max(1, m.items.length)];
                  return (
                    <span key={i} style={{ color: m.text_color, fontFamily: m.font_family, fontSize: `${m.font_size}px`, fontWeight: m.font_weight === "bold" ? 700 : m.font_weight === "semibold" ? 600 : m.font_weight === "medium" ? 500 : 400 }}>
                      {item?.text || ""}
                    </span>
                  );
                })}
              </motion.div>
            </div>
          ))}
        </div>
      );
    },

    monthly_offers: () => <MonthlyOffersSection key="monthly_offers" />,

    why_choose: () => {
      if (!whySettings?.is_active || whyItems.length === 0) return null;
      return (
        <section key="why_choose" className="py-16 lg:py-20" style={{ backgroundColor: whySettings.bg_color, backgroundImage: whySettings.bg_image_url ? `url(${whySettings.bg_image_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold" style={{ color: whySettings.title_color }}>{whySettings.title}</h2>
              <p className="mt-2" style={{ color: whySettings.desc_color, fontSize: `${whySettings.desc_font_size}px` }}>{whySettings.subtitle}</p>
            </div>
            <div className={`grid gap-6 max-w-5xl mx-auto ${whyItems.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {whyItems.map((item: any, i: number) => {
                const ItemIcon = iconMap[item.icon] || Shield;
                const cardStyle = whySettings.display_style === "card" ? "rounded-2xl p-6 shadow-sm" : whySettings.display_style === "outline" ? "rounded-2xl p-6 border border-border" : "";
                const cardBg = whySettings.display_style !== "minimal" ? { backgroundColor: whySettings.card_bg_color } : {};
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`text-center ${cardStyle}`} style={cardBg}>
                    <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-4" style={{ borderColor: `${whySettings.icon_color}30` }}>
                      <ItemIcon style={{ width: whySettings.icon_size, height: whySettings.icon_size, color: whySettings.icon_color }} />
                    </div>
                    <h3 className="font-display font-semibold mb-1" style={{ fontSize: `${whySettings.title_font_size}px`, color: whySettings.title_color }}>{item.title}</h3>
                    <p className="leading-relaxed" style={{ fontSize: `${whySettings.desc_font_size}px`, color: whySettings.desc_color }}>{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      );
    },

    featured_sections: () => {
      if (featuredSections.length === 0) return null;
      return (
        <div key="featured_sections">
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
                        <button onClick={() => setSectionPages((prev) => ({ ...prev, [section.id]: Math.max(0, currentPage - 1) }))} disabled={currentPage === 0} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                        <button onClick={() => setSectionPages((prev) => ({ ...prev, [section.id]: Math.min(totalPages - 1, currentPage + 1) }))} disabled={currentPage === totalPages - 1} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                    {visibleProducts.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      );
    },

    how_it_works: () => {
      if (!hiwSettings?.is_active || hiwItems.length === 0) return null;
      return (
        <section key="how_it_works" className="py-16 lg:py-20" style={{ backgroundColor: hiwSettings.bg_color, backgroundImage: hiwSettings.bg_image_url ? `url(${hiwSettings.bg_image_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="container px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2" style={{ color: hiwSettings.title_color }}>{hiwSettings.title}</h2>
              <p style={{ color: hiwSettings.desc_color, fontSize: `${hiwSettings.desc_font_size}px` }}>{hiwSettings.subtitle}</p>
            </motion.div>
            <div className={`grid gap-6 max-w-4xl mx-auto ${hiwItems.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {hiwItems.map((item: any, i: number) => {
                const IC = iconMap[item.icon] || Shield;
                const cardClass = hiwSettings.display_style === "card" ? "rounded-2xl shadow-sm" : hiwSettings.display_style === "outline" ? "rounded-2xl border border-border" : "";
                const cardBg = hiwSettings.display_style !== "minimal" ? hiwSettings.card_bg_color : "transparent";
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={`relative p-8 text-center group hover:shadow-lg transition-all ${cardClass}`} style={{ backgroundColor: cardBg }}>
                    {hiwSettings.show_step_numbers && <div className="text-5xl font-display font-black absolute top-3 right-4" style={{ color: hiwSettings.step_number_color, opacity: 0.5 }}>{String(i + 1).padStart(2, '0')}</div>}
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4"><IC style={{ width: hiwSettings.icon_size, height: hiwSettings.icon_size, color: hiwSettings.icon_color }} /></div>
                      <h3 className="font-display font-bold mb-2" style={{ fontSize: `${hiwSettings.title_font_size}px`, color: hiwSettings.title_color }}>{item.title}</h3>
                      <p className="leading-relaxed" style={{ fontSize: `${hiwSettings.desc_font_size}px`, color: hiwSettings.desc_color }}>{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      );
    },

    testimonials: () => {
      if (testimonials.length === 0) return null;
      const perPage = typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 3;
      const totalPages = Math.ceil(testimonials.length / perPage);
      const visibleTestimonials = testimonials.slice(testimonialPage * perPage, testimonialPage * perPage + perPage);
      return (
        <section key="testimonials" className="py-16 lg:py-20" style={{ backgroundColor: testimonialBgColor }}>
          <div className="container px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1">Customer Testimonials</h2>
                <p className="text-sm text-muted-foreground">See what our community has to say</p>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setTestimonialPage((p) => Math.max(0, p - 1))} disabled={testimonialPage === 0} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                  <button onClick={() => setTestimonialPage((p) => Math.min(totalPages - 1, p + 1))} disabled={testimonialPage === totalPages - 1} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                </div>
              )}
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {visibleTestimonials.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
                  <div>
                    <Quote className="h-8 w-8 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4">
                    <div className="flex items-center gap-2.5">
                      {t.avatar_url ? <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">{t.name[0]?.toUpperCase()}</div>}
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    </div>
                    <div className="flex items-center gap-1"><Star className="h-4 w-4 text-primary fill-primary" /><span className="text-sm font-medium text-foreground">{t.rating}.0</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      );
    },

    marquee_bottom: () => {
      const bottomMarquees = marqueeData.length > 1 ? [marqueeData[1]] : marqueeData.length === 1 ? [marqueeData[0]] : [];
      if (bottomMarquees.length === 0) return null;
      return (
        <div key="marquee_bottom">
          {bottomMarquees.map((m: any) => (
            <div key={m.id} className="overflow-hidden border-y border-border" style={{ backgroundColor: m.bg_color, height: `${m.height}px` }}>
              <motion.div
                animate={{ x: m.direction === "right" ? [-1200, 0] : [0, -1200] }}
                transition={{ duration: Math.max(5, 40 - m.speed), repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-10 whitespace-nowrap h-full"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const item = m.items[i % Math.max(1, m.items.length)];
                  return (
                    <span key={i} style={{ color: m.text_color, fontFamily: m.font_family, fontSize: `${m.font_size}px`, fontWeight: m.font_weight === "bold" ? 700 : m.font_weight === "semibold" ? 600 : m.font_weight === "medium" ? 500 : 400 }}>
                      {item?.text || ""}
                    </span>
                  );
                })}
              </motion.div>
            </div>
          ))}
        </div>
      );
    },

    newsletter: () => (
      <section key="newsletter" className="py-16 lg:py-20" style={{ backgroundColor: newsletterSettings.bg_color }}>
        <div className="container px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">{newsletterSettings.heading}</h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">{newsletterSettings.subtext}</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
                if (!email) return;
                const { error } = await supabase.from("newsletter_subscribers").insert({ email } as any);
                if (error) { if (error.code === "23505") toast.info("You're already subscribed!"); else toast.error("Something went wrong. Please try again."); } else { toast.success("Thanks for subscribing!"); }
                form.reset();
              }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" name="email" required placeholder="Your e-mail address" className="flex-1 h-12 px-5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                <Button type="submit" className="h-12 px-8 rounded-lg font-semibold">{newsletterSettings.button_text}</Button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    ),

    footer: () => <Footer key="footer" />,
  };

  // Default order if no DB data
  const defaultOrder = ['banner', 'hero_stats', 'category', 'marquee_top', 'monthly_offers', 'why_choose', 'featured_sections', 'how_it_works', 'testimonials', 'marquee_bottom', 'newsletter', 'footer'];

  const orderedKeys = sectionOrder.length > 0
    ? sectionOrder.filter((s) => s.is_visible).map((s) => s.section_key)
    : defaultOrder;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {orderedKeys.map((key) => {
        const renderer = sectionRenderers[key];
        return renderer ? renderer() : null;
      })}
    </div>
  );
};

export default Index;
