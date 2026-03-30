import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandSettings {
  brand_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  footer_logo_url: string;
  og_image_url: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  website: string;
  brand_color: string;
  button_color: string;
  font_heading: string;
  font_body: string;
  stat_color_1: string;
  stat_color_2: string;
  stat_color_3: string;
  stat_color_4: string;
}

const defaultBrand: BrandSettings = {
  brand_name: "Velvame",
  tagline: "Build your network, grow your income.",
  logo_url: "",
  favicon_url: "",
  footer_logo_url: "",
  og_image_url: "",
  email: "",
  phone: "",
  address: "",
  gst_number: "",
  website: "",
  brand_color: "#1a1a2e",
  button_color: "#1a1a2e",
  font_heading: "Space Grotesk",
  font_body: "Inter",
  stat_color_1: "#4f46e5",
  stat_color_2: "#10b981",
  stat_color_3: "#f59e0b",
  stat_color_4: "#ec4899",
};

const BrandContext = createContext<BrandSettings>(defaultBrand);

export const useBrand = () => useContext(BrandContext);

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBrandTheme(brand: BrandSettings) {
  const root = document.documentElement;

  // Apply brand color as primary
  if (brand.brand_color && brand.brand_color.startsWith("#") && brand.brand_color.length === 7) {
    const hsl = hexToHsl(brand.brand_color);
    root.style.setProperty("--primary", hsl);
    // Derive a lighter foreground for contrast
    const r = parseInt(brand.brand_color.slice(1, 3), 16);
    const g = parseInt(brand.brand_color.slice(3, 5), 16);
    const b = parseInt(brand.brand_color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    root.style.setProperty("--primary-foreground", brightness > 128 ? "0 0% 10%" : "0 0% 98%");
  }

  // Apply button color as a CSS variable for buttons
  if (brand.button_color && brand.button_color.startsWith("#") && brand.button_color.length === 7) {
    root.style.setProperty("--button-bg", brand.button_color);
    const hsl = hexToHsl(brand.button_color);
    root.style.setProperty("--button-hsl", hsl);
  }

  // Apply fonts
  if (brand.font_heading) {
    root.style.setProperty("--font-display", `'${brand.font_heading}', sans-serif`);
  }
  if (brand.font_body) {
    root.style.setProperty("--font-body", `'${brand.font_body}', sans-serif`);
    root.style.fontFamily = `'${brand.font_body}', sans-serif`;
  }

  // Set document title
  document.title = brand.brand_name || defaultBrand.brand_name;

  // Set favicon
  if (brand.favicon_url) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = brand.favicon_url;
  }

  // Set OG image meta tag
  if (brand.og_image_url) {
    let ogMeta = document.querySelector("meta[property='og:image']") as HTMLMetaElement;
    if (!ogMeta) {
      ogMeta = document.createElement("meta");
      ogMeta.setAttribute("property", "og:image");
      document.head.appendChild(ogMeta);
    }
    ogMeta.content = brand.og_image_url;

    let twMeta = document.querySelector("meta[name='twitter:image']") as HTMLMetaElement;
    if (!twMeta) {
      twMeta = document.createElement("meta");
      twMeta.setAttribute("name", "twitter:image");
      document.head.appendChild(twMeta);
    }
    twMeta.content = brand.og_image_url;
  }
}

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);

  useEffect(() => {
    supabase
      .from("brand_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          const b: BrandSettings = {
            brand_name: d.brand_name || defaultBrand.brand_name,
            tagline: d.tagline || defaultBrand.tagline,
            logo_url: d.logo_url || "",
            favicon_url: d.favicon_url || "",
            footer_logo_url: d.footer_logo_url || "",
            og_image_url: d.og_image_url || "",
            email: d.email || "",
            phone: d.phone || "",
            address: d.address || "",
            gst_number: d.gst_number || "",
            website: d.website || "",
            brand_color: d.brand_color || defaultBrand.brand_color,
            button_color: d.button_color || defaultBrand.button_color,
            font_heading: d.font_heading || defaultBrand.font_heading,
            font_body: d.font_body || defaultBrand.font_body,
          };
          setBrand(b);
          applyBrandTheme(b);
        }
      });
  }, []);

  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
};
