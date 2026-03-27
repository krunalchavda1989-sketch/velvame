import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Link2, Users, Lock, AlertTriangle } from "lucide-react";
import SocialShareButtons from "@/components/share/SocialShareButtons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const InviteLink = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["invite-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, direct_referral_count, full_name, subscription_paid")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isSubscribed = profile?.subscription_paid === true;

  const referralLink = profile
    ? `${window.location.origin}/register?ref=${profile.referral_code}`
    : "";

  const handleCopy = async () => {
    if (!isSubscribed) {
      setShowSubModal(true);
      return;
    }
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invite Link</h1>
          <p className="text-sm text-muted-foreground">Share your referral link to grow your team</p>
        </div>

        {/* Subscription Warning Banner */}
        {!isSubscribed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                  <Lock className="h-5 w-5 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">Referral Feature Locked</p>
                  <p className="text-xs text-muted-foreground">
                    Referral feature is available for subscribed members only. Subscribe to unlock referral sharing and start building your team.
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => navigate("/dashboard")}
                    className="mt-1"
                  >
                    Subscribe Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Direct Referrals</p>
                  <p className="text-xl font-bold text-foreground">{profile?.direct_referral_count || 0}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Referral Code</p>
                  <p className="text-xl font-bold text-foreground">{profile?.referral_code}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Link Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={!isSubscribed ? "opacity-60 pointer-events-none select-none relative" : ""}>
            {!isSubscribed && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-lg cursor-pointer pointer-events-auto"
                onClick={() => setShowSubModal(true)}
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Subscription Required</span>
                </div>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-base">Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">Share via</p>
                <SocialShareButtons referralLink={referralLink} referralCode={profile?.referral_code} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  "Share your unique referral link with friends & contacts",
                  "They register using your link and activate their account",
                  "You earn commissions on their purchases up to 9 levels deep",
                  "Grow your team to unlock higher commission tiers",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 shrink-0">{i + 1}</Badge>
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Subscription Required Modal */}
      <AlertDialog open={showSubModal} onOpenChange={setShowSubModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Subscription Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              You are not subscribed yet. To refer and register new members, you must have an active subscription. Please subscribe first to unlock the referral feature.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/dashboard")}
              className="bg-primary text-primary-foreground"
            >
              Subscribe Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default InviteLink;
