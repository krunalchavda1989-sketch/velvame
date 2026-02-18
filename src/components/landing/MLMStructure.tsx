import { motion } from "framer-motion";

const levels = [
  { level: 1, rate: "5%", qualification: "1 Direct Referral", color: "from-primary to-gold-light" },
  { level: 2, rate: "4.5%", qualification: "3 Referrals", color: "from-primary to-gold-light" },
  { level: 3, rate: "4%", qualification: "3 Referrals", color: "from-primary to-gold-light" },
  { level: 4, rate: "3.5%", qualification: "3 Referrals", color: "from-primary to-gold-light" },
  { level: 5, rate: "3%", qualification: "3 Referrals", color: "from-primary to-gold-light" },
  { level: 6, rate: "2.5%", qualification: "6 Referrals", color: "from-accent to-gold-dark" },
  { level: 7, rate: "2%", qualification: "6 Referrals", color: "from-accent to-gold-dark" },
  { level: 8, rate: "1.5%", qualification: "6 Referrals", color: "from-accent to-gold-dark" },
  { level: 9, rate: "1%", qualification: "6 Referrals", color: "from-accent to-gold-dark" },
];

const MLMStructure = () => {
  return (
    <section className="py-24 bg-gradient-dark">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            <span className="text-gradient-gold">9-Level</span> Income Structure
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Earn commissions on every purchase made by your network, up to 9 levels deep.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto grid gap-3">
          {levels.map((l, i) => (
            <motion.div
              key={l.level}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-gold flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-lg">L{l.level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Level {l.level}</span>
                  <span className="text-xs text-muted-foreground">{l.qualification}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(10 - l.level) * 11}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-gold"
                  />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-xl font-display font-bold text-primary">{l.rate}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-3xl mx-auto p-6 rounded-xl bg-card border border-primary/20 glow-gold-sm"
        >
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Repurchase Income (3 Levels)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { level: 1, rate: "3%" },
              { level: 2, rate: "2%" },
              { level: 3, rate: "1%" },
            ].map((r) => (
              <div key={r.level} className="p-3 rounded-lg bg-secondary">
                <div className="text-xs text-muted-foreground mb-1">Level {r.level}</div>
                <div className="text-xl font-display font-bold text-primary">{r.rate}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MLMStructure;
