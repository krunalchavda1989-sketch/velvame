import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Megaphone, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageBreadcrumb from "@/components/PageBreadcrumb";
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

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("monthly_offers")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false });
      setOffers((data as unknown as Offer[]) || []);
      setLoading(false);
    };
    fetchOffers();
  }, []);

  const daysLeft = (endDate: string) => {
    const diff = Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <PageBreadcrumb
          title="Monthly Offers"
          subtitle="Explore this month's exclusive deals and discounts. Limited time only — grab them before they're gone!"
        />

        <div className="container px-4 pt-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Tag className="h-14 w-14 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                No Active Offers
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                There are no offers running right now. Check back soon for exciting deals!
              </p>
              <Link to="/shop">
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                  Browse Shop <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer, i) => {
                const remaining = daysLeft(offer.end_date);
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 transition-all hover:shadow-lg h-full flex flex-col">
                      <div className="relative h-52 bg-secondary flex items-center justify-center">
                        {offer.image_url ? (
                          <img
                            src={offer.image_url}
                            alt={offer.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground/40">
                            {offer.offer_type === "banner" ? (
                              <Megaphone className="h-14 w-14" />
                            ) : (
                              <Tag className="h-14 w-14" />
                            )}
                          </div>
                        )}
                        {offer.offer_type === "product_discount" &&
                          offer.discount_percentage && (
                            <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md">
                              {offer.discount_percentage}% OFF
                            </span>
                          )}
                        {remaining <= 3 && remaining > 0 && (
                          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                            Ends in {remaining} day{remaining !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-display font-bold text-foreground text-lg mb-2">
                          {offer.title}
                        </h3>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground mb-4 flex-1">
                            {offer.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              Valid till{" "}
                              {new Date(offer.end_date).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </span>
                          </div>
                          {offer.product_id && (
                            <Link
                              to={`/product/${offer.product_id}`}
                              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                            >
                              View Product <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Offers;
