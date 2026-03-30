import { useState, useEffect } from "react";
import { Palette, Save, Loader2, Type, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FONT_OPTIONS = [
  "Inter", "Space Grotesk", "Poppins", "Lora", "Merriweather",
  "JetBrains Mono", "Space Mono", "Roboto", "Open Sans", "Montserrat",
  "Raleway", "Nunito", "Playfair Display", "Oswald", "Source Sans Pro",
];

const DEFAULTS = {
  brand_color: "#1a1a2e",
  button_color: "#1a1a2e",
  secondary_color: "#10b981",
  accent_color: "#8b5cf6",
  success_color: "#22c55e",
  warning_color: "#f59e0b",
  info_color: "#3b82f6",
  danger_color: "#ef4444",
  sidebar_color: "#1a1a2e",
  stat_color_1: "#4f46e5",
  stat_color_2: "#10b981",
  stat_color_3: "#f59e0b",
  stat_color_4: "#ec4899",
  font_heading: "Space Grotesk",
  font_body: "Inter",
};

const AdminSystemColors = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState("");
  const [colors, setColors] = useState(DEFAULTS);

  useEffect(() => {
    supabase.from("brand_settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        const d = data as any;
        setId(d.id);
        setColors({
          brand_color: d.brand_color || DEFAULTS.brand_color,
          button_color: d.button_color || DEFAULTS.button_color,
          secondary_color: d.secondary_color || DEFAULTS.secondary_color,
          accent_color: d.accent_color || DEFAULTS.accent_color,
          success_color: d.success_color || DEFAULTS.success_color,
          warning_color: d.warning_color || DEFAULTS.warning_color,
          info_color: d.info_color || DEFAULTS.info_color,
          danger_color: d.danger_color || DEFAULTS.danger_color,
          sidebar_color: d.sidebar_color || DEFAULTS.sidebar_color,
          stat_color_1: d.stat_color_1 || DEFAULTS.stat_color_1,
          stat_color_2: d.stat_color_2 || DEFAULTS.stat_color_2,
          stat_color_3: d.stat_color_3 || DEFAULTS.stat_color_3,
          stat_color_4: d.stat_color_4 || DEFAULTS.stat_color_4,
          font_heading: d.font_heading || DEFAULTS.font_heading,
          font_body: d.font_body || DEFAULTS.font_body,
        });
      }
      setLoading(false);
    });
  }, []);

  const update = (key: string, value: string) => setColors(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("brand_settings").update(colors as any).eq("id", id);
    if (error) toast.error("Failed to save");
    else toast.success("System colors saved! Refresh to see changes across site.");
    setSaving(false);
  };

  const handleReset = () => {
    setColors(DEFAULTS);
    toast.info("Reset to defaults — save to apply.");
  };

  const ColorField = ({ label, field, desc }: { label: string; field: string; desc?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={(colors as any)[field]}
          onChange={(e) => update(field, e.target.value)}
          className="h-9 w-12 rounded-md border border-border cursor-pointer"
        />
        <Input
          value={(colors as any)[field]}
          onChange={(e) => update(field, e.target.value)}
          className="w-28 font-mono text-xs"
        />
        <div className="h-9 w-9 rounded-md border border-border flex-shrink-0" style={{ backgroundColor: (colors as any)[field] }} />
      </div>
    </div>
  );

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
      <div className="p-6 max-w-5xl">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              System Colors & Fonts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customize global colors and typography applied across the entire platform
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Primary Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary Colors</CardTitle>
              <CardDescription>Main brand and button colors used across UI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ColorField label="Brand / Primary" field="brand_color" desc="Headers, links, primary UI" />
                <ColorField label="Button Color" field="button_color" desc="CTA buttons" />
                <ColorField label="Secondary" field="secondary_color" desc="Secondary elements" />
                <ColorField label="Accent" field="accent_color" desc="Highlights and badges" />
                <ColorField label="Sidebar" field="sidebar_color" desc="Admin sidebar background" />
              </div>
            </CardContent>
          </Card>

          {/* Status Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Colors</CardTitle>
              <CardDescription>Colors for alerts, notifications, and status indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ColorField label="Success" field="success_color" desc="Success messages" />
                <ColorField label="Warning" field="warning_color" desc="Warning alerts" />
                <ColorField label="Info" field="info_color" desc="Informational notices" />
                <ColorField label="Danger" field="danger_color" desc="Error and destructive" />
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Stat Card Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dashboard Stat Cards</CardTitle>
              <CardDescription>Colors for the 4 stat cards on dashboards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <ColorField label="Card 1 (Earnings)" field="stat_color_1" />
                <ColorField label="Card 2 (Referrals)" field="stat_color_2" />
                <ColorField label="Card 3 (Wallet)" field="stat_color_3" />
                <ColorField label="Card 4 (Orders)" field="stat_color_4" />
              </div>
              {/* Live preview */}
              <div className="mt-6">
                <Label className="text-sm mb-3 block">Live Preview</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Total Earnings", value: "₹12,500", color: colors.stat_color_1 },
                    { label: "Direct Referrals", value: "24", color: colors.stat_color_2 },
                    { label: "Wallet Balance", value: "₹3,200", color: colors.stat_color_3 },
                    { label: "Orders", value: "18", color: colors.stat_color_4 },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="p-4 rounded-xl text-white"
                      style={{
                        background: `linear-gradient(135deg, ${s.color}, ${s.color}dd)`,
                        boxShadow: `0 4px 14px -3px ${s.color}55`,
                      }}
                    >
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-sm opacity-90">{s.label}</div>
                    </div>
                  ))}
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
              <CardDescription>Global font families for headings and body text</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select value={colors.font_heading} onValueChange={(v) => update("font_heading", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          <span style={{ fontFamily: f }}>{f}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-lg font-bold mt-2" style={{ fontFamily: colors.font_heading }}>
                    The quick brown fox jumps
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select value={colors.font_body} onValueChange={(v) => update("font_body", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          <span style={{ fontFamily: f }}>{f}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm mt-2" style={{ fontFamily: colors.font_body }}>
                    The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemColors;
