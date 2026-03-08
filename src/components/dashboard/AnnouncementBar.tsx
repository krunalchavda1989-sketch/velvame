import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

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

const AnnouncementBar = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetch = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("announcements")
        .select("id, message, bg_color, text_color, link_url, link_text, starts_at, ends_at")
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("sort_order", { ascending: true });

      if (data) {
        // Filter out expired ones client-side (ends_at can be null = no expiry)
        const active = (data as Announcement[]).filter(
          a => !a.ends_at || new Date(a.ends_at) > new Date()
        );
        setAnnouncements(active);
      }
    };
    fetch();
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-0">
      {visible.map(a => (
        <div
          key={a.id}
          className="relative flex items-center justify-center px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: a.bg_color, color: a.text_color }}
        >
          <span className="text-center flex-1">
            {a.message}
            {a.link_url && a.link_text && (
              a.link_url.startsWith("/") ? (
                <Link to={a.link_url} className="inline-flex items-center gap-1 ml-2 underline underline-offset-2 opacity-90 hover:opacity-100">
                  {a.link_text} <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 ml-2 underline underline-offset-2 opacity-90 hover:opacity-100">
                  {a.link_text} <ExternalLink className="h-3 w-3" />
                </a>
              )
            )}
          </span>
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(a.id))}
            className="absolute right-3 p-0.5 rounded-full opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: a.text_color }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBar;
