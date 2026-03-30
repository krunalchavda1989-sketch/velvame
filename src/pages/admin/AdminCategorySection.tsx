import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";

interface CategorySettings {
  id: string;
  title: string;
  subtitle: string;
  bg_color: string;
  bg_image_url: string;
  display_count: number;
  image_style: string;
  hover_effect: string;
  is_active: boolean;
}

const AdminCategorySection = () => {
  const [settings, setSettings] = useState<CategorySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("category_section_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (data) setSettings(data as any);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase
      .from("category_section_settings" as any)
      .update({ ...rest, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Category section settings saved!");
    }
  };

  if (!settings) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;

  const imageStyleOptions = [
    { value: "square", label: "Square" },
    { value: "rounded", label: "Rounded" },
    { value: "full-round", label: "Full Round (Circle)" },
    { value: "adaptive", label: "Adaptive Height" },
  ];

  const hoverEffectOptions = [
    { value: "none", label: "None" },
    { value: "zoom", label: "Zoom In" },
    { value: "lift", label: "Lift Up" },
    { value: "glow", label: "Glow Border" },
    { value: "grayscale", label: "Grayscale to Color" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shop by Category Section</h1>
            <p className="text-sm text-muted-foreground">Manage the category section on your landing page</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Title & Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Section Enabled</Label>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(v) => setSettings({ ...settings, is_active: v })}
                />
              </div>
              <div>
                <Label>Section Title</Label>
                <Input
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={settings.subtitle}
                  onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Categories to Display</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.display_count}
                  onChange={(e) => setSettings({ ...settings, display_count: parseInt(e.target.value) || 6 })}
                />
                <p className="text-xs text-muted-foreground mt-1">How many categories to show in the carousel</p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={settings.bg_color}
                    onChange={(e) => setSettings({ ...settings, bg_color: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.bg_color}
                    onChange={(e) => setSettings({ ...settings, bg_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Background Image URL (optional)</Label>
                <Input
                  value={settings.bg_image_url}
                  onChange={(e) => setSettings({ ...settings, bg_image_url: e.target.value })}
                  placeholder="https://example.com/bg.jpg"
                />
              </div>
              <div>
                <Label>Image Shape</Label>
                <Select
                  value={settings.image_style}
                  onValueChange={(v) => setSettings({ ...settings, image_style: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageStyleOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hover Effect</Label>
                <Select
                  value={settings.hover_effect}
                  onValueChange={(v) => setSettings({ ...settings, hover_effect: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hoverEffectOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-4 w-4" /> Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-xl p-8 text-center"
              style={{
                backgroundColor: settings.bg_color,
                backgroundImage: settings.bg_image_url ? `url(${settings.bg_image_url})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <h2 className="text-xl font-bold mb-1">{settings.title}</h2>
              <p className="text-sm text-muted-foreground mb-6">{settings.subtitle}</p>
              <div className="flex justify-center gap-4">
                {Array.from({ length: Math.min(settings.display_count, 4) }).map((_, i) => {
                  const shapeClass =
                    settings.image_style === "full-round"
                      ? "rounded-full aspect-square"
                      : settings.image_style === "square"
                      ? "rounded-none aspect-square"
                      : settings.image_style === "adaptive"
                      ? "rounded-2xl aspect-[3/4]"
                      : "rounded-2xl aspect-square";

                  const hoverClass =
                    settings.hover_effect === "zoom"
                      ? "hover:scale-105"
                      : settings.hover_effect === "lift"
                      ? "hover:-translate-y-2"
                      : settings.hover_effect === "glow"
                      ? "hover:ring-4 hover:ring-primary/30"
                      : settings.hover_effect === "grayscale"
                      ? "grayscale hover:grayscale-0"
                      : "";

                  return (
                    <div
                      key={i}
                      className={`w-24 bg-secondary border border-border ${shapeClass} ${hoverClass} transition-all duration-300`}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCategorySection;
