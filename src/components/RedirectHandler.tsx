import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side redirect handler. Reads the seo_redirects table and rewrites
 * navigation for any matching from_path. Lovable hosting has no edge
 * redirect support, so this runs after the SPA boots.
 */
const RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: redirects } = useQuery({
    queryKey: ["seo-redirects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_redirects")
        .select("from_path, to_path, status_code")
        .eq("is_active", true);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!redirects?.length) return;
    const match = redirects.find((r: any) => r.from_path === location.pathname);
    if (match) {
      // External link
      if (/^https?:\/\//.test(match.to_path)) {
        window.location.replace(match.to_path);
      } else {
        navigate(match.to_path, { replace: true });
      }
    }
  }, [location.pathname, redirects, navigate]);

  return null;
};

export default RedirectHandler;
