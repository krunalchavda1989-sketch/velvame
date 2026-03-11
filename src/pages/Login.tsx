import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/contexts/BrandContext";

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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.brand_name} className="h-8 w-auto object-contain rounded" />
            ) : (
              <Crown className="h-8 w-8 text-primary" />
            )}
            <span className="font-display text-2xl font-bold text-gradient-gold">{brand.brand_name}</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1 bg-secondary border-border"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="bg-secondary border-border pr-10"
                placeholder="Your password"
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

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">Join now</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
