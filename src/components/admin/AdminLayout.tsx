import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import {
  Crown, LayoutDashboard, Users, Package, ShoppingCart,
  BarChart3, ArrowDownToLine, ChevronLeft, ChevronRight, Settings,
  Store, Map, Trophy, Megaphone, Ticket, Layers, FolderTree, FileText,
  CreditCard, ShoppingBag, ChevronDown, LogOut, MessageSquareQuote, PanelTop,
  TrendingUp
} from "lucide-react";

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  children?: { icon: any; label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  {
    icon: Package, label: "Products", href: "/admin/products",
    children: [
      { icon: FolderTree, label: "Categories", href: "/admin/categories" },
    ],
  },
  {
    icon: ShoppingCart, label: "Orders", href: "/admin/orders",
    children: [
      { icon: CreditCard, label: "Transactions", href: "/admin/transactions" },
      { icon: ShoppingBag, label: "Manual Order", href: "/admin/manual-order" },
    ],
  },
  { icon: BarChart3, label: "Commissions", href: "/admin/commissions" },
  { icon: ArrowDownToLine, label: "Withdrawals", href: "/admin/withdrawals" },
  {
    icon: Store, label: "Website", href: "/admin/brand-settings",
    children: [
      { icon: PanelTop, label: "Hero Stats", href: "/admin/hero-stats" },
      { icon: Store, label: "Brand Settings", href: "/admin/brand-settings" },
      { icon: FileText, label: "Page Manager", href: "/admin/pages" },
      { icon: MessageSquareQuote, label: "Testimonials", href: "/admin/testimonials" },
    ],
  },
  { icon: Map, label: "Title Roadmap", href: "/admin/title-roadmap" },
  { icon: Layers, label: "Commission Levels", href: "/admin/commission-levels" },
  { icon: Trophy, label: "Awards & Rewards", href: "/admin/awards" },
  { icon: Megaphone, label: "Monthly Offers", href: "/admin/offers" },
  { icon: Ticket, label: "Coupons", href: "/admin/coupons" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const brand = useBrand();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const isChildActive = (item: MenuItem) =>
    item.children?.some((c) => location.pathname === c.href) || false;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.children && (location.pathname === item.href || isChildActive(item))) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed left-0 top-0 h-full z-40 border-r border-border bg-card transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        } hidden md:flex flex-col`}
      >
        <div className="flex items-center justify-center px-4 h-16 border-b border-border">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.brand_name} className="h-8 w-auto object-contain rounded flex-shrink-0" />
          ) : (
            <Crown className="h-6 w-6 text-primary flex-shrink-0" />
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const active = location.pathname === item.href;
            const hasChildren = item.children && item.children.length > 0;
            const groupOpen = openGroups[item.label] || false;
            const childActive = isChildActive(item);

            return (
              <div key={item.label}>
                {/* Parent item */}
                <div className="flex items-center">
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors flex-1 min-w-0 ${
                      active || childActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                  {hasChildren && !collapsed && (
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          groupOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Children */}
                {hasChildren && !collapsed && groupOpen && (
                  <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-0.5">
                    {item.children!.map((child) => {
                      const childIsActive = location.pathname === child.href;
                      return (
                        <Link
                          key={child.label}
                          to={child.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            childIsActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
