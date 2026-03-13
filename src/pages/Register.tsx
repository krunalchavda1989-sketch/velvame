import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Crown, Eye, EyeOff, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/contexts/BrandContext";
import { useMembershipAmount } from "@/hooks/useMembershipAmount";

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brand = useBrand();
  const { amount: membershipAmount } = useMembershipAmount();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    referralCode: searchParams.get("ref") || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      // Validate referral code if provided
      if (form.referralCode) {
        const { data: isValid } = await supabase.rpc("validate_referral_code", {
          _code: form.referralCode,
        });
        if (!isValid) {
          toast.error("Invalid referral code. Please check and try again.");
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
      toast.success("Verification code sent to your email!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: form.email,
        token: otp,
        type: "signup",
      });
      if (error) throw error;
      toast.success("Email verified! Welcome to " + brand.brand_name + "!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: form.email,
      });
      if (error) throw error;
      toast.success("New verification code sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    } finally {
      setResending(false);
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
          {step === "form" ? (
            <>
              <h1 className="text-2xl font-display font-bold text-foreground">Create Your Account</h1>
              <p className="text-sm text-muted-foreground mt-1">Lifetime membership — One-time ₹{membershipAmount.toLocaleString("en-IN")}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold text-foreground">Verify Your Email</h1>
              <p className="text-sm text-muted-foreground mt-1">We sent a 6-digit code to</p>
              <p className="text-sm font-medium text-primary mt-0.5">{form.email}</p>
            </>
          )}
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl bg-card border border-border">
            <div>
              <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="mt-1 bg-secondary border-border"
                placeholder="Your full name"
              />
            </div>

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
              <Label htmlFor="referral" className="text-foreground">Referral Code (optional)</Label>
              <Input
                id="referral"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                className="mt-1 bg-secondary border-border"
                placeholder="e.g. NXM1A2B3C"
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
                  Creating account...
                </>
              ) : (
                `Join ${brand.brand_name} — ₹${membershipAmount.toLocaleString("en-IN")}`
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        ) : (
          <div className="space-y-6 p-6 rounded-xl bg-card border border-border">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-primary hover:underline font-medium disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              </p>
              <button
                onClick={() => { setStep("form"); setOtp(""); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to registration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
