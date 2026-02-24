import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Wallet as WalletIcon, TrendingUp, ArrowDownToLine, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WalletData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface Commission {
  id: string;
  amount: number;
  rate: number;
  level: number;
  commission_type: string;
  status: string;
  created_at: string;
}

const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [walletRes, commissionsRes] = await Promise.all([
        supabase.from("wallets").select("balance, total_earned, total_withdrawn").eq("user_id", user.id).single(),
        supabase.from("commissions").select("id, amount, rate, level, commission_type, status, created_at").eq("beneficiary_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      setWallet(walletRes.data);
      setCommissions((commissionsRes.data as Commission[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const stats = [
    { label: "Available Balance", value: wallet?.balance ?? 0, icon: WalletIcon, highlight: true },
    { label: "Total Earned", value: wallet?.total_earned ?? 0, icon: TrendingUp },
    { label: "Total Withdrawn", value: wallet?.total_withdrawn ?? 0, icon: ArrowDownToLine },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your balance, earnings and commissions</p>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    s.highlight ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    s.highlight ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    <s.icon className={`h-5 w-5 ${s.highlight ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-foreground">
                      {formatCurrency(s.value)}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Commissions table */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-display font-semibold text-foreground">Commission History</h2>
              </div>

              {commissions.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No commissions yet. Grow your team to start earning!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {commissions.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            Level {c.level} · {c.commission_type}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(c.created_at)} · {c.rate}% rate
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-display font-bold text-foreground">
                          {formatCurrency(c.amount)}
                        </span>
                        <Badge variant="outline" className={`text-xs ${statusColor(c.status)}`}>
                          {c.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;
