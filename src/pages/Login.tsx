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
      const identifier = form.identifier.trim();

      if (!identifier.includes("@")) {
        const { data, error } = await supabase.functions.invoke("login-with-identifier", {
          body: {
            identifier,
            password: form.password,
          },
        });

        if (error) {
          throw new Error("Unable to sign in right now. Please try again.");
        }

        if (!data?.success || !data?.session?.access_token || !data?.session?.refresh_token) {
          throw new Error(data?.error || "Login failed");
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) throw sessionError;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier.toLowerCase(),
          password: form.password,
        });

        if (error) throw error;
      }

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
        <p className="text-sm text-muted-foreground mt-1">Sign in with your email address or referral ID</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-xl bg-white border border-border shadow-lg">
        <div>
          <Label htmlFor="identifier" className="text-foreground text-sm font-medium">
            Email Address or Referral ID
          </Label>
          <Input
            id="identifier"
            type="text"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required
            className="mt-1.5 h-11 bg-background border-border"
            placeholder="you@example.com or VM502"
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
