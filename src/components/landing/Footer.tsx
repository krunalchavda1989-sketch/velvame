import { Crown } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold text-gradient-gold">NexaMLM</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Build your network, grow your income. The premium MLM platform.
            </p>
          </div>

          {[
            { title: "Platform", links: ["Shop", "Dashboard", "Pricing", "FAQ"] },
            { title: "Company", links: ["About", "Blog", "Contact", "Careers"] },
            { title: "Legal", links: ["Privacy", "Terms", "Refunds", "Compliance"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © 2026 NexaMLM. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
