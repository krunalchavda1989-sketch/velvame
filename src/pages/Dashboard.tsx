import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NotificationBanner from "@/components/dashboard/NotificationBanner";
import { motion } from "framer-motion";
import { Wallet, Users, TrendingUp, ShoppingBag, Copy, Check } from "lucide-react";
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
  const [binaryPosition, setBinaryPosition] = useState<any>(null);
  const [binaryPayouts, setBinaryPayouts] = useState<any[]>([]);
  const [binarySettings, setBinarySettings] = useState<any>(null);

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

      // Binary position & payouts
      const { data: binPos } = await supabase
        .from("binary_positions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setBinaryPosition(binPos);

      const { data: binPayouts } = await supabase
        .from("binary_payouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setBinaryPayouts(binPayouts || []);

      const { data: binSettings } = await supabase
        .from("binary_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      setBinarySettings(binSettings);
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
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
            <span className="font-semibold text-destructive">⚠ Subscription pending.</span>{" "}
            <span className="text-muted-foreground">Pay ₹{membershipAmount.toLocaleString("en-IN")} to activate your MLM income and start earning commissions.</span>
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

        {/* Binary Income Section - only show if binary module is active */}
        {binarySettings?.is_active && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
                Binary Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* BV Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Left Leg BV</span>
                    <span className="text-sm font-bold text-foreground">
                      {binaryPosition ? (Number(binaryPosition.total_left_bv) + Number(binaryPosition.carry_forward_left)).toLocaleString() : "0"}
                    </span>
                  </div>
                  {(() => {
                    const total = binaryPosition
                      ? Number(binaryPosition.total_left_bv) + Number(binaryPosition.carry_forward_left) + Number(binaryPosition.total_right_bv) + Number(binaryPosition.carry_forward_right)
                      : 0;
                    const left = binaryPosition ? Number(binaryPosition.total_left_bv) + Number(binaryPosition.carry_forward_left) : 0;
                    const pct = total > 0 ? (left / total) * 100 : 0;
                    return <Progress value={pct} className="h-2" />;
                  })()}
                  <div className="text-xs text-muted-foreground mt-1">
                    Carry Forward: ₹{binaryPosition ? Number(binaryPosition.carry_forward_left).toLocaleString() : "0"}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Right Leg BV</span>
                    <span className="text-sm font-bold text-foreground">
                      {binaryPosition ? (Number(binaryPosition.total_right_bv) + Number(binaryPosition.carry_forward_right)).toLocaleString() : "0"}
                    </span>
                  </div>
                  {(() => {
                    const total = binaryPosition
                      ? Number(binaryPosition.total_left_bv) + Number(binaryPosition.carry_forward_left) + Number(binaryPosition.total_right_bv) + Number(binaryPosition.carry_forward_right)
                      : 0;
                    const right = binaryPosition ? Number(binaryPosition.total_right_bv) + Number(binaryPosition.carry_forward_right) : 0;
                    const pct = total > 0 ? (right / total) * 100 : 0;
                    return <Progress value={pct} className="h-2" />;
                  })()}
                  <div className="text-xs text-muted-foreground mt-1">
                    Carry Forward: ₹{binaryPosition ? Number(binaryPosition.carry_forward_right).toLocaleString() : "0"}
                  </div>
                </div>
              </div>

              {/* Settings info */}
              {binarySettings && (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Matching: <strong className="text-foreground">{binarySettings.matching_percentage}%</strong></span>
                  <span>Cap: <strong className="text-foreground">₹{Number(binarySettings.cap_amount).toLocaleString()}</strong></span>
                  <span>Min BV: <strong className="text-foreground">{Number(binarySettings.min_bv_for_payout).toLocaleString()}</strong></span>
                  <span>Frequency: <strong className="text-foreground capitalize">{binarySettings.payout_frequency}</strong></span>
                </div>
              )}

              {/* Recent Payouts */}
              {binaryPayouts.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Recent Payouts</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border text-xs">
                          <th className="text-left py-2 font-medium">Date</th>
                          <th className="text-right py-2 font-medium">Weak BV</th>
                          <th className="text-right py-2 font-medium">Strong BV</th>
                          <th className="text-right py-2 font-medium">Payout</th>
                          <th className="text-center py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {binaryPayouts.map((p) => (
                          <tr key={p.id} className="border-b border-border/50">
                            <td className="py-2 text-muted-foreground">{format(new Date(p.created_at), "dd MMM yyyy")}</td>
                            <td className="py-2 text-right">{Number(p.weak_leg_bv).toLocaleString()}</td>
                            <td className="py-2 text-right">{Number(p.strong_leg_bv).toLocaleString()}</td>
                            <td className="py-2 text-right font-semibold text-primary">₹{Number(p.matching_amount).toLocaleString()}</td>
                            <td className="py-2 text-center">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{p.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">No binary payouts yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

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
