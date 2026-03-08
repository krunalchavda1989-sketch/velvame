import { useState, useEffect } from "react";
import { Settings, Key, CheckCircle, XCircle, Loader2, Shield, ExternalLink, Globe, DollarSign, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "NPR", symbol: "रू", name: "Nepalese Rupee" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
];

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage payment, localization, and tax configuration
          </p>
        </div>

        <Tabs defaultValue="payment" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="payment" className="gap-2">
              <Key className="h-4 w-4" /> Payment
            </TabsTrigger>
            <TabsTrigger value="localization" className="gap-2">
              <Globe className="h-4 w-4" /> Localization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment">
            <PaymentTab />
          </TabsContent>

          <TabsContent value="localization">
            <LocalizationTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

/* ───────── Payment Tab ───────── */
const PaymentTab = () => {
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
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: { action: "test_connection" },
      });
      if (error) throw error;
      setTestResult(data);
      if (data.success) toast.success("Razorpay connection is working!");
      else toast.error(data.error || "Connection test failed");
    } catch (err: any) {
      toast.error("Connection test failed");
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><Key className="h-5 w-5 text-primary" />Razorpay API Keys</CardTitle>
              <CardDescription className="mt-1">API credentials used for processing payments</CardDescription>
            </div>
            <Badge variant={settings?.has_key_id && settings?.has_key_secret ? "default" : "destructive"} className={settings?.has_key_id && settings?.has_key_secret ? "bg-success/10 text-success border-success/20" : ""}>
              {settings?.has_key_id && settings?.has_key_secret ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <div><p className="text-sm font-medium text-foreground">API Key ID</p><p className="text-xs text-muted-foreground mt-0.5">{settings?.has_key_id ? settings.key_id_masked : "Not set"}</p></div>
            {settings?.has_key_id ? <CheckCircle className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <div><p className="text-sm font-medium text-foreground">API Key Secret</p><p className="text-xs text-muted-foreground mt-0.5">{settings?.has_key_secret ? "••••••••••••" : "Not set"}</p></div>
            {settings?.has_key_secret ? <CheckCircle className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-foreground">Test Connection</p><p className="text-xs text-muted-foreground">Verify your Razorpay credentials are working</p></div>
            <Button variant="outline" size="sm" onClick={testConnection} disabled={testing || !settings?.has_key_id || !settings?.has_key_secret}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}Test
            </Button>
          </div>
          {testResult && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${testResult.success ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.success ? testResult.message : testResult.error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Update Keys</CardTitle>
          <CardDescription>Razorpay API keys are securely stored as backend secrets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">1.</span> Go to your <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Razorpay Dashboard <ExternalLink className="h-3 w-3" /></a></p>
            <p><span className="font-medium text-foreground">2.</span> Navigate to Settings → API Keys</p>
            <p><span className="font-medium text-foreground">3.</span> Generate or copy your Key ID and Key Secret</p>
            <p><span className="font-medium text-foreground">4.</span> Contact your developer to update the backend secrets</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Overview</CardTitle>
          <CardDescription>Quick summary of payment activity</CardDescription>
        </CardHeader>
        <CardContent><PaymentStats /></CardContent>
      </Card>
    </div>
  );
};

/* ───────── Localization Tab ───────── */
const LocalizationTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    id: "",
    default_language: "en",
    default_currency: "INR",
    currency_symbol: "₹",
    available_languages: ["en", "hi"] as string[],
    available_currencies: CURRENCIES.slice(0, 3),
    tax_enabled: false,
    tax_label: "GST",
    tax_rate: 18,
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("localization_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        setConfig({
          id: data.id,
          default_language: data.default_language,
          default_currency: data.default_currency,
          currency_symbol: data.currency_symbol,
          available_languages: (data.available_languages as string[]) || ["en", "hi"],
          available_currencies: (data.available_currencies as typeof CURRENCIES) || CURRENCIES.slice(0, 3),
          tax_enabled: data.tax_enabled,
          tax_label: data.tax_label,
          tax_rate: Number(data.tax_rate),
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("localization_settings")
        .update({
          default_language: config.default_language,
          default_currency: config.default_currency,
          currency_symbol: config.currency_symbol,
          available_languages: config.available_languages,
          available_currencies: config.available_currencies,
          tax_enabled: config.tax_enabled,
          tax_label: config.tax_label,
          tax_rate: config.tax_rate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id);
      if (error) throw error;
      toast.success("Localization settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (code: string) => {
    setConfig((prev) => {
      const has = prev.available_languages.includes(code);
      const langs = has
        ? prev.available_languages.filter((l) => l !== code)
        : [...prev.available_languages, code];
      // Ensure default language is always included
      if (!langs.includes(prev.default_language)) langs.push(prev.default_language);
      return { ...prev, available_languages: langs };
    });
  };

  const toggleCurrency = (cur: (typeof CURRENCIES)[0]) => {
    setConfig((prev) => {
      const has = prev.available_currencies.some((c) => c.code === cur.code);
      const currencies = has
        ? prev.available_currencies.filter((c) => c.code !== cur.code)
        : [...prev.available_currencies, cur];
      // Ensure default currency is always included
      if (!currencies.some((c) => c.code === prev.default_currency)) {
        const def = CURRENCIES.find((c) => c.code === prev.default_currency);
        if (def) currencies.push(def);
      }
      return { ...prev, available_currencies: currencies };
    });
  };

  const handleCurrencyChange = (code: string) => {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (cur) {
      setConfig((prev) => ({
        ...prev,
        default_currency: code,
        currency_symbol: cur.symbol,
        available_currencies: prev.available_currencies.some((c) => c.code === code)
          ? prev.available_currencies
          : [...prev.available_currencies, cur],
      }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Language Settings
          </CardTitle>
          <CardDescription>Configure default and available languages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Language</Label>
            <Select
              value={config.default_language}
              onValueChange={(v) => setConfig((p) => ({
                ...p,
                default_language: v,
                available_languages: p.available_languages.includes(v) ? p.available_languages : [...p.available_languages, v],
              }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Available Languages</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const active = config.available_languages.includes(l.code);
                const isDefault = config.default_language === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => !isDefault && toggleLanguage(l.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/20"
                    } ${isDefault ? "opacity-80 cursor-default" : "cursor-pointer"}`}
                  >
                    {l.name}
                    {isDefault && <span className="ml-1 text-[10px]">(default)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Currency Settings
          </CardTitle>
          <CardDescription>Set default currency and enable additional currencies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select value={config.default_currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Available Currencies</Label>
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((c) => {
                const active = config.available_currencies.some((ac) => ac.code === c.code);
                const isDefault = config.default_currency === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => !isDefault && toggleCurrency(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/20"
                    } ${isDefault ? "opacity-80 cursor-default" : "cursor-pointer"}`}
                  >
                    {c.symbol} {c.code}
                    {isDefault && <span className="ml-1 text-[10px]">(default)</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Currency symbol preview: <span className="text-foreground font-semibold text-sm">{config.currency_symbol}1,000</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Tax Settings
          </CardTitle>
          <CardDescription>Enable and configure tax for your products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Tax</p>
              <p className="text-xs text-muted-foreground">Apply tax to product prices globally</p>
            </div>
            <Switch
              checked={config.tax_enabled}
              onCheckedChange={(v) => setConfig((p) => ({ ...p, tax_enabled: v }))}
            />
          </div>

          {config.tax_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Label</Label>
                  <Input
                    value={config.tax_label}
                    onChange={(e) => setConfig((p) => ({ ...p, tax_label: e.target.value }))}
                    placeholder="e.g. GST, VAT, Sales Tax"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={config.tax_rate}
                    onChange={(e) => setConfig((p) => ({ ...p, tax_rate: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  Example: Product {config.currency_symbol}1,000 + {config.tax_label} {config.tax_rate}% ={" "}
                  <span className="text-foreground font-semibold">
                    {config.currency_symbol}{(1000 + (1000 * config.tax_rate) / 100).toLocaleString()}
                  </span>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Localization Settings
        </Button>
      </div>
    </div>
  );
};

/* ───────── Payment Stats ───────── */
const PaymentStats = () => {
  const [stats, setStats] = useState({ total: 0, paid: 0, failed: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: payments } = await supabase.from("payments").select("status, amount");
      if (payments) {
        setStats({
          total: payments.length,
          paid: payments.filter((p) => p.status === "paid").length,
          failed: payments.filter((p) => p.status === "failed").length,
          totalAmount: payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0),
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
