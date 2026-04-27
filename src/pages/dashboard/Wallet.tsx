import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization } from "@/hooks/useLocalization";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import WalletTransactionHistory from "@/components/wallet/WalletTransactionHistory";
import WalletReconciliationPanel from "@/components/wallet/WalletReconciliationPanel";
import {
  Wallet as WalletIcon, TrendingUp, ArrowDownToLine, Clock,
  DollarSign, Send, AlertCircle, CheckCircle2, XCircle, Info, ShoppingBag, Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface WalletData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  subscription_balance: number;
  commission_balance: number;
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
  const { currencySymbol } = useLocalization();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(true);

  // Withdrawal form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const commissionBalance = wallet?.commission_balance ?? 0;

  const [totalCommissionEarned, setTotalCommissionEarned] = useState(0);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, commissionsRes, withdrawalsRes, toggleRes] = await Promise.all([
      supabase.from("wallets").select("balance, total_earned, total_withdrawn, subscription_balance, commission_balance").eq("user_id", user.id).single(),
      supabase.from("commissions").select("id, amount, rate, level, commission_type, status, created_at").eq("beneficiary_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("withdrawal_requests").select("id, amount, status, upi_id, admin_note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("feature_toggles").select("is_enabled").eq("feature_key", "wallet_withdrawal").maybeSingle(),
    ]);
    setWallet(walletRes.data as any);
    setCommissions((commissionsRes.data as Commission[]) || []);
    setWithdrawals((withdrawalsRes.data as WithdrawalRequest[]) || []);
    if (toggleRes.data) setWithdrawalEnabled(toggleRes.data.is_enabled);

    // Use wallet's total_earned which already tracks commission totals
    if (walletRes.data) {
      setTotalCommissionEarned((walletRes.data as any).total_earned ?? 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // Validate withdrawal amount on change
  useEffect(() => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawError("");
      return;
    }
    if (amount > commissionBalance) {
      setWithdrawError("Withdrawal is not allowed from Subscription Balance. Only your Commission Balance is available for withdrawal. Please use your Subscription Balance for placing orders.");
    } else {
      setWithdrawError("");
    }
  }, [withdrawAmount, commissionBalance]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > commissionBalance) {
      toast.error("Withdrawal is not allowed from Subscription Balance. Only your Commission Balance is available for withdrawal.");
      return;
    }
    if (!upiId.trim()) {
      toast.error("Enter your UPI ID");
      return;
    }

    setSubmitting(true);

    // Server-side validation
    const { data: validation } = await supabase.rpc("validate_withdrawal" as any, {
      _user_id: user!.id,
      _amount: amount,
    });

    if (validation && !(validation as any).valid) {
      toast.error((validation as any).error || "Withdrawal validation failed");
      setSubmitting(false);
      return;
    }

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
      setWithdrawError("");
      fetchData();
    }
    setSubmitting(false);
  };

  const formatCurrency = (val: number) =>
    `${currencySymbol}${val.toLocaleString("en-IN")}`;

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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Wallet</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your balance, earnings and commissions</p>
          </div>

          {withdrawalEnabled && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setWithdrawError(""); setWithdrawAmount(""); } }}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={!wallet || commissionBalance <= 0}>
                  <Send className="h-4 w-4" /> Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Withdrawal</DialogTitle>
                  <DialogDescription>
                    Commission Balance available: {formatCurrency(commissionBalance)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({currencySymbol})</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min={1}
                      max={commissionBalance}
                    />
                    {withdrawError && (
                      <div className="flex items-start gap-2 text-xs text-red-600 bg-red-500/10 p-3 rounded-lg">
                        <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{withdrawError}</span>
                      </div>
                    )}
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
                    <span>Only your Commission Balance can be withdrawn. Subscription Balance can only be used for placing orders. Withdrawals are reviewed within 24-48 hours.</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleWithdraw} disabled={submitting || !!withdrawError}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Balance Segregation Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <WalletIcon className="h-5 w-5 text-primary" />
                <h2 className="font-display font-bold text-foreground text-lg">💰 My Wallet</h2>
              </div>

              <div className="space-y-3">
                <TooltipProvider>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Subscription Balance</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px] text-xs">This balance can only be used for placing orders and cannot be withdrawn.</p>
                        </TooltipContent>
                      </Tooltip>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Only for Orders</Badge>
                    </div>
                    <span className="text-lg font-display font-bold text-foreground">{formatCurrency(wallet?.subscription_balance ?? 0)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Commission Balance</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-700 border-green-500/20">Withdrawable</Badge>
                    </div>
                    <span className="text-lg font-display font-bold text-green-600">{formatCurrency(wallet?.commission_balance ?? 0)}</span>
                  </div>
                </TooltipProvider>

                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">Total Wallet Balance</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent className="max-w-[260px] text-xs">
                          <strong>Net of all activity.</strong> This is Subscription Balance + Commission Balance after every credit, debit, reversal, correction, repurchase deduction, and withdrawal. Use the Reconciliation panel below to audit each line.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xl font-display font-bold text-primary">{formatCurrency(wallet?.balance ?? 0)}</span>
                </div>
              </div>

              {commissionBalance <= 0 && (
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>You have no Commission Balance available for withdrawal.</span>
                </div>
              )}
            </motion.div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { label: "Total Commission Earned", value: totalCommissionEarned, icon: TrendingUp, gradient: "from-emerald-500 to-emerald-600" },
                { label: "Total Withdrawn", value: wallet?.total_withdrawn ?? 0, icon: ArrowDownToLine, gradient: "from-orange-500 to-orange-600" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-lg`}
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/20">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold">{formatCurrency(s.value)}</div>
                    <div className="text-xs opacity-80">{s.label}</div>
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

            {/* Wallet Activity */}
            <WalletTransactionHistory />

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
