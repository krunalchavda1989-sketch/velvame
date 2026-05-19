// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.velvame.com";

// Load .env for SUPABASE creds (build-time fetch of dynamic routes)
function loadEnv() {
  const env = { ...process.env };
  if (existsSync(".env")) {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

async function fetchRows(path) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Load admin SEO settings (sitemap toggles + robots.txt content)
const seoRows = await fetchRows("seo_settings?select=key,config&key=in.(sitemap,robots,global)");
const seoMap = {};
for (const r of Array.isArray(seoRows) ? seoRows : []) seoMap[r.key] = r.config || {};
const smCfg = seoMap.sitemap || {};
const globalCfg = seoMap.global || {};
const BASE = globalCfg.base_url || BASE_URL;

// Static, public, indexable routes (excludes auth, checkout, admin, dashboard)
const staticEntries = smCfg.include_static === false ? [] : [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/offers", changefreq: "daily", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
];

const products = smCfg.include_products === false ? [] : await fetchRows("products?select=id,seo_slug&active=eq.true");
const productEntries = products.map((p) => ({
  path: `/product/${p.seo_slug && p.seo_slug.length > 0 ? p.seo_slug : p.id}`,
  changefreq: "weekly",
  priority: "0.8",
}));

const categories = smCfg.include_categories === false ? [] : await fetchRows("product_categories?select=slug&is_active=eq.true&slug=not.is.null");
const categoryEntries = categories
  .filter((c) => c.slug)
  .map((c) => ({ path: `/category/${c.slug}`, changefreq: "weekly", priority: "0.7" }));

const pages = smCfg.include_cms_pages === false ? [] : await fetchRows("cms_pages?select=slug&is_published=eq.true").catch(() => []);
const pageEntries = (Array.isArray(pages) ? pages : [])
  .filter((p) => p.slug)
  .map((p) => ({ path: `/${p.slug}`, changefreq: "monthly", priority: "0.5" }));

const entries = [...staticEntries, ...productEntries, ...categoryEntries, ...pageEntries];

function generateSitemap(entries) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);

// Write robots.txt from admin SEO settings (if configured)
const robotsCfg = seoMap.robots || {};
if (robotsCfg.content && typeof robotsCfg.content === "string") {
  writeFileSync(resolve("public/robots.txt"), robotsCfg.content);
  console.log("robots.txt written from admin settings");
}
