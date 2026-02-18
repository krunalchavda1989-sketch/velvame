import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Crown, LayoutDashboard, Users, Wallet, ShoppingBag,
  BarChart3, Settings, Link2, LogOut, ChevronLeft, ChevronRight, Award
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "My Team", href: "/dashboard/team" },
  { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
  { icon: BarChart3, label: "Earnings", href: "/dashboard/earnings" },
  { icon: ShoppingBag, label: "Shop", href: "/shop" },
  { icon: Link2, label: "Invite Link", href: "/dashboard/invite" },
  { icon: Award, label: "My Title", href: "/dashboard/title" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed left-0 top-0 h-full z-40 border-r border-border bg-card transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        } hidden md:flex flex-col`}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border">
          <Crown className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && <span className="font-display font-bold text-gradient-gold">NexaMLM</span>}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {menuItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
