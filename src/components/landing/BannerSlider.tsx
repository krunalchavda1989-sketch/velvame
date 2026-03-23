import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  desktop_image_url: string;
  mobile_image_url: string;
  destination_link: string;
  link_target: string;
  alt_text: string;
  sort_order: number;
  desktop_display_mode: string;
  mobile_display_mode: string;
  custom_duration: number | null;
}

interface SliderSettings {
  autoplay_speed: number;
  transition_speed: number;
  transition_effect: string;
  easing: string;
  direction: string;
  loop_enabled: boolean;
  pause_on_hover: boolean;
  show_arrows: boolean;
  show_dots: boolean;
  default_desktop_mode: string;
  default_mobile_mode: string;
}

const defaultSettings: SliderSettings = {
  autoplay_speed: 4000,
  transition_speed: 600,
  transition_effect: "slide",
  easing: "ease-in-out",
  direction: "horizontal",
  loop_enabled: true,
  pause_on_hover: true,
  show_arrows: true,
  show_dots: true,
  default_desktop_mode: "cover",
  default_mobile_mode: "cover",
};

const getObjectFit = (mode: string): string => {
  switch (mode) {
    case "contain": return "object-contain";
    case "fill": return "object-fill";
    case "auto": return "object-scale-down";
    default: return "object-cover";
  }
};

const BannerSlider = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<SliderSettings>(defaultSettings);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const fetchAll = async () => {
      const [bannersRes, settingsRes] = await Promise.all([
        supabase.from("banners").select("id, desktop_image_url, mobile_image_url, destination_link, link_target, alt_text, sort_order, desktop_display_mode, mobile_display_mode, custom_duration").eq("is_active", true).order("sort_order"),
        supabase.from("banner_settings").select("*").limit(1).single(),
      ]);
      setBanners((bannersRes.data as Banner[]) || []);
      if (settingsRes.data) setSettings(settingsRes.data as any);
      setLoaded(true);
    };
    fetchAll();
  }, []);

  // Auto-play with per-banner custom duration
  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const currentBanner = banners[current];
    const duration = currentBanner?.custom_duration || settings.autoplay_speed;
    timerRef.current = setTimeout(() => {
      goNext();
    }, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [banners.length, current, paused, settings.autoplay_speed]);

  const goNext = useCallback(() => {
    if (isAnimating) return;
    setCurrent(c => {
      if (!settings.loop_enabled && c >= banners.length - 1) return c;
      return (c + 1) % banners.length;
    });
  }, [banners.length, settings.loop_enabled, isAnimating]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    setCurrent(c => {
      if (!settings.loop_enabled && c <= 0) return c;
      return (c - 1 + banners.length) % banners.length;
    });
  }, [banners.length, settings.loop_enabled, isAnimating]);

  const goTo = useCallback((index: number) => {
    if (!isAnimating) setCurrent(index);
  }, [isAnimating]);

  if (!loaded || banners.length === 0) return null;

  const transitionStyle = (() => {
    const speed = settings.transition_speed;
    const ease = settings.easing;
    if (settings.transition_effect === "fade") {
      return { transition: `opacity ${speed}ms ${ease}` };
    }
    return { transition: `transform ${speed}ms ${ease}` };
  })();

  const getSlideStyle = (index: number) => {
    if (settings.transition_effect === "fade") {
      return {
        position: "absolute" as const,
        inset: 0,
        opacity: index === current ? 1 : 0,
        transition: `opacity ${settings.transition_speed}ms ${settings.easing}`,
        zIndex: index === current ? 1 : 0,
      };
    }
    if (settings.transition_effect === "zoom-in") {
      return {
        position: "absolute" as const,
        inset: 0,
        opacity: index === current ? 1 : 0,
        transform: index === current ? "scale(1)" : "scale(0.8)",
        transition: `opacity ${settings.transition_speed}ms ${settings.easing}, transform ${settings.transition_speed}ms ${settings.easing}`,
        zIndex: index === current ? 1 : 0,
      };
    }
    if (settings.transition_effect === "zoom-out") {
      return {
        position: "absolute" as const,
        inset: 0,
        opacity: index === current ? 1 : 0,
        transform: index === current ? "scale(1)" : "scale(1.2)",
        transition: `opacity ${settings.transition_speed}ms ${settings.easing}, transform ${settings.transition_speed}ms ${settings.easing}`,
        zIndex: index === current ? 1 : 0,
      };
    }
    return {};
  };

  const isSlideMode = settings.transition_effect === "slide";
  const desktopFit = getObjectFit(settings.default_desktop_mode);
  const mobileFit = getObjectFit(settings.default_mobile_mode);

  const renderSlide = (banner: Banner) => {
    const bannerDesktopFit = banner.desktop_display_mode ? getObjectFit(banner.desktop_display_mode) : desktopFit;
    const bannerMobileFit = banner.mobile_display_mode ? getObjectFit(banner.mobile_display_mode) : mobileFit;

    const content = (
      <>
        {banner.desktop_image_url && (
          <img src={banner.desktop_image_url} alt={banner.alt_text || "Banner"} className={`hidden md:block w-full h-auto ${bannerDesktopFit}`} loading="lazy" />
        )}
        <img src={banner.mobile_image_url || banner.desktop_image_url} alt={banner.alt_text || "Banner"} className={`block md:hidden w-full h-auto ${bannerMobileFit}`} loading="lazy" />
        {!banner.desktop_image_url && banner.mobile_image_url && (
          <img src={banner.mobile_image_url} alt={banner.alt_text || "Banner"} className={`hidden md:block w-full h-auto ${bannerDesktopFit}`} loading="lazy" />
        )}
      </>
    );

    if (banner.destination_link) {
      const isExternal = banner.destination_link.startsWith("http");
      return (
        <a href={banner.destination_link} target={isExternal ? "_blank" : banner.link_target} rel={isExternal ? "noopener noreferrer" : undefined} className="block cursor-pointer">
          {content}
        </a>
      );
    }
    return <div>{content}</div>;
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-background"
      onMouseEnter={() => settings.pause_on_hover && setPaused(true)}
      onMouseLeave={() => settings.pause_on_hover && setPaused(false)}
    >
      {isSlideMode ? (
        <div
          className="flex"
          style={{
            transform: `translateX(-${current * 100}%)`,
            ...transitionStyle,
          }}
          onTransitionEnd={() => setIsAnimating(false)}
        >
          {banners.map(banner => (
            <div key={banner.id} className="w-full flex-shrink-0">
              {renderSlide(banner)}
            </div>
          ))}
        </div>
      ) : (
        <div className="relative" style={{ minHeight: 200 }}>
          {banners.map((banner, index) => (
            <div key={banner.id} style={getSlideStyle(index)}>
              {renderSlide(banner)}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && settings.show_arrows && (
        <>
          <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors" aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors" aria-label="Next slide">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && settings.show_dots && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-white scale-110" : "bg-white/50 hover:bg-white/70"}`} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerSlider;
