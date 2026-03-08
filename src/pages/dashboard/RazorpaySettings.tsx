import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, CheckCircle2, XCircle, Clock, IndianRupee, Loader2, ShieldCheck, ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMembershipAmount } from "@/hooks/useMembershipAmount";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpaySettings = () => {
  const { amount: SUBSCRIPTION_AMOUNT } = useMembershipAmount();
  const { user } = useAuth();
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["razorpay-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_paid, subscription_date, full_name, phone")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["razorpay-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaySubscription = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay SDK");

      // Create order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke("razorpay", {
        body: { action: "create_order", amount: SUBSCRIPTION_AMOUNT, purpose: "subscription" },
      });

      if (orderError) throw new Error(orderError.message);
      if (orderData?.error) throw new Error(orderData.error);

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "NexaMLM",
        description: `Lifetime Subscription - ₹${SUBSCRIPTION_AMOUNT.toLocaleString("en-IN")}`,
        order_id: orderData.order_id,
        prefill: {
          name: profile?.full_name || "",
          email: user?.email || "",
          contact: profile?.phone || "",
        },
        theme: { color: "#D4AF37" },
        handler: async (response: any) => {
          // Verify payment
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke("razorpay", {
            body: {
              action: "verify_payment",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verifyError || verifyData?.error) {
            toast({ title: "Payment verification failed", description: verifyData?.error || "Please contact support.", variant: "destructive" });
          } else {
            toast({ title: "Payment successful! 🎉", description: "Your subscription is now active." });
            refetchProfile();
          }
          setPaying(false);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast({ title: "Payment failed", description: response.error?.description || "Something went wrong.", variant: "destructive" });
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/dashboard/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Payment & Subscription</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your subscription and view payment history</p>
        </motion.div>

        {/* Subscription Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={profile?.subscription_paid ? "border-green-500/30" : "border-primary/20"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Subscription Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {profile?.subscription_paid ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="border-destructive text-destructive">Inactive</Badge>
                    )}
                  </div>
                  {profile?.subscription_paid ? (
                    <p className="text-sm text-muted-foreground">
                      Activated on {new Date(profile.subscription_date!).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Pay ₹{SUBSCRIPTION_AMOUNT.toLocaleString("en-IN")} one-time to activate your account and start earning commissions.
                    </p>
                  )}
                </div>
                {!profile?.subscription_paid && (
                  <Button onClick={handlePaySubscription} disabled={paying} className="gap-2">
                    {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                    Pay ₹{SUBSCRIPTION_AMOUNT.toLocaleString("en-IN")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Payment History</CardTitle>
              </div>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !payments?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No payment history yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center gap-3">
                        {statusIcon(p.status)}
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{p.purpose}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">₹{Number(p.amount).toLocaleString("en-IN")}</p>
                        <Badge variant="outline" className={`text-xs ${
                          p.status === "paid" ? "border-green-500/30 text-green-500" :
                          p.status === "failed" ? "border-destructive/30 text-destructive" :
                          "border-border text-muted-foreground"
                        }`}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default RazorpaySettings;
