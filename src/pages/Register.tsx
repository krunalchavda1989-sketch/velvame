import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/contexts/BrandContext";
import { useMembershipAmount } from "@/hooks/useMembershipAmount";
import AuthPageLayout from "@/components/auth/AuthPageLayout";

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brand = useBrand();
  const { amount: membershipAmount } = useMembershipAmount();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"form" | "verifyEmail">("form");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [referralWarning, setReferralWarning] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    referralCode: searchParams.get("ref") || "",
  });

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (!refCode) return;
    const validateRef = async () => {
      const { data, error } = await supabase.rpc("validate_referral_with_subscription", { _code: refCode });
      if (error) return;
      const result = data as { valid: boolean; reason: string | null; message: string | null };
      if (!result.valid) {
        if (result.reason === "SUBSCRIPTION_REQUIRED") {
          setReferralWarning("This referral link is inactive. The referring user does not have an active subscription. You can register without a referral code or contact the person who referred you.");
        } else {
          setReferralWarning("This referral code is invalid. You can register without a referral code.");
        }
        setForm((prev) => ({ ...prev, referralCode: "" }));
      }
    };
    validateRef();
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (form.referralCode) {
        const { data } = await supabase.rpc("validate_referral_with_subscription", { _code: form.referralCode });
        const result = data as { valid: boolean; reason: string | null; message: string | null } | null;
        if (result && !result.valid) {
          if (result.reason === "SUBSCRIPTION_REQUIRED") {
            toast.error("This referral code belongs to an unsubscribed user. Registering without referral.");
            setForm((prev) => ({ ...prev, referralCode: "" }));
          } else {
            toast.error("Invalid referral code. Please check and try again.");
          }
          setLoading(false);
          return;
        }
      }
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, referral_code: form.referralCode },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast.success("Verification email sent. Please check your inbox.");
      setStep("verifyEmail");
      setCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterVerification = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        toast.success("Email verified! Welcome to " + brand.brand_name + "!");
        navigate("/dashboard");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          toast.error("Please click the verification link in your email first.");
          return;
        }
        throw error;
      }
      toast.success("Email verified! Welcome to " + brand.brand_name + "!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Unable to continue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resendCount >= 5) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: form.email });
      if (error) throw error;
      toast.success(`Verification email sent successfully to ${form.email}`);
      setResendCount((c) => c + 1);
      setCooldown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthPageLayout>
      {step === "form" ? (
        <>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Create Your Account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Lifetime membership — One-time ₹{membershipAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {referralWarning && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{referralWarning}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="text-foreground text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="mt-1.5 h-11 bg-background border-border"
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-foreground text-sm font-medium">Email Address</Label>
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
              <Label htmlFor="password" className="text-foreground text-sm font-medium">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="h-11 bg-background border-border pr-10"
                  placeholder="Min 6 characters"
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

            <div>
              <Label htmlFor="referral" className="text-foreground text-sm font-medium">Referral Code (optional)</Label>
              <Input
                id="referral"
                value={form.referralCode}
                onChange={(e) => {
                  setForm({ ...form, referralCode: e.target.value });
                  if (referralWarning) setReferralWarning("");
                }}
                className="mt-1.5 h-11 bg-background border-border"
                placeholder="e.g. NXM1A2B3C"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90 rounded-lg"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account...</>
              ) : (
                `Join ${brand.brand_name} — ₹${membershipAmount.toLocaleString("en-IN")}`
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
            </p>
          </form>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Verify Your Email</h1>
            <p className="text-sm text-muted-foreground mt-1">A verification link has been sent to</p>
            <p className="text-sm font-medium text-primary mt-0.5">{form.email}</p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                We sent a verification email to <span className="font-medium text-primary">{form.email}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Open your inbox and click <span className="font-medium text-foreground">"Verify Email"</span>.
              </p>
            </div>

            <Button
              onClick={handleContinueAfterVerification}
              disabled={loading}
              className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90 rounded-lg"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</>) : "I Have Verified Email"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email?{" "}
                {resendCount >= 5 ? (
                  <span className="text-destructive font-medium">Maximum resend attempts reached</span>
                ) : cooldown > 0 ? (
                  <span className="text-muted-foreground font-medium">Resend in 0:{cooldown.toString().padStart(2, "0")}</span>
                ) : (
                  <button onClick={handleResendOtp} disabled={resending} className="text-primary hover:underline font-medium disabled:opacity-50">
                    {resending ? "Sending..." : "Resend verification email"}
                  </button>
                )}
              </p>
              <button
                onClick={() => { setStep("form"); setCooldown(0); setResendCount(0); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to registration
              </button>
            </div>
          </div>
        </>
      )}
    </AuthPageLayout>
  );
};

export default Register;
