## Goal

Build a master-admin **SEO Manager** module (RankMath-style) that centralizes every SEO knob for the site — global meta, social cards, schema, robots.txt, sitemap, verification codes, per-page overrides, and a live audit of each indexable URL.

## New admin route

`/admin/seo` — Master-admin only (uses existing `AdminRoute` + master email gate). Added to the sidebar **Website** group as "SEO Manager" (Search icon).

Tabbed layout inside the page:

```
┌─ SEO Manager ──────────────────────────────────────────────┐
│ [General] [Titles & Meta] [Social] [Schema]                │
│ [Sitemap] [Robots.txt] [Verification] [Redirects] [Audit]  │
└────────────────────────────────────────────────────────────┘
```

## What each tab does

**1. General**
- Site name, default separator (` — `, `|`, `·`), default meta description, default OG image (upload to `branding` bucket), Twitter handle, default locale.
- Knowledge Graph: Organization vs Person, logo, contact, sameAs social URLs (pulled from existing `social_media_links` table).

**2. Titles & Meta**
- Per-route templates with tokens (`%page_title%`, `%site_name%`, `%product_name%`, `%category_name%`, `%price%`).
- Routes covered: Home, Shop, Offers, About, Contact, FAQ, Product (`/product/:slug`), Category (`/category/:slug`), CMS page (`/:slug`).
- Live Google SERP preview (title + URL + description) as user types — same component pattern already in `AdminProductForm.tsx` lines 630-640.
- Noindex/Nofollow toggles per route group.

**3. Social**
- OG & Twitter card defaults (type, image, title/description templates).
- Per-route OG image overrides.
- Twitter card type (summary, summary_large_image).

**4. Schema (JSON-LD)**
- Toggle which schemas to inject: Organization, WebSite + SearchAction, BreadcrumbList, Product (already in `ProductSEOHead.tsx`), FAQPage, Article.
- Editor for Organization fields (name, logo, address, contactPoint, sameAs).

**5. Sitemap**
- Read-only viewer of current `/sitemap.xml` with entry count and grouped breakdown (Static / Products / Categories / CMS pages).
- "Regenerate Now" button → calls a new edge function `regenerate-sitemap` that rebuilds and uploads `sitemap.xml` to the `public` storage bucket (or rewrites it via the same logic in `scripts/generate-sitemap.mjs`, executed server-side).
- Per-section toggles: include/exclude Products, Categories, CMS pages, Auth pages.
- Per-route `priority` and `changefreq` settings.
- "Ping Google / Bing" button after regeneration.
- Direct link: `https://velvame.lovable.app/sitemap.xml`.

**6. Robots.txt**
- Live editor (Monaco-style textarea) with current contents of `public/robots.txt`.
- Pre-built rule blocks (toggle): Block /admin, Block /dashboard, Block /checkout, Allow Googlebot/Bingbot, Add Sitemap directive.
- Saves to DB (`seo_settings.robots_txt`) and an edge function `serve-robots` returns it dynamically — OR writes to storage. (See "Serving dynamic files" below.)
- Direct link: `https://velvame.lovable.app/robots.txt`.

**7. Verification**
- Inputs for: Google Search Console, Bing Webmaster, Yandex, Pinterest, Facebook Domain Verification.
- Each saves as a `<meta>` tag injected into `<head>` via a new `<SEOHead>` component mounted in `App.tsx` (uses `react-helmet-async`, already documented as the pattern).
- Replaces the currently hard-coded `google-site-verification` meta in `index.html`.

**8. Redirects (301)**
- Table of `from_path` → `to_path` → `status_code` (301/302/307).
- Stored in `seo_redirects` table.
- Implemented client-side via a route guard component that checks the table on navigation (since Lovable hosting has no edge redirects).

**9. Audit**
- Crawls every indexable URL (same source as sitemap) and shows a status table:
  - ✅/⚠️/❌ for each: title length (30-60), description length (120-160), H1 present, canonical present, OG image, schema present, image alt coverage.
- Filterable, exportable CSV. Mirrors the `seo_chat--list_findings` style.

## Data model (single migration)

```sql
-- Global + per-route SEO config
create table public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,        -- 'global', 'route:/shop', 'route:product', etc.
  config jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Site-wide verification + robots stored as rows under key='global'
-- e.g. { google_verification, bing_verification, robots_txt, default_og_image, ... }

create table public.seo_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text unique not null,
  to_path text not null,
  status_code int not null default 301,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS: master admin write, public read (so client can apply redirects + meta)
```

## Serving dynamic files

`robots.txt` and `sitemap.xml` are static files in `public/`. Two options — pick one in clarifying question below:

- **A. Edge function + URL rewrite**: New `serve-robots` and `serve-sitemap` functions that read DB and return text. Frontend keeps a stub `public/robots.txt` redirecting via meta — but Lovable hosting can't do edge rewrites. So this needs the user to link `/robots.txt` to the function URL, which Googlebot won't honor.
- **B. Storage bucket approach**: Admin edits → edge function rewrites the file in a public storage bucket → `index.html` doesn't change. Still can't replace `/robots.txt` path.
- **C. Pragmatic hybrid (recommended)**: Admin UI saves to DB AND triggers a build-time regeneration. The `scripts/generate-sitemap.mjs` script (already in place) is extended to read `seo_settings` from the DB and rewrite both `public/sitemap.xml` and `public/robots.txt` on every `predev`/`prebuild`. Admin sees a "Changes will go live on next publish" banner with a one-click "Publish now" link. This matches how the current sitemap already works.

## Per-page meta injection

Add `src/components/SEOHead.tsx` (uses `react-helmet-async`, install required):
- Reads `seo_settings` once via React Query.
- Mounted in `App.tsx` once at root.
- Each route component already using `<Helmet>` (e.g. `ProductSEOHead`) continues to override.
- Removes the hard-coded `google-site-verification` meta from `index.html` (replaced by SEOHead-injected version driven by admin).

## Sidebar entry

Add to `src/components/admin/AdminLayout.tsx` Website children:
```
{ icon: Search, label: "SEO Manager", href: "/admin/seo" },
```

## Files to create

- `supabase/migrations/<ts>_seo_manager.sql` — tables + RLS + seed default `global` row
- `src/pages/admin/AdminSEOManager.tsx` — tabbed shell
- `src/components/admin/seo/GeneralTab.tsx`
- `src/components/admin/seo/TitlesMetaTab.tsx` (with `SerpPreview`)
- `src/components/admin/seo/SocialTab.tsx`
- `src/components/admin/seo/SchemaTab.tsx`
- `src/components/admin/seo/SitemapTab.tsx`
- `src/components/admin/seo/RobotsTab.tsx`
- `src/components/admin/seo/VerificationTab.tsx`
- `src/components/admin/seo/RedirectsTab.tsx`
- `src/components/admin/seo/AuditTab.tsx`
- `src/components/SEOHead.tsx` — sitewide head injector
- `src/components/RedirectHandler.tsx` — applies redirect table
- `supabase/functions/seo-audit/index.ts` — crawls URLs, returns metrics
- `supabase/functions/regenerate-sitemap/index.ts` — rewrites sitemap from DB
- Extend `scripts/generate-sitemap.mjs` to also rewrite `public/robots.txt` from DB

## Files to edit

- `src/App.tsx` — register `/admin/seo`, mount `<SEOHead/>` and `<RedirectHandler/>`
- `src/components/admin/AdminLayout.tsx` — add sidebar item
- `index.html` — remove hardcoded google-site-verification (replaced by dynamic injector)
- `package.json` — `react-helmet-async` (already in use via ProductSEOHead — verify)

## Clarifying questions

Before implementing I want to confirm a few things — see questions in chat.
