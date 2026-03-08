import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}

const PageBreadcrumb = ({ title, subtitle, breadcrumbs, children }: PageBreadcrumbProps) => {
  const crumbs: BreadcrumbItem[] = breadcrumbs || [{ label: title }];

  return (
    <section className="relative border-b border-border bg-card/50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      <div className="container px-4 relative">
        {/* Breadcrumb trail */}
        <div className="pt-6 pb-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-3 w-3" />
              <span>Home</span>
            </Link>
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                {crumb.href && i < crumbs.length - 1 ? (
                  <Link to={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{subtitle}</p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
};

export default PageBreadcrumb;
