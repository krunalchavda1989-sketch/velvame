import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface Announcement {
  id: string;
  message: string;
  bg_color: string;
  text_color: string;
  link_url: string | null;
  link_text: string | null;
  starts_at: string;
  ends_at: string | null;
}

const CYCLE_INTERVAL = 5000;

const slideVariants = {
  enter: (dir: number) => ({
    y: dir > 0 ? 28 : -28,
    opacity: 0,
  }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({
    y: dir > 0 ? -28 : 28,
    opacity: 0,
  }),
};

const AnnouncementBar = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("announcements")
        .select("id, message, bg_color, text_color, link_url, link_text, starts_at, ends_at")
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("sort_order", { ascending: true });

      if (data) {
        const active = (data as Announcement[]).filter(
          (a) => !a.ends_at || new Date(a.ends_at) > new Date()
        );
        setAnnouncements(active);
      }
    };
    fetchAnnouncements();
  }, []);

  const goNext = useCallback(() => {
    if (announcements.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  }, [announcements.length]);

  const goPrev = useCallback(() => {
    if (announcements.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  }, [announcements.length]);

  // Auto-cycle
  useEffect(() => {
    if (announcements.length <= 1) return;
    timerRef.current = setInterval(goNext, CYCLE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goNext, announcements.length]);

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  // Parse message: support \n and <br> for multi-line
  const messageLines = current.message
    .split(/\n|<br\s*\/?>/)
    .filter((l) => l.trim());

  return (
    <div
      className="relative flex items-center justify-center px-10 py-2 text-sm font-medium overflow-hidden"
      style={{ backgroundColor: current.bg_color, color: current.text_color, minHeight: 36 }}
    >
      {/* Left arrow */}
      {announcements.length > 1 && (
        <button
          onClick={goPrev}
          className="absolute left-2 p-0.5 rounded-full opacity-70 hover:opacity-100 transition-opacity z-10"
          style={{ color: current.text_color }}
          aria-label="Previous announcement"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Sliding content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="text-center flex-1 flex flex-col items-center gap-0"
        >
          {messageLines.map((line, i) => (
            <span key={i} className="block leading-snug">
              {line}
            </span>
          ))}
          {current.link_url && current.link_text && (
            current.link_url.startsWith("/") ? (
              <Link
                to={current.link_url}
                className="inline-flex items-center gap-1 mt-0.5 underline underline-offset-2 opacity-90 hover:opacity-100 text-xs"
              >
                {current.link_text} <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <a
                href={current.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-0.5 underline underline-offset-2 opacity-90 hover:opacity-100 text-xs"
              >
                {current.link_text} <ExternalLink className="h-3 w-3" />
              </a>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Right arrow */}
      {announcements.length > 1 && (
        <button
          onClick={goNext}
          className="absolute right-8 p-0.5 rounded-full opacity-70 hover:opacity-100 transition-opacity z-10"
          style={{ color: current.text_color }}
          aria-label="Next announcement"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Close */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 p-0.5 rounded-full opacity-70 hover:opacity-100 transition-opacity z-10"
        style={{ color: current.text_color }}
        aria-label="Dismiss announcements"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
