import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/contexts/BrandContext";
import AuthPageLayout from "@/components/auth/AuthPageLayout";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const brand = useBrand();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      const redirectTo = searchParams.get("redirect");
      navigate(redirectTo || "/dashboard");
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email" className="text-foreground text-sm font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="mt-1.5 h-11 bg-background border-border"
            placeholder="you@example.com"
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
