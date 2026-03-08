import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, LayoutDashboard, Users, Wallet, ShoppingBag, Package,
  BarChart3, Settings, Link2, LogOut, ChevronLeft, ChevronRight, Award, GitBranch, CreditCard, MapPin,
  Menu, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";


const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "My Team", href: "/dashboard/team" },
  { icon: GitBranch, label: "Genealogy", href: "/dashboard/genealogy" },
  { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
  { icon: BarChart3, label: "Earnings", href: "/dashboard/earnings" },
  { icon: Package, label: "Orders", href: "/dashboard/orders" },
  { icon: CreditCard, label: "Payment & Subscription", href: "/dashboard/payment" },
  { icon: MapPin, label: "My Addresses", href: "/dashboard/addresses" },
  { icon: ShoppingBag, label: "Shop", href: "/shop" },
  { icon: Link2, label: "Invite Link", href: "/dashboard/invite" },
  { icon: Award, label: "My Title", href: "/dashboard/title" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const brand = useBrand();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navLinks = (isMobile: boolean) =>
    menuItems.map((item) => {
      const active = location.pathname === item.href ||
        (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
      return (
        <Link
          key={item.label}
          to={item.href}
          onClick={() => isMobile && setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {(isMobile || !collapsed) && <span>{item.label}</span>}
        </Link>
      );
    });

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.brand_name} className="h-8 w-auto object-contain rounded flex-shrink-0" />
          ) : (
            <Crown className="h-6 w-6 text-primary flex-shrink-0" />
          )}
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navLinks(isMobile)}
      </nav>

      <div className="p-2 border-t border-border">
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary w-full"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(isMobile || !collapsed) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4 md:hidden">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.brand_name} className="h-6 w-auto object-contain rounded" />
          ) : (
            <Crown className="h-5 w-5 text-primary" />
          )}
          <span className="text-sm font-semibold text-foreground">Dashboard</span>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col"
            >
              {sidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 border-r border-border bg-card transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        } hidden md:flex flex-col`}
      >
        {sidebarContent(false)}
      </aside>

      <main className={`flex-1 transition-all duration-300 pt-14 md:pt-0 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
