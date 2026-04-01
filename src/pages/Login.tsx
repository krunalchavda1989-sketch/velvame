import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import AuthPageLayout from "@/components/auth/AuthPageLayout";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let email = form.identifier.trim();

      // If the identifier doesn't look like an email, treat it as a referral ID
      if (!email.includes("@")) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("referral_code", email.toUpperCase())
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error("No account found with this User ID. Please check and try again.");
        }

        // Look up email via security definer function
        const { data: emailResult, error: emailError } = await supabase
          .rpc("get_user_email_by_id" as any, { _user_id: profile.user_id });

        if (emailError || !emailResult) {
          throw new Error("Unable to retrieve account details. Please try logging in with your email.");
        }

        email = emailResult as unknown as string;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      const redirectTo = searchParams.get("redirect");
      navigate(redirectTo || "/");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Welcome Back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-xl bg-white border border-border shadow-lg">
        <div>
          <Label htmlFor="identifier" className="text-foreground text-sm font-medium">
            Email Address or User ID
          </Label>
          <Input
            id="identifier"
            type="text"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required
            className="mt-1.5 h-11 bg-background border-border"
            placeholder="you@example.com or VEL001"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-foreground text-sm font-medium">
              Password
            </Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              Forgot Password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="h-11 bg-background border-border pr-10"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90 rounded-lg"
        >
          {loading ? "Signing in..." : "Log In"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};

export default Login;
