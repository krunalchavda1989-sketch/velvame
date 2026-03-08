import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_MEMBERSHIP_AMOUNT = 2800;

export const useMembershipAmount = () => {
  const { data: amount = DEFAULT_MEMBERSHIP_AMOUNT, isLoading } = useQuery({
    queryKey: ["membership-amount"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages_content")
        .select("content")
        .eq("page_slug", "membership-settings")
        .maybeSingle();
      if (data?.content) {
        const content = data.content as any;
        return Number(content.membership_amount) || DEFAULT_MEMBERSHIP_AMOUNT;
      }
      return DEFAULT_MEMBERSHIP_AMOUNT;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { amount, isLoading };
};
