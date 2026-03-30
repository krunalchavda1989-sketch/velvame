import { motion } from "framer-motion";
import { DollarSign, Layers, RefreshCw, Clock } from "lucide-react";

interface Props {
  summary: { total: number; levelIncome: number; repurchaseIncome: number; pending: number };
  currencySymbol: string;
  onCardClick: (section: string) => void;
}

const cards = [
  { key: "total", label: "Total Earnings", icon: DollarSign, section: "level", gradient: "from-blue-500 to-blue-600" },
  { key: "levelIncome", label: "Level Income", icon: Layers, section: "level", gradient: "from-emerald-500 to-emerald-600" },
  { key: "repurchaseIncome", label: "Repurchase Income", icon: RefreshCw, section: "repurchase", gradient: "from-purple-500 to-purple-600" },
  { key: "pending", label: "Pending / Unpaid", icon: Clock, section: "log", gradient: "from-amber-500 to-amber-600" },
] as const;

export default function EarningsSummaryCards({ summary, currencySymbol, onCardClick }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`rounded-xl bg-gradient-to-br ${c.gradient} p-4 text-white shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all`}
          onClick={() => onCardClick(c.section)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs opacity-80">{c.label}</span>
            <c.icon className="h-4 w-4 opacity-80" />
          </div>
          <p className="text-xl font-bold">
            {currencySymbol}{summary[c.key].toLocaleString()}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
