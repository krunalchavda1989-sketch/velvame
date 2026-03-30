import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AuthPageLayout from "@/components/auth/AuthPageLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset link sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Forgot Password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {sent ? "Check your inbox for the reset link" : "Enter your email to receive a reset link"}
        </p>
      </div>

      {sent ? (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            We've sent a password reset link to <span className="font-medium text-primary">{email}</span>.
            Please check your email and click the link to reset your password.
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-11" onClick={() => { setSent(false); setEmail(""); }}>
              Try a different email
            </Button>
            <Link to="/login" className="block">
              <Button variant="ghost" className="w-full h-11 text-muted-foreground gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="text-foreground text-sm font-medium">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 h-11 bg-background border-border"
              placeholder="you@example.com"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90 rounded-lg"
          >
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</>) : "Send Reset Link"}
          </Button>
          <Link to="/login" className="block">
            <Button variant="ghost" type="button" className="w-full h-11 text-muted-foreground gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </form>
      )}
    </AuthPageLayout>
  );
};

export default ForgotPassword;
