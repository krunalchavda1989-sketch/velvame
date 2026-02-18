import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, Shield } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      <div className="container relative z-10 px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold bg-secondary/50 mb-8">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-gold" />
            <span className="text-xs font-medium text-primary">Lifetime Membership — One-time ₹2800</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
            Build Your Empire with{" "}
            <span className="text-gradient-gold">9-Level</span> Network Income
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join NexaMLM — purchase products, refer others, and earn commissions across 9 levels. 
            Your network, your wealth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold text-base px-8 glow-gold hover:opacity-90 transition-opacity">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: Users, label: "50,000+", sub: "Active Members" },
              { icon: TrendingUp, label: "₹12Cr+", sub: "Commissions Paid" },
              { icon: Shield, label: "100%", sub: "Secure Payments" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border"
              >
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="text-2xl font-display font-bold text-foreground">{stat.label}</span>
                <span className="text-xs text-muted-foreground">{stat.sub}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
