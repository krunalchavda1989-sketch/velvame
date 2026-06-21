import { useState, useEffect } from "react";
import { Store, Save, Loader2, Upload, Palette, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandSettings {
  id: string;
  brand_name: string;
  logo_url: string;
  favicon_url: string;
  footer_logo_url: string;
  og_image_url: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gst_number: string;
  brand_color: string;
  button_color: string;
  font_heading: string;
  font_body: string;
}

const FONT_OPTIONS = [
  "Inter",
  "Space Grotesk",
  "Poppins",
  "Lora",
  "Merriweather",
  "JetBrains Mono",
  "Space Mono",
];

const AdminBrandSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [settings, setSettings] = useState<BrandSettings>({
    id: "", brand_name: "", logo_url: "", favicon_url: "", footer_logo_url: "", og_image_url: "",
    tagline: "", address: "", phone: "", email: "", website: "", gst_number: "",
    brand_color: "#1a1a2e", button_color: "#1a1a2e", font_heading: "Space Grotesk", font_body: "Inter",
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("brand_settings").select("*").limit(1).maybeSingle();
      const { data: tax } = await supabase.from("tax_settings" as any).select("gst_number").limit(1).maybeSingle();
      if (data) {
        setSettings({
          ...(data as any),
          gst_number: (tax as any)?.gst_number || "",
        } as BrandSettings);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { id, gst_number, ...rest } = settings;
    const { error } = await supabase.from("brand_settings").update(rest as any).eq("id", id);
    // Upsert GST into private tax_settings (admin-only)
    const { data: existingTax } = await supabase.from("tax_settings" as any).select("id").limit(1).maybeSingle();
    let taxError: any = null;
    if (existingTax && (existingTax as any).id) {
      ({ error: taxError } = await supabase.from("tax_settings" as any).update({ gst_number, updated_at: new Date().toISOString() } as any).eq("id", (existingTax as any).id));
    } else {
      ({ error: taxError } = await supabase.from("tax_settings" as any).insert({ gst_number } as any));
    }
    if (error || taxError) toast.error("Failed to save");
    else toast.success("Brand settings saved! Refresh the site to see changes.");
    setSaving(false);
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'favicon_url' | 'footer_logo_url' | 'og_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    const ext = file.name.split(".").pop();
    const path = `brand/${field.replace('_url', '')}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setSettings({ ...settings, [field]: urlData.publicUrl });
    setUploading(null);
    toast.success("Uploaded successfully!");
  };

  const update = (key: keyof BrandSettings, value: string) => setSettings({ ...settings, [key]: value });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const renderUploadField = (
    label: string,
    field: 'logo_url' | 'favicon_url' | 'footer_logo_url' | 'og_image_url',
    description?: string,
    imgClass?: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-4">
        {settings[field] && (
          <img src={settings[field]} alt={label} className={imgClass || "h-16 w-auto max-w-[160px] object-contain rounded-lg border border-border bg-secondary/50 p-1"} />
        )}
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm">
            {uploading === field ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading === field ? "Uploading..." : `Upload ${label}`}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, field)} />
        </label>
        {settings[field] && (
          <Button variant="ghost" size="sm" onClick={() => setSettings({ ...settings, [field]: "" })}>Remove</Button>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              Brand Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your brand identity, colors, and typography</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Brand Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brand Identity</CardTitle>
              <CardDescription>Your brand name, logos, and tagline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input value={settings.brand_name} onChange={(e) => update("brand_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={settings.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={settings.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Your brand tagline" />
              </div>
              {renderUploadField("Header Logo", "logo_url")}
              {renderUploadField("Footer Logo", "footer_logo_url", "Separate logo for the website footer. Falls back to header logo if not set.")}
              {renderUploadField("Favicon", "favicon_url", "Small icon shown in browser tabs. Recommended: 32×32 or 64×64 PNG.", "h-10 w-10 object-contain rounded-lg border border-border bg-secondary/50 p-1")}
              {renderUploadField("OG Social Share Image", "og_image_url", "Image shown when your site is shared on social media (Facebook, Twitter, LinkedIn). Recommended: 1200×630px.")}
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input value={settings.gst_number} onChange={(e) => update("gst_number", e.target.value)} placeholder="GST Number" />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Colors
              </CardTitle>
              <CardDescription>Primary brand color and button color used across the website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Brand / Primary Color</Label>
                  <p className="text-xs text-muted-foreground">Used for headings, links, and primary UI elements</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.brand_color}
                      onChange={(e) => update("brand_color", e.target.value)}
                      className="h-10 w-14 rounded-md border border-border cursor-pointer"
                    />
                    <Input value={settings.brand_color} onChange={(e) => update("brand_color", e.target.value)} className="w-32 font-mono text-sm" />
                    <div className="h-10 flex-1 rounded-md border border-border" style={{ backgroundColor: settings.brand_color }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Button Color</Label>
                  <p className="text-xs text-muted-foreground">Used for CTA buttons and interactive elements</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.button_color}
                      onChange={(e) => update("button_color", e.target.value)}
                      className="h-10 w-14 rounded-md border border-border cursor-pointer"
                    />
                    <Input value={settings.button_color} onChange={(e) => update("button_color", e.target.value)} className="w-32 font-mono text-sm" />
                    <div className="h-10 flex-1 rounded-md flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: settings.button_color, borderRadius: '0.375rem' }}>
                      Button Preview
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>Font families used for headings and body text across the website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select value={settings.font_heading} onValueChange={(v) => update("font_heading", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          <span style={{ fontFamily: f }}>{f}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-lg font-bold mt-2" style={{ fontFamily: settings.font_heading }}>
                    The quick brown fox jumps
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select value={settings.font_body} onValueChange={(v) => update("font_body", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          <span style={{ fontFamily: f }}>{f}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm mt-2" style={{ fontFamily: settings.font_body }}>
                    The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>Address, phone and email for your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={settings.address} onChange={(e) => update("address", e.target.value)} rows={3} placeholder="Full business address" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={settings.email} onChange={(e) => update("email", e.target.value)} placeholder="contact@brand.com" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBrandSettings;
