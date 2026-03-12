import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Checks if the current user's next order will be their first successful order,
 * and whether they are a paid subscriber (membership_source = 'paid').
 * 
 * Rules:
 * - First order of a paid subscriber → use retail pricing
 * - Otherwise → use normal (distributor if member, retail if not)
 */
export const useFirstOrderCheck = () => {
  const { user, profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["first-order-check", user?.id],
    queryFn: async () => {
      if (!user) return { isFirstOrder: false, isPaidSubscriber: false, useRetailPricing: false };

      // Count successful orders (not cancelled/failed)
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("status", "in", '("cancelled","failed")');

      const isFirstOrder = (count ?? 0) === 0;
      
      // Check if membership was obtained via paid subscription (not auto)
      const isPaidSubscriber = !!profile?.subscription_paid && profile?.membership_source === "paid";

      return {
        isFirstOrder,
        isPaidSubscriber,
        // First order of a paid subscriber must use retail pricing
        useRetailPricing: isFirstOrder && isPaidSubscriber,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  return {
    isFirstOrder: data?.isFirstOrder ?? false,
    isPaidSubscriber: data?.isPaidSubscriber ?? false,
    useRetailPricing: data?.useRetailPricing ?? false,
    isLoading,
  };
};
