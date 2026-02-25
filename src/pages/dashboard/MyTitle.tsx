import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Users, Star, ChevronRight, Lock, CheckCircle2, Loader2 } from "lucide-react";

const TITLES = [
  { name: "Member", requiredReferrals: 0, icon: "🌱" },
  { name: "Bronze", requiredReferrals: 1, icon: "🥉" },
  { name: "Silver", requiredReferrals: 3, icon: "🥈" },
  { name: "Gold", requiredReferrals: 6, icon: "🥇" },
  { name: "Platinum", requiredReferrals: 10, icon: "💎" },
  { name: "Diamond", requiredReferrals: 15, icon: "👑" },
  { name: "Crown", requiredReferrals: 25, icon: "🏆" },
];

const COMMISSION_LEVELS = [
  { level: 1, rate: 5, minReferrals: 1 },
  { level: 2, rate: 4.5, minReferrals: 3 },
  { level: 3, rate: 4, minReferrals: 3 },
  { level: 4, rate: 3.5, minReferrals: 3 },
  { level: 5, rate: 3, minReferrals: 3 },
  { level: 6, rate: 2.5, minReferrals: 6 },
  { level: 7, rate: 2, minReferrals: 6 },
  { level: 8, rate: 1.5, minReferrals: 6 },
  { level: 9, rate: 1, minReferrals: 6 },
];

const MyTitle = () => {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
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
  const currentTitleIndex = [...TITLES].reverse().findIndex((t) => referrals >= t.requiredReferrals);
  const resolvedIndex = currentTitleIndex >= 0 ? TITLES.length - 1 - currentTitleIndex : 0;
  const currentTitle = TITLES[resolvedIndex];
  const nextTitle = TITLES[resolvedIndex + 1] || null;
  const progress = nextTitle
    ? Math.min(100, ((referrals - currentTitle.requiredReferrals) / (nextTitle.requiredReferrals - currentTitle.requiredReferrals)) * 100)
    : 100;

  // Determine max unlocked commission level
  const unlockedLevels = COMMISSION_LEVELS.filter((l) => referrals >= l.minReferrals).length;

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
                {TITLES.map((title, i) => {
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

        {/* Commission Levels Unlocked */}
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
              <div className="grid grid-cols-3 gap-2">
                {COMMISSION_LEVELS.map((cl) => {
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default MyTitle;
