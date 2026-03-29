import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MASTER_ADMIN_EMAIL = "shweta1112025@gmail.com";

export const useAdminCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setIsMasterAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      // Check if master admin (has admin role AND correct email)
      if (user.email === MASTER_ADMIN_EMAIL) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (data) {
          setIsAdmin(true);
          setIsMasterAdmin(true);
          setLoading(false);
          return;
        }
      }

      // Check if sub-admin
      const { data: subAdmin } = await supabase
        .from("admin_sub_users")
        .select("is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (subAdmin) {
        setIsAdmin(true);
        setIsMasterAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(false);
      setIsMasterAdmin(false);
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  return { isAdmin, isMasterAdmin, loading };
};
