import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminSubUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "" });

  const { data: subUsers = [], isLoading } = useQuery({
    queryKey: ["admin-sub-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_sub_users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ email, full_name }: { email: string; full_name: string }) => {
      // Look up user by email via edge function
      const { data: session } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-settings", {
        body: { action: "lookup_user_by_email", email },
      });
      if (res.error || !res.data?.user_id) {
        throw new Error(res.data?.error || "User not found with this email. They must register first.");
      }

      const { error } = await supabase.from("admin_sub_users").insert({
        user_id: res.data.user_id,
        added_by: user!.id,
        full_name,
        email,
        is_active: true,
      });
      if (error) {
        if (error.code === "23505") throw new Error("This user is already a sub-admin.");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-users"] });
      setDialogOpen(false);
      setForm({ email: "", full_name: "" });
      toast.success("Sub-admin added successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("admin_sub_users")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-users"] });
      toast.success("Sub-admin status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_sub_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-users"] });
      toast.success("Sub-admin removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Sub-Admin Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add trusted users who can access the admin panel
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Sub-Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sub-Admin</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.email || !form.full_name) return;
                  addMutation.mutate(form);
                }}
                className="space-y-4"
              >
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    User must be registered on the platform first.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Adding..." : "Add Sub-Admin"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Sub-Admins</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : subUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sub-admins added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subUsers.map((su: any) => (
                  <div
                    key={su.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{su.full_name}</p>
                        <p className="text-xs text-muted-foreground">{su.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={su.is_active ? "default" : "secondary"}>
                        {su.is_active ? "Active" : "Disabled"}
                      </Badge>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        Added {format(new Date(su.created_at), "dd MMM yyyy")}
                      </p>
                      <Switch
                        checked={su.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: su.id, is_active: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Remove this sub-admin?")) {
                            deleteMutation.mutate(su.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubUsers;
