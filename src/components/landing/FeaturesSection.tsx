import { motion } from "framer-motion";
import { ShoppingBag, Wallet, Users, BarChart3, Shield, Smartphone } from "lucide-react";

const features = [
  { icon: ShoppingBag, title: "Product Shop", desc: "Browse and buy quality products at distributor prices." },
  { icon: Wallet, title: "Instant Wallet", desc: "Commission wallet with easy withdrawal to bank account." },
  { icon: Users, title: "Team Network", desc: "Track your entire downline tree with real-time insights." },
  { icon: BarChart3, title: "Earnings Reports", desc: "Detailed monthly reports of all commission streams." },
  { icon: Shield, title: "Secure Payments", desc: "Multiple payment gateways with encrypted transactions." },
  { icon: Smartphone, title: "PWA Ready", desc: "Install on any device — works like a native app." },
];

const FeaturesSection = () => {
  return (
    <section className="py-24">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Everything You Need to <span className="text-gradient-gold">Succeed</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A complete platform with tools for selling, earning, and growing your network.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
