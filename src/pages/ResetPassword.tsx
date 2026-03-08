import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";

const ResetPassword = () => {
  const brand = useBrand();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.brand_name} className="h-8 w-auto object-contain rounded" />
              ) : (
                <Crown className="h-8 w-8 text-primary" />
              )}
              <span className="font-display text-2xl font-bold text-gradient-gold">{brand.brand_name}</span>
            </Link>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <h1 className="text-xl font-display font-bold text-foreground">Invalid Reset Link</h1>
            <p className="text-sm text-muted-foreground">
              This link is invalid or has expired. Please request a new password reset.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-display font-bold text-foreground">
            {success ? "Password Updated!" : "Set New Password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {success ? "You can now sign in with your new password" : "Enter your new password below"}
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-xl bg-card border border-border text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            <Link to="/login">
              <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
                Go to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl bg-card border border-border">
            <div>
              <Label htmlFor="password" className="text-foreground">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-secondary border-border pr-10"
                  placeholder="Min 6 characters"
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
            <div>
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 bg-secondary border-border"
                placeholder="Confirm your password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
