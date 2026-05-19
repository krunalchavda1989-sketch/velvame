import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, Globe, Tag, Share2, Code2, Map as MapIcon, FileText, ShieldCheck,
  ArrowRightLeft, Activity, Save, ExternalLink, RefreshCw, Plus, Trash2, Copy, Check,
} from "lucide-react";

type Settings = Record<string, any>;

const BASE_URL = "https://velvame.lovable.app";

const useSEOSettings = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("seo_settings").select("key, config");
    if (error) toast.error(error.message);
    const map: Settings = {};
    (data || []).forEach((r: any) => (map[r.key] = r.config || {}));
    setSettings(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (key: string, config: any) => {
    const { error } = await supabase
      .from("seo_settings")
      .upsert({ key, config, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) { toast.error(error.message); return false; }
    setSettings((s) => ({ ...s, [key]: config }));
    toast.success("Saved");
    return true;
  };

  return { settings, setSettings, loading, save, reload: load };
};

// ─────────── General Tab ───────────
const GeneralTab = ({ settings, save }: any) => {
  const [form, setForm] = useState<any>({});
  useEffect(() => setForm(settings.global || {}), [settings.global]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Site-wide identity and defaults used across every page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Site Name</Label><Input value={form.site_name || ""} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></div>
          <div><Label>Title Separator</Label>
            <Select value={form.separator || " — "} onValueChange={(v) => setForm({ ...form, separator: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" — ">— (em dash)</SelectItem>
                <SelectItem value=" | ">| (pipe)</SelectItem>
                <SelectItem value=" · ">· (middot)</SelectItem>
                <SelectItem value=" - ">- (hyphen)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Base URL</Label><Input value={form.base_url || ""} onChange={(e) => setForm({ ...form, base_url: e.target.value })} /></div>
          <div><Label>Locale</Label><Input value={form.locale || ""} onChange={(e) => setForm({ ...form, locale: e.target.value })} placeholder="en_IN" /></div>
          <div><Label>Twitter Handle</Label><Input value={form.twitter_handle || ""} onChange={(e) => setForm({ ...form, twitter_handle: e.target.value })} placeholder="@Velvame" /></div>
          <div><Label>Twitter Card Type</Label>
            <Select value={form.twitter_card || "summary_large_image"} onValueChange={(v) => setForm({ ...form, twitter_card: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Default Title</Label><Input value={form.default_title || ""} onChange={(e) => setForm({ ...form, default_title: e.target.value })} maxLength={70} />
          <p className="text-xs text-muted-foreground mt-1">{(form.default_title || "").length}/70</p>
        </div>
        <div><Label>Default Meta Description</Label><Textarea value={form.default_description || ""} onChange={(e) => setForm({ ...form, default_description: e.target.value })} maxLength={160} rows={3} />
          <p className="text-xs text-muted-foreground mt-1">{(form.default_description || "").length}/160</p>
        </div>
        <div><Label>Default OG Image URL</Label><Input value={form.default_og_image || ""} onChange={(e) => setForm({ ...form, default_og_image: e.target.value })} placeholder="https://..." /></div>

        <Button onClick={() => save("global", form)}><Save className="h-4 w-4 mr-2" />Save General</Button>
      </CardContent>
    </Card>
  );
};

// ─────────── Titles & Meta Tab ───────────
const ROUTE_KEYS = [
  { key: "home", label: "Home (/)", url: "/" },
  { key: "shop", label: "Shop (/shop)", url: "/shop" },
  { key: "offers", label: "Offers (/offers)", url: "/offers" },
  { key: "about", label: "About (/about)", url: "/about" },
  { key: "contact", label: "Contact (/contact)", url: "/contact" },
  { key: "faq", label: "FAQ (/faq)", url: "/faq" },
  { key: "product", label: "Product (/product/:slug)", url: "/product/sample" },
  { key: "category", label: "Category (/category/:slug)", url: "/category/sample" },
];

const SerpPreview = ({ title, url, description }: any) => (
  <div className="border rounded-lg p-4 bg-white">
    <div className="text-xs text-muted-foreground mb-1">Google Preview</div>
    <div className="text-xs text-green-700 truncate">{BASE_URL}{url}</div>
    <div className="text-blue-700 text-lg font-medium truncate hover:underline">{title || "Title preview"}</div>
    <div className="text-sm text-gray-700 line-clamp-2">{description || "Description preview"}</div>
  </div>
);

const TitlesMetaTab = ({ settings, save }: any) => {
  const [routes, setRoutes] = useState<any>({});
  useEffect(() => setRoutes(settings.routes || {}), [settings.routes]);
  const global = settings.global || {};

  const renderToken = (s: string) =>
    (s || "")
      .replace(/%site_name%/g, global.site_name || "Velvame")
      .replace(/%page_title%/g, "Page")
      .replace(/%product_name%/g, "Sample Product")
      .replace(/%category_name%/g, "Sample Category");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Titles & Meta Descriptions</CardTitle>
        <CardDescription>
          Per-route templates. Tokens: <code className="text-xs">%site_name%</code>{" "}
          <code className="text-xs">%product_name%</code> <code className="text-xs">%category_name%</code>{" "}
          <code className="text-xs">%page_title%</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="home">
          <TabsList className="flex-wrap h-auto">
            {ROUTE_KEYS.map((r) => (
              <TabsTrigger key={r.key} value={r.key} className="text-xs">{r.label}</TabsTrigger>
            ))}
          </TabsList>
          {ROUTE_KEYS.map((r) => {
            const route = routes[r.key] || {};
            const update = (patch: any) => setRoutes({ ...routes, [r.key]: { ...route, ...patch } });
            return (
              <TabsContent key={r.key} value={r.key} className="space-y-4 pt-4">
                <div><Label>Title Template</Label><Input value={route.title || ""} onChange={(e) => update({ title: e.target.value })} maxLength={70} />
                  <p className="text-xs text-muted-foreground mt-1">{(route.title || "").length}/70</p>
                </div>
                <div><Label>Meta Description</Label><Textarea value={route.description || ""} onChange={(e) => update({ description: e.target.value })} maxLength={160} rows={2} />
                  <p className="text-xs text-muted-foreground mt-1">{(route.description || "").length}/160</p>
                </div>
                <div className="flex items-center gap-2"><Switch checked={!!route.noindex} onCheckedChange={(v) => update({ noindex: v })} /><Label>Noindex this route</Label></div>
                <SerpPreview title={renderToken(route.title)} url={r.url} description={renderToken(route.description)} />
              </TabsContent>
            );
          })}
        </Tabs>
        <Button className="mt-6" onClick={() => save("routes", routes)}><Save className="h-4 w-4 mr-2" />Save All Routes</Button>
      </CardContent>
    </Card>
  );
};

// ─────────── Schema Tab ───────────
const SchemaTab = ({ settings, save }: any) => {
  const [form, setForm] = useState<any>({});
  useEffect(() => setForm(settings.schema || {}), [settings.schema]);
  const org = form.organization || {};
  const updateOrg = (patch: any) => setForm({ ...form, organization: { ...org, ...patch } });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schema (JSON-LD)</CardTitle>
        <CardDescription>Structured data Google uses for rich results.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[
            ["organization_enabled", "Organization"],
            ["website_enabled", "WebSite + SearchAction"],
            ["breadcrumb_enabled", "BreadcrumbList"],
            ["product_enabled", "Product (auto-injected on product pages)"],
            ["faq_enabled", "FAQPage"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">{label}</span>
              <Switch checked={!!form[k]} onCheckedChange={(v) => setForm({ ...form, [k]: v })} />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Organization Details</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={org.name || ""} onChange={(e) => updateOrg({ name: e.target.value })} /></div>
            <div><Label>Logo URL</Label><Input value={org.logo || ""} onChange={(e) => updateOrg({ logo: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={org.email || ""} onChange={(e) => updateOrg({ email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={org.phone || ""} onChange={(e) => updateOrg({ phone: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Address</Label><Input value={org.address || ""} onChange={(e) => updateOrg({ address: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Same As (one URL per line)</Label>
              <Textarea
                value={Array.isArray(org.same_as) ? org.same_as.join("\n") : ""}
                onChange={(e) => updateOrg({ same_as: e.target.value.split("\n").filter(Boolean) })}
                rows={4}
                placeholder="https://facebook.com/velvame&#10;https://instagram.com/velvame"
              />
            </div>
          </div>
        </div>
        <Button onClick={() => save("schema", form)}><Save className="h-4 w-4 mr-2" />Save Schema</Button>
      </CardContent>
    </Card>
  );
};

// ─────────── Sitemap Tab ───────────
const SitemapTab = ({ settings, save }: any) => {
  const [form, setForm] = useState<any>({});
  const [counts, setCounts] = useState<any>({ products: 0, categories: 0, pages: 0 });
  const [xmlSize, setXmlSize] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => setForm(settings.sitemap || {}), [settings.sitemap]);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("product_categories").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      setCounts({ products: p.count || 0, categories: c.count || 0, pages: 0 });
      try {
        const res = await fetch("/sitemap.xml");
        const t = await res.text();
        setXmlSize(t.length);
      } catch {}
    })();
  }, []);

  const copyUrl = () => {
    navigator.clipboard.writeText(`${BASE_URL}/sitemap.xml`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("URL copied");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>XML Sitemap</CardTitle>
        <CardDescription>Auto-generated on every dev/build. Submit to Google Search Console.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="font-mono text-sm">{BASE_URL}/sitemap.xml</div>
              <div className="text-xs text-muted-foreground mt-1">~{Math.round(xmlSize / 1024)} KB</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}Copy
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/sitemap.xml" target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-2" />View</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Static Pages</div><div className="text-2xl font-bold">6</div></div>
          <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Products</div><div className="text-2xl font-bold">{counts.products}</div></div>
          <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Categories</div><div className="text-2xl font-bold">{counts.categories}</div></div>
          <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">CMS Pages</div><div className="text-2xl font-bold">{counts.pages}</div></div>
        </div>

        <div className="space-y-3 pt-2">
          {[
            ["include_static", "Include static pages (home, shop, about, etc.)"],
            ["include_products", "Include active products"],
            ["include_categories", "Include active categories"],
            ["include_cms_pages", "Include CMS pages"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">{label}</span>
              <Switch checked={form[k] !== false} onCheckedChange={(v) => setForm({ ...form, [k]: v })} />
            </div>
          ))}
        </div>

        <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3 text-sm">
          <strong>Note:</strong> Sitemap is regenerated automatically on every <code>dev</code> and <code>build</code>.
          Changes here apply on the next publish.
        </div>

        <div className="flex gap-2">
          <Button onClick={() => save("sitemap", form)}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
          <Button variant="outline" asChild>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mr-2" />Submit in Search Console
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────── Robots Tab ───────────
const RobotsTab = ({ settings, save }: any) => {
  const [content, setContent] = useState("");
  useEffect(() => setContent(settings.robots?.content || ""), [settings.robots]);

  const insert = (text: string) => setContent((c) => (c.includes(text) ? c : `${c}\n${text}\n`));

  return (
    <Card>
      <CardHeader>
        <CardTitle>robots.txt</CardTitle>
        <CardDescription>Tells search engines which paths to crawl.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-3 bg-muted/30 flex items-center justify-between">
          <div className="font-mono text-sm">{BASE_URL}/robots.txt</div>
          <Button variant="outline" size="sm" asChild>
            <a href="/robots.txt" target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-2" />View Live</a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => insert("Disallow: /admin")}>+ Block /admin</Button>
          <Button size="sm" variant="outline" onClick={() => insert("Disallow: /dashboard")}>+ Block /dashboard</Button>
          <Button size="sm" variant="outline" onClick={() => insert("Disallow: /checkout")}>+ Block /checkout</Button>
          <Button size="sm" variant="outline" onClick={() => insert(`Sitemap: ${BASE_URL}/sitemap.xml`)}>+ Add Sitemap</Button>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          className="font-mono text-sm"
          spellCheck={false}
        />

        <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3 text-sm">
          <strong>Note:</strong> robots.txt is regenerated on next <code>dev</code>/<code>build</code> and goes live on publish.
        </div>

        <Button onClick={() => save("robots", { content })}><Save className="h-4 w-4 mr-2" />Save robots.txt</Button>
      </CardContent>
    </Card>
  );
};

// ─────────── Verification Tab ───────────
const VerificationTab = ({ settings, save }: any) => {
  const [form, setForm] = useState<any>({});
  useEffect(() => setForm(settings.verification || {}), [settings.verification]);

  const fields = [
    { k: "google", label: "Google Search Console", placeholder: "google-site-verification token", url: "https://search.google.com/search-console" },
    { k: "bing", label: "Bing Webmaster Tools", placeholder: "msvalidate.01 token", url: "https://www.bing.com/webmasters" },
    { k: "yandex", label: "Yandex Webmaster", placeholder: "yandex-verification token", url: "https://webmaster.yandex.com/" },
    { k: "pinterest", label: "Pinterest", placeholder: "p:domain_verify token", url: "https://www.pinterest.com/business/" },
    { k: "facebook", label: "Facebook Domain Verification", placeholder: "facebook-domain-verification token", url: "https://business.facebook.com/" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Verification</CardTitle>
        <CardDescription>Each token is injected as a <code className="text-xs">&lt;meta&gt;</code> tag in the page head.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.k}>
            <div className="flex items-center justify-between mb-1">
              <Label>{f.label}</Label>
              <a href={f.url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Get token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input value={form[f.k] || ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.placeholder} />
          </div>
        ))}
        <Button onClick={() => save("verification", form)}><Save className="h-4 w-4 mr-2" />Save Verification</Button>
      </CardContent>
    </Card>
  );
};

// ─────────── Redirects Tab ───────────
const RedirectsTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [adding, setAdding] = useState({ from_path: "", to_path: "", status_code: 301 });

  const load = async () => {
    const { data } = await supabase.from("seo_redirects").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!adding.from_path || !adding.to_path) { toast.error("Both paths required"); return; }
    if (!adding.from_path.startsWith("/")) { toast.error("From path must start with /"); return; }
    const { error } = await supabase.from("seo_redirects").insert(adding);
    if (error) { toast.error(error.message); return; }
    setAdding({ from_path: "", to_path: "", status_code: 301 });
    toast.success("Redirect added");
    load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("seo_redirects").update({ is_active }).eq("id", id);
    load();
  };

  const del = async (id: string) => {
    await supabase.from("seo_redirects").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redirects</CardTitle>
        <CardDescription>Client-side redirects applied on navigation. Use for moved pages and broken links.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-2 items-end p-3 border rounded-lg">
          <div><Label className="text-xs">From Path</Label><Input value={adding.from_path} onChange={(e) => setAdding({ ...adding, from_path: e.target.value })} placeholder="/old-page" /></div>
          <div><Label className="text-xs">To Path / URL</Label><Input value={adding.to_path} onChange={(e) => setAdding({ ...adding, to_path: e.target.value })} placeholder="/new-page" /></div>
          <div><Label className="text-xs">Status</Label>
            <Select value={String(adding.status_code)} onValueChange={(v) => setAdding({ ...adding, status_code: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301 Permanent</SelectItem>
                <SelectItem value="302">302 Temporary</SelectItem>
                <SelectItem value="307">307 Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add}><Plus className="h-4 w-4 mr-2" />Add</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Code</TableHead>
              <TableHead>Active</TableHead><TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No redirects yet</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.from_path}</TableCell>
                <TableCell className="font-mono text-xs">{r.to_path}</TableCell>
                <TableCell><Badge variant="outline">{r.status_code}</Badge></TableCell>
                <TableCell><Switch checked={r.is_active} onCheckedChange={(v) => toggle(r.id, v)} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ─────────── Audit Tab ───────────
const AuditTab = ({ settings }: any) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const out: any[] = [];
    const routes = settings.routes || {};
    const global = settings.global || {};

    for (const r of ROUTE_KEYS) {
      const rt = routes[r.key] || {};
      out.push({
        url: r.url, type: "static", title: rt.title, description: rt.description,
        title_ok: (rt.title || "").length >= 30 && (rt.title || "").length <= 70,
        desc_ok: (rt.description || "").length >= 80 && (rt.description || "").length <= 160,
        noindex: !!rt.noindex,
      });
    }
    const { data: products } = await supabase.from("products").select("id, name, seo_title, seo_slug, seo_description").eq("active", true);
    (products || []).forEach((p: any) => {
      const title = p.seo_title || p.name;
      const desc = p.seo_description || "";
      out.push({
        url: `/product/${p.seo_slug || p.id}`, type: "product", title, description: desc,
        title_ok: title.length >= 30 && title.length <= 70,
        desc_ok: desc.length >= 80 && desc.length <= 160,
        noindex: false,
      });
    });
    const { data: cats } = await supabase.from("product_categories").select("slug, name, seo_title, seo_description").eq("is_active", true);
    (cats || []).forEach((c: any) => {
      const title = c.seo_title || c.name;
      const desc = c.seo_description || "";
      out.push({
        url: `/category/${c.slug}`, type: "category", title, description: desc,
        title_ok: title.length >= 30 && title.length <= 70,
        desc_ok: desc.length >= 80 && desc.length <= 160,
        noindex: false,
      });
    });
    setRows(out);
    setLoading(false);
    toast.success(`Audited ${out.length} URLs`);
  };

  useEffect(() => { run(); /* eslint-disable-next-line */ }, [settings]);

  const exportCsv = () => {
    const csv = ["URL,Type,Title,Title OK,Description,Desc OK,Noindex"];
    rows.forEach((r) => csv.push([r.url, r.type, JSON.stringify(r.title || ""), r.title_ok, JSON.stringify(r.description || ""), r.desc_ok, r.noindex].join(",")));
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "seo-audit.csv";
    a.click();
  };

  const passed = rows.filter((r) => r.title_ok && r.desc_ok && !r.noindex).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Audit</CardTitle>
        <CardDescription>Quality check across every indexable URL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary">{rows.length} URLs</Badge>
          <Badge className="bg-green-600">{passed} passing</Badge>
          <Badge variant="destructive">{rows.length - passed} need fixes</Badge>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={run} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Re-run</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>URL</TableHead><TableHead>Type</TableHead>
              <TableHead>Title</TableHead><TableHead>Desc</TableHead><TableHead>Idx</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs max-w-[280px] truncate">{r.url}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{r.type}</Badge></TableCell>
                  <TableCell>{r.title_ok ? <Check className="h-4 w-4 text-green-600" /> : <span className="text-xs text-amber-600">{(r.title || "").length} chars</span>}</TableCell>
                  <TableCell>{r.desc_ok ? <Check className="h-4 w-4 text-green-600" /> : <span className="text-xs text-amber-600">{(r.description || "").length} chars</span>}</TableCell>
                  <TableCell>{r.noindex ? <Badge variant="destructive" className="text-xs">noindex</Badge> : <Check className="h-4 w-4 text-green-600" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────── Main shell ───────────
const AdminSEOManager = () => {
  const { settings, loading, save } = useSEOSettings();

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Search className="h-7 w-7" />SEO Manager</h1>
          <p className="text-muted-foreground mt-1">Complete RankMath-style control over your site's SEO.</p>
        </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading settings…</CardContent></Card>
        ) : (
          <Tabs defaultValue="general">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="general"><Globe className="h-4 w-4 mr-1.5" />General</TabsTrigger>
              <TabsTrigger value="titles"><Tag className="h-4 w-4 mr-1.5" />Titles & Meta</TabsTrigger>
              <TabsTrigger value="schema"><Code2 className="h-4 w-4 mr-1.5" />Schema</TabsTrigger>
              <TabsTrigger value="sitemap"><MapIcon className="h-4 w-4 mr-1.5" />Sitemap</TabsTrigger>
              <TabsTrigger value="robots"><FileText className="h-4 w-4 mr-1.5" />Robots.txt</TabsTrigger>
              <TabsTrigger value="verification"><ShieldCheck className="h-4 w-4 mr-1.5" />Verification</TabsTrigger>
              <TabsTrigger value="redirects"><ArrowRightLeft className="h-4 w-4 mr-1.5" />Redirects</TabsTrigger>
              <TabsTrigger value="audit"><Activity className="h-4 w-4 mr-1.5" />Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6"><GeneralTab settings={settings} save={save} /></TabsContent>
            <TabsContent value="titles" className="mt-6"><TitlesMetaTab settings={settings} save={save} /></TabsContent>
            <TabsContent value="schema" className="mt-6"><SchemaTab settings={settings} save={save} /></TabsContent>
            <TabsContent value="sitemap" className="mt-6"><SitemapTab settings={settings} save={save} /></TabsContent>
            <TabsContent value="robots" className="mt-6"><RobotsTab settings={settings} save={save} /></TabsContent>
            <TabsContent value="verification" className="mt-6"><VerificationTab settings={settings} save={save} /></TabsContent>
            <TabsContent value="redirects" className="mt-6"><RedirectsTab /></TabsContent>
            <TabsContent value="audit" className="mt-6"><AuditTab settings={settings} /></TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSEOManager;
