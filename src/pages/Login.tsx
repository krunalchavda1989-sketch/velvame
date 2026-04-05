import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import AuthPageLayout from "@/components/auth/AuthPageLayout";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendActivation = async () => {
    if (resendCooldown > 0) return;
    const email = form.identifier.includes("@") ? form.identifier.trim().toLowerCase() : "";
    if (!email) {
      toast.error("Please enter your email address to resend the activation link.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success(`Activation link sent to ${email}`);
      startCooldown();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend activation link.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResend(false);
    try {
      const identifier = form.identifier.trim();

      if (!identifier.includes("@")) {
        const { data, error } = await supabase.functions.invoke("login-with-identifier", {
          body: { identifier, password: form.password },
        });
        if (error) throw new Error("Unable to sign in right now. Please try again.");
        if (!data?.success || !data?.session?.access_token || !data?.session?.refresh_token) {
          const errMsg = data?.error || "Login failed";
          if (errMsg.toLowerCase().includes("email not confirmed")) {
            setShowResend(true);
          }
          throw new Error(errMsg);
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
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setShowResend(true);
          }
          throw error;
        }
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
        <p className="text-sm text-muted-foreground mt-1">Sign in with your email address or VM ID</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-xl bg-white border border-border shadow-lg">
        <div>
          <Label htmlFor="identifier" className="text-foreground text-sm font-medium">
            Email Address or VM ID
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

        {showResend && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Mail className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="text-amber-800 font-medium">Email not verified</p>
              <p className="text-amber-700 text-xs mt-0.5">Check your inbox or resend the activation link.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleResendActivation}
              disabled={resending || resendCooldown > 0}
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : resendCooldown > 0 ? `0:${resendCooldown.toString().padStart(2, "0")}` : "Resend"}
            </Button>
          </div>
        )}

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
