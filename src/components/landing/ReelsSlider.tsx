import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ReelVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  platform: string;
  video_id: string;
  thumbnail_url: string;
  custom_thumbnail_url: string;
  destination_link: string;
  link_target: string;
}

interface ReelsSettings {
  section_title: string;
  section_subtitle: string;
  is_enabled: boolean;
  show_platform_badge: boolean;
  show_title: boolean;
  show_description: boolean;
  cards_desktop: number;
  cards_mobile: number;
  show_arrows: boolean;
  enable_swipe: boolean;
  bg_type: string;
  bg_color: string;
  gradient_direction: string;
  gradient_stops: { color: string; position: number }[];
  bg_image_url: string;
  padding_top: number;
  padding_bottom: number;
}

const PLATFORM_ICONS: Record<string, { color: string; label: string }> = {
  youtube: { color: "#FF0000", label: "YouTube" },
  facebook: { color: "#1877F2", label: "Facebook" },
  instagram: { color: "#E4405F", label: "Instagram" },
};

const getEmbedUrl = (platform: string, videoId: string, videoUrl: string): string | null => {
  if (platform === "youtube") return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  if (platform === "facebook") return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&autoplay=true`;
  if (platform === "instagram") return `https://www.instagram.com/reel/${videoId}/embed/`;
  return null;
};

const ReelsSlider = () => {
  const [videos, setVideos] = useState<ReelVideo[]>([]);
  const [settings, setSettings] = useState<ReelsSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ReelVideo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: vids }, { data: sett }] = await Promise.all([
        supabase.from("reels_videos" as any).select("id, title, description, video_url, platform, video_id, thumbnail_url, custom_thumbnail_url, destination_link, link_target").eq("is_active", true).order("sort_order"),
        supabase.from("reels_settings" as any).select("*").limit(1).single(),
      ]);
      setVideos((vids as any[]) || []);
      if (sett) setSettings(sett as any);
      setLoaded(true);
    };
    fetchData();
  }, []);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", updateScrollState);
    return () => { if (el) el.removeEventListener("scroll", updateScrollState); };
  }, [videos, loaded]);

  if (!loaded || !settings?.is_enabled || videos.length === 0) return null;

  const scrollBy = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-reel-card]")?.clientWidth || 200;
    el.scrollBy({ left: dir * cardWidth * 2, behavior: "smooth" });
  };

  const handleClick = (v: ReelVideo) => {
    setActiveVideo(v);
  };

  const thumb = (v: ReelVideo) => {
    if (v.custom_thumbnail_url) return v.custom_thumbnail_url;
    if (v.thumbnail_url) return v.thumbnail_url;
    return "";
  };

  // Background style
  const getSectionStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      paddingTop: `${settings.padding_top}px`,
      paddingBottom: `${settings.padding_bottom}px`,
    };
    if (settings.bg_type === "gradient" && settings.gradient_stops?.length >= 2) {
      const stops = settings.gradient_stops.map(s => `${s.color} ${s.position}%`).join(", ");
      style.background = `linear-gradient(${settings.gradient_direction}, ${stops})`;
    } else if (settings.bg_type === "image" && settings.bg_image_url) {
      style.backgroundImage = `url(${settings.bg_image_url})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
      style.backgroundRepeat = "no-repeat";
    } else {
      style.backgroundColor = settings.bg_color || undefined;
    }
    return style;
  };

  const embedUrl = activeVideo ? getEmbedUrl(activeVideo.platform, (activeVideo as any).video_id, activeVideo.video_url) : null;

  return (
    <>
      <section style={getSectionStyle()}>
        <div className="container px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{settings.section_title}</h2>
              {settings.section_subtitle && <p className="text-sm text-muted-foreground mt-1">{settings.section_subtitle}</p>}
            </div>
            {settings.show_arrows && (
              <div className="flex gap-2">
                <button onClick={() => scrollBy(-1)} disabled={!canScrollLeft} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30" aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => scrollBy(1)} disabled={!canScrollRight} className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30" aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </div>

          {/* Slider */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollSnapType: settings.enable_swipe ? "x mandatory" : undefined, WebkitOverflowScrolling: "touch" }}
          >
            {videos.map((v) => (
              <div
                key={v.id}
                data-reel-card
                onClick={() => handleClick(v)}
                className="flex-shrink-0 cursor-pointer group transition-transform hover:-translate-y-1"
                style={{
                  width: `calc((100% - ${(settings.cards_desktop - 1) * 16}px) / ${settings.cards_desktop})`,
                  minWidth: "140px",
                  scrollSnapAlign: "start",
                }}
              >
                {/* Thumbnail */}
                <div className="relative rounded-2xl overflow-hidden bg-muted border border-border" style={{ aspectRatio: "9/16" }}>
                  {thumb(v) ? (
                    <img src={thumb(v)} alt={v.title || "Video"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, ${PLATFORM_ICONS[v.platform]?.color || '#666'}22, ${PLATFORM_ICONS[v.platform]?.color || '#666'}44)` }}>
                      <Play className="h-12 w-12" style={{ color: PLATFORM_ICONS[v.platform]?.color || '#666' }} />
                      <span className="text-xs font-bold mt-2" style={{ color: PLATFORM_ICONS[v.platform]?.color || '#666' }}>{PLATFORM_ICONS[v.platform]?.label || "Video"}</span>
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-foreground fill-foreground ml-1" />
                    </div>
                  </div>

                  {/* Platform badge */}
                  {settings.show_platform_badge && PLATFORM_ICONS[v.platform] && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: PLATFORM_ICONS[v.platform].color }}>
                      {PLATFORM_ICONS[v.platform].label}
                    </div>
                  )}
                </div>

                {/* Title & description */}
                {(settings.show_title || settings.show_description) && (v.title || v.description) && (
                  <div className="mt-2 px-1">
                    {settings.show_title && v.title && <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{v.title}</p>}
                    {settings.show_description && v.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{v.description}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          @media (max-width: 768px) {
            [data-reel-card] {
              width: calc((100% - ${(settings.cards_mobile - 1) * 16}px) / ${settings.cards_mobile}) !important;
            }
          }
        `}</style>
      </section>

      {/* Video Popup */}
      <Dialog open={!!activeVideo} onOpenChange={(o) => { if (!o) setActiveVideo(null); }}>
        <DialogContent className={`p-0 bg-black border-none overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80 [&>button]:z-20 ${activeVideo?.platform === "instagram" ? "max-w-md w-[90vw]" : "max-w-3xl w-[95vw]"}`}>
          {embedUrl && (
            <div className="relative w-full" style={{ aspectRatio: activeVideo?.platform === "instagram" ? "9/16" : "16/9", maxHeight: "80vh" }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                frameBorder="0"
              />
            </div>
          )}
          {activeVideo?.title && (
            <div className="p-4 bg-black text-white">
              <h3 className="font-semibold text-lg">{activeVideo.title}</h3>
              {activeVideo.description && <p className="text-sm text-white/70 mt-1">{activeVideo.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReelsSlider;
