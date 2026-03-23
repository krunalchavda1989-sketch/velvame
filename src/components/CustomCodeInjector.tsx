import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CustomCodeInjector = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("custom_code_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      setSettings(data);
    };
    fetch();
  }, []);

  // Don't inject on admin pages
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!settings || isAdmin) return;
    const d = settings as any;

    // Inject CSS
    const existingStyle = document.getElementById("custom-admin-css");
    if (existingStyle) existingStyle.remove();

    if (d.css_enabled && d.custom_css?.trim()) {
      const style = document.createElement("style");
      style.id = "custom-admin-css";
      style.textContent = d.custom_css;
      document.head.appendChild(style);
    }

    // Inject JS
    const existingScript = document.getElementById("custom-admin-js");
    if (existingScript) existingScript.remove();

    if (d.js_enabled && d.custom_js?.trim()) {
      const script = document.createElement("script");
      script.id = "custom-admin-js";
      script.textContent = `try { ${d.custom_js} } catch(e) { console.error('Custom JS Error:', e); }`;
      if (d.js_injection_position === "head") {
        document.head.appendChild(script);
      } else {
        document.body.appendChild(script);
      }
    }

    return () => {
      // Cleanup on unmount
      document.getElementById("custom-admin-css")?.remove();
      document.getElementById("custom-admin-js")?.remove();
    };
  }, [settings, isAdmin]);

  return null;
};

export default CustomCodeInjector;
