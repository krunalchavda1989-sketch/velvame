import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PopupData {
  id: string;
  name: string;
  title: string;
  description: string;
  image_url: string;
  btn1_text: string;
  btn1_link: string;
  btn2_text: string;
  btn2_action: string;
  bg_color: string;
  overlay_color: string;
  overlay_opacity: number;
  width: number;
  position: string;
  show_close_btn: boolean;
  close_on_overlay: boolean;
  sort_order: number;
  conditions: any[];
  triggers: any;
  advanced: any;
}

const STORAGE_KEY = "popup_engine_data";

const getStorageData = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
};

const setStorageData = (data: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getSessionData = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
};

const setSessionData = (data: any) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Increment page view counter
const incrementPageViews = () => {
  const d = getStorageData();
  d.pageViews = (d.pageViews || 0) + 1;
  setStorageData(d);
  return d.pageViews;
};

// Track session
const trackSession = () => {
  const sd = getSessionData();
  if (!sd.sessionTracked) {
    const d = getStorageData();
    d.sessions = (d.sessions || 0) + 1;
    setStorageData(d);
    sd.sessionTracked = true;
    setSessionData(sd);
  }
};

const getShowCount = (popupId: string) => {
  const sd = getSessionData();
  return sd[`shown_${popupId}`] || 0;
};

const recordShow = (popupId: string) => {
  const sd = getSessionData();
  sd[`shown_${popupId}`] = (sd[`shown_${popupId}`] || 0) + 1;
  setSessionData(sd);
};

const getDeviceType = (): string => {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const getTrafficSource = (): string => {
  const ref = document.referrer;
  if (!ref) return "direct";
  try {
    const url = new URL(ref);
    const host = url.hostname;
    if (/google|bing|yahoo|duckduckgo|baidu/.test(host)) return "search";
    if (/facebook|twitter|instagram|linkedin|youtube|tiktok/.test(host)) return "social";
    if (host === window.location.hostname) return "direct";
    return "external";
  } catch { return "external"; }
};

const checkConditions = (conditions: any[], pathname: string): boolean => {
  if (!conditions || conditions.length === 0) return true;
  let included = false;
  let excluded = false;
  const includes = conditions.filter((c: any) => c.include_exclude === "include");
  const excludes = conditions.filter((c: any) => c.include_exclude === "exclude");

  if (includes.length === 0) included = true;
  else included = includes.some((c: any) => matchPage(c, pathname));
  if (excludes.length > 0) excluded = excludes.some((c: any) => matchPage(c, pathname));

  return included && !excluded;
};

const matchPage = (condition: any, pathname: string): boolean => {
  if (condition.scope === "entire_site") return true;
  const pt = condition.page_type;
  if (pt === "all") return true;
  if (pt === "homepage") return pathname === "/";
  if (pt === "product") return pathname.startsWith("/product/");
  if (pt === "category") return pathname.startsWith("/category/");
  if (pt === "shop") return pathname === "/shop";
  if (pt === "contact") return pathname === "/contact";
  if (pt === "about") return pathname === "/about";
  if (pt === "checkout") return pathname === "/checkout";
  if (pt === "custom") return pathname === condition.specific_page || pathname === `/${condition.specific_page}`;
  return false;
};

const checkAdvancedRules = (rules: any, isLoggedIn: boolean): boolean => {
  if (!rules) return true;
  const storage = getStorageData();

  if (rules.show_after_pageviews && (storage.pageViews || 0) < rules.pageview_count) return false;
  if (rules.show_after_sessions && (storage.sessions || 0) < rules.session_count) return false;
  if (rules.hide_logged_in && isLoggedIn) return false;

  if (rules.show_on_devices) {
    const device = getDeviceType();
    const dt = rules.device_type;
    if (dt !== "all" && dt !== device) return false;
  }

  if (rules.arriving_from_source && rules.traffic_source !== "any") {
    const src = getTrafficSource();
    if (src !== rules.traffic_source) return false;
  }

  if (rules.arriving_from_url && rules.referrer_url) {
    if (!document.referrer.includes(rules.referrer_url)) return false;
  }

  return true;
};

const checkMaxTimes = (rules: any, popupId: string): boolean => {
  if (!rules || !rules.show_max_times) return true;
  return getShowCount(popupId) < rules.max_times;
};

const getPositionClasses = (position: string): string => {
  switch (position) {
    case "top": return "items-start justify-center pt-20";
    case "bottom": return "items-end justify-center pb-20";
    case "top-left": return "items-start justify-start pt-20 pl-8";
    case "top-right": return "items-start justify-end pt-20 pr-8";
    case "bottom-left": return "items-end justify-start pb-20 pl-8";
    case "bottom-right": return "items-end justify-end pb-20 pr-8";
    default: return "items-center justify-center";
  }
};

const PopupEngine = () => {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [activePopup, setActivePopup] = useState<PopupData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const triggersRegistered = useRef(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const exitIntentRegistered = useRef(false);
  const clickCount = useRef(0);

  // Track page views and sessions
  useEffect(() => {
    incrementPageViews();
    trackSession();
  }, []);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session?.user));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch all active popups once
  useEffect(() => {
    const fetchPopups = async () => {
      const { data: popupsData } = await supabase.from("popups").select("*").eq("status", true).order("sort_order");
      if (!popupsData || popupsData.length === 0) return;

      const ids = popupsData.map((p: any) => p.id);
      const [condRes, trigRes, advRes] = await Promise.all([
        supabase.from("popup_conditions").select("*").in("popup_id", ids),
        supabase.from("popup_triggers").select("*").in("popup_id", ids),
        supabase.from("popup_advanced_rules").select("*").in("popup_id", ids),
      ]);

      const enriched = popupsData.map((p: any) => ({
        ...p,
        conditions: (condRes.data || []).filter((c: any) => c.popup_id === p.id),
        triggers: (trigRes.data || []).find((t: any) => t.popup_id === p.id) || {},
        advanced: (advRes.data || []).find((a: any) => a.popup_id === p.id) || {},
      }));

      setPopups(enriched);
    };
    fetchPopups();
  }, []);

  // Evaluate and register triggers when route changes
  useEffect(() => {
    if (popups.length === 0 || activePopup) return;

    // Reset triggers on route change
    triggersRegistered.current = false;
    clickCount.current = 0;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    // Find first eligible popup
    const eligible = popups.find(p =>
      checkConditions(p.conditions, location.pathname) &&
      checkAdvancedRules(p.advanced, isLoggedIn) &&
      checkMaxTimes(p.advanced, p.id)
    );

    if (!eligible) return;

    const t = eligible.triggers;
    if (!t) return;

    const showPopup = () => {
      if (activePopup) return;
      recordShow(eligible.id);
      setActivePopup(eligible);
    };

    // Register triggers
    // On Page Load
    if (t.on_page_load) {
      const delay = (t.page_load_delay || 0) * 1000;
      const timer = setTimeout(showPopup, delay);
      return () => clearTimeout(timer);
    }

    // On Scroll
    if (t.on_scroll) {
      const handler = () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (t.scroll_direction === "down" && scrollPercent >= t.scroll_percent) {
          showPopup();
          window.removeEventListener("scroll", handler);
        }
      };
      window.addEventListener("scroll", handler, { passive: true });
      return () => window.removeEventListener("scroll", handler);
    }

    // On Exit Intent
    if (t.on_exit_intent) {
      const handler = (e: MouseEvent) => {
        if (e.clientY <= 5) {
          showPopup();
          document.removeEventListener("mouseout", handler);
        }
      };
      document.addEventListener("mouseout", handler);
      return () => document.removeEventListener("mouseout", handler);
    }

    // After Inactivity
    if (t.after_inactivity) {
      let timer: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(showPopup, (t.inactivity_seconds || 30) * 1000);
      };
      resetTimer();
      const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
      events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
      return () => {
        clearTimeout(timer);
        events.forEach(e => window.removeEventListener(e, resetTimer));
      };
    }

    // On Click
    if (t.on_click) {
      const handler = () => {
        clickCount.current++;
        if (clickCount.current >= (t.click_count || 1)) {
          showPopup();
          document.removeEventListener("click", handler);
        }
      };
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }

    // On Scroll To Element
    if (t.on_scroll_to_element && t.element_selector) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            showPopup();
            observer.disconnect();
          }
        });
      });
      const el = document.querySelector(t.element_selector);
      if (el) observer.observe(el);
      return () => observer.disconnect();
    }
  }, [popups, location.pathname, isLoggedIn, activePopup]);

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  const handleBtn1 = () => {
    if (activePopup?.btn1_link) {
      window.open(activePopup.btn1_link, "_blank");
    }
    closePopup();
  };

  const handleBtn2 = () => {
    if (activePopup?.btn2_action === "url" && activePopup.btn1_link) {
      window.open(activePopup.btn1_link, "_blank");
    }
    closePopup();
  };

  if (!activePopup) return null;

  const overlayBg = `${activePopup.overlay_color}${Math.round(activePopup.overlay_opacity * 2.55).toString(16).padStart(2, "0")}`;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex ${getPositionClasses(activePopup.position)}`}
      style={{ backgroundColor: overlayBg }}
      onClick={activePopup.close_on_overlay ? closePopup : undefined}
    >
      <div
        className="relative rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        style={{ backgroundColor: activePopup.bg_color, width: activePopup.width, maxWidth: "95vw", maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {activePopup.show_close_btn && (
          <button
            onClick={closePopup}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/20 hover:bg-black/40 p-1.5 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}

        <div className="overflow-y-auto max-h-[90vh]">
          {activePopup.image_url && (
            <img src={activePopup.image_url} alt="" className="w-full object-cover max-h-56" />
          )}

          <div className="p-6">
            {activePopup.title && (
              <h2 className="text-xl font-bold mb-2">{activePopup.title}</h2>
            )}
            {activePopup.description && (
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{activePopup.description}</p>
            )}
            <div className="flex gap-2">
              {activePopup.btn1_text && (
                <Button onClick={handleBtn1} className="flex-1">{activePopup.btn1_text}</Button>
              )}
              {activePopup.btn2_text && (
                <Button variant="outline" onClick={handleBtn2} className="flex-1">{activePopup.btn2_text}</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupEngine;
