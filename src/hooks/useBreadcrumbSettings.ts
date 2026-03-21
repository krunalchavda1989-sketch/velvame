import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BreadcrumbSettings {
  id: string;
  background_type: string;
  bg_color: string;
  gradient_type: string;
  gradient_direction: string;
  gradient_stops: { color: string; position: number }[];
  bg_image_url: string;
  bg_position: string;
  bg_size: string;
  bg_repeat: string;
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
  section_height: string;
  custom_height: number;
  padding_top: number;
  padding_bottom: number;
  title_font_size: number;
  title_font_weight: string;
  title_color: string;
  title_transform: string;
  title_letter_spacing: number;
  crumb_font_size: number;
  crumb_font_weight: string;
  crumb_active_color: string;
  crumb_inactive_color: string;
  separator_symbol: string;
  separator_color: string;
  text_alignment: string;
  vertical_position: string;
  visibility_settings: Record<string, boolean>;
}

const defaultSettings: BreadcrumbSettings = {
  id: "",
  background_type: "solid",
  bg_color: "#1a1a2e",
  gradient_type: "linear",
  gradient_direction: "to right",
  gradient_stops: [{ color: "#1a1a2e", position: 0 }, { color: "#ff6600", position: 100 }],
  bg_image_url: "",
  bg_position: "center",
  bg_size: "cover",
  bg_repeat: "no-repeat",
  overlay_enabled: false,
  overlay_color: "#000000",
  overlay_opacity: 40,
  section_height: "medium",
  custom_height: 100,
  title_font_size: 32,
  title_font_weight: "bold",
  title_color: "#ffffff",
  title_transform: "none",
  title_letter_spacing: 0,
  crumb_font_size: 14,
  crumb_font_weight: "normal",
  crumb_active_color: "#ffffff",
  crumb_inactive_color: "#cccccc",
  separator_symbol: ">",
  separator_color: "#ffffff",
  text_alignment: "left",
  vertical_position: "middle",
  visibility_settings: { cms: true, product: true, category: true, about: true, contact: true, blog: true, home: false, checkout: false, login: false },
};

export function useBreadcrumbSettings() {
  const [settings, setSettings] = useState<BreadcrumbSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("breadcrumb_settings").select("*").limit(1).maybeSingle();
      if (data) {
        setSettings({
          ...data,
          gradient_stops: Array.isArray(data.gradient_stops) ? data.gradient_stops as any : defaultSettings.gradient_stops,
          visibility_settings: typeof data.visibility_settings === "object" && data.visibility_settings !== null ? data.visibility_settings as any : defaultSettings.visibility_settings,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { settings, loading };
}

export function getHeightPx(settings: BreadcrumbSettings): number {
  switch (settings.section_height) {
    case "small": return 60;
    case "large": return 150;
    case "custom": return settings.custom_height;
    default: return 100;
  }
}

export function getBackgroundStyle(s: BreadcrumbSettings): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (s.background_type === "solid") {
    style.backgroundColor = s.bg_color;
  } else if (s.background_type === "gradient") {
    const stops = s.gradient_stops.map(st => `${st.color} ${st.position}%`).join(", ");
    if (s.gradient_type === "radial") {
      style.background = `radial-gradient(circle, ${stops})`;
    } else {
      style.background = `linear-gradient(${s.gradient_direction}, ${stops})`;
    }
  } else if (s.background_type === "image") {
    style.backgroundImage = `url(${s.bg_image_url})`;
    style.backgroundPosition = s.bg_position;
    style.backgroundSize = s.bg_size;
    style.backgroundRepeat = s.bg_repeat;
  }
  return style;
}
