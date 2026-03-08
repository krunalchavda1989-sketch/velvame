import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useMembershipAmount } from "@/hooks/useMembershipAmount";

const CTASection = () => {
  const { amount: membershipAmount } = useMembershipAmount();
  return (
    <section className="py-24">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-card border border-primary/20 glow-gold-sm"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Ready to Start <span className="text-gradient-gold">Earning?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            One-time ₹{membershipAmount.toLocaleString("en-IN")} subscription unlocks lifetime access to products, commissions, and your personal network business.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold text-base px-10 glow-gold hover:opacity-90">
              Join NexaMLM Today <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
