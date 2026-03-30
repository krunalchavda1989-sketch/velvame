import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Users, Search, UserPlus, Copy, Check, TrendingUp, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TeamMember {
  id: string;
  full_name: string;
  referral_code: string;
  title: string;
  subscription_paid: boolean;
  direct_referral_count: number;
  created_at: string;
  avatar_url: string | null;
  depth?: number;
}

const STAT_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6"];

const MemberRow = ({ member, i }: { member: TeamMember; i: number }) => (
  <motion.div
    key={member.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: i * 0.03 }}
    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">
          {(member.full_name || "U")[0].toUpperCase()}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {member.full_name || "User"}
        </div>
        <div className="text-xs text-muted-foreground">
          {member.referral_code}
          {member.depth != null && ` · Level ${member.depth}`}
          {" · "}{member.direct_referral_count} referral{member.direct_referral_count !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <Badge variant="outline" className="text-xs hidden sm:inline-flex">
        {member.title}
      </Badge>
      <Badge
        variant={member.subscription_paid ? "default" : "secondary"}
        className={`text-xs ${
          member.subscription_paid
            ? "bg-green-500/10 text-green-600 border-green-500/20"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {member.subscription_paid ? "Active" : "Pending"}
      </Badge>
    </div>
  </motion.div>
);

const MyTeam = () => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allReferrals, setAllReferrals] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [allLoading, setAllLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [allSearch, setAllSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [totalReferralCount, setTotalReferralCount] = useState(0);
  const [activeTab, setActiveTab] = useState("direct");

  const referralLink = profile
    ? `${window.location.origin}/register?ref=${profile.referral_code}`
    : "";

  useEffect(() => {
    if (!user || !profile) return;

    const fetchTeam = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, full_name, referral_code, title, subscription_paid, direct_referral_count, created_at, avatar_url"
        )
        .eq("referred_by", profile.id)
        .order("created_at", { ascending: true });
      setMembers((data as TeamMember[]) || []);
      setLoading(false);
    };

    const fetchTotalCount = async () => {
      const { data: treeData } = await supabase.rpc("get_genealogy_tree", { _user_id: user.id });
      setTotalReferralCount(treeData ? treeData.length - 1 : 0);
    };

    fetchTeam();
    fetchTotalCount();
  }, [user, profile]);

  useEffect(() => {
    if (activeTab !== "all" || !user || allReferrals.length > 0) return;
    const fetchAll = async () => {
      setAllLoading(true);
      const { data: treeData } = await supabase.rpc("get_genealogy_tree", { _user_id: user.id });
      if (treeData) {
        const all = (treeData as any[])
          .filter((m: any) => m.user_id !== user.id)
          .map((m: any) => ({
            id: m.profile_id,
            full_name: m.full_name,
            referral_code: m.referral_code,
            title: m.title,
            subscription_paid: m.subscription_paid,
            direct_referral_count: m.direct_referral_count,
            created_at: "",
            avatar_url: m.avatar_url,
            depth: m.depth,
          }));
        setAllReferrals(all);
      }
      setAllLoading(false);
    };
    fetchAll();
  }, [activeTab, user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.referral_code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAll = allReferrals.filter(
    (m) =>
      m.full_name.toLowerCase().includes(allSearch.toLowerCase()) ||
      m.referral_code.toLowerCase().includes(allSearch.toLowerCase())
  );

  const activeCount = members.filter((m) => m.subscription_paid).length;
  const totalDownline = members.reduce((s, m) => s + m.direct_referral_count, 0);

  const stats = [
    { label: "Direct Referrals", value: members.length, icon: Users, color: STAT_COLORS[0] },
    { label: "Active Members", value: activeCount, icon: TrendingUp, color: STAT_COLORS[1] },
    { label: "Team's Referrals", value: totalDownline, icon: UserPlus, color: STAT_COLORS[2] },
    { label: "Total Referrals", value: totalReferralCount, icon: UsersRound, color: STAT_COLORS[3] },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">My Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your direct referrals and grow your network
          </p>
        </div>

        {/* Stats row - colorful */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-xl text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                boxShadow: `0 8px 24px -4px ${s.color}44`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20"
                style={{ background: "white", transform: "translate(30%, -30%)" }}
              />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-display font-bold">{s.value}</div>
                  <div className="text-xs text-white/80">{s.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Invite card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-card border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">Invite Link</div>
            <div className="text-sm font-mono text-foreground truncate">{referralLink}</div>
          </div>
          <Button size="sm" onClick={handleCopy} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="direct">Direct Referrals</TabsTrigger>
            <TabsTrigger value="all">Total Referrals</TabsTrigger>
          </TabsList>

          {/* Direct Referrals Tab */}
          <TabsContent value="direct">
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <h2 className="font-display font-semibold text-foreground flex-1">
                  Direct Referrals ({members.length})
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              {loading ? (
                <div className="p-12 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  {members.length === 0 ? "No team members yet. Share your referral link to grow your network!" : "No members match your search."}
                </div>
              ) : (
                <div className="divide-y divide-border">{filtered.map((m, i) => <MemberRow key={m.id} member={m} i={i} />)}</div>
              )}
            </div>
          </TabsContent>

          {/* Total Referrals Tab */}
          <TabsContent value="all">
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <h2 className="font-display font-semibold text-foreground flex-1">
                  Total Referrals ({totalReferralCount})
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search all referrals..." value={allSearch} onChange={(e) => setAllSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              {allLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredAll.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  {allReferrals.length === 0 ? "No referrals in your network yet." : "No members match your search."}
                </div>
              ) : (
                <div className="divide-y divide-border">{filteredAll.map((m, i) => <MemberRow key={m.id} member={m} i={i} />)}</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyTeam;
