import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Megaphone, ChevronRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  offer_type: string;
  discount_percentage: number | null;
  product_id: string | null;
  start_date: string;
  end_date: string;
}

const MonthlyOffersSection = () => {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    const fetchOffers = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("monthly_offers")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .limit(6);
      setOffers((data as unknown as Offer[]) || []);
    };
    fetchOffers();
  }, []);

  if (offers.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Monthly <span className="text-gradient-gold">Offers</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Don't miss out on this month's exclusive deals
            </p>
          </div>
          <Link
            to="/offers"
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer, i) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={offer.product_id ? `/product/${offer.product_id}` : "/offers"}
                className="block rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 transition-all hover:shadow-lg"
              >
                <div className="relative h-44 bg-secondary flex items-center justify-center">
                  {offer.image_url ? (
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground/40">
                      {offer.offer_type === "banner" ? (
                        <Megaphone className="h-12 w-12" />
                      ) : (
                        <Tag className="h-12 w-12" />
                      )}
                    </div>
                  )}
                  {offer.offer_type === "product_discount" && offer.discount_percentage && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
                      {offer.discount_percentage}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
                    {offer.title}
                  </h3>
                  {offer.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {offer.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Valid till{" "}
                      {new Date(offer.end_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MonthlyOffersSection;
