import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

const MASTER_ADMIN_EMAIL = "shweta1112025@gmail.com";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      const userEmail = authData.user.email;

      // Check if master admin
      if (userEmail === MASTER_ADMIN_EMAIL) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          toast.success("Welcome, Master Administrator!");
          navigate("/admin");
          return;
        }
      }

      // Check if sub-admin
      const { data: subAdmin } = await supabase
        .from("admin_sub_users")
        .select("is_active")
        .eq("user_id", authData.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (subAdmin) {
        toast.success("Welcome, Administrator!");
        navigate("/admin");
        return;
      }

      // Not authorized
      await supabase.auth.signOut();
      toast.error("Access denied. Admin credentials required.");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Master Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">Restricted access — authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl bg-card border border-border shadow-lg">
          <div>
            <Label htmlFor="admin-email" className="text-foreground text-xs uppercase tracking-wider">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1 bg-secondary border-border"
              placeholder="admin@company.com"
            />
          </div>

          <div>
            <Label htmlFor="admin-password" className="text-foreground text-xs uppercase tracking-wider">
              Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="bg-secondary border-border pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold">
            <Lock className="h-4 w-4 mr-2" />
            {loading ? "Verifying..." : "Authenticate"}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground mt-4">This portal is for administrators only.</p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
