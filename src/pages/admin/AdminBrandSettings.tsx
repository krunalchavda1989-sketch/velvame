import { useState, useEffect } from "react";
import { Store, Save, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandSettings {
  id: string;
  brand_name: string;
  logo_url: string;
  favicon_url: string;
  footer_logo_url: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gst_number: string;
}

const AdminBrandSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<BrandSettings>({
    id: "", brand_name: "", logo_url: "", favicon_url: "", footer_logo_url: "", tagline: "", address: "", phone: "", email: "", website: "", gst_number: "",
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("brand_settings").select("*").limit(1).maybeSingle();
      if (data) setSettings(data as unknown as BrandSettings);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase.from("brand_settings").update(rest as any).eq("id", id);
    if (error) toast.error("Failed to save");
    else toast.success("Brand settings saved!");
    setSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'favicon_url' | 'footer_logo_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `brand/${field.replace('_url', '')}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setSettings({ ...settings, [field]: urlData.publicUrl });
    setUploading(false);
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              Brand Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your brand identity and contact details</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brand Identity</CardTitle>
              <CardDescription>Your brand name, logo and tagline</CardDescription>
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
              <div className="space-y-2">
                <Label>Header Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.logo_url && (
                    <img src={settings.logo_url} alt="Logo" className="h-16 w-auto max-w-[160px] object-contain rounded-lg border border-border bg-secondary/50 p-1" />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Uploading..." : "Upload Header Logo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo_url')} />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Footer Logo</Label>
                <p className="text-xs text-muted-foreground">Separate logo for the website footer. Falls back to header logo if not set.</p>
                <div className="flex items-center gap-4">
                  {settings.footer_logo_url && (
                    <img src={settings.footer_logo_url} alt="Footer Logo" className="h-16 w-auto max-w-[160px] object-contain rounded-lg border border-border bg-secondary/50 p-1" />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Uploading..." : "Upload Footer Logo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'footer_logo_url')} />
                  </label>
                  {settings.footer_logo_url && (
                    <Button variant="ghost" size="sm" onClick={() => setSettings({ ...settings, footer_logo_url: "" })}>Remove</Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Favicon</Label>
                <p className="text-xs text-muted-foreground">Small icon shown in browser tabs. Recommended: 32×32 or 64×64 PNG.</p>
                <div className="flex items-center gap-4">
                  {settings.favicon_url && (
                    <img src={settings.favicon_url} alt="Favicon" className="h-10 w-10 object-contain rounded-lg border border-border bg-secondary/50 p-1" />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Uploading..." : "Upload Favicon"}
                    </div>
                    <input type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={(e) => handleFileUpload(e, 'favicon_url')} />
                  </label>
                  {settings.favicon_url && (
                    <Button variant="ghost" size="sm" onClick={() => setSettings({ ...settings, favicon_url: "" })}>Remove</Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input value={settings.gst_number} onChange={(e) => update("gst_number", e.target.value)} placeholder="GST Number" />
              </div>
            </CardContent>
          </Card>

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
