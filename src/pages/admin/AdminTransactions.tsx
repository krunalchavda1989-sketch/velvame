import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

const AdminTransactions = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, referral_code");
      const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p]));

      setPayments(
        (paymentsData || []).map((p) => ({
          ...p,
          profile: profileMap.get(p.user_id) || null,
        }))
      );
      setLoading(false);
    };
    fetch();
  }, []);

  const statusColor = (s: string) => {
    switch (s) {
      case "captured":
      case "paid":
        return "bg-success text-success-foreground";
      case "created":
        return "bg-accent text-accent-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Payment Transactions</h1>
              <p className="text-sm text-muted-foreground">All payment records across orders</p>
            </div>
          </div>
          <Badge variant="outline" className="text-muted-foreground">{payments.length} transactions</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground rounded-xl border border-border bg-card">
            No transactions yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">Txn ID</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">User</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Purpose</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Razorpay Order</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Payment ID</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}…</td>
                      <td className="p-3 text-foreground">{p.profile?.full_name || "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs capitalize">{p.purpose}</Badge>
                      </td>
                      <td className="p-3 font-medium text-primary">
                        {p.currency === "INR" ? "₹" : p.currency} {p.amount}
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{p.razorpay_order_id?.slice(0, 16) || "—"}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{p.razorpay_payment_id?.slice(0, 16) || "—"}</td>
                      <td className="p-3">
                        <Badge className={statusColor(p.status)}>{p.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTransactions;
