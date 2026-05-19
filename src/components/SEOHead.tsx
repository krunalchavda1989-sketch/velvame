import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sitewide SEO head injector. Reads global config + verification codes from
 * the seo_settings table and injects them into <head>. Per-route <Helmet>
 * tags later in the tree override these for JS-executing crawlers.
 */
const SEOHead = () => {
  const { data } = useQuery({
    queryKey: ["seo-settings-head"],
    queryFn: async () => {
      const { data } = await supabase
        .from("seo_settings")
        .select("key, config")
        .in("key", ["global", "verification", "schema"]);
      const map: Record<string, any> = {};
      (data || []).forEach((r: any) => (map[r.key] = r.config || {}));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const g = data?.global || {};
  const v = data?.verification || {};
  const s = data?.schema || {};

  return (
    <Helmet>
      {v.google && <meta name="google-site-verification" content={v.google} />}
      {v.bing && <meta name="msvalidate.01" content={v.bing} />}
      {v.yandex && <meta name="yandex-verification" content={v.yandex} />}
      {v.pinterest && <meta name="p:domain_verify" content={v.pinterest} />}
      {v.facebook && <meta name="facebook-domain-verification" content={v.facebook} />}

      {g.default_title && <meta name="application-name" content={g.site_name || "Velvame"} />}
      {g.twitter_handle && <meta name="twitter:site" content={g.twitter_handle} />}
      {g.twitter_card && <meta name="twitter:card" content={g.twitter_card} />}
      {g.locale && <meta property="og:locale" content={g.locale} />}
      {g.default_og_image && <meta property="og:image" content={g.default_og_image} />}

      {s.organization_enabled && s.organization && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: s.organization.name || g.site_name,
            url: g.base_url,
            logo: s.organization.logo || undefined,
            email: s.organization.email || undefined,
            telephone: s.organization.phone || undefined,
            address: s.organization.address || undefined,
            sameAs: Array.isArray(s.organization.same_as) ? s.organization.same_as : undefined,
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
