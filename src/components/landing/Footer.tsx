import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, string> = {
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  youtube: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  telegram: "M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  pinterest: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z",
  tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  snapchat: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.195-.045.42.044.6.046.074.09.149.135.223.166.27.42.66.614 1.064.33.63.494 1.215.494 1.74 0 .6-.18 1.11-.54 1.53-.36.42-.869.63-1.529.63-.33 0-.675-.06-1.02-.165a5.472 5.472 0 01-.72-.27c-.18-.075-.36-.15-.54-.195a2.074 2.074 0 00-.54-.075c-.374 0-.75.135-1.08.42-.33.27-.614.645-.854 1.096-.434.793-1.08 1.176-1.92 1.176-.84 0-1.485-.39-1.92-1.176a3.655 3.655 0 00-.855-1.096c-.33-.285-.705-.42-1.08-.42-.18 0-.36.03-.54.075-.18.06-.36.12-.539.195-.24.09-.48.18-.72.27-.345.105-.69.165-1.02.165-.66 0-1.17-.21-1.53-.63-.359-.42-.539-.93-.539-1.53 0-.525.164-1.11.494-1.74.194-.404.448-.794.614-1.064.045-.074.09-.149.135-.223.09-.18.134-.405.044-.6-.194-.45-.884-.675-1.333-.81a3.497 3.497 0 01-.345-.12c-.823-.328-1.227-.719-1.212-1.168 0-.36.284-.689.734-.838.15-.06.328-.09.51-.09.119 0 .299.015.464.104.374.18.733.285 1.034.3.198 0 .326-.044.4-.089-.007-.165-.017-.33-.03-.51l-.002-.06c-.105-1.628-.23-3.654.299-4.847C7.86 1.07 11.216.793 12.206.793z",
};

const SocialIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const path = ICON_MAP[icon];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className || "h-5 w-5"}>
      <path d={path} />
    </svg>
  );
};

interface FooterSettingsData {
  bg_color: string;
  text_color: string;
  link_color: string;
  link_hover_color: string;
  heading_color: string;
  border_color: string;
  show_visit_counter: boolean;
  visit_counter_label: string;
  visit_counter_format: string;
  visit_counter_base: number;
  visit_counter_total: number;
  copyright_text: string;
}

interface FooterSectionData {
  id: string;
  heading: string;
  heading_color: string;
  heading_font_size: string;
  width_percentage: number;
  display_order: number;
}

interface FooterMenuItemData {
  id: string;
  section_id: string;
  label: string;
  url: string;
  open_in_new_tab: boolean;
  display_order: number;
  is_active: boolean;
}

const formatCount = (num: number, format: string) => {
  if (format === "formatted") return num.toLocaleString("en-IN");
  return String(num);
};

const Footer = () => {
  const brand = useBrand();
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string; icon: string }[]>([]);
  const [footerSettings, setFooterSettings] = useState<FooterSettingsData | null>(null);
  const [sections, setSections] = useState<FooterSectionData[]>([]);
  const [menuItems, setMenuItems] = useState<FooterMenuItemData[]>([]);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("social_media_links").select("platform, url, icon").eq("is_active", true).order("sort_order"),
      supabase.from("footer_settings").select("*").limit(1).single(),
      supabase.from("footer_sections").select("*").eq("is_active", true).order("display_order"),
      supabase.from("footer_menu_items").select("*").eq("is_active", true).order("display_order"),
    ]).then(([socialRes, settingsRes, sectionsRes, itemsRes]) => {
      if (socialRes.data) setSocialLinks(socialRes.data.filter((l: any) => l.url && l.url.trim() !== "") as any);
      if (settingsRes.data) setFooterSettings(settingsRes.data as any);
      if (sectionsRes.data) setSections(sectionsRes.data as any);
      if (itemsRes.data) setMenuItems(itemsRes.data as any);
    });

    // Track visit (session-based)
    if (!sessionStorage.getItem("_visit_tracked")) {
      sessionStorage.setItem("_visit_tracked", "1");
      supabase.functions.invoke("track-visit").catch(() => {});
    }
  }, []);

  const getSectionItems = (sectionId: string) =>
    menuItems.filter(i => i.section_id === sectionId).sort((a, b) => a.display_order - b.display_order);

  // If dynamic footer is configured, use it
  if (footerSettings && sections.length > 0) {
    const fs = footerSettings;
    const totalVisits = fs.visit_counter_base + fs.visit_counter_total;

    return (
      <footer style={{ backgroundColor: fs.bg_color, color: fs.text_color, borderTop: `1px solid ${fs.border_color}` }} className="py-12">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-none gap-8" style={{ display: "grid", gridTemplateColumns: `repeat(1, 1fr)` }}>
            {/* Desktop: dynamic grid; Mobile: stacked */}
            <div className="hidden md:flex gap-4" style={{ width: "100%" }}>
              {sections.map(section => {
                const items = getSectionItems(section.id);
                return (
                  <div key={section.id} style={{ width: `${section.width_percentage}%` }}>
                    <h4 style={{ color: section.heading_color || fs.heading_color, fontSize: section.heading_font_size }} className="font-semibold mb-4">{section.heading}</h4>
                    <ul className="space-y-2">
                      {items.map(item => (
                        <li key={item.id}>
                          {item.url.startsWith("http") ? (
                            <a
                              href={item.url}
                              target={item.open_in_new_tab ? "_blank" : "_self"}
                              rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                              style={{ color: hoveredLink === item.id ? fs.link_hover_color : fs.link_color }}
                              className="text-sm transition-colors"
                              onMouseEnter={() => setHoveredLink(item.id)}
                              onMouseLeave={() => setHoveredLink(null)}
                            >{item.label}</a>
                          ) : (
                            <Link
                              to={item.url}
                              style={{ color: hoveredLink === item.id ? fs.link_hover_color : fs.link_color }}
                              className="text-sm transition-colors"
                              onMouseEnter={() => setHoveredLink(item.id)}
                              onMouseLeave={() => setHoveredLink(null)}
                            >{item.label}</Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            {/* Mobile: stacked */}
            <div className="md:hidden space-y-8">
              {sections.map(section => {
                const items = getSectionItems(section.id);
                return (
                  <div key={section.id}>
                    <h4 style={{ color: section.heading_color || fs.heading_color, fontSize: section.heading_font_size }} className="font-semibold mb-3">{section.heading}</h4>
                    <ul className="space-y-2">
                      {items.map(item => (
                        <li key={item.id}>
                          {item.url.startsWith("http") ? (
                            <a href={item.url} target={item.open_in_new_tab ? "_blank" : "_self"} rel={item.open_in_new_tab ? "noopener noreferrer" : undefined} style={{ color: fs.link_color }} className="text-sm">{item.label}</a>
                          ) : (
                            <Link to={item.url} style={{ color: fs.link_color }} className="text-sm">{item.label}</Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              {socialLinks.map((link) => (
                <a key={link.icon} href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: fs.link_color }} className="hover:opacity-80 transition-opacity" title={link.platform}>
                  <SocialIcon icon={link.icon} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}

          {/* Visit counter */}
          {fs.show_visit_counter && (
            <div className="mt-6 text-center text-sm" style={{ color: fs.text_color }}>
              🌐 {fs.visit_counter_label} {formatCount(totalVisits, fs.visit_counter_format)}
            </div>
          )}

          {/* Copyright */}
          <div className="mt-8 pt-4 text-center text-sm" style={{ borderTop: `1px solid ${fs.border_color}`, color: fs.text_color, opacity: 0.7 }}>
            {fs.copyright_text || `© ${new Date().getFullYear()} ${brand.brand_name}. All rights reserved.`}
          </div>
        </div>
      </footer>
    );
  }

  // Fallback static footer
  return (
    <footer className="border-t border-border py-12">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {(brand.footer_logo_url || brand.logo_url) ? (
                <img src={brand.footer_logo_url || brand.logo_url} alt={brand.brand_name} className="h-10 w-auto max-w-[160px] object-contain" />
              ) : (
                <>
                  <Crown className="h-6 w-6 text-primary" />
                  <span className="font-display text-lg font-bold text-gradient-gold">{brand.brand_name}</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {brand.tagline || "Build your network, grow your income. The premium MLM platform."}
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              {[{ label: "Shop", href: "/shop" }, { label: "Dashboard", href: "/dashboard" }, { label: "FAQ", href: "/faq" }].map((link) => (
                <li key={link.label}><Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {[{ label: "About", href: "/about" }, { label: "Contact", href: "/contact" }].map((link) => (
                <li key={link.label}><Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Get Started</h4>
            <ul className="space-y-2">
              {[{ label: "Register", href: "/register" }, { label: "Login", href: "/login" }].map((link) => (
                <li key={link.label}><Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {brand.brand_name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
