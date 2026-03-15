import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  upi_id: string | null;
  admin_note: string | null;
  created_at: string;
  user_id: string;
  profile?: { full_name: string } | null;
}

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Dialog state
  const [selected, setSelected] = useState<WithdrawalRow | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [adminNote, setAdminNote] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // Get profiles for names
    const userIds = [...new Set((data || []).map((w) => w.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const list = (data || []).map((w) => ({
      ...w,
      profile: profileMap.get(w.user_id) || null,
    }));

    setWithdrawals(list);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openDialog = (row: WithdrawalRow, act: "approve" | "reject") => {
    setSelected(row);
    setAction(act);
    setAdminNote("");
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setProcessing(true);

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update withdrawal request status
    const { error: wError } = await supabase
      .from("withdrawal_requests")
      .update({ status: newStatus, admin_note: adminNote || null })
      .eq("id", selected.id);

    if (wError) {
      toast.error("Failed to update withdrawal request");
      setProcessing(false);
      return;
    }

    // If approved, deduct from commission_balance only
    if (action === "approve") {
      // Get current wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance, commission_balance, total_withdrawn")
        .eq("user_id", selected.user_id)
        .single();

      if (wallet) {
        const commBal = Number((wallet as any).commission_balance) || 0;
        if (commBal < selected.amount) {
          toast.error("User does not have sufficient Commission Balance for this withdrawal");
          setProcessing(false);
          return;
        }

        const newCommBalance = commBal - selected.amount;
        const newBalance = Math.max(0, wallet.balance - selected.amount);
        const newWithdrawn = wallet.total_withdrawn + selected.amount;

        const { error: walletErr } = await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            commission_balance: newCommBalance,
            total_withdrawn: newWithdrawn,
          } as any)
          .eq("id", wallet.id);

        if (walletErr) {
          toast.error("Withdrawal approved but failed to update wallet balance");
        }
      }
    }

    toast.success(`Withdrawal ${newStatus}`);
    setSelected(null);
    setProcessing(false);
    fetchData();
  };

  const totals = {
    pending: withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0),
    approved: withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0),
    rejected: withdrawals.filter((w) => w.status === "rejected").reduce((s, w) => s + Number(w.amount), 0),
  };

  const summaryCards = [
    { icon: Clock, label: "Pending", value: `₹${totals.pending.toLocaleString()}`, color: "text-yellow-600" },
    { icon: CheckCircle2, label: "Approved", value: `₹${totals.approved.toLocaleString()}`, color: "text-green-600" },
    { icon: XCircle, label: "Rejected", value: `₹${totals.rejected.toLocaleString()}`, color: "text-red-500" },
  ];

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20" variant="outline">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20" variant="outline">Pending</Badge>;
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Withdrawal Requests</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {summaryCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-5 rounded-xl bg-card border border-border"
            >
              <c.icon className={`h-5 w-5 ${c.color} mb-3`} />
              <div className="text-2xl font-display font-bold text-foreground">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground rounded-xl border border-border bg-card">
            No withdrawal requests yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">UPI ID</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Note</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3 text-foreground">{w.profile?.full_name || "—"}</td>
                      <td className="p-3 font-medium text-primary">{formatCurrency(w.amount)}</td>
                      <td className="p-3 text-muted-foreground">{w.upi_id || "—"}</td>
                      <td className="p-3">{statusBadge(w.status)}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(w.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs max-w-[150px] truncate">{w.admin_note || "—"}</td>
                      <td className="p-3">
                        {w.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" onClick={() => openDialog(w, "approve")} className="h-7 text-xs">
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDialog(w, "reject")} className="h-7 text-xs">
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"} Withdrawal
            </DialogTitle>
            <DialogDescription>
              {selected && (
                <>
                  {formatCurrency(selected.amount)} requested by{" "}
                  <strong>{selected.profile?.full_name || "User"}</strong>
                  {selected.upi_id && <> to UPI: <strong>{selected.upi_id}</strong></>}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-note">Admin Note (optional)</Label>
              <Input
                id="admin-note"
                placeholder={action === "approve" ? "e.g. Processed via NEFT" : "e.g. Invalid UPI ID"}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={processing}
            >
              {processing ? "Processing…" : action === "approve" ? "Confirm Approve" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
