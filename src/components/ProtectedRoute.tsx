import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: forceKyc, isLoading: kycSettingLoading } = useQuery({
    queryKey: ["site-setting-force-kyc"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "force_kyc")
        .maybeSingle();
      return data?.value === true;
    },
    staleTime: 300000,
  });

  const { data: forceBankDetails, isLoading: bankSettingLoading } = useQuery({
    queryKey: ["site-setting-force-bank-details"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "force_bank_details")
        .maybeSingle();
      return data?.value === true;
    },
    staleTime: 300000,
  });

  const { data: kycDocs, isLoading: kycLoading } = useQuery({
    queryKey: ["kyc-check", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("kyc_documents")
        .select("document_type, status")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user && forceKyc === true,
    staleTime: 60000,
  });

  const { data: bankDetails, isLoading: bankLoading } = useQuery({
    queryKey: ["bank-details-check", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_details")
        .select("account_holder_name, bank_name, account_number, ifsc_code")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && forceBankDetails === true,
    staleTime: 60000,
  });

  const isSettingsLoading = kycSettingLoading || bankSettingLoading;
  const isDataLoading = (forceKyc && kycLoading) || (forceBankDetails && bankLoading);

  if (loading || isSettingsLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check KYC completion only if forced KYC is enabled
  if (forceKyc && kycDocs) {
    const isSettingsKycPage = location.pathname === "/dashboard/settings" && 
      (new URLSearchParams(location.search).get("tab") === "kyc");
    
    if (!isSettingsKycPage) {
      const hasAadharFront = kycDocs.some((d: any) => d.document_type === "aadhar_front");
      const hasAadharBack = kycDocs.some((d: any) => d.document_type === "aadhar_back");
      const hasPan = kycDocs.some((d: any) => d.document_type === "pan");
      
      if (!hasAadharFront || !hasAadharBack || !hasPan) {
        return <Navigate to="/dashboard/settings?tab=kyc" replace />;
      }
    }
  }

  // Check bank details completion only if forced bank details is enabled
  if (forceBankDetails) {
    const isSettingsProfilePage = location.pathname === "/dashboard/settings" &&
      (new URLSearchParams(location.search).get("tab") === "profile" || !new URLSearchParams(location.search).get("tab"));

    if (!isSettingsProfilePage) {
      const bankComplete = bankDetails?.account_holder_name?.trim() &&
        bankDetails?.bank_name?.trim() &&
        bankDetails?.account_number?.trim() &&
        bankDetails?.ifsc_code?.trim();

      if (!bankComplete) {
        return <Navigate to="/dashboard/settings?tab=profile" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
