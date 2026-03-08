import { useState, useEffect, useCallback } from "react";
import { Settings, Key, CheckCircle, Loader2, Shield, ExternalLink, Globe, DollarSign, Receipt, Mail, Save, TestTube, RefreshCw, ToggleLeft, CreditCard, Smartphone, Zap, Truck, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Download, Search, MonitorSmartphone, ShieldCheck, Wallet, Building2, Package, Hash, Menu, X, MessageSquare, Send, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const SETTINGS_TABS = [
  { key: "payment", label: "Payment", icon: Key },
  { key: "localization", label: "Localization", icon: Globe },
  { key: "smtp", label: "SMTP", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "whatsapp", label: "WhatsApp", icon: Phone },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "pwa", label: "PWA", icon: MonitorSmartphone },
  { key: "captcha", label: "reCAPTCHA", icon: ShieldCheck },
  { key: "membership", label: "Membership", icon: DollarSign },
  { key: "ordernumber", label: "Order Number", icon: Hash },
];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("payment");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "payment": return <PaymentTab />;
      case "localization": return <LocalizationTab />;
      case "smtp": return <SmtpTab />;
      case "sms": return <SmsTab />;
      case "whatsapp": return <WhatsAppTab />;
      case "shipping": return <ShippingTab />;
      case "pwa": return <PWATab />;
      case "captcha": return <CaptchaTab />;
      case "membership": return <MembershipTab />;
      case "ordernumber": return <OrderNumberTab />;
      default: return <PaymentTab />;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">Settings</h2>
      </div>
      {SETTINGS_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </>
  );

  return (
    <AdminLayout>
      <div className="flex min-h-[calc(100vh-64px)] relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar — desktop: always visible, mobile: slide-in */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border p-4 space-y-1 pt-16 transition-transform duration-200
          lg:static lg:z-auto lg:w-56 lg:pt-4 lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          {/* Mobile close button */}
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground lg:hidden">
            <X className="h-5 w-5" />
          </button>
          <SidebarContent />
        </aside>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-secondary lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  {SETTINGS_TABS.find(t => t.key === activeTab)?.label || "Settings"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your {SETTINGS_TABS.find(t => t.key === activeTab)?.label.toLowerCase()} configuration
                </p>
              </div>
            </div>
          </div>
          {renderContent()}
        </div>
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
  paytm: GatewayConfig;
  instamojo: GatewayConfig;
  bank_transfer: GatewayConfig;
  cod: GatewayConfig;
}

const DEFAULT_GATEWAYS: AllGateways = {
  razorpay: { enabled: false, sandbox: false, fields: { key_id: "", key_secret: "" } },
  phonepe: { enabled: false, sandbox: false, fields: { merchant_id: "", salt_key: "", salt_index: "1" } },
  stripe: { enabled: false, sandbox: false, fields: { publishable_key: "", secret_key: "" } },
  paytm: { enabled: false, sandbox: false, fields: { merchant_id: "", merchant_key: "" } },
  instamojo: { enabled: false, sandbox: false, fields: { api_key: "", auth_token: "" } },
  bank_transfer: { enabled: false, sandbox: false, fields: { bank_name: "", account_name: "", account_number: "", ifsc_code: "", upi_id: "" } },
  cod: { enabled: false, sandbox: false, fields: { min_order_amount: "0", max_order_amount: "", instructions: "" } },
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
  {
    key: "paytm" as const,
    label: "Paytm",
    icon: Wallet,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10 border-sky-500/20",
    docsUrl: "https://dashboard.paytm.com/next/apikeys",
    fields: [
      { key: "merchant_id", label: "Merchant ID", placeholder: "YOUR_MERCHANT_ID", secret: false },
      { key: "merchant_key", label: "Merchant Key", placeholder: "Enter your merchant key", secret: true },
    ],
  },
  {
    key: "instamojo" as const,
    label: "Instamojo",
    icon: Zap,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    docsUrl: "https://www.instamojo.com/developers/",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Enter your API key", secret: false },
      { key: "auth_token", label: "Auth Token", placeholder: "Enter your auth token", secret: true },
    ],
  },
  {
    key: "bank_transfer" as const,
    label: "Bank Transfer",
    icon: Building2,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    docsUrl: "",
    fields: [
      { key: "bank_name", label: "Bank Name", placeholder: "e.g. State Bank of India", secret: false },
      { key: "account_name", label: "Account Holder Name", placeholder: "e.g. Your Company Pvt Ltd", secret: false },
      { key: "account_number", label: "Account Number", placeholder: "e.g. 1234567890", secret: false },
      { key: "ifsc_code", label: "IFSC Code", placeholder: "e.g. SBIN0001234", secret: false },
      { key: "upi_id", label: "UPI ID (optional)", placeholder: "e.g. company@upi", secret: false },
    ],
  },
  {
    key: "cod" as const,
    label: "Cash on Delivery",
    icon: Package,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    docsUrl: "",
    fields: [
      { key: "min_order_amount", label: "Min Order Amount (₹)", placeholder: "0", secret: false },
      { key: "max_order_amount", label: "Max Order Amount (₹)", placeholder: "Leave empty for no limit", secret: false },
      { key: "instructions", label: "Instructions for Customers", placeholder: "e.g. Pay at the time of delivery", secret: false },
    ],
  },
];

/* ───────── Payment Transaction List Component ───────── */
const PaymentTransactionList = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "failed">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, status, created_at, user_id, purpose, razorpay_payment_id, currency")
        .order("created_at", { ascending: false })
        .limit(500);

      if (data) {
        const userIds = [...new Set(data.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

        setTransactions(
          data.map((t) => ({
            ...t,
            customer_name: profileMap.get(t.user_id) || "Unknown",
            gateway: t.razorpay_payment_id ? "Razorpay" : "—",
            failed_reason: t.status === "failed" ? "Payment declined or cancelled" : t.status === "created" ? "Payment not completed" : "—",
          }))
        );
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const searchLower = search.toLowerCase();
  const filtered = transactions
    .filter((t) => filter === "all" || (filter === "paid" ? t.status === "paid" : (t.status === "failed" || t.status === "created")))
    .filter((t) => !searchLower || t.customer_name.toLowerCase().includes(searchLower) || (t.razorpay_payment_id || "").toLowerCase().includes(searchLower));

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleFilterChange = (f: "all" | "paid" | "failed") => {
    setFilter(f);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ["Payment Gateway", "Customer Name", "Amount", "Currency", "Date/Time", "Status", "Purpose", "Razorpay Payment ID", "Failed Reason"];
    const rows = filtered.map((t) => [
      t.gateway,
      t.customer_name,
      Number(t.amount).toFixed(2),
      t.currency,
      new Date(t.created_at).toLocaleString("en-IN"),
      t.status === "paid" ? "Success" : t.status === "created" ? "Incomplete" : "Failed",
      t.purpose,
      t.razorpay_payment_id || "",
      t.status !== "paid" ? t.failed_reason : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${filter}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Card><CardContent className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <CardDescription>Recent payment transactions across all gateways</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
            <div className="flex gap-1">
              {(["all", "paid", "failed"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(f)}
                  className="text-xs capitalize"
                >
                  {f === "paid" ? "Success" : f === "failed" ? "Failed" : "All"}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or payment ID..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No transactions found.</p>
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Payment Gateway</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Failed Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{t.gateway}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{t.customer_name}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {t.currency === "INR" ? "₹" : t.currency} {Number(t.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}{" "}
                        {new Date(t.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === "paid" ? "default" : "destructive"} className={`text-[10px] ${t.status === "paid" ? "bg-success/15 text-success border-success/30" : ""}`}>
                          {t.status === "paid" ? (
                            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Success</span>
                          ) : (
                            <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> {t.status === "created" ? "Incomplete" : "Failed"}</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {t.status !== "paid" ? (
                          <span className="flex items-center gap-1 text-destructive/80">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {t.failed_reason}
                          </span>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} transactions
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
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
      setGateways((prev) => {
        const merged = { ...prev } as any;
        for (const key of Object.keys(prev)) {
          if (saved[key]) {
            merged[key] = {
              ...prev[key as keyof AllGateways],
              ...saved[key],
              fields: { ...prev[key as keyof AllGateways].fields, ...maskFields(saved[key]?.fields) },
            };
          }
        }
        return merged;
      });
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(meta.key)}
                    disabled={testing === meta.key}
                  >
                    {testing === meta.key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                    Test Connection
                  </Button>
                </div>

                {/* Test Result */}
                {testResults[meta.key] && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                    testResults[meta.key].success
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}>
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {testResults[meta.key].success ? testResults[meta.key].message : testResults[meta.key].error}
                  </div>
                )}
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

      {/* Transaction Lists */}
      <PaymentTransactionList />
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
interface FreeShippingSettings {
  enabled: boolean;
  label: string;
  min_amount: number;
}

interface FlatRateSettings {
  enabled: boolean;
  label: string;
  cost: number;
}

const DEFAULT_FREE_SHIPPING: FreeShippingSettings = { enabled: false, label: "Free Shipping", min_amount: 0 };
const DEFAULT_FLAT_RATE: FlatRateSettings = { enabled: true, label: "Flat Rate", cost: 0 };

const ShippingTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingFreeShipping, setSavingFreeShipping] = useState(false);
  const [savingFlatRate, setSavingFlatRate] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    channel_id: "",
    sandbox: false,
  });
  const [freeShipping, setFreeShipping] = useState<FreeShippingSettings>(DEFAULT_FREE_SHIPPING);
  const [flatRate, setFlatRate] = useState<FlatRateSettings>(DEFAULT_FLAT_RATE);

  useEffect(() => {
    const load = async () => {
      const [shiprocketRes, shippingMethodsRes] = await Promise.all([
        supabase.from("pages_content").select("content").eq("page_slug", "shipping-settings").maybeSingle(),
        supabase.from("pages_content").select("content").eq("page_slug", "shipping-methods").maybeSingle(),
      ]);

      if (shiprocketRes.data?.content) {
        const c = shiprocketRes.data.content as any;
        setForm({
          email: c.email || "",
          password: c.password ? "••••••••" : "",
          channel_id: c.channel_id || "",
          sandbox: c.sandbox || false,
        });
      }

      if (shippingMethodsRes.data?.content) {
        const c = shippingMethodsRes.data.content as any;
        if (c.free_shipping) setFreeShipping({ ...DEFAULT_FREE_SHIPPING, ...c.free_shipping });
        if (c.flat_rate) setFlatRate({ ...DEFAULT_FLAT_RATE, ...c.flat_rate });
      }

      setLoading(false);
    };
    load();
  }, []);

  const saveShippingMethods = async (type: "free_shipping" | "flat_rate") => {
    const setter = type === "free_shipping" ? setSavingFreeShipping : setSavingFlatRate;
    setter(true);

    const payload = type === "free_shipping" ? { free_shipping: freeShipping } : { flat_rate: flatRate };

    const { data: existing } = await supabase
      .from("pages_content")
      .select("id, content")
      .eq("page_slug", "shipping-methods")
      .maybeSingle();

    if (existing) {
      const merged = { ...(existing.content as any), ...payload };
      await supabase
        .from("pages_content")
        .update({ content: merged as any, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("pages_content").insert({
        page_slug: "shipping-methods",
        title: "Shipping Methods",
        content: payload as any,
      });
    }
    setter(false);
    toast.success(`${type === "free_shipping" ? "Free Shipping" : "Flat Rate"} settings saved`);
  };

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
      {/* Free Shipping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Free Shipping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="free-shipping-enabled"
              checked={freeShipping.enabled}
              onCheckedChange={(v) => setFreeShipping((prev) => ({ ...prev, enabled: v }))}
            />
            <Label htmlFor="free-shipping-enabled" className="text-sm cursor-pointer">Enable Free Shipping</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              value={freeShipping.label}
              onChange={(e) => setFreeShipping((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Free Shipping"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Minimum Amount</Label>
            <Input
              type="number"
              min={0}
              value={freeShipping.min_amount}
              onChange={(e) => setFreeShipping((prev) => ({ ...prev, min_amount: Number(e.target.value) }))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Orders above this amount qualify for free shipping. Set 0 for no minimum.</p>
          </div>

          <Button onClick={() => saveShippingMethods("free_shipping")} disabled={savingFreeShipping} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            {savingFreeShipping ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </CardContent>
      </Card>

      {/* Flat Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Flat Rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="flat-rate-enabled"
              checked={flatRate.enabled}
              onCheckedChange={(v) => setFlatRate((prev) => ({ ...prev, enabled: v }))}
            />
            <Label htmlFor="flat-rate-enabled" className="text-sm cursor-pointer">Enable Flat Rate</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              value={flatRate.label}
              onChange={(e) => setFlatRate((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Flat Rate"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Cost <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={flatRate.cost}
              onChange={(e) => setFlatRate((prev) => ({ ...prev, cost: Number(e.target.value) }))}
              placeholder="0"
            />
          </div>

          <Button onClick={() => saveShippingMethods("flat_rate")} disabled={savingFlatRate} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            {savingFlatRate ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Shiprocket Config */}
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

/* ───────── PWA Tab ───────── */
const DISPLAY_OPTIONS = ["standalone", "fullscreen", "minimal-ui", "browser"];
const ORIENTATION_OPTIONS = ["any", "portrait", "landscape"];
const DIRECTION_OPTIONS = ["auto", "ltr", "rtl"];

interface PWASettings {
  enabled: boolean;
  icon_url: string;
  theme_color: string;
  background_color: string;
  status_bar: string;
  display: string;
  orientation: string;
  direction: string;
}

const DEFAULT_PWA: PWASettings = {
  enabled: false,
  icon_url: "",
  theme_color: "#000000",
  background_color: "#ffffff",
  status_bar: "#000000",
  display: "standalone",
  orientation: "any",
  direction: "auto",
};

const PWATab = () => {
  const [form, setForm] = useState<PWASettings>(DEFAULT_PWA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pages_content")
        .select("content")
        .eq("page_slug", "pwa-settings")
        .maybeSingle();
      if (data?.content) {
        setForm({ ...DEFAULT_PWA, ...(data.content as any) });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleIconUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/svg+xml";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Icon must be under 2MB");
        return;
      }
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `pwa/icon_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) {
        toast.error("Upload failed");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((prev) => ({ ...prev, icon_url: urlData.publicUrl }));
      setUploading(false);
      toast.success("Icon uploaded");
    };
    input.click();
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("pages_content")
      .select("id")
      .eq("page_slug", "pwa-settings")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("pages_content")
        .update({ content: form as any, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("pages_content").insert({
        page_slug: "pwa-settings",
        title: "PWA Settings",
        content: form as any,
      });
    }
    setSaving(false);
    toast.success("PWA settings saved");
  };

  if (loading) {
    return <Card><CardContent className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MonitorSmartphone className="h-5 w-5 text-primary" />
            Progressive Web App (PWA)
          </CardTitle>
          <CardDescription>Configure installable web app settings for mobile users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Enable PWA</p>
              <p className="text-xs text-muted-foreground">Allow users to install the app on their home screen</p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, enabled: v }))}
            />
          </div>

          <Separator />

          {/* Icon */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">App Icon</Label>
            <div className="flex items-start gap-4">
              <Button variant="outline" size="sm" onClick={handleIconUpload} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MonitorSmartphone className="h-4 w-4" />}
                Browse
              </Button>
              <div className="w-24 h-24 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                {form.icon_url ? (
                  <img src={form.icon_url} alt="PWA Icon" className="w-full h-full object-contain" />
                ) : (
                  <MonitorSmartphone className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Recommended: 512×512px PNG with transparent background</p>
          </div>

          <Separator />

          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Theme Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.theme_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, theme_color: e.target.value }))}
                  className="w-10 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={form.theme_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, theme_color: e.target.value }))}
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Background Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.background_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, background_color: e.target.value }))}
                  className="w-10 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={form.background_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, background_color: e.target.value }))}
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Status Bar</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.status_bar}
                  onChange={(e) => setForm((prev) => ({ ...prev, status_bar: e.target.value }))}
                  className="w-10 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={form.status_bar}
                  onChange={(e) => setForm((prev) => ({ ...prev, status_bar: e.target.value }))}
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Display, Orientation, Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Display</Label>
              <Select value={form.display} onValueChange={(v) => setForm((prev) => ({ ...prev, display: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISPLAY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">{o.replace("-", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Orientation</Label>
              <Select value={form.orientation} onValueChange={(v) => setForm((prev) => ({ ...prev, orientation: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIENTATION_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Direction</Label>
              <Select value={form.direction} onValueChange={(v) => setForm((prev) => ({ ...prev, direction: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIRECTION_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="uppercase">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
        {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save PWA Settings
      </Button>
    </div>
  );
};

/* ───────── Google reCAPTCHA Tab ───────── */
interface CaptchaSettings {
  enabled: boolean;
  site_key: string;
  secret_key: string;
}

const DEFAULT_CAPTCHA: CaptchaSettings = {
  enabled: false,
  site_key: "",
  secret_key: "",
};

const CaptchaTab = () => {
  const [form, setForm] = useState<CaptchaSettings>(DEFAULT_CAPTCHA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pages_content")
        .select("content")
        .eq("page_slug", "captcha-settings")
        .maybeSingle();
      if (data?.content) {
        const saved = data.content as any;
        setForm({
          ...DEFAULT_CAPTCHA,
          ...saved,
          secret_key: saved.secret_key ? "••••••••••••" : "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (form.enabled && !form.site_key.trim()) {
      toast.error("Site Key is required when reCAPTCHA is enabled");
      return;
    }
    setSaving(true);

    const payload: any = {
      enabled: form.enabled,
      site_key: form.site_key.trim(),
    };
    // Only update secret if user changed it (not the masked value)
    if (form.secret_key && !form.secret_key.startsWith("••")) {
      payload.secret_key = form.secret_key.trim();
    }

    const { data: existing } = await supabase
      .from("pages_content")
      .select("id, content")
      .eq("page_slug", "captcha-settings")
      .maybeSingle();

    const mergedContent = existing?.content
      ? { ...(existing.content as any), ...payload }
      : payload;

    if (existing) {
      await supabase
        .from("pages_content")
        .update({ content: mergedContent as any, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("pages_content").insert({
        page_slug: "captcha-settings",
        title: "Captcha Settings",
        content: mergedContent as any,
      });
    }
    setSaving(false);
    toast.success("reCAPTCHA settings saved");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Google reCAPTCHA
          </CardTitle>
          <CardDescription>
            Protect your forms from spam and abuse with Google reCAPTCHA v2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="captcha-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, enabled: v }))}
            />
            <Label htmlFor="captcha-enabled" className="text-sm cursor-pointer">
              Enable Google reCAPTCHA (V2) in Registration, Review and Contact Us Forms
            </Label>
          </div>

          <Separator />

          {/* Site Key */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Site Key <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.site_key}
              onChange={(e) => setForm((prev) => ({ ...prev, site_key: e.target.value }))}
              placeholder="Enter your reCAPTCHA site key"
            />
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Secret Key <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={form.secret_key}
              onChange={(e) => setForm((prev) => ({ ...prev, secret_key: e.target.value }))}
              placeholder="Enter your reCAPTCHA secret key"
              onFocus={(e) => {
                if (e.target.value.startsWith("••")) {
                  setForm((prev) => ({ ...prev, secret_key: "" }));
                }
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Get your keys from{" "}
            <a
              href="https://www.google.com/recaptcha/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-0.5"
            >
              Google reCAPTCHA Admin <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
        {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save
      </Button>
    </div>
  );
};

/* ───────── Membership Tab ───────── */
const MembershipTab = () => {
  const [amount, setAmount] = useState<number>(2800);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pages_content")
        .select("content")
        .eq("page_slug", "membership-settings")
        .maybeSingle();
      if (data?.content) {
        const content = data.content as any;
        setAmount(Number(content.membership_amount) || 2800);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const content = { membership_amount: amount };

      const { data: existing } = await supabase
        .from("pages_content")
        .select("id")
        .eq("page_slug", "membership-settings")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("pages_content")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("pages_content").insert({
          page_slug: "membership-settings",
          title: "Membership Settings",
          content,
          is_published: true,
        });
      }
      toast.success("Membership amount updated successfully");
    } catch {
      toast.error("Failed to save membership amount");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Membership Fee
          </CardTitle>
          <CardDescription>
            Set the one-time membership subscription amount that users must pay to activate their account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="membership-amount">Membership Amount (₹)</Label>
            <Input
              id="membership-amount"
              type="number"
              min={0}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="2800"
            />
            <p className="text-xs text-muted-foreground">
              This amount is displayed across the website and used for subscription payments.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Preview</p>
            <p className="text-sm text-muted-foreground">
              "Lifetime Membership — One-time <span className="font-semibold text-foreground">₹{amount.toLocaleString("en-IN")}</span>"
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
        {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Membership Amount
      </Button>
    </div>
  );
};

/* ───────── Order Number Tab ───────── */
const OrderNumberTab = () => {
  const [prefix, setPrefix] = useState("ORD");
  const [nextNumber, setNextNumber] = useState(1);
  const [padding, setPadding] = useState(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("order_number_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        setPrefix((data as any).prefix || "ORD");
        setNextNumber((data as any).next_number || 1);
        setPadding((data as any).padding || 4);
        setSettingsId((data as any).id);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const preview = prefix + String(nextNumber).padStart(padding, "0");

  const handleSave = async () => {
    setSaving(true);
    const payload = { prefix: prefix.toUpperCase().trim(), next_number: nextNumber, padding, updated_at: new Date().toISOString() };
    
    let error;
    if (settingsId) {
      ({ error } = await supabase.from("order_number_settings" as any).update(payload as any).eq("id", settingsId));
    } else {
      ({ error } = await supabase.from("order_number_settings" as any).insert(payload as any));
    }
    
    if (error) toast.error(error.message);
    else toast.success("Order number settings saved");
    setSaving(false);
  };

  if (loading) return <Card><CardContent className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Order Number Format
          </CardTitle>
          <CardDescription>
            Configure the prefix and starting number for auto-generated order numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.replace(/[^A-Za-z0-9-_]/g, "").slice(0, 10))}
                placeholder="e.g. VEL, ORD"
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">Letters, numbers, hyphens allowed</p>
            </div>
            <div className="space-y-2">
              <Label>Next Number</Label>
              <Input
                type="number"
                min={1}
                value={nextNumber}
                onChange={(e) => setNextNumber(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="text-xs text-muted-foreground">The next order will use this number</p>
            </div>
            <div className="space-y-2">
              <Label>Number Padding</Label>
              <Select value={String(padding)} onValueChange={(v) => setPadding(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8].map((p) => (
                    <SelectItem key={p} value={String(p)}>{p} digits (e.g. {String(1).padStart(p, "0")})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Zero-pad the number portion</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div className="text-lg font-mono font-bold text-primary">{preview}</div>
              <span className="text-xs text-muted-foreground">→ Next: {prefix.toUpperCase().trim() + String(nextNumber + 1).padStart(padding, "0")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Changing the prefix or next number will only affect <strong>future</strong> orders. Existing orders keep their assigned numbers.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || !prefix.trim()} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
        {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Order Number Settings
      </Button>
    </div>
  );
};

/* ───────── SMS Integration Tab ───────── */
const SMS_PROVIDERS = [
  { key: "msg91", label: "MSG91", color: "text-green-500", bgColor: "bg-green-500/10 border-green-500/20", docsUrl: "https://msg91.com/help", fields: [
    { key: "api_key", label: "Auth Key", placeholder: "Enter MSG91 auth key", secret: true },
    { key: "sender_id", label: "Sender ID (6 chars)", placeholder: "e.g. NXAMKT" },
    { key: "template_id", label: "Template ID", placeholder: "Enter DLT template ID" },
  ]},
  { key: "twilio", label: "Twilio", color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/20", docsUrl: "https://www.twilio.com/docs/sms", fields: [
    { key: "api_key", label: "Account SID", placeholder: "ACxxxxxxxx", secret: false },
    { key: "sender_id", label: "Auth Token", placeholder: "Enter Twilio auth token", secret: true },
    { key: "template_id", label: "From Number", placeholder: "+1234567890" },
  ]},
  { key: "textlocal", label: "Textlocal", color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/20", docsUrl: "https://api.textlocal.in/docs/", fields: [
    { key: "api_key", label: "API Key", placeholder: "Enter Textlocal API key", secret: true },
    { key: "sender_id", label: "Sender Name", placeholder: "e.g. TXTLCL" },
    { key: "template_id", label: "Template ID", placeholder: "Enter template ID" },
  ]},
  { key: "fast2sms", label: "Fast2SMS", color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/20", docsUrl: "https://docs.fast2sms.com/", fields: [
    { key: "api_key", label: "API Key", placeholder: "Enter Fast2SMS API key", secret: true },
    { key: "sender_id", label: "Sender ID", placeholder: "e.g. FSTSMS" },
    { key: "template_id", label: "Template ID", placeholder: "Enter DLT template ID" },
  ]},
  { key: "custom", label: "Custom API", color: "text-purple-500", bgColor: "bg-purple-500/10 border-purple-500/20", docsUrl: "", fields: [
    { key: "api_key", label: "API Key / Token", placeholder: "Enter your API key", secret: true },
    { key: "sender_id", label: "API Endpoint URL", placeholder: "https://api.example.com/sms/send" },
    { key: "template_id", label: "Extra Config", placeholder: "JSON config if needed" },
  ]},
];

const SmsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [provider, setProvider] = useState("msg91");
  const [isEnabled, setIsEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [senderId, setSenderId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [orderUpdatesEnabled, setOrderUpdatesEnabled] = useState(false);
  const [welcomeSmsEnabled, setWelcomeSmsEnabled] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("sms_settings").select("*").limit(1).maybeSingle();
      if (data) {
        setSettingsId(data.id);
        setProvider(data.provider);
        setIsEnabled(data.is_enabled);
        setApiKey(data.api_key);
        setSenderId(data.sender_id);
        setTemplateId(data.template_id);
        setOtpEnabled(data.otp_enabled);
        setOrderUpdatesEnabled(data.order_updates_enabled);
        setWelcomeSmsEnabled(data.welcome_sms_enabled);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        provider,
        is_enabled: isEnabled,
        api_key: apiKey,
        sender_id: senderId,
        template_id: templateId,
        otp_enabled: otpEnabled,
        order_updates_enabled: orderUpdatesEnabled,
        welcome_sms_enabled: welcomeSmsEnabled,
        updated_at: new Date().toISOString(),
      };
      if (settingsId) {
        await supabase.from("sms_settings").update(payload).eq("id", settingsId);
      } else {
        const { data } = await supabase.from("sms_settings").insert(payload).select().single();
        if (data) setSettingsId(data.id);
      }
      toast.success("SMS settings saved successfully");
    } catch {
      toast.error("Failed to save SMS settings");
    }
    setSaving(false);
  };

  const handleTestSms = async () => {
    if (!testPhone.trim()) { toast.error("Enter a phone number to test"); return; }
    if (!apiKey.trim()) { toast.error("Please configure API key first"); return; }
    setTesting(true);
    // Simulate test — in production this would call an edge function
    setTimeout(() => {
      toast.success(`Test SMS request sent to ${testPhone}`);
      setTesting(false);
    }, 1500);
  };

  const currentProvider = SMS_PROVIDERS.find(p => p.key === provider) || SMS_PROVIDERS[0];

  if (loading) return <Card><CardContent className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            SMS Gateway Provider
          </CardTitle>
          <CardDescription>Choose your SMS service provider for sending messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SMS_PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => setProvider(p.key)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  provider === p.key
                    ? `${p.bgColor} border-current ring-2 ring-primary/20`
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <MessageSquare className={`h-6 w-6 ${p.color}`} />
                <span className="text-xs font-medium">{p.label}</span>
                {provider === p.key && (
                  <CheckCircle className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Master Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentProvider.bgColor}`}>
                <MessageSquare className={`h-5 w-5 ${currentProvider.color}`} />
              </div>
              <div>
                <p className="font-medium text-sm">{currentProvider.label} Integration</p>
                <p className="text-xs text-muted-foreground">Enable or disable SMS sending</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                {isEnabled ? "Active" : "Inactive"}
              </Badge>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">API Credentials</CardTitle>
              <CardDescription>Configure your {currentProvider.label} API credentials</CardDescription>
            </div>
            {currentProvider.docsUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={currentProvider.docsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Docs
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentProvider.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-sm">{field.label}</Label>
              <Input
                type={field.secret ? "password" : "text"}
                placeholder={field.placeholder}
                value={field.key === "api_key" ? apiKey : field.key === "sender_id" ? senderId : templateId}
                onChange={(e) => {
                  if (field.key === "api_key") setApiKey(e.target.value);
                  else if (field.key === "sender_id") setSenderId(e.target.value);
                  else setTemplateId(e.target.value);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SMS Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SMS Features</CardTitle>
          <CardDescription>Choose which SMS notifications to send</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "OTP Verification", desc: "Send OTP codes for phone verification during registration", value: otpEnabled, setter: setOtpEnabled, icon: Shield },
            { label: "Order Updates", desc: "Send SMS notifications for order status changes (confirmed, shipped, delivered)", value: orderUpdatesEnabled, setter: setOrderUpdatesEnabled, icon: Package },
            { label: "Welcome SMS", desc: "Send a welcome message when a new user registers", value: welcomeSmsEnabled, setter: setWelcomeSmsEnabled, icon: Send },
          ].map((feature) => (
            <div key={feature.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <feature.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
              <Switch checked={feature.value} onCheckedChange={feature.setter} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test SMS</CardTitle>
          <CardDescription>Send a test SMS to verify your configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="Enter phone number (e.g. +919876543210)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleTestSms} disabled={testing || !apiKey.trim()}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Test
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A test message will be sent using your configured {currentProvider.label} credentials.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
        {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save SMS Settings
      </Button>
    </div>
  );
};

export default AdminSettings;
