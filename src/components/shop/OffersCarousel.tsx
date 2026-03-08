import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Tag, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  offer_type: string;
  discount_percentage: number;
  product_id: string | null;
  start_date: string;
  end_date: string;
}

const OffersCarousel = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("monthly_offers")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false });
      setOffers((data as unknown as Offer[]) || []);
    };
    fetch();
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % offers.length), [offers.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + offers.length) % offers.length), [offers.length]);

  // Auto-advance every 5s
  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [offers.length, next]);

  if (offers.length === 0) return null;

  const offer = offers[current];

  return (
    <div className="relative mb-8 rounded-xl overflow-hidden border border-border bg-card group">
      <AnimatePresence mode="wait">
        <motion.div
          key={offer.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row items-center"
        >
          {offer.image_url ? (
            <div className="w-full sm:w-1/3 h-40 sm:h-48 flex-shrink-0">
              <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full sm:w-1/3 h-40 sm:h-48 flex-shrink-0 bg-primary/5 flex items-center justify-center">
              {offer.offer_type === "banner" ? (
                <Megaphone className="h-12 w-12 text-primary/40" />
              ) : (
                <Tag className="h-12 w-12 text-primary/40" />
              )}
            </div>
          )}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-2">
              {offer.offer_type === "product_discount" && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {offer.discount_percentage}% OFF
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Valid till {new Date(offer.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
            <h3 className="text-lg font-display font-bold text-foreground mb-1">{offer.title}</h3>
            {offer.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{offer.description}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {offers.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {offers.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OffersCarousel;
