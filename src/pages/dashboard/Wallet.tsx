import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization } from "@/hooks/useLocalization";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon, TrendingUp, ArrowDownToLine, Clock,
  DollarSign, Send, AlertCircle, CheckCircle2, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  upi_id: string | null;
  admin_note: string | null;
  created_at: string;
}

const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, commissionsRes, withdrawalsRes] = await Promise.all([
      supabase.from("wallets").select("balance, total_earned, total_withdrawn").eq("user_id", user.id).single(),
      supabase.from("commissions").select("id, amount, rate, level, commission_type, status, created_at").eq("beneficiary_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("withdrawal_requests").select("id, amount, status, upi_id, admin_note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setWallet(walletRes.data);
    setCommissions((commissionsRes.data as Commission[]) || []);
    setWithdrawals((withdrawalsRes.data as WithdrawalRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > (wallet?.balance ?? 0)) {
      toast.error("Insufficient balance");
      return;
    }
    if (!upiId.trim()) {
      toast.error("Enter your UPI ID");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      amount,
      upi_id: upiId.trim(),
    });

    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Withdrawal request submitted!");
      setDialogOpen(false);
      setWithdrawAmount("");
      setUpiId("");
      fetchData();
    }
    setSubmitting(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": case "approved": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "approved": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Wallet</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your balance, earnings and commissions</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!wallet || wallet.balance <= 0}>
                <Send className="h-4 w-4" /> Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Withdrawal</DialogTitle>
                <DialogDescription>
                  Available balance: {formatCurrency(wallet?.balance ?? 0)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={1}
                    max={wallet?.balance ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input
                    id="upi"
                    type="text"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Withdrawals are reviewed by the admin and typically processed within 24-48 hours.</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleWithdraw} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

            {/* Withdrawal Requests */}
            {withdrawals.length > 0 && (
              <div className="rounded-xl bg-card border border-border overflow-hidden mb-6">
                <div className="p-4 border-b border-border">
                  <h2 className="font-display font-semibold text-foreground">Withdrawal Requests</h2>
                </div>
                <div className="divide-y divide-border">
                  {withdrawals.map((w, i) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {statusIcon(w.status)}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {formatCurrency(w.amount)}
                            {w.upi_id && <span className="text-muted-foreground ml-2">→ {w.upi_id}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(w.created_at)}
                            {w.admin_note && <span className="ml-2">· {w.admin_note}</span>}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusColor(w.status)}`}>
                        {w.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

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
