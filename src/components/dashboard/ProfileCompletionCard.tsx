import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, ShieldCheck, Landmark, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface MilestoneData {
  label: string;
  icon: React.ElementType;
  percent: number;
  filled: number;
  total: number;
  route: string;
}

const ProfileCompletionCard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [overall, setOverall] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const calc = async () => {
      // --- Profile fields ---
      const profileFields = [
        profile?.first_name?.trim(),
        profile?.last_name?.trim(),
        profile?.phone?.trim(),
        profile?.birth_date,
        profile?.avatar_url?.trim(),
      ];
      const profileFilled = profileFields.filter(Boolean).length;
      const profileTotal = profileFields.length;

      // --- KYC ---
      const { data: kycDocs } = await supabase
        .from("kyc_documents")
        .select("document_type, status")
        .eq("user_id", user.id);

      const kycTypes = ["aadhar_front", "aadhar_back", "pan"];
      const kycApproved = kycTypes.filter((t) =>
        (kycDocs || []).some((d) => d.document_type === t && d.status === "approved")
      ).length;
      const kycSubmitted = kycTypes.filter((t) =>
        (kycDocs || []).some((d) => d.document_type === t && (d.status === "pending" || d.status === "approved"))
      ).length;
      const kycFilled = Math.max(kycApproved, kycSubmitted);
      const kycTotal = kycTypes.length;

      // --- Bank Details ---
      const { data: bank } = await supabase
        .from("bank_details")
        .select("account_holder_name, bank_name, account_number, ifsc_code")
        .eq("user_id", user.id)
        .maybeSingle();

      const bankFields = [
        bank?.account_holder_name?.trim(),
        bank?.bank_name?.trim(),
        bank?.account_number?.trim(),
        bank?.ifsc_code?.trim(),
      ];
      const bankFilled = bankFields.filter(Boolean).length;
      const bankTotal = bankFields.length;

      const ms: MilestoneData[] = [
        {
          label: "Profile",
          icon: User,
          percent: Math.round((profileFilled / profileTotal) * 100),
          filled: profileFilled,
          total: profileTotal,
          route: "/dashboard/settings",
        },
        {
          label: "KYC",
          icon: ShieldCheck,
          percent: Math.round((kycFilled / kycTotal) * 100),
          filled: kycFilled,
          total: kycTotal,
          route: "/dashboard/settings",
        },
        {
          label: "Bank Details",
          icon: Landmark,
          percent: Math.round((bankFilled / bankTotal) * 100),
          filled: bankFilled,
          total: bankTotal,
          route: "/dashboard/settings",
        },
      ];

      setMilestones(ms);
      setOverall(Math.round(ms.reduce((s, m) => s + m.percent, 0) / ms.length));
      setLoading(false);
    };
    calc();
  }, [user, profile]);

  if (loading || overall === 100) return null;

  const getColor = (pct: number) => {
    if (pct === 100) return "text-emerald-500";
    if (pct >= 50) return "text-amber-500";
    return "text-destructive";
  };

  const getBg = (pct: number) => {
    if (pct === 100) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2 border-amber-300/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-700/40 shadow-lg overflow-hidden">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
            </div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {overall}%
            </span>
          </div>

          {/* Overall progress */}
          <div className="mb-5">
            <Progress value={overall} className="h-3 bg-amber-200/60 dark:bg-amber-900/40" />
          </div>

          {/* Milestones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {milestones.map((m) => {
              const complete = m.percent === 100;
              return (
                <div
                  key={m.label}
                  onClick={() => !complete && navigate(m.route)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    complete
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                      : "bg-card border-border hover:border-primary/40 hover:shadow-md cursor-pointer group"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                      complete
                        ? "bg-emerald-100 dark:bg-emerald-900/50"
                        : "bg-amber-100 dark:bg-amber-900/40"
                    }`}
                  >
                    {complete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <m.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{m.label}</span>
                      <span className={`text-xs font-bold ${getColor(m.percent)}`}>
                        {m.percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBg(m.percent)}`}
                        style={{ width: `${m.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {m.filled}/{m.total} completed
                      </span>
                      {!complete && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
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
  );
};

export default ProfileCompletionCard;
