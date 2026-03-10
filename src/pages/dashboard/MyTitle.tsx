import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Users, Star, Lock, CheckCircle2, Loader2 } from "lucide-react";

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

  const isLoading = profileLoading || titlesLoading || levelsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const referrals = profile?.direct_referral_count ?? 0;

  // Build titles list from DB
  const titleList = titles.map((t, i) => ({
    name: t.title_name,
    requiredReferrals: t.required_referrals,
    icon: TITLE_ICONS[i] || "⭐",
    color: t.badge_color,
  }));

  // Fallback if no titles configured
  if (titleList.length === 0) {
    titleList.push({ name: "Member", requiredReferrals: 0, icon: "🌱", color: null });
  }

  const currentTitleIndex = [...titleList].reverse().findIndex((t) => referrals >= t.requiredReferrals);
  const resolvedIndex = currentTitleIndex >= 0 ? titleList.length - 1 - currentTitleIndex : 0;
  const currentTitle = titleList[resolvedIndex];
  const nextTitle = titleList[resolvedIndex + 1] || null;
  const progress = nextTitle
    ? Math.min(100, ((referrals - currentTitle.requiredReferrals) / (nextTitle.requiredReferrals - currentTitle.requiredReferrals)) * 100)
    : 100;

  // Build commission levels from DB
  const levelsList = commissionLevels.map((cl) => ({
    level: cl.level,
    rate: Number(cl.rate),
    minReferrals: cl.min_referrals,
  }));

  const unlockedLevels = levelsList.filter((l) => referrals >= l.minReferrals).length;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">My Title</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your rank and unlock higher commission levels</p>
        </motion.div>

        {/* Current Rank Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{currentTitle.icon}</div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Current Title</p>
                  <h2 className="text-2xl font-bold text-foreground">{currentTitle.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{referrals} direct referral{referrals !== 1 ? "s" : ""}</span>
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
                    <span className="text-muted-foreground">{referrals}/{nextTitle.requiredReferrals} referrals</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {nextTitle.requiredReferrals - referrals} more referral{nextTitle.requiredReferrals - referrals !== 1 ? "s" : ""} needed
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
              <CardDescription>Milestones based on direct referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {titleList.map((title) => {
                  const achieved = referrals >= title.requiredReferrals;
                  return (
                    <div
                      key={title.name}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        achieved ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                      }`}
                    >
                      <span className="text-2xl">{title.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${achieved ? "text-foreground" : "text-muted-foreground"}`}>
                          {title.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {title.requiredReferrals === 0 ? "Default rank" : `${title.requiredReferrals} direct referrals`}
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
              <CardDescription>Levels unlocked based on your direct referrals</CardDescription>
            </CardHeader>
            <CardContent>
              {levelsList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No commission levels configured yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {levelsList.map((cl) => {
                    const unlocked = referrals >= cl.minReferrals;
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
                          {cl.minReferrals} ref{cl.minReferrals !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default MyTitle;
