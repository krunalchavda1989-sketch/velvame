import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Crown, LayoutDashboard, LogOut, ShoppingCart, BadgeCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useBrand } from "@/contexts/BrandContext";
import { supabase } from "@/integrations/supabase/client";
import { useMembershipAmount } from "@/hooks/useMembershipAmount";
import CartDrawer from "@/components/shop/CartDrawer";
import AnnouncementBar from "@/components/dashboard/AnnouncementBar";

const fallbackLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { totalItems, cartOpen, setCartOpen } = useCart();
  const brand = useBrand();
  const { amount: membershipAmount } = useMembershipAmount();
  const [navLinks, setNavLinks] = useState(fallbackLinks);

  useEffect(() => {
    supabase
      .from("nav_menus")
      .select("label, href, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setNavLinks(data.map((d) => ({ label: d.label, href: d.href })));
        }
      });
  }, []);

  const BrandLogo = () => (
    <>
      {brand.logo_url ? (
        <img src={brand.logo_url} alt={brand.brand_name} className="h-10 w-auto max-w-[160px] object-contain" />
      ) : (
        <>
          <Crown className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-gradient-gold">{brand.brand_name}</span>
        </>
      )}
    </>
  );

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
        <nav className="glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-gray-900 relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {profile?.full_name || "Dashboard"}
                  </Button>
                  {profile?.subscription_paid ? (
                    <Badge className="bg-success/15 text-success border-success/30 text-[10px] px-1.5 py-0 h-5 gap-0.5">
                      <BadgeCheck className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Link to="/dashboard/payment" onClick={(e) => e.stopPropagation()}>
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px] px-1.5 py-0 h-5 gap-0.5 hover:bg-amber-500/10 cursor-pointer">
                        <ShieldAlert className="h-3 w-3" />
                        Inactive
                      </Badge>
                    </Link>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-gray-500 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="icon" variant="outline" className="rounded-full">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
            <button className="text-gray-700" onClick={() => setOpen(!open)}>
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-border"
            >
              <div className="flex flex-col p-4 gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground py-2"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="w-full">
                      <Button variant="ghost" className="w-full justify-start text-muted-foreground gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {profile?.full_name || "Dashboard"}
                        {profile?.subscription_paid ? (
                          <Badge className="bg-success/15 text-success border-success/30 text-[10px] px-1.5 py-0 h-5 gap-0.5 ml-auto">
                            <BadgeCheck className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px] px-1.5 py-0 h-5 gap-0.5 ml-auto">
                            <ShieldAlert className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-destructive gap-2"
                      onClick={() => { signOut(); setOpen(false); }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-muted-foreground">Login</Button>
                    </Link>
                    <Link to="/register" onClick={() => setOpen(false)}>
                      <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold">Join Now</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </nav>
      </div>

      <CartDrawer />
    </>
  );
};

export default Navbar;
