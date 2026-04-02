import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization } from "@/hooks/useLocalization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, DollarSign, Banknote, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface PayoutRecord {
  id: string;
  amount: number;
  payment_mode: string;
  transaction_ref: string;
  payment_date: string;
  note: string;
  status: string;
  created_at: string;
}

interface EarningEntry {
  id: string;
  amount: number;
  commission_type: string;
  level: number;
  status: string;
  created_at: string;
  source_user_name?: string;
}

const PayoutHistory = () => {
  const { user } = useAuth();
  const { currencySymbol } = useLocalization();
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [commissions, setCommissions] = useState<EarningEntry[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [hasBankDetails, setHasBankDetails] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [payoutsRes, commissionsRes, bankRes] = await Promise.all([
        supabase.from("payout_transactions").select("*").eq("user_id", user.id).order("payment_date", { ascending: false }),
        supabase.from("commissions").select("id, amount, commission_type, level, status, created_at, source_user_id").eq("beneficiary_id", user.id).order("created_at", { ascending: false }).limit(200),
        supabase.from("bank_details").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      const payoutData = (payoutsRes.data || []) as PayoutRecord[];
      const commData = (commissionsRes.data || []) as any[];

      // Get source user names
      const sourceIds = [...new Set(commData.map(c => c.source_user_id))];
      const { data: sourceProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", sourceIds);
      const nameMap = new Map(sourceProfiles?.map(p => [p.user_id, p.full_name]) || []);

      setPayouts(payoutData);
      setCommissions(commData.map(c => ({ ...c, source_user_name: nameMap.get(c.source_user_id) || "Team Member" })));
      setTotalEarned(commData.reduce((s, c) => s + Number(c.amount), 0));
      setTotalPaid(payoutData.reduce((s, p) => s + Number(p.amount), 0));
      setHasBankDetails(!!bankRes.data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const fc = (val: number) => `${currencySymbol}${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const pendingBalance = totalEarned - totalPaid;

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Bank details warning */}
      {!hasBankDetails && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700">Bank details required</p>
            <p className="text-xs text-amber-600 mt-1">Please add your bank details to receive payouts. <Link to="/dashboard/settings?tab=bank" className="underline font-medium">Go to Settings → Bank Details</Link></p>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-foreground text-lg">💰 My Earnings</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Total Commission Earned</span>
            <span className="text-lg font-display font-bold text-foreground">{fc(totalEarned)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Total Paid Out</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-700 border-green-500/20">Received</Badge>
            </div>
            <span className="text-lg font-display font-bold text-green-600">{fc(totalPaid)}</span>
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Pending Balance</span>
            <span className="text-xl font-display font-bold text-primary">{fc(Math.max(0, pendingBalance))}</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="text-xs">All Earnings</TabsTrigger>
          <TabsTrigger value="paid" className="text-xs">Paid</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              {commissions.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No earnings yet. Grow your team to start earning!</div>
              ) : (
                <div className="divide-y divide-border">
                  {commissions.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          Level {c.level} · {c.commission_type === "level" ? "Level Income" : "Repurchase Income"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "dd MMM yyyy")} · From: {c.source_user_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-display font-bold">{fc(c.amount)}</span>
                        <Badge variant="outline" className={`text-[10px] ${c.status === "paid" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"}`}>
                          {c.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardContent className="p-0">
              {payouts.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No payouts received yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {payouts.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{fc(p.amount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(p.payment_date), "dd MMM yyyy")} · {p.payment_mode.replace("_", " ")} · Ref: {p.transaction_ref}
                          </div>
                          {p.note && <div className="text-xs text-muted-foreground mt-0.5">{p.note}</div>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                        ✅ Paid
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Pending Earnings — {fc(Math.max(0, pendingBalance))}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {commissions.filter(c => c.status === "pending").length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No pending earnings.</div>
              ) : (
                <div className="divide-y divide-border">
                  {commissions.filter(c => c.status === "pending").map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          Level {c.level} · {c.commission_type === "level" ? "Level Income" : "Repurchase Income"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "dd MMM yyyy")} · From: {c.source_user_name}
                        </div>
                      </div>
                      <span className="text-sm font-display font-bold text-primary">{fc(c.amount)}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayoutHistory;
