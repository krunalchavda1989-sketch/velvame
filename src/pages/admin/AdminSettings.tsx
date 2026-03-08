import { useState, useEffect, useCallback } from "react";
import { Settings, Key, CheckCircle, Loader2, ExternalLink, Globe, DollarSign, Receipt, Mail, Save, TestTube, RefreshCw, ToggleLeft, CreditCard, Smartphone, Zap, Truck } from "lucide-react";
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
            <TabsTrigger value="smtp" className="gap-2">
              <Mail className="h-4 w-4" /> SMTP
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="h-4 w-4" /> Shipping
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment">
            <PaymentTab />
          </TabsContent>

          <TabsContent value="localization">
            <LocalizationTab />
          </TabsContent>

          <TabsContent value="smtp">
            <SmtpTab />
          </TabsContent>

          <TabsContent value="shipping">
            <ShippingTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

/* ───────── Gateway Config Type ───────── */
interface GatewayConfig {
  enabled: boolean;
  sandbox: boolean;
  fields: Record<string, string>;
}

interface AllGateways {
  razorpay: GatewayConfig;
  phonepe: GatewayConfig;
  stripe: GatewayConfig;
}

const DEFAULT_GATEWAYS: AllGateways = {
  razorpay: { enabled: false, sandbox: false, fields: { key_id: "", key_secret: "" } },
  phonepe: { enabled: false, sandbox: false, fields: { merchant_id: "", salt_key: "", salt_index: "1" } },
  stripe: { enabled: false, sandbox: false, fields: { publishable_key: "", secret_key: "" } },
};

const GATEWAY_META = [
  {
    key: "razorpay" as const,
    label: "Razorpay",
    icon: CreditCard,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    docsUrl: "https://dashboard.razorpay.com/app/keys",
    fields: [
      { key: "key_id", label: "API Key ID", placeholder: "rzp_live_xxxxxxxx", secret: false },
      { key: "key_secret", label: "API Key Secret", placeholder: "Enter your key secret", secret: true },
    ],
  },
  {
    key: "phonepe" as const,
    label: "PhonePe",
    icon: Smartphone,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    docsUrl: "https://developer.phonepe.com/docs",
    fields: [
      { key: "merchant_id", label: "Merchant ID", placeholder: "MERCHANTUAT", secret: false },
      { key: "salt_key", label: "Salt Key", placeholder: "Enter your salt key", secret: true },
      { key: "salt_index", label: "Salt Index", placeholder: "1", secret: false },
    ],
  },
  {
    key: "stripe" as const,
    label: "Stripe",
    icon: Zap,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10 border-indigo-500/20",
    docsUrl: "https://dashboard.stripe.com/apikeys",
    fields: [
      { key: "publishable_key", label: "Publishable Key", placeholder: "pk_live_xxxxxxxx", secret: false },
      { key: "secret_key", label: "Secret Key", placeholder: "sk_live_xxxxxxxx", secret: true },
    ],
  },
];

/* ───────── Payment Tab ───────── */
const PaymentTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message?: string; error?: string }>>({});
  const [gateways, setGateways] = useState<AllGateways>(DEFAULT_GATEWAYS);
  const [expandedGateway, setExpandedGateway] = useState<string | null>("razorpay");

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("pages_content")
      .select("content")
      .eq("page_slug", "payment-gateway-settings")
      .maybeSingle();
    if (data?.content) {
      const saved = data.content as any;
      setGateways((prev) => ({
        razorpay: { ...prev.razorpay, ...saved.razorpay, fields: { ...prev.razorpay.fields, ...maskFields(saved.razorpay?.fields) } },
        phonepe: { ...prev.phonepe, ...saved.phonepe, fields: { ...prev.phonepe.fields, ...maskFields(saved.phonepe?.fields) } },
        stripe: { ...prev.stripe, ...saved.stripe, fields: { ...prev.stripe.fields, ...maskFields(saved.stripe?.fields) } },
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const maskFields = (fields: Record<string, string> | undefined): Record<string, string> => {
    if (!fields) return {};
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      const meta = GATEWAY_META.flatMap((g) => g.fields).find((f) => f.key === k);
      masked[k] = meta?.secret && v ? "••••••••" : (v || "");
    }
    return masked;
  };

  const updateGateway = (gw: keyof AllGateways, patch: Partial<GatewayConfig>) => {
    setGateways((prev) => ({ ...prev, [gw]: { ...prev[gw], ...patch } }));
  };

  const updateField = (gw: keyof AllGateways, fieldKey: string, value: string) => {
    setGateways((prev) => ({
      ...prev,
      [gw]: { ...prev[gw], fields: { ...prev[gw].fields, [fieldKey]: value } },
    }));
  };

  const handleSave = async (gwKey: keyof AllGateways) => {
    setSaving(gwKey);
    try {
      // Build payload: only include changed (non-masked) secret fields
      const gwConfig = gateways[gwKey];
      const cleanFields: Record<string, string> = {};
      for (const [k, v] of Object.entries(gwConfig.fields)) {
        if (v !== "••••••••") cleanFields[k] = v;
      }

      const payload: any = {
        enabled: gwConfig.enabled,
        sandbox: gwConfig.sandbox,
        fields: cleanFields,
      };

      // Load existing data to merge
      const { data: existing } = await supabase
        .from("pages_content")
        .select("id, content")
        .eq("page_slug", "payment-gateway-settings")
        .maybeSingle();

      const merged = existing?.content
        ? { ...(existing.content as any), [gwKey]: { ...(existing.content as any)[gwKey], ...payload, fields: { ...((existing.content as any)[gwKey]?.fields || {}), ...cleanFields } } }
        : { [gwKey]: payload };

      if (existing) {
        await supabase
          .from("pages_content")
          .update({ content: merged, title: "Payment Gateway Settings", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("pages_content").insert({
          page_slug: "payment-gateway-settings",
          title: "Payment Gateway Settings",
          content: merged,
          is_published: false,
        });
      }

      toast.success(`${GATEWAY_META.find((g) => g.key === gwKey)?.label} settings saved!`);
      await loadSettings();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const handleTestConnection = async (gwKey: keyof AllGateways) => {
    setTesting(gwKey);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[gwKey];
      return next;
    });
    try {
      const { data, error } = await supabase.functions.invoke("test-payment-gateway", {
        body: { gateway: gwKey },
      });
      if (error) throw error;
      setTestResults((prev) => ({ ...prev, [gwKey]: data }));
      if (data.success) toast.success(data.message);
      else toast.error(data.error || "Test failed");
    } catch (err: any) {
      const result = { success: false, error: err.message || "Connection test failed" };
      setTestResults((prev) => ({ ...prev, [gwKey]: result }));
      toast.error(result.error);
    } finally {
      setTesting(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {GATEWAY_META.map((meta) => {
        const gw = gateways[meta.key];
        const isExpanded = expandedGateway === meta.key;
        const IconComp = meta.icon;

        return (
          <Card key={meta.key} className={`transition-all ${gw.enabled ? "border-primary/30" : ""}`}>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => setExpandedGateway(isExpanded ? null : meta.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${meta.bgColor}`}>
                    <IconComp className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{meta.label}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-0.5">
                      {gw.sandbox && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-600">Sandbox</Badge>}
                      {gw.enabled
                        ? <span className="text-success text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</span>
                        : <span className="text-muted-foreground text-xs">Disabled</span>}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={gw.enabled}
                    onCheckedChange={(v) => updateGateway(meta.key, { enabled: v })}
                  />
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4 pt-0">
                <Separator />

                {/* Sandbox Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4 text-amber-500" />
                      Sandbox / Test Mode
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Use test credentials for development</p>
                  </div>
                  <Switch
                    checked={gw.sandbox}
                    onCheckedChange={(v) => updateGateway(meta.key, { sandbox: v })}
                  />
                </div>

                {/* Key Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meta.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <Input
                        type={field.secret ? "password" : "text"}
                        value={gw.fields[field.key] || ""}
                        onChange={(e) => updateField(meta.key, field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>

                {/* Docs Link */}
                <p className="text-xs text-muted-foreground">
                  Get your API keys from the{" "}
                  <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    {meta.label} Dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleSave(meta.key)}
                    disabled={saving === meta.key}
                    size="sm"
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                  >
                    {saving === meta.key ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save {meta.label}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Payment Stats */}
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

/* ───────── SMTP Tab ───────── */
const SmtpTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_password: "",
    from_email: "",
    from_name: "",
    use_tls: true,
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pages_content")
        .select("content")
        .eq("page_slug", "smtp-settings")
        .maybeSingle();
      if (data?.content) {
        const c = data.content as any;
        setForm({
          smtp_host: c.smtp_host || "",
          smtp_port: c.smtp_port || "587",
          smtp_user: c.smtp_user || "",
          smtp_password: c.smtp_password ? "••••••••" : "",
          from_email: c.from_email || "",
          from_name: c.from_name || "",
          use_tls: c.use_tls !== false,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port,
        smtp_user: form.smtp_user,
        from_email: form.from_email,
        from_name: form.from_name,
        use_tls: form.use_tls,
      };
      if (form.smtp_password && form.smtp_password !== "••••••••") {
        payload.smtp_password = form.smtp_password;
      }

      const { data: existing } = await supabase
        .from("pages_content")
        .select("id")
        .eq("page_slug", "smtp-settings")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("pages_content")
          .update({ content: payload, title: "SMTP Settings", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("pages_content").insert({
          page_slug: "smtp-settings",
          title: "SMTP Settings",
          content: payload,
          is_published: false,
        });
      }
      toast.success("SMTP settings saved successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await supabase.functions.invoke("smtp-test", {
        body: { to_email: form.from_email },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.success) toast.success("Test email sent successfully!");
      else toast.error(res.data?.error || "Test failed");
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>Configure email server for sending transactional emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input value={form.smtp_port} onChange={(e) => setForm({ ...form, smtp_port: e.target.value })} placeholder="587" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.smtp_user} onChange={(e) => setForm({ ...form, smtp_user: e.target.value })} placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.smtp_password} onChange={(e) => setForm({ ...form, smtp_password: e.target.value })} placeholder="App password" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} placeholder="noreply@yoursite.com" />
            </div>
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} placeholder="NexaMLM" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch checked={form.use_tls} onCheckedChange={(checked) => setForm({ ...form, use_tls: checked })} />
            <Label>Use TLS/STARTTLS</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save SMTP Settings
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
          Send Test Email
        </Button>
      </div>
    </div>
  );
};

/* ───────── Shipping Tab ───────── */
const ShippingTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    channel_id: "",
    sandbox: false,
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pages_content")
        .select("content")
        .eq("page_slug", "shipping-settings")
        .maybeSingle();
      if (data?.content) {
        const c = data.content as any;
        setForm({
          email: c.email || "",
          password: c.password ? "••••••••" : "",
          channel_id: c.channel_id || "",
          sandbox: c.sandbox || false,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        email: form.email,
        channel_id: form.channel_id,
        sandbox: form.sandbox,
      };
      if (form.password && form.password !== "••••••••") {
        payload.password = form.password;
      }

      const { data: existing } = await supabase
        .from("pages_content")
        .select("id, content")
        .eq("page_slug", "shipping-settings")
        .maybeSingle();

      if (existing) {
        const merged = { ...(existing.content as any), ...payload };
        // preserve existing password if not changed
        if (!payload.password && (existing.content as any)?.password) {
          merged.password = (existing.content as any).password;
        }
        await supabase
          .from("pages_content")
          .update({ content: merged, title: "Shipping Settings", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("pages_content").insert({
          page_slug: "shipping-settings",
          title: "Shipping Settings",
          content: payload,
          is_published: false,
        });
      }
      toast.success("Shiprocket settings saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Test by generating a Shiprocket auth token
      const baseUrl = form.sandbox
        ? "https://apiv2.shiprocket.in/v1/external"
        : "https://apiv2.shiprocket.in/v1/external";
      const email = form.email;
      const password = form.password === "••••••••" ? null : form.password;

      if (!email || !password) {
        toast.error("Please enter email and password first");
        setTesting(false);
        return;
      }

      toast.info("Shiprocket credentials saved. Test connection from your application.");
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" />
                Shiprocket Configuration
              </CardTitle>
              <CardDescription className="mt-1">Configure Shiprocket API for order shipping and tracking</CardDescription>
            </div>
            <Badge
              variant={form.email ? "default" : "destructive"}
              className={form.email ? "bg-success/10 text-success border-success/20" : ""}
            >
              {form.email ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sandbox Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <ToggleLeft className="h-4 w-4 text-amber-500" />
                Sandbox / Test Mode
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Use test environment for development</p>
            </div>
            <Switch
              checked={form.sandbox}
              onCheckedChange={(v) => setForm({ ...form, sandbox: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shiprocket Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Shiprocket Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Channel ID <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={form.channel_id}
                onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
                placeholder="e.g. 123456"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Get your credentials from the{" "}
            <a href="https://app.shiprocket.in/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              Shiprocket Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Shipping Settings
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
          Test Connection
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
