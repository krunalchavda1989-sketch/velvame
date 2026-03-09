import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";

const Footer = () => {
  const brand = useBrand();

  return (
    <footer className="border-t border-border py-12">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.brand_name} className="h-10 w-auto max-w-[160px] object-contain" />
              ) : (
                <Crown className="h-6 w-6 text-primary" />
              )}
              <span className="font-display text-lg font-bold text-gradient-gold">{brand.brand_name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {brand.tagline || "Build your network, grow your income. The premium MLM platform."}
            </p>
            {brand.email && (
              <p className="text-sm text-muted-foreground mt-2">📧 {brand.email}</p>
            )}
            {brand.phone && (
              <p className="text-sm text-muted-foreground mt-1">📞 {brand.phone}</p>
            )}
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              {[
                { label: "Shop", href: "/shop" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "FAQ", href: "/faq" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {[
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Get Started</h4>
            <ul className="space-y-2">
              {[
                { label: "Register", href: "/register" },
                { label: "Login", href: "/login" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {brand.brand_name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
