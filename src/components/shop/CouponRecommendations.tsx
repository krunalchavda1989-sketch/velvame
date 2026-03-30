import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  end_date: string;
}

interface Props {
  onSelect: (code: string) => void;
  appliedCode?: string;
}

const CouponRecommendations = ({ onSelect, appliedCode }: Props) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("coupons")
        .select("id, code, discount_type, discount_value, max_discount_amount, min_order_amount, end_date, max_uses, used_count")
        .eq("is_active", true)
        .gte("end_date", now)
        .order("discount_value", { ascending: false });

      const valid = (data || []).filter(
        (c: any) => !c.max_uses || c.used_count < c.max_uses
      );
      setCoupons(valid);
    };
    fetchCoupons();
  }, []);

  if (coupons.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Available Coupons</p>
      <div className="flex flex-wrap gap-2">
        {coupons.map((c) => {
          const isApplied = appliedCode === c.code;
          const label =
            c.discount_type === "percentage"
              ? `${c.discount_value}% off`
              : `₹${c.discount_value} off`;

          return (
            <button
              key={c.id}
              onClick={() => !isApplied && onSelect(c.code)}
              disabled={isApplied}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isApplied
                  ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 cursor-default"
                  : "bg-secondary/50 border-border hover:border-primary/50 hover:bg-primary/5 text-foreground cursor-pointer"
              }`}
            >
              <Ticket className="h-3 w-3 shrink-0" />
              <span className="font-mono font-bold">{c.code}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {label}
              </Badge>
              {c.min_order_amount && c.min_order_amount > 0 && (
                <span className="text-muted-foreground text-[10px]">Min ₹{c.min_order_amount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CouponRecommendations;
