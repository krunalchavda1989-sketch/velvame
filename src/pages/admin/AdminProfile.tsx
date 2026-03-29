import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Lock, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AdminProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pwDialog, setPwDialog] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, middle_name, last_name, phone")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        middle_name: profile.middle_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fullName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ");
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          full_name: fullName,
          phone: form.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: pwForm.current,
      });
      if (signInErr) throw new Error("Current password is incorrect");

      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;

      toast.success("Password changed successfully");
      setPwDialog(false);
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Admin Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input
                    value={form.middle_name}
                    onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                    placeholder="Middle name"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label>Mobile No</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={pwDialog} onOpenChange={setPwDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showOld ? "text" : "password"}
                        value={pwForm.current}
                        onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showNew ? "text" : "password"}
                        value={pwForm.newPw}
                        onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={pwLoading}>
                    {pwLoading ? "Changing..." : "Update Password"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
