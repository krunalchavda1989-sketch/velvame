import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, ShoppingBag, Users, Wallet, Trophy,
  CreditCard, TrendingUp, Calendar, Phone, Mail, Hash
} from "lucide-react";
import { format } from "date-fns";

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [titleRoadmap, setTitleRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      const [
        { data: prof },
        { data: wall },
        { data: ord },
        { data: comm },
        { data: refs },
        { data: wd },
        { data: aw },
        { data: tr },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("wallets").select("*").eq("user_id", "").limit(1), // placeholder
        supabase.from("orders").select("*, order_items(*, products(name, image_url))").order("created_at", { ascending: false }),
        supabase.from("commissions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("referred_by", userId).order("created_at", { ascending: false }),
        supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("awards_rewards").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("title_roadmap").select("*").eq("is_active", true).order("sort_order"),
      ]);

      setProfile(prof);

      // Now fetch wallet & orders with correct user_id from profile
      if (prof) {
        const [{ data: w }, { data: o }, { data: c }, { data: wdr }] = await Promise.all([
          supabase.from("wallets").select("*").eq("user_id", prof.user_id).single(),
          supabase.from("orders").select("*, order_items(*, products(name, image_url))").eq("user_id", prof.user_id).order("created_at", { ascending: false }),
          supabase.from("commissions").select("*").eq("beneficiary_id", prof.user_id).order("created_at", { ascending: false }),
          supabase.from("withdrawal_requests").select("*").eq("user_id", prof.user_id).order("created_at", { ascending: false }),
        ]);
        setWallet(w);
        setOrders(o || []);
        setCommissions(c || []);
        setWithdrawals(wdr || []);
      }

      setReferrals(refs || []);
      setAwards(aw || []);
      setTitleRoadmap(tr || []);
      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-muted-foreground">User not found.</div>
      </AdminLayout>
    );
  }

  const currentTitleIndex = titleRoadmap.findIndex((t) => t.title_name === profile.title);
  const nextTitle = titleRoadmap[currentTitleIndex + 1];
  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Back */}
        <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{(profile.full_name || "U")[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-display font-bold text-foreground">{profile.full_name || "User"}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{profile.referral_code}</Badge>
              <Badge className={profile.subscription_paid ? "bg-success text-success-foreground" : "bg-destructive/10 text-destructive"}>
                {profile.subscription_paid ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="secondary">{profile.title}</Badge>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Phone, label: "Phone", value: profile.phone || "—" },
            { icon: Calendar, label: "Joined", value: format(new Date(profile.created_at), "dd MMM yyyy") },
            { icon: Users, label: "Direct Referrals", value: String(profile.direct_referral_count) },
            { icon: Hash, label: "User ID", value: profile.referral_code },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Wallet, label: "Wallet Balance", value: `₹${wallet?.balance || 0}`, color: "text-primary" },
            { icon: TrendingUp, label: "Total Earned", value: `₹${wallet?.total_earned || 0}`, color: "text-success" },
            { icon: CreditCard, label: "Total Withdrawn", value: `₹${wallet?.total_withdrawn || 0}`, color: "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" />Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="team" className="gap-1.5"><Users className="h-3.5 w-3.5" />Team ({referrals.length})</TabsTrigger>
            <TabsTrigger value="commissions" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Commissions ({commissions.length})</TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Withdrawals ({withdrawals.length})</TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1.5"><Trophy className="h-3.5 w-3.5" />Achievements</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader><CardTitle className="text-base">Order History</CardTitle></CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Items</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Type</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-secondary/30">
                            <td className="p-2">
                              <Link to={`/admin/orders/${o.id}`} className="font-mono text-xs text-primary hover:underline">
                                {o.id.slice(0, 8)}…
                              </Link>
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {o.order_items?.map((i: any) => i.products?.name).filter(Boolean).join(", ") || "—"}
                            </td>
                            <td className="p-2 font-semibold text-foreground">₹{o.total_amount}</td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs capitalize">{o.status}</Badge>
                            </td>
                            <td className="p-2">
                              {o.is_repurchase && <Badge variant="secondary" className="text-xs">Repurchase</Badge>}
                            </td>
                            <td className="p-2 text-muted-foreground text-xs">{format(new Date(o.created_at), "dd MMM yyyy")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader><CardTitle className="text-base">Direct Referrals</CardTitle></CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No referrals yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {referrals.map((r) => (
                      <Link to={`/admin/users/${r.id}`} key={r.id} className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{(r.full_name || "U")[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{r.full_name || "User"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{r.referral_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{r.title}</Badge>
                          <Badge variant={r.subscription_paid ? "default" : "outline"}
                            className={`text-xs ${r.subscription_paid ? "bg-success text-success-foreground" : "text-muted-foreground"}`}>
                            {r.subscription_paid ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Commission History</CardTitle>
                  <Badge className="bg-primary/10 text-primary">Total: ₹{totalCommission.toFixed(2)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No commissions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">Type</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Level</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Rate</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {commissions.map((c) => (
                          <tr key={c.id} className="hover:bg-secondary/30">
                            <td className="p-2 capitalize text-foreground">{c.commission_type}</td>
                            <td className="p-2 text-muted-foreground">L{c.level}</td>
                            <td className="p-2 text-muted-foreground">{c.rate}%</td>
                            <td className="p-2 font-semibold text-foreground">₹{c.amount}</td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs capitalize">{c.status}</Badge>
                            </td>
                            <td className="p-2 text-muted-foreground text-xs">{format(new Date(c.created_at), "dd MMM yyyy")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader><CardTitle className="text-base">Withdrawal Requests</CardTitle></CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No withdrawal requests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">UPI / Bank</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {withdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-secondary/30">
                            <td className="p-2 font-semibold text-foreground">₹{w.amount}</td>
                            <td className="p-2 text-muted-foreground text-xs font-mono">{w.upi_id || "Bank Transfer"}</td>
                            <td className="p-2">
                              <Badge variant="outline" className={`text-xs capitalize ${
                                w.status === "approved" ? "border-success text-success" :
                                w.status === "rejected" ? "border-destructive text-destructive" : ""
                              }`}>{w.status}</Badge>
                            </td>
                            <td className="p-2 text-muted-foreground text-xs">{format(new Date(w.created_at), "dd MMM yyyy")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="space-y-4">
              {/* Title Progress */}
              <Card>
                <CardHeader><CardTitle className="text-base">Title Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {titleRoadmap.map((t, i) => {
                      const achieved = i <= currentTitleIndex;
                      const isCurrent = t.title_name === profile.title;
                      return (
                        <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isCurrent ? "border-primary bg-primary/5" : achieved ? "border-success/30 bg-success/5" : "border-border"
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            achieved ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            {achieved ? "✓" : i + 1}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>
                              {t.title_name}
                              {isCurrent && <Badge className="ml-2 text-[10px] bg-primary/10 text-primary">Current</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">{t.required_referrals} direct referrals required</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {nextTitle && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      <strong className="text-foreground">Next milestone:</strong> {nextTitle.title_name} — needs {nextTitle.required_referrals - profile.direct_referral_count} more referrals
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Awards */}
              <Card>
                <CardHeader><CardTitle className="text-base">Awards & Rewards</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {awards.map((a) => {
                      const earned = titleRoadmap.findIndex((t) => t.title_name === a.title_name) <= currentTitleIndex;
                      return (
                        <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                          earned ? "border-success/30 bg-success/5" : "border-border opacity-50"
                        }`}>
                          {a.gift_image_url ? (
                            <img src={a.gift_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Trophy className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {a.gift_name || a.title_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.reward_type === "cash" ? `₹${a.cash_amount}` : a.gift_description || a.reward_type}
                            </p>
                          </div>
                          {earned && <Badge className="bg-success text-success-foreground text-[10px]">Earned</Badge>}
                        </div>
                      );
                    })}
                  </div>
                  {awards.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No awards configured.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;
