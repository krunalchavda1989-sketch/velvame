import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NotificationBanner from "@/components/dashboard/NotificationBanner";
import { motion } from "framer-motion";
import { Wallet, Users, TrendingUp, ShoppingBag, Copy, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SocialShareButtons from "@/components/share/SocialShareButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useMembershipAmount } from "@/hooks/useMembershipAmount";


const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { amount: membershipAmount } = useMembershipAmount();
  const [copied, setCopied] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [recentTeam, setRecentTeam] = useState<any[]>([]);
  const [earningsTrend, setEarningsTrend] = useState<any[]>([]);
  const [commissionBreakdown, setCommissionBreakdown] = useState<any[]>([]);
  const [teamGrowth, setTeamGrowth] = useState<any[]>([]);

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

      // Team
      let team: any[] = [];
      let count = 0;
      if (profile) {
        const res = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("referred_by", profile.id)
          .order("created_at", { ascending: false })
          .limit(5);
        team = res.data || [];
        count = res.count || 0;
        setTeamCount(count);
        setRecentTeam(team);

        // Team growth (last 6 months)
        const { data: allTeam } = await supabase
          .from("profiles")
          .select("created_at")
          .eq("referred_by", profile.id);
        const tg: any[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = subMonths(new Date(), i);
          const start = startOfMonth(d);
          const end = endOfMonth(d);
          const c = (allTeam || []).filter(
            (t) => new Date(t.created_at) >= start && new Date(t.created_at) <= end
          ).length;
          tg.push({ month: format(d, "MMM"), members: c });
        }
        setTeamGrowth(tg);
      }

      // Orders
      const { count: oc } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setOrderCount(oc || 0);

      // Commissions
      const { data: comms } = await supabase
        .from("commissions")
        .select("amount, commission_type, created_at")
        .eq("beneficiary_id", user.id);

      // Earnings trend (last 6 months)
      const et: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const total = (comms || [])
          .filter((c) => new Date(c.created_at) >= start && new Date(c.created_at) <= end)
          .reduce((s, c) => s + Number(c.amount), 0);
        et.push({ month: format(d, "MMM"), earnings: Math.round(total) });
      }
      setEarningsTrend(et);

      // Commission breakdown by type
      const typeMap: Record<string, number> = {};
      (comms || []).forEach((c) => {
        const t = c.commission_type === "level" ? "Level Income" : c.commission_type === "repurchase" ? "Repurchase" : c.commission_type;
        typeMap[t] = (typeMap[t] || 0) + Number(c.amount);
      });
      setCommissionBreakdown(
        Object.entries(typeMap).map(([name, value]) => ({ name, value: Math.round(value) }))
      );

    };

    fetchData();
  }, [user, profile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { icon: Wallet, label: "Total Earnings", value: `₹${wallet?.total_earned || 0}`, color: "text-primary" },
    { icon: Users, label: "Direct Referrals", value: String(teamCount), color: "text-chart-2" },
    { icon: TrendingUp, label: "Wallet Balance", value: `₹${wallet?.balance || 0}`, color: "text-chart-3" },
    { icon: ShoppingBag, label: "Orders", value: String(orderCount), color: "text-chart-4" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {profile?.full_name || "User"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your ID: <span className="text-primary font-mono">{profile?.referral_code}</span>
            {" · "}Title: <span className="text-primary">{profile?.title}</span>
          </p>
        </div>

        <NotificationBanner />

        {/* Referral link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-card border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-3"
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

        {/* Social sharing */}
        <SocialShareButtons referralLink={referralLink} referralCode={profile?.referral_code} compact />

        {/* Subscription status */}
        {!profile?.subscription_paid && (
          <div className="p-4 rounded-xl bg-destructive/15 border-2 border-destructive text-sm">
            <span className="font-bold text-destructive">⚠️ Action Required:</span>{" "}
            <span className="text-destructive/90">Your membership is not yet active. Please complete your subscription payment of ₹{membershipAmount.toLocaleString("en-IN")} to activate your account and unlock commission earnings.</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <div className="text-xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Earnings Trend (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={earningsTrend}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fill="url(#earnGrad)" name="Earnings (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Growth */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team Growth (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={teamGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="members" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="New Members" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Commission Breakdown + Recent Team */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Commission Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {commissionBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={commissionBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {commissionBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center text-muted-foreground text-sm">No commissions yet</div>
              )}
            </CardContent>
          </Card>

          {/* Recent Team */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTeam.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No team members yet. Share your referral link to grow your network!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentTeam.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
