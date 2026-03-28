import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Users, Star, Lock, CheckCircle2, Loader2, Trophy, Gift } from "lucide-react";

const TITLE_ICONS = ["🌱", "🥉", "🥈", "🥇", "💎", "👑", "🏆", "⭐", "🔥", "🚀"];

const MyTitle = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["title-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("title, direct_referral_count, subscription_paid")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get active downline count (all levels, only active members)
  const { data: activeDownlineCount = 0, isLoading: downlineLoading } = useQuery({
    queryKey: ["active-downline-count", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_downline_count", { _user_id: user!.id });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user,
  });

  const { data: titles = [], isLoading: titlesLoading } = useQuery({
    queryKey: ["title-roadmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("title_roadmap")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: awards = [], isLoading: awardsLoading } = useQuery({
    queryKey: ["awards-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards_rewards")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: commissionLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["commission-levels-user"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_levels")
        .select("*")
        .eq("is_active", true)
        .eq("commission_type", "level")
        .order("level");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = profileLoading || titlesLoading || levelsLoading || downlineLoading || awardsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const activeMembers = activeDownlineCount;

  // Build titles list from DB
  const titleList = titles.map((t: any, i: number) => ({
    name: t.title_name,
    requiredMembers: t.required_referrals,
    icon: TITLE_ICONS[i] || "⭐",
    color: t.badge_color,
    image_url: t.image_url || "",
  }));

  if (titleList.length === 0) {
    titleList.push({ name: "Member", requiredMembers: 0, icon: "🌱", color: null, image_url: "" });
  }

  const currentTitleIndex = [...titleList].reverse().findIndex((t) => activeMembers >= t.requiredMembers);
  const resolvedIndex = currentTitleIndex >= 0 ? titleList.length - 1 - currentTitleIndex : 0;
  const currentTitle = titleList[resolvedIndex];
  const nextTitle = titleList[resolvedIndex + 1] || null;
  const progress = nextTitle
    ? Math.min(100, ((activeMembers - currentTitle.requiredMembers) / (nextTitle.requiredMembers - currentTitle.requiredMembers)) * 100)
    : 100;

  const levelsList = commissionLevels.map((cl: any) => ({
    level: cl.level,
    rate: Number(cl.rate),
    minReferrals: cl.min_referrals,
  }));

  const unlockedLevels = levelsList.filter((l) => activeMembers >= l.minReferrals).length;

  const TitleBadge = ({ title, size = "md" }: { title: typeof currentTitle; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = size === "lg" ? "h-14 w-14" : size === "md" ? "h-10 w-10" : "h-8 w-8";
    const textSize = size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-lg";
    if (title.image_url) {
      return <img src={title.image_url} alt={title.name} className={`${sizeClasses} rounded-full object-cover`} />;
    }
    return <span className={textSize}>{title.icon}</span>;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">My Title</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your rank based on active downline members</p>
        </motion.div>

        {/* Current Rank Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <TitleBadge title={currentTitle} size="lg" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Current Title</p>
                  <h2 className="text-2xl font-bold text-foreground">{currentTitle.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{activeMembers} active downline member{activeMembers !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                {!profile?.subscription_paid && (
                  <Badge variant="outline" className="border-destructive text-destructive">Inactive</Badge>
                )}
                {profile?.subscription_paid && (
                  <Badge variant="outline" className="border-primary text-primary">Active</Badge>
                )}
              </div>

              {nextTitle && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress to <span className="font-medium text-foreground">{nextTitle.name}</span></span>
                    <span className="text-muted-foreground">{activeMembers}/{nextTitle.requiredMembers} active members</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {nextTitle.requiredMembers - activeMembers} more active member{nextTitle.requiredMembers - activeMembers !== 1 ? "s" : ""} needed
                  </p>
                </div>
              )}
              {!nextTitle && (
                <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-primary font-medium text-center">🎉 You've reached the highest title!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Title Roadmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Title Roadmap</CardTitle>
              </div>
              <CardDescription>Milestones based on active downline members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {titleList.map((title) => {
                  const achieved = activeMembers >= title.requiredMembers;
                  return (
                    <div
                      key={title.name}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        achieved ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                      }`}
                    >
                      <TitleBadge title={title} size="sm" />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${achieved ? "text-foreground" : "text-muted-foreground"}`}>
                          {title.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {title.requiredMembers === 0 ? "Default rank" : `${title.requiredMembers} active members`}
                        </p>
                      </div>
                      {achieved ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission Levels */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Commission Levels</CardTitle>
              </div>
              <CardDescription>Levels unlocked based on your active downline members</CardDescription>
            </CardHeader>
            <CardContent>
              {levelsList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No commission levels configured yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {levelsList.map((cl) => {
                    const unlocked = activeMembers >= cl.minReferrals;
                    return (
                      <div
                        key={cl.level}
                        className={`text-center p-3 rounded-lg border ${
                          unlocked ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border opacity-60"
                        }`}
                      >
                        <p className={`text-lg font-bold ${unlocked ? "text-primary" : "text-muted-foreground"}`}>
                          L{cl.level}
                        </p>
                        <p className="text-xs text-muted-foreground">{cl.rate}%</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {cl.minReferrals} member{cl.minReferrals !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        {/* My Achievements */}
        {awards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">My Achievements</CardTitle>
                </div>
                <CardDescription>Awards & rewards based on your active downline members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {awards.map((award: any) => {
                    const achieved = activeMembers >= (award.required_active_members || 0);
                    const progress = award.required_active_members > 0
                      ? Math.min(100, (activeMembers / award.required_active_members) * 100)
                      : 100;
                    return (
                      <div
                        key={award.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          achieved ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {award.gift_image_url ? (
                            <img src={award.gift_image_url} alt={award.title_name} className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${achieved ? "bg-primary/10" : "bg-muted"}`}>
                              {award.reward_type === "gift" ? <Gift className="h-6 w-6 text-primary" /> : <Trophy className="h-6 w-6 text-primary" />}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold text-sm ${achieved ? "text-foreground" : "text-muted-foreground"}`}>
                                {award.title_name}
                              </p>
                              {achieved && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                              {!achieved && <Lock className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {award.reward_type === "cash" ? `₹${(award.cash_amount || 0).toLocaleString()} Cash Bonus` :
                               award.reward_type === "gift" ? `Gift: ${award.gift_name}` :
                               `₹${(award.cash_amount || 0).toLocaleString()} + ${award.gift_name}`}
                            </p>
                            {award.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{award.description}</p>
                            )}
                            {!achieved && (
                              <div className="mt-2 space-y-1">
                                <Progress value={progress} className="h-1.5" />
                                <p className="text-[10px] text-muted-foreground">
                                  {activeMembers}/{award.required_active_members} active members ({Math.round(progress)}%)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTitle;
