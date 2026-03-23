import { useState, useEffect, useCallback } from "react";
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
}

const BannerSlider = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("banners")
        .select("id, desktop_image_url, mobile_image_url, destination_link, link_target, alt_text, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      setBanners((data as Banner[]) || []);
      setLoaded(true);
    };
    fetch();
  }, []);

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  if (!loaded || banners.length === 0) return null;

  const renderSlide = (banner: Banner) => {
    const content = (
      <>
        {/* Desktop image */}
        {banner.desktop_image_url && (
          <img
            src={banner.desktop_image_url}
            alt={banner.alt_text || "Banner"}
            className="hidden md:block w-full h-auto object-cover"
            loading="lazy"
          />
        )}
        {/* Mobile image - fallback to desktop if no mobile */}
        <img
          src={banner.mobile_image_url || banner.desktop_image_url}
          alt={banner.alt_text || "Banner"}
          className="block md:hidden w-full h-auto object-cover"
          loading="lazy"
        />
        {/* Desktop fallback if no desktop image but mobile exists */}
        {!banner.desktop_image_url && banner.mobile_image_url && (
          <img
            src={banner.mobile_image_url}
            alt={banner.alt_text || "Banner"}
            className="hidden md:block w-full h-auto object-cover"
            loading="lazy"
          />
        )}
      </>
    );

    if (banner.destination_link) {
      const isExternal = banner.destination_link.startsWith("http");
      return (
        <a
          href={banner.destination_link}
          target={isExternal ? "_blank" : banner.link_target}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="block cursor-pointer"
        >
          {content}
        </a>
      );
    }

    return <div>{content}</div>;
  };

  return (
    <div className="relative w-full overflow-hidden bg-background">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full flex-shrink-0">
            {renderSlide(banner)}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current ? "bg-white scale-110" : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerSlider;
