import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

const AdminCommissions = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ total: 0, pending: 0, paid: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("commissions")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch profiles for beneficiary names
      const { data: profilesData } = await supabase.from("profiles").select("id, full_name, referral_code");
      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

      const list = (data || []).map((c) => ({ ...c, profile: profileMap.get(c.beneficiary_id) || null }));
      setCommissions(list);

      const total = list.reduce((s, c) => s + Number(c.amount), 0);
      const pending = list.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
      const paid = list.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
      setTotals({ total, pending, paid });
      setLoading(false);
    };
    fetch();
  }, []);

  const summaryCards = [
    { icon: DollarSign, label: "Total Commissions", value: `₹${totals.total.toLocaleString()}` },
    { icon: Clock, label: "Pending", value: `₹${totals.pending.toLocaleString()}` },
    { icon: TrendingUp, label: "Paid Out", value: `₹${totals.paid.toLocaleString()}` },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Commission Reports</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {summaryCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-5 rounded-xl bg-card border border-border"
            >
              <c.icon className="h-5 w-5 text-primary mb-3" />
              <div className="text-2xl font-display font-bold text-foreground">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground rounded-xl border border-border bg-card">No commissions yet.</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">Beneficiary</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Level</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Rate</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3 text-foreground">{c.profile?.full_name || "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-muted-foreground capitalize">{c.commission_type}</Badge>
                      </td>
                      <td className="p-3 text-foreground">L{c.level}</td>
                      <td className="p-3 text-muted-foreground">{c.rate}%</td>
                      <td className="p-3 font-medium text-primary">₹{c.amount}</td>
                      <td className="p-3">
                        <Badge className={c.status === "paid" ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
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

export default AdminCommissions;
