import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, ShoppingBag, Users, Wallet, Trophy,
  CreditCard, TrendingUp, Calendar, Phone, Hash, Pencil, Save, Loader2,
  Ban, Trash2, Shield, CheckCircle, XCircle, Clock, Eye, Mail, MapPin, Landmark, User
} from "lucide-react";
import { format } from "date-fns";
import ManualSubscriptionForm from "@/components/admin/ManualSubscriptionForm";

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [titleRoadmap, setTitleRoadmap] = useState<any[]>([]);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    title: "",
    subscription_paid: false,
  });

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      // First fetch: profile + static data
      const [{ data: prof }, { data: refs }, { data: aw }, { data: tr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("profiles").select("*").eq("referred_by", userId).order("created_at", { ascending: false }),
        supabase.from("awards_rewards").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("title_roadmap").select("*").eq("is_active", true).order("sort_order"),
      ]);

      setProfile(prof);
      setReferrals(refs || []);
      setAwards(aw || []);
      setTitleRoadmap(tr || []);

      if (prof) {
        setEditForm({
          full_name: prof.full_name || "",
          phone: prof.phone || "",
          title: prof.title || "Member",
          subscription_paid: prof.subscription_paid || false,
        });

        const [{ data: w }, { data: o }, { data: c }, { data: wdr }, { data: kyc }, { data: bank }, { data: addr }] = await Promise.all([
          supabase.from("wallets").select("*").eq("user_id", prof.user_id).single(),
          supabase.from("orders").select("*, order_items(*, products(name, image_url))").eq("user_id", prof.user_id).order("created_at", { ascending: false }),
          supabase.from("commissions").select("*").eq("beneficiary_id", prof.user_id).order("created_at", { ascending: false }),
          supabase.from("withdrawal_requests").select("*").eq("user_id", prof.user_id).order("created_at", { ascending: false }),
          supabase.from("kyc_documents").select("*").eq("user_id", prof.user_id).order("created_at", { ascending: false }),
          supabase.from("bank_details").select("*").eq("user_id", prof.user_id).single(),
          supabase.from("user_addresses").select("*").eq("user_id", prof.user_id).order("is_default", { ascending: false }),
        ]);
        setWallet(w);
        setOrders(o || []);
        setCommissions(c || []);
        setWithdrawals(wdr || []);
        setKycDocs((kyc as any) || []);
        setBankDetails(bank);
        setAddresses(addr || []);

        // Fetch user email via edge function
        const { data: emailData } = await supabase.functions.invoke("admin-settings", {
          body: { action: "get_user_email", user_id: prof.user_id },
        });
        if (emailData?.email) setUserEmail(emailData.email);
      }

      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  const handleSave = async () => {
    if (!profile) return;
    const trimmedName = editForm.full_name.trim();
    if (!trimmedName) {
      toast({ title: "Error", description: "Name cannot be empty.", variant: "destructive" });
      return;
    }
    if (trimmedName.length > 100) {
      toast({ title: "Error", description: "Name must be less than 100 characters.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const updateData: any = {
      full_name: trimmedName,
      phone: editForm.phone.trim(),
      title: editForm.title,
      subscription_paid: editForm.subscription_paid,
    };

    if (editForm.subscription_paid && !profile.subscription_paid) {
      updateData.subscription_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
      return;
    }

    setProfile({ ...profile, ...updateData });
    setEditOpen(false);
    toast({ title: "Saved", description: "User profile updated successfully." });
  };

  const handleQuickToggleSubscription = async () => {
    if (!profile) return;
    const newVal = !profile.subscription_paid;
    const updateData: any = { subscription_paid: newVal };
    if (newVal) updateData.subscription_date = new Date().toISOString();

    const { error } = await supabase.from("profiles").update(updateData).eq("id", profile.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update subscription.", variant: "destructive" });
      return;
    }
    setProfile({ ...profile, ...updateData });
    setEditForm((f) => ({ ...f, subscription_paid: newVal }));
    toast({ title: newVal ? "Activated" : "Deactivated", description: `Subscription ${newVal ? "activated" : "deactivated"} successfully.` });
  };

  const handleDeactivateUser = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ subscription_paid: false, subscription_date: null }).eq("id", profile.id);
    if (error) {
      toast({ title: "Error", description: "Failed to deactivate user.", variant: "destructive" });
      return;
    }
    setProfile({ ...profile, subscription_paid: false, subscription_date: null });
    setEditForm((f) => ({ ...f, subscription_paid: false }));
    toast({ title: "User Deactivated", description: "User account has been deactivated successfully." });
  };

  const handleDeleteUser = async () => {
    if (!profile) return;
    const { error } = await supabase.functions.invoke("admin-settings", {
      body: { action: "delete_user", user_id: profile.user_id },
    });
    if (error) {
      toast({ title: "Error", description: "Failed to delete user account.", variant: "destructive" });
      return;
    }
    toast({ title: "User Deleted", description: "User account has been permanently deleted." });
    window.location.href = "/admin/users";
  };

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-foreground">{profile.full_name || "User"}</h1>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Select value={editForm.title} onValueChange={(v) => setEditForm({ ...editForm, title: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {titleRoadmap.length > 0 ? (
                            titleRoadmap.map((t) => (
                              <SelectItem key={t.id} value={t.title_name}>{t.title_name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="Member">Member</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <Label className="text-sm font-medium">Subscription Active</Label>
                        <p className="text-xs text-muted-foreground">Toggle subscription status for this user</p>
                      </div>
                      <Switch
                        checked={editForm.subscription_paid}
                        onCheckedChange={(v) => setEditForm({ ...editForm, subscription_paid: v })}
                      />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{profile.referral_code}</Badge>
              <button onClick={handleQuickToggleSubscription} className="cursor-pointer">
                <Badge className={profile.subscription_paid ? "bg-success text-success-foreground hover:bg-success/80" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}>
                  {profile.subscription_paid ? "Active ✓" : "Inactive ✗"}
                </Badge>
              </button>
              <Badge variant="secondary">{profile.title}</Badge>
              {kycDocs.length >= 2 && kycDocs.every((d: any) => d.status === "approved") ? (
                <Badge className="bg-success/15 text-success border-success/30 text-xs gap-1"><Shield className="h-3 w-3" />KYC Verified</Badge>
              ) : kycDocs.some((d: any) => d.status === "pending") ? (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">KYC Pending</Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {profile.subscription_paid && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50">
                      <Ban className="h-3.5 w-3.5" /> Deactivate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate User Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will deactivate {profile.full_name}'s subscription. They will lose access to distributor features but their account data will be preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeactivateUser} className="bg-orange-600 hover:bg-orange-700">Deactivate</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Permanently Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete {profile.full_name}'s account, profile, wallet, orders, and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Delete Permanently</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Mail, label: "Email", value: userEmail || "—" },
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
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" />Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="team" className="gap-1.5"><Users className="h-3.5 w-3.5" />Team ({referrals.length})</TabsTrigger>
            <TabsTrigger value="commissions" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Commissions ({commissions.length})</TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Withdrawals ({withdrawals.length})</TabsTrigger>
            <TabsTrigger value="kyc" className="gap-1.5"><Shield className="h-3.5 w-3.5" />KYC ({kycDocs.length})</TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1.5"><Trophy className="h-3.5 w-3.5" />Achievements</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Addresses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No addresses saved.</p>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="rounded-lg border border-border p-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{addr.name}</p>
                            <Badge variant="outline" className="text-[10px]">{addr.label}</Badge>
                            {addr.is_default && <Badge className="text-[10px] bg-primary/10 text-primary">Default</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                          <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} — {addr.pincode}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{addr.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4" />Bank Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {!bankDetails ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No bank details added.</p>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { label: "Account Holder", value: bankDetails.account_holder_name },
                        { label: "Bank Name", value: bankDetails.bank_name },
                        { label: "Account Number", value: bankDetails.account_number },
                        { label: "IFSC Code", value: bankDetails.ifsc_code },
                        { label: "Branch", value: bankDetails.branch_name },
                        { label: "UPI ID", value: bankDetails.upi_id },
                      ].filter(d => d.value).map((d) => (
                        <div key={d.label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                          <span className="text-xs text-muted-foreground">{d.label}</span>
                          <span className="text-sm font-medium text-foreground font-mono">{d.value}</span>
                        </div>
                      ))}
                      {(bankDetails as any).bank_proof_url && (
                        <BankProofPreview path={(bankDetails as any).bank_proof_url} />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Manual Subscription Module */}
            <ManualSubscriptionForm
              profile={profile}
              onSubscriptionActivated={(updatedProfile) => {
                setProfile(updatedProfile);
                setEditForm((f) => ({ ...f, subscription_paid: true }));
              }}
            />
          </TabsContent>

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

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <KycAdminTab docs={kycDocs} onUpdate={setKycDocs} userId={profile.user_id} />
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
                            <div className={`text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}>
                              {t.title_name}
                              {isCurrent && <Badge className="ml-2 text-[10px] bg-primary/10 text-primary">Current</Badge>}
                            </div>
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

/* ─── KYC Admin Tab (Card View with Image Previews) ─── */
const DOC_LABELS: Record<string, string> = { aadhar: "Aadhar Card", aadhar_front: "Aadhar Card (Front)", aadhar_back: "Aadhar Card (Back)", pan: "PAN Card" };
const STATUS_MAP: Record<string, { icon: any; label: string; cls: string }> = {
  pending: { icon: Clock, label: "Pending", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  approved: { icon: CheckCircle, label: "Approved", cls: "bg-success/15 text-success border-success/30" },
  rejected: { icon: XCircle, label: "Rejected", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

const KycAdminTab = ({ docs, onUpdate }: { docs: any[]; onUpdate: (d: any[]) => void; userId: string }) => {
  const { toast } = useToast();
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPreviews = async () => {
      for (const doc of docs) {
        if (doc.document_url) {
          const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(doc.document_url, 3600);
          if (data?.signedUrl) {
            setImageUrls((prev) => ({ ...prev, [doc.id]: data.signedUrl }));
          }
        }
      }
    };
    if (docs.length > 0) loadPreviews();
  }, [docs]);

  const handleAction = async (docId: string, status: "approved" | "rejected") => {
    setActionLoading(docId);
    const note = status === "rejected" ? (rejectNote[docId] || "").trim() : "";
    if (status === "rejected" && !note) {
      toast({ title: "Error", description: "Please provide a reason for rejection.", variant: "destructive" });
      setActionLoading(null);
      return;
    }
    const { error } = await supabase
      .from("kyc_documents")
      .update({ status, admin_note: note, updated_at: new Date().toISOString() })
      .eq("id", docId);
    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: "Failed to update KYC status.", variant: "destructive" });
      return;
    }
    onUpdate(docs.map((d) => d.id === docId ? { ...d, status, admin_note: note } : d));
    toast({ title: "Updated", description: `Document ${status} successfully.` });
  };

  if (docs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          No KYC documents submitted yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {docs.map((doc) => {
        const s = STATUS_MAP[doc.status] || STATUS_MAP.pending;
        const SIcon = s.icon;
        const previewUrl = imageUrls[doc.id];
        return (
          <Card key={doc.id} className={doc.status === "approved" ? "border-success/30" : ""}>
            <CardContent className="p-0">
              {/* Image Preview */}
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt={DOC_LABELS[doc.document_type]} className="w-full h-48 object-cover rounded-t-lg" />
                  <Badge variant="outline" className={`absolute top-2 right-2 gap-1 text-[10px] ${s.cls}`}>
                    <SIcon className="h-3 w-3" /> {s.label}
                  </Badge>
                </div>
              ) : (
                <div className="w-full h-48 bg-muted/50 rounded-t-lg flex items-center justify-center">
                  <Shield className="h-10 w-10 text-muted-foreground/30" />
                  <Badge variant="outline" className={`absolute top-2 right-2 gap-1 text-[10px] ${s.cls}`}>
                    <SIcon className="h-3 w-3" /> {s.label}
                  </Badge>
                </div>
              )}

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">{DOC_LABELS[doc.document_type] || doc.document_type}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Document Number</p>
                    <p className="font-mono font-medium text-foreground">{doc.document_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="text-foreground">{format(new Date(doc.created_at), "dd MMM yyyy")}</p>
                  </div>
                </div>

                {previewUrl && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" onClick={() => window.open(previewUrl, "_blank")}>
                    <Eye className="h-3.5 w-3.5" /> View Full Image
                  </Button>
                )}

                {doc.status === "pending" && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Input
                      placeholder="Rejection reason..."
                      value={rejectNote[doc.id] || ""}
                      onChange={(e) => setRejectNote({ ...rejectNote, [doc.id]: e.target.value })}
                      maxLength={500}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
                        disabled={actionLoading === doc.id}
                        onClick={() => handleAction(doc.id, "approved")}
                      >
                        {actionLoading === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5 text-destructive border-destructive/30"
                        disabled={actionLoading === doc.id}
                        onClick={() => handleAction(doc.id, "rejected")}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                )}

                {doc.status === "rejected" && doc.admin_note && (
                  <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                    <strong>Reason:</strong> {doc.admin_note}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminUserDetail;
