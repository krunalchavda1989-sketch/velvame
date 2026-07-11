import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useAdminCheck();
  const location = useLocation();
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Re-verify session on mount and when the page is restored from bfcache
  // (browser back/forward). Without this, a logged-out admin can hit the back
  // button and see the previously rendered admin UI from cache.
  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSessionValid(!!data.session);
    };

    const onPageShow = (e: PageTransitionEvent) => {
      // If page was restored from bfcache, force a hard reload so React
      // state and auth are re-initialised from scratch.
      if (e.persisted) {
        window.location.reload();
        return;
      }
      verify();
    };

    verify();
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [location.pathname]);

  if (authLoading || loading || sessionValid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !sessionValid) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default AdminRoute;
