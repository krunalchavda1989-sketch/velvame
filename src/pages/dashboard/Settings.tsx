import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Lock, Bell, Save, Loader2, CreditCard, ChevronRight, Shield, Landmark, Upload, Camera } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import KYCSection from "@/components/dashboard/KYCSection";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [commissionNotifs, setCommissionNotifs] = useState(true);
  const [teamNotifs, setTeamNotifs] = useState(true);

  // Bank details state
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetailsLoaded, setBankDetailsLoaded] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [uploadingBankProof, setUploadingBankProof] = useState(false);
  const [bankProofPreview, setBankProofPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: bankDetails, isLoading: bankLoading } = useQuery({
    queryKey: ["bank-details", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_details")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Sync profile form
  useEffect(() => {
    if (profile && !profileLoaded) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // Sync bank details form
  useEffect(() => {
    if (bankDetails && !bankDetailsLoaded) {
      setAccountHolderName(bankDetails.account_holder_name || "");
      setBankName(bankDetails.bank_name || "");
      setAccountNumber(bankDetails.account_number || "");
      setIfscCode(bankDetails.ifsc_code || "");
      setBranchName(bankDetails.branch_name || "");
      setUpiId(bankDetails.upi_id || "");
      setBankDetailsLoaded(true);
      // Load bank proof preview
      if ((bankDetails as any).bank_proof_url) {
        supabase.storage.from("kyc-documents").createSignedUrl((bankDetails as any).bank_proof_url, 3600)
          .then(({ data }) => { if (data?.signedUrl) setBankProofPreview(data.signedUrl); });
      }
    }
    if (!bankDetails && !bankLoading && !bankDetailsLoaded) {
      setBankDetailsLoaded(true);
    }
  }, [bankDetails, bankLoading, bankDetailsLoaded]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed", description: "Your password has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveBankDetails = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        account_holder_name: accountHolderName.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        branch_name: branchName.trim(),
        upi_id: upiId.trim(),
        updated_at: new Date().toISOString(),
      };

      if (bankDetails) {
        const { error } = await supabase
          .from("bank_details")
          .update(payload)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bank_details")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-details"] });
      toast({ title: "Bank details saved", description: "Your bank information has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save bank details.", variant: "destructive" });
    },
  });

  const compressImage = async (file: File, maxSizeKB = 300): Promise<File> => {
    if (!file.type.startsWith("image/")) return file;
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          let quality = 0.8;
          const tryCompress = () => {
            canvas.toBlob((blob) => {
              if (blob && (blob.size <= maxSizeKB * 1024 || quality <= 0.2)) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
              } else { quality -= 0.1; tryCompress(); }
            }, "image/jpeg", quality);
          };
          tryCompress();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBankProofUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/jpg,image/webp";
    fileInput.onchange = async (e: any) => {
      let file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast({ title: "Error", description: "Only image files allowed.", variant: "destructive" });
        return;
      }
      if (file.size > 300 * 1024) {
        file = await compressImage(file, 300);
        if (file.size > 300 * 1024) {
          toast({ title: "Error", description: "Image too large even after compression.", variant: "destructive" });
          return;
        }
      }
      setUploadingBankProof(true);
      try {
        const path = `${user!.id}/bank_proof_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("kyc-documents")
          .upload(path, file, { upsert: true, contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;
        
        // Save to bank_details
        if (bankDetails) {
          await supabase.from("bank_details").update({ bank_proof_url: path } as any).eq("user_id", user!.id);
        } else {
          await supabase.from("bank_details").insert({ user_id: user!.id, bank_proof_url: path } as any);
        }
        
        const { data: urlData } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 3600);
        if (urlData?.signedUrl) setBankProofPreview(urlData.signedUrl);
        queryClient.invalidateQueries({ queryKey: ["bank-details"] });
        toast({ title: "Uploaded", description: "Bank proof uploaded successfully." });
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Upload failed", variant: "destructive" });
      }
      setUploadingBankProof(false);
    };
    fileInput.click();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
        </motion.div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" /> Profile</TabsTrigger>
            <TabsTrigger value="kyc" className="gap-2"><Shield className="h-4 w-4" /> KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </div>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
                  </div>
                  <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="gap-2">
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bank Details Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Bank Details</CardTitle>
                  </div>
                  <CardDescription>Add your bank account information for withdrawal payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bankLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountHolderName">Account Holder Name</Label>
                          <Input
                            id="accountHolderName"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="As per bank records"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. State Bank of India"
                            maxLength={100}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Your bank account number"
                            maxLength={20}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ifscCode">IFSC Code</Label>
                          <Input
                            id="ifscCode"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            placeholder="e.g. SBIN0001234"
                            maxLength={11}
                            className="uppercase"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="branchName">Branch Name</Label>
                          <Input
                            id="branchName"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="Branch name"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upiId">UPI ID (Optional)</Label>
                          <Input
                            id="upiId"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. name@upi"
                            maxLength={50}
                          />
                        </div>
                      </div>
                      {/* Bank Passbook/Cheque Upload */}
                      <div className="space-y-2">
                        <Label>Bank Passbook / Cancelled Cheque (Optional)</Label>
                        {bankProofPreview && (
                          <div className="rounded-lg border border-border overflow-hidden max-w-xs">
                            <img src={bankProofPreview} alt="Bank Proof" className="w-full h-32 object-cover" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          disabled={uploadingBankProof}
                          onClick={handleBankProofUpload}
                        >
                          {uploadingBankProof ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {bankDetails?.bank_proof_url ? "Re-upload Proof" : "Upload Proof"}
                        </Button>
                        <p className="text-xs text-muted-foreground">Max 300KB. Auto-compressed if larger.</p>
                      </div>

                      <Button
                        onClick={() => saveBankDetails.mutate()}
                        disabled={saveBankDetails.isPending || (!accountHolderName.trim() && !bankName.trim() && !accountNumber.trim())}
                        className="gap-2"
                      >
                        {saveBankDetails.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {bankDetails ? "Update Bank Details" : "Save Bank Details"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Password Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Change Password</CardTitle>
                  </div>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
                  </div>
                  <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending} variant="outline" className="gap-2">
                    {changePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Notification Preferences</CardTitle>
                  </div>
                  <CardDescription>Choose what updates you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive general updates via email</p>
                    </div>
                    <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Commission Alerts</p>
                      <p className="text-xs text-muted-foreground">Get notified when you earn commissions</p>
                    </div>
                    <Switch checked={commissionNotifs} onCheckedChange={setCommissionNotifs} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Team Updates</p>
                      <p className="text-xs text-muted-foreground">Notifications about new team members</p>
                    </div>
                    <Switch checked={teamNotifs} onCheckedChange={setTeamNotifs} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Razorpay / Payments */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Link to="/dashboard/payment">
                <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-5">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Payment & Subscription</p>
                        <p className="text-xs text-muted-foreground">Manage Razorpay payments and subscription status</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </TabsContent>

          <TabsContent value="kyc">
            <KYCSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
