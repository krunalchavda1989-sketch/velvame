import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface Announcement {
  id: string;
  message: string;
  bg_color: string;
  text_color: string;
  link_url: string | null;
  link_text: string | null;
  link_target: string;
  starts_at: string;
  ends_at: string | null;
}

interface BarSettings {
  transition_effect: string;
  display_duration: number;
  transition_speed: number;
  auto_play: boolean;
  loop_enabled: boolean;
  pause_on_hover: boolean;
  show_arrows: boolean;
  show_dots: boolean;
  bg_color: string;
  text_color: string;
  font_size: number;
  font_weight: string;
  bar_height: number;
  text_align: string;
  show_close_button: boolean;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
  is_enabled: boolean;
}

const defaultSettings: BarSettings = {
  transition_effect: "slide",
  display_duration: 3000,
  transition_speed: 500,
  auto_play: true,
  loop_enabled: true,
  pause_on_hover: true,
  show_arrows: false,
  show_dots: false,
  bg_color: "#000000",
  text_color: "#ffffff",
  font_size: 14,
  font_weight: "medium",
  bar_height: 40,
  text_align: "center",
  show_close_button: true,
  show_on_mobile: true,
  show_on_desktop: true,
  is_enabled: true,
};

const AnnouncementBar = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<BarSettings>(defaultSettings);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date().toISOString();

      const [annRes, settingsRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("id, message, bg_color, text_color, link_url, link_text, link_target, starts_at, ends_at")
          .eq("is_active", true)
          .lte("starts_at", now)
          .order("sort_order", { ascending: true }),
        supabase
          .from("announcement_bar_settings" as any)
          .select("*")
          .limit(1)
          .single(),
      ]);

      if (annRes.data) {
        const active = (annRes.data as Announcement[]).filter(
          a => !a.ends_at || new Date(a.ends_at) > new Date()
        );
        setAnnouncements(active);
      }
      if (settingsRes.data) {
        setSettings(settingsRes.data as any);
      }
    };
    fetchData();
  }, []);

  const goNext = useCallback(() => {
    if (announcements.length <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => {
      if (prev >= announcements.length - 1) {
        return settings.loop_enabled ? 0 : prev;
      }
      return prev + 1;
    });
  }, [announcements.length, settings.loop_enabled]);

  const goPrev = useCallback(() => {
    if (announcements.length <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => {
      if (prev <= 0) {
        return settings.loop_enabled ? announcements.length - 1 : prev;
      }
      return prev - 1;
    });
  }, [announcements.length, settings.loop_enabled]);

  // Auto-cycle
  useEffect(() => {
    if (!settings.auto_play || announcements.length <= 1 || isPaused) return;
    if (settings.transition_effect === "marquee") return; // marquee is continuous
    timerRef.current = setInterval(goNext, settings.display_duration);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [goNext, announcements.length, settings.auto_play, settings.display_duration, isPaused, settings.transition_effect]);

  // Typewriter effect
  useEffect(() => {
    if (settings.transition_effect !== "typewriter" || announcements.length === 0) return;
    const fullText = announcements[currentIndex]?.message || "";
    setTypewriterText("");
    let charIdx = 0;
    typewriterRef.current = setInterval(() => {
      charIdx++;
      setTypewriterText(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
      }
    }, 50);
    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current); };
  }, [currentIndex, settings.transition_effect, announcements]);

  if (dismissed || announcements.length === 0 || !settings.is_enabled) return null;

  const current = announcements[currentIndex];
  const bgColor = current.bg_color || settings.bg_color;
  const txtColor = current.text_color || settings.text_color;
  const speed = settings.transition_speed / 1000;
  const fontW = settings.font_weight === "bold" ? 700 : settings.font_weight === "medium" ? 500 : 400;

  // Animation variants per effect
  const getVariants = () => {
    switch (settings.transition_effect) {
      case "fade":
        return {
          enter: { opacity: 0 },
          center: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case "flip":
        return {
          enter: (d: number) => ({ rotateX: d > 0 ? 90 : -90, opacity: 0 }),
          center: { rotateX: 0, opacity: 1 },
          exit: (d: number) => ({ rotateX: d > 0 ? -90 : 90, opacity: 0 }),
        };
      case "zoom":
        return {
          enter: { scale: 0.3, opacity: 0 },
          center: { scale: 1, opacity: 1 },
          exit: { scale: 0.3, opacity: 0 },
        };
      case "rollup":
        return {
          enter: (d: number) => ({ y: d > 0 ? 40 : -40, opacity: 0 }),
          center: { y: 0, opacity: 1 },
          exit: (d: number) => ({ y: d > 0 ? -40 : 40, opacity: 0 }),
        };
      case "slide":
      default:
        return {
          enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
          center: { x: 0, opacity: 1 },
          exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
        };
    }
  };

  const variants = getVariants();

  // Parse multi-line
  const messageLines = (settings.transition_effect === "typewriter" ? typewriterText : current.message)
    .split(/\n|<br\s*\/?>/)
    .filter(l => l.trim());

  const renderLink = () => {
    if (!current.link_url || !current.link_text) return null;
    const cls = "inline-flex items-center gap-1 ml-2 underline underline-offset-2 opacity-90 hover:opacity-100 text-xs";
    if (current.link_url.startsWith("/")) {
      return <Link to={current.link_url} className={cls}>{current.link_text} <ExternalLink className="h-3 w-3" /></Link>;
    }
    return (
      <a href={current.link_url} target={current.link_target || "_self"} rel="noopener noreferrer" className={cls}>
        {current.link_text} <ExternalLink className="h-3 w-3" />
      </a>
    );
  };

  // Marquee effect — continuous scroll
  if (settings.transition_effect === "marquee") {
    const allText = announcements.map(a => a.message + (a.link_text ? ` — ${a.link_text}` : "")).join("   •   ");
    return (
      <div
        className={`relative overflow-hidden ${!settings.show_on_mobile ? "hidden md:flex" : ""} ${!settings.show_on_desktop ? "md:hidden" : ""}`}
        style={{ backgroundColor: bgColor, color: txtColor, height: settings.bar_height, fontSize: settings.font_size, fontWeight: fontW }}
        onMouseEnter={() => settings.pause_on_hover && setIsPaused(true)}
        onMouseLeave={() => settings.pause_on_hover && setIsPaused(false)}
      >
        <div
          className="flex items-center whitespace-nowrap absolute"
          style={{
            animation: `marquee-scroll ${Math.max(10, announcements.length * 8)}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          <span className="px-8">{allText}</span>
          <span className="px-8">{allText}</span>
        </div>
        {settings.show_close_button && (
          <button onClick={() => setDismissed(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 z-10 opacity-70 hover:opacity-100" style={{ color: txtColor }}>
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${!settings.show_on_mobile ? "hidden md:flex" : ""} ${!settings.show_on_desktop ? "md:hidden" : ""}`}
      style={{ backgroundColor: bgColor, color: txtColor, height: settings.bar_height, fontSize: settings.font_size, fontWeight: fontW }}
      onMouseEnter={() => settings.pause_on_hover && setIsPaused(true)}
      onMouseLeave={() => settings.pause_on_hover && setIsPaused(false)}
    >
      {/* Left arrow */}
      {settings.show_arrows && announcements.length > 1 && (
        <button onClick={goPrev} className="absolute left-2 p-0.5 z-10 opacity-70 hover:opacity-100" style={{ color: txtColor }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-10" style={{ textAlign: settings.text_align as any }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id + currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: speed, ease: "easeInOut" }}
            className="flex items-center justify-center gap-1"
            style={{ perspective: 600 }}
          >
            <div className="flex flex-col items-center">
              {messageLines.map((line, i) => (
                <span key={i} className="block leading-snug">{line}</span>
              ))}
            </div>
            {renderLink()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right arrow */}
      {settings.show_arrows && announcements.length > 1 && (
        <button onClick={goNext} className="absolute right-8 p-0.5 z-10 opacity-70 hover:opacity-100" style={{ color: txtColor }}>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Dots */}
      {settings.show_dots && announcements.length > 1 && (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
              className="w-1.5 h-1.5 rounded-full transition-opacity"
              style={{ backgroundColor: txtColor, opacity: i === currentIndex ? 1 : 0.4 }}
            />
          ))}
        </div>
      )}

      {/* Close */}
      {settings.show_close_button && (
        <button onClick={() => setDismissed(true)} className="absolute right-2 p-0.5 z-10 opacity-70 hover:opacity-100" style={{ color: txtColor }}>
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default AnnouncementBar;
