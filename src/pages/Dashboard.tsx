import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Wallet, Users, TrendingUp, ShoppingBag, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [recentTeam, setRecentTeam] = useState<any[]>([]);

  const referralLink = profile ? `${window.location.origin}/register?ref=${profile.referral_code}` : "";

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Wallet
      const { data: w } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setWallet(w);

      // Team (direct referrals)
      if (profile) {
        const { data: team, count } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("referred_by", profile.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setTeamCount(count || 0);
        setRecentTeam(team || []);
      }

      // Orders count
      const { count: oc } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setOrderCount(oc || 0);
    };

    fetchData();
  }, [user, profile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { icon: Wallet, label: "Total Earnings", value: `₹${wallet?.total_earned || 0}`, change: "" },
    { icon: Users, label: "Direct Referrals", value: String(teamCount), change: "" },
    { icon: TrendingUp, label: "Wallet Balance", value: `₹${wallet?.balance || 0}`, change: "" },
    { icon: ShoppingBag, label: "Orders", value: String(orderCount), change: "" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {profile?.full_name || "User"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your ID: <span className="text-primary font-mono">{profile?.referral_code}</span>
            {" · "}Title: <span className="text-primary">{profile?.title}</span>
          </p>
        </div>

        {/* Referral link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-card border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">Your Referral Link</div>
            <div className="text-sm text-foreground font-mono truncate">{referralLink}</div>
          </div>
          <Button size="sm" onClick={handleCopy} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </motion.div>

        {/* Subscription status */}
        {!profile?.subscription_paid && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
            <span className="font-semibold text-destructive">⚠ Subscription pending.</span>{" "}
            <span className="text-muted-foreground">Pay ₹2800 to activate your MLM income and start earning commissions.</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent team */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Recent Team Members</h2>
          </div>
          {recentTeam.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No team members yet. Share your referral link to grow your network!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTeam.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{(member.full_name || "U")[0]}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{member.full_name || "User"}</div>
                      <div className="text-xs text-muted-foreground">{member.referral_code}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Direct</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
