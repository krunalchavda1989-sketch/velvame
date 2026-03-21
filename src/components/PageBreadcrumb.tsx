import { Link } from "react-router-dom";
import { useBreadcrumbSettings, getHeightPx, getBackgroundStyle } from "@/hooks/useBreadcrumbSettings";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
  pageType?: string;
}

const PageBreadcrumb = ({ title, subtitle, breadcrumbs, children, pageType = "cms" }: PageBreadcrumbProps) => {
  const { settings: s, loading } = useBreadcrumbSettings();
  const crumbs: BreadcrumbItem[] = breadcrumbs || [{ label: title }];

  // Check visibility
  if (!loading && s.visibility_settings && pageType && s.visibility_settings[pageType] === false) {
    return null;
  }

  const heightPx = getHeightPx(s);
  const bgStyle = getBackgroundStyle(s);

  const alignItems = s.vertical_position === "top" ? "flex-start" : s.vertical_position === "bottom" ? "flex-end" : "center";
  const textAlign = s.text_alignment as "left" | "center" | "right";

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        ...(c.href ? { item: `${window.location.origin}${c.href}` } : { item: window.location.href }),
      })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section
        className="relative overflow-hidden"
        style={{
          ...bgStyle,
          minHeight: `${heightPx}px`,
          display: "flex",
          alignItems,
        }}
      >
        {/* Overlay for background image */}
        {s.background_type === "image" && s.overlay_enabled && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: s.overlay_color, opacity: s.overlay_opacity / 100 }}
          />
        )}

        <div className="container px-4 relative z-10 py-4 w-full" style={{ textAlign }}>
          {/* Breadcrumb trail */}
          <nav aria-label="Breadcrumb" className="mb-2" style={{ display: "flex", justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start" }}>
            <ol className="flex flex-wrap items-center" style={{ gap: "6px", fontSize: `${s.crumb_font_size}px`, fontWeight: s.crumb_font_weight }}>
              <li>
                <Link to="/" style={{ color: s.crumb_active_color }} className="hover:underline transition-colors">
                  Home
                </Link>
              </li>
              {crumbs.map((crumb, i) => (
                <li key={i} className="flex items-center" style={{ gap: "6px" }}>
                  <span style={{ color: s.separator_color }}>{s.separator_symbol}</span>
                  {crumb.href && i < crumbs.length - 1 ? (
                    <Link to={crumb.href} style={{ color: s.crumb_active_color }} className="hover:underline transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span style={{ color: s.crumb_inactive_color }}>{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Page title */}
          <h1
            style={{
              fontSize: `${s.title_font_size}px`,
              fontWeight: s.title_font_weight,
              color: s.title_color,
              textTransform: s.title_transform as any,
              letterSpacing: `${s.title_letter_spacing}px`,
            }}
            className="font-display leading-tight"
          >
            {title}
          </h1>

          {subtitle && (
            <p style={{ color: s.crumb_inactive_color }} className="mt-1 text-sm max-w-xl">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </section>
    </>
  );
};

export default PageBreadcrumb;
