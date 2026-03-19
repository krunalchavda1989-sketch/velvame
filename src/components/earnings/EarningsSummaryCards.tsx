import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Layers, RefreshCw, Clock } from "lucide-react";

interface Props {
  summary: { total: number; levelIncome: number; repurchaseIncome: number; pending: number };
  currencySymbol: string;
  onCardClick: (section: string) => void;
}

const cards = [
  { key: "total", label: "Total Earnings", icon: DollarSign, section: "level", color: "text-primary" },
  { key: "levelIncome", label: "Level Income", icon: Layers, section: "level", color: "text-green-500" },
  { key: "repurchaseIncome", label: "Repurchase Income", icon: RefreshCw, section: "repurchase", color: "text-blue-500" },
  { key: "pending", label: "Pending / Unpaid", icon: Clock, section: "log", color: "text-amber-500" },
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
        >
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onCardClick(c.section)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">
                {currencySymbol}{summary[c.key].toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
