import { useState, useEffect } from "react";
import { Settings, Key, CheckCircle, XCircle, Loader2, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<{
    key_id_masked: string;
    has_key_id: boolean;
    has_key_secret: boolean;
  } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: { action: "get_settings" },
      });
      if (error) throw error;
      setSettings(data);
    } catch (err: any) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: { action: "test_connection" },
      });
      if (error) throw error;
      setTestResult(data);
      if (data.success) {
        toast.success("Razorpay connection is working!");
      } else {
        toast.error(data.error || "Connection test failed");
      }
    } catch (err: any) {
      toast.error("Connection test failed");
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Payment Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Razorpay payment gateway configuration
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Razorpay Configuration Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Key className="h-5 w-5 text-primary" />
                      Razorpay API Keys
                    </CardTitle>
                    <CardDescription className="mt-1">
                      API credentials used for processing payments
                    </CardDescription>
                  </div>
                  <Badge
                    variant={settings?.has_key_id && settings?.has_key_secret ? "default" : "destructive"}
                    className={settings?.has_key_id && settings?.has_key_secret
                      ? "bg-success/10 text-success border-success/20"
                      : ""}
                  >
                    {settings?.has_key_id && settings?.has_key_secret ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key ID */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">API Key ID</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {settings?.has_key_id
                        ? `${settings.key_id_masked}`
                        : "Not set"}
                    </p>
                  </div>
                  {settings?.has_key_id ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>

                {/* Key Secret */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">API Key Secret</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {settings?.has_key_secret ? "••••••••••••" : "Not set"}
                    </p>
                  </div>
                  {settings?.has_key_secret ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>

                <Separator />

                {/* Test Connection */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Test Connection</p>
                    <p className="text-xs text-muted-foreground">
                      Verify your Razorpay credentials are working
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testConnection}
                    disabled={testing || !settings?.has_key_id || !settings?.has_key_secret}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Test
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      testResult.success
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.success ? testResult.message : testResult.error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Update Keys</CardTitle>
                <CardDescription>
                  Razorpay API keys are securely stored as backend secrets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">1.</span> Go to your{" "}
                    <a
                      href="https://dashboard.razorpay.com/app/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Razorpay Dashboard <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">2.</span> Navigate to Settings → API Keys
                  </p>
                  <p>
                    <span className="font-medium text-foreground">3.</span> Generate or copy your Key ID and Key Secret
                  </p>
                  <p>
                    <span className="font-medium text-foreground">4.</span> Contact your developer to update the backend secrets: <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">RAZORPAY_KEY_ID</code> and <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">RAZORPAY_KEY_SECRET</code>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Overview</CardTitle>
                <CardDescription>Quick summary of payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentStats />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const PaymentStats = () => {
  const [stats, setStats] = useState({ total: 0, paid: 0, failed: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: payments } = await supabase
        .from("payments")
        .select("status, amount");

      if (payments) {
        setStats({
          total: payments.length,
          paid: payments.filter((p) => p.status === "paid").length,
          failed: payments.filter((p) => p.status === "failed").length,
          totalAmount: payments
            .filter((p) => p.status === "paid")
            .reduce((sum, p) => sum + Number(p.amount), 0),
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
        <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Total Payments</p>
      </div>
      <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-center">
        <p className="text-2xl font-display font-bold text-success">{stats.paid}</p>
        <p className="text-xs text-muted-foreground">Successful</p>
      </div>
      <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
        <p className="text-2xl font-display font-bold text-destructive">{stats.failed}</p>
        <p className="text-xs text-muted-foreground">Failed</p>
      </div>
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
        <p className="text-2xl font-display font-bold text-primary">₹{stats.totalAmount.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Total Revenue</p>
      </div>
    </div>
  );
};

export default AdminSettings;
