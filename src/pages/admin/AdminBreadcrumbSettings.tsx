import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Save, Loader2, Monitor, Smartphone, Plus, Trash2, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getBackgroundStyle, getHeightPx, type BreadcrumbSettings } from "@/hooks/useBreadcrumbSettings";

const defaultSettings: BreadcrumbSettings = {
  id: "",
  background_type: "solid",
  bg_color: "#1a1a2e",
  gradient_type: "linear",
  gradient_direction: "to right",
  gradient_stops: [{ color: "#1a1a2e", position: 0 }, { color: "#ff6600", position: 100 }],
  bg_image_url: "",
  bg_position: "center",
  bg_size: "cover",
  bg_repeat: "no-repeat",
  overlay_enabled: false,
  overlay_color: "#000000",
  overlay_opacity: 40,
  section_height: "medium",
  custom_height: 100,
  title_font_size: 32,
  title_font_weight: "bold",
  title_color: "#ffffff",
  title_transform: "none",
  title_letter_spacing: 0,
  crumb_font_size: 14,
  crumb_font_weight: "normal",
  crumb_active_color: "#ffffff",
  crumb_inactive_color: "#cccccc",
  separator_symbol: ">",
  separator_color: "#ffffff",
  text_alignment: "left",
  vertical_position: "middle",
  visibility_settings: { cms: true, product: true, category: true, about: true, contact: true, blog: true, home: false, checkout: false, login: false },
};

const gradientDirections = [
  { value: "to right", label: "Left to Right" },
  { value: "to left", label: "Right to Left" },
  { value: "to bottom", label: "Top to Bottom" },
  { value: "to top", label: "Bottom to Top" },
  { value: "to bottom right", label: "Diagonal ↘" },
  { value: "to bottom left", label: "Diagonal ↙" },
];

const fontWeights = [
  { value: "normal", label: "Normal" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi Bold" },
  { value: "bold", label: "Bold" },
  { value: "800", label: "Extra Bold" },
];

const visibilityOptions = [
  { key: "cms", label: "CMS / Dynamic Pages" },
  { key: "product", label: "Product Detail Page" },
  { key: "category", label: "Product Category Page" },
  { key: "about", label: "About Us Page" },
  { key: "contact", label: "Contact Page" },
  { key: "blog", label: "Blog Pages" },
  { key: "home", label: "Home Page" },
  { key: "checkout", label: "Checkout Page" },
  { key: "login", label: "Login / Register Page" },
];

const AdminBreadcrumbSettings = () => {
  const [settings, setSettings] = useState<BreadcrumbSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("breadcrumb_settings").select("*").limit(1).maybeSingle();
      if (data) {
        setSettings({
          ...data,
          gradient_stops: Array.isArray(data.gradient_stops) ? data.gradient_stops as any : defaultSettings.gradient_stops,
          visibility_settings: typeof data.visibility_settings === "object" && data.visibility_settings !== null ? data.visibility_settings as any : defaultSettings.visibility_settings,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const update = useCallback((field: keyof BreadcrumbSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase.from("breadcrumb_settings").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Failed to save");
    else toast.success("Breadcrumb settings saved!");
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `breadcrumb-bg-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); return; }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    update("bg_image_url", pub.publicUrl);
    toast.success("Image uploaded");
  };

  const updateGradientStop = (index: number, field: "color" | "position", value: any) => {
    const stops = [...settings.gradient_stops];
    stops[index] = { ...stops[index], [field]: field === "position" ? Number(value) : value };
    update("gradient_stops", stops);
  };

  const addGradientStop = () => {
    if (settings.gradient_stops.length >= 4) return;
    update("gradient_stops", [...settings.gradient_stops, { color: "#ffffff", position: 50 }]);
  };

  const removeGradientStop = (i: number) => {
    if (settings.gradient_stops.length <= 2) return;
    update("gradient_stops", settings.gradient_stops.filter((_, idx) => idx !== i));
  };

  const toggleVisibility = (key: string) => {
    update("visibility_settings", { ...settings.visibility_settings, [key]: !settings.visibility_settings[key] });
  };

  // Preview styles
  const previewBg = getBackgroundStyle(settings);
  const previewHeight = getHeightPx(settings);
  const alignItems = settings.vertical_position === "top" ? "flex-start" : settings.vertical_position === "bottom" ? "flex-end" : "center";
  const textAlign = settings.text_alignment as any;

  if (loading) return <AdminLayout title="Breadcrumb Settings"><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout title="Breadcrumb Settings">
      <div className="space-y-6 max-w-5xl">
        {/* Live Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Live Preview</CardTitle>
              <div className="flex gap-2">
                <Button variant={previewMode === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("desktop")}><Monitor className="h-4 w-4 mr-1" /> Desktop</Button>
                <Button variant={previewMode === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("mobile")}><Smartphone className="h-4 w-4 mr-1" /> Mobile</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`mx-auto rounded-lg overflow-hidden border ${previewMode === "mobile" ? "max-w-[375px]" : "w-full"}`}>
              <div
                className="relative overflow-hidden flex"
                style={{ ...previewBg, minHeight: `${previewHeight}px`, alignItems }}
              >
                {settings.background_type === "image" && settings.overlay_enabled && (
                  <div className="absolute inset-0" style={{ backgroundColor: settings.overlay_color, opacity: settings.overlay_opacity / 100 }} />
                )}
                <div className="relative z-10 px-6 py-4 w-full" style={{ textAlign }}>
                  <div className="mb-2" style={{ display: "flex", justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start" }}>
                    <div className="flex items-center" style={{ gap: "6px", fontSize: `${settings.crumb_font_size}px`, fontWeight: settings.crumb_font_weight }}>
                      <span style={{ color: settings.crumb_active_color }}>Home</span>
                      <span style={{ color: settings.separator_color }}>{settings.separator_symbol}</span>
                      <span style={{ color: settings.crumb_inactive_color }}>Privacy Policy</span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: `${settings.title_font_size}px`,
                      fontWeight: settings.title_font_weight,
                      color: settings.title_color,
                      textTransform: settings.title_transform as any,
                      letterSpacing: `${settings.title_letter_spacing}px`,
                    }}
                  >
                    Privacy Policy
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Background Settings */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Background Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={settings.background_type} onValueChange={v => update("background_type", v)} className="flex gap-4">
              {["solid", "gradient", "image"].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={`bg-${t}`} />
                  <Label htmlFor={`bg-${t}`} className="capitalize">{t === "image" ? "Background Image" : t === "gradient" ? "Gradient" : "Solid Color"}</Label>
                </div>
              ))}
            </RadioGroup>

            {settings.background_type === "solid" && (
              <div className="flex items-center gap-3">
                <Label>Background Color</Label>
                <input type="color" value={settings.bg_color} onChange={e => update("bg_color", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                <Input value={settings.bg_color} onChange={e => update("bg_color", e.target.value)} className="w-28" />
              </div>
            )}

            {settings.background_type === "gradient" && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div>
                    <Label>Gradient Type</Label>
                    <RadioGroup value={settings.gradient_type} onValueChange={v => update("gradient_type", v)} className="flex gap-3 mt-1">
                      <div className="flex items-center gap-1"><RadioGroupItem value="linear" id="g-linear" /><Label htmlFor="g-linear">Linear</Label></div>
                      <div className="flex items-center gap-1"><RadioGroupItem value="radial" id="g-radial" /><Label htmlFor="g-radial">Radial</Label></div>
                    </RadioGroup>
                  </div>
                  {settings.gradient_type === "linear" && (
                    <div>
                      <Label>Direction</Label>
                      <Select value={settings.gradient_direction} onValueChange={v => update("gradient_direction", v)}>
                        <SelectTrigger className="w-48 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{gradientDirections.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Color Stops</Label>
                  {settings.gradient_stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="color" value={stop.color} onChange={e => updateGradientStop(i, "color", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                      <Input value={stop.color} onChange={e => updateGradientStop(i, "color", e.target.value)} className="w-28" />
                      <Input type="number" value={stop.position} onChange={e => updateGradientStop(i, "position", e.target.value)} className="w-20" min={0} max={100} />
                      <span className="text-xs text-muted-foreground">%</span>
                      {settings.gradient_stops.length > 2 && <Button variant="ghost" size="icon" onClick={() => removeGradientStop(i)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  ))}
                  {settings.gradient_stops.length < 4 && <Button variant="outline" size="sm" onClick={addGradientStop}><Plus className="h-4 w-4 mr-1" /> Add Stop</Button>}
                </div>
              </div>
            )}

            {settings.background_type === "image" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label>Image</Label>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Button variant="outline" size="sm" asChild><span><Upload className="h-4 w-4 mr-1" /> Upload</span></Button>
                  </label>
                  <Input value={settings.bg_image_url} onChange={e => update("bg_image_url", e.target.value)} placeholder="Or paste URL" className="flex-1" />
                </div>
                {settings.bg_image_url && <img src={settings.bg_image_url} alt="preview" className="h-20 rounded object-cover" />}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Position</Label>
                    <Select value={settings.bg_position} onValueChange={v => update("bg_position", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["center", "top", "bottom", "left", "right"].map(v => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Size</Label>
                    <Select value={settings.bg_size} onValueChange={v => update("bg_size", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["cover", "contain", "auto"].map(v => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Repeat</Label>
                    <Select value={settings.bg_repeat} onValueChange={v => update("bg_repeat", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["no-repeat", "repeat", "repeat-x", "repeat-y"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={settings.overlay_enabled} onCheckedChange={v => update("overlay_enabled", v)} />
                    <Label>Enable Overlay</Label>
                  </div>
                  {settings.overlay_enabled && (
                    <>
                      <input type="color" value={settings.overlay_color} onChange={e => update("overlay_color", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                      <div className="flex items-center gap-2 flex-1">
                        <Label className="text-xs whitespace-nowrap">Opacity: {settings.overlay_opacity}%</Label>
                        <Slider value={[settings.overlay_opacity]} onValueChange={v => update("overlay_opacity", v[0])} min={0} max={100} step={5} className="flex-1" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Height */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Section Height</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={settings.section_height} onValueChange={v => update("section_height", v)} className="flex flex-wrap gap-4">
              {[{ v: "small", l: "Small (60px)" }, { v: "medium", l: "Medium (100px)" }, { v: "large", l: "Large (150px)" }, { v: "custom", l: "Custom" }].map(o => (
                <div key={o.v} className="flex items-center gap-2">
                  <RadioGroupItem value={o.v} id={`h-${o.v}`} />
                  <Label htmlFor={`h-${o.v}`}>{o.l}</Label>
                </div>
              ))}
            </RadioGroup>
            {settings.section_height === "custom" && (
              <div className="flex items-center gap-2 mt-3">
                <Input type="number" value={settings.custom_height} onChange={e => update("custom_height", Number(e.target.value))} className="w-24" min={40} max={400} />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Font & Text */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Font & Text Settings</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Page Title (Main Heading)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Font Size (px)</Label>
                  <Input type="number" value={settings.title_font_size} onChange={e => update("title_font_size", Number(e.target.value))} min={16} max={72} />
                </div>
                <div>
                  <Label className="text-xs">Font Weight</Label>
                  <Select value={settings.title_font_weight} onValueChange={v => update("title_font_weight", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{fontWeights.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Font Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.title_color} onChange={e => update("title_color", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                    <Input value={settings.title_color} onChange={e => update("title_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Text Transform</Label>
                  <Select value={settings.title_transform} onValueChange={v => update("title_transform", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["none", "uppercase", "capitalize", "lowercase"].map(v => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Letter Spacing (px)</Label>
                  <Input type="number" value={settings.title_letter_spacing} onChange={e => update("title_letter_spacing", Number(e.target.value))} min={-5} max={20} />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-3 block">Breadcrumb Trail</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Font Size (px)</Label>
                  <Input type="number" value={settings.crumb_font_size} onChange={e => update("crumb_font_size", Number(e.target.value))} min={10} max={24} />
                </div>
                <div>
                  <Label className="text-xs">Font Weight</Label>
                  <Select value={settings.crumb_font_weight} onValueChange={v => update("crumb_font_weight", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{fontWeights.slice(0, 3).map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Active Link Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.crumb_active_color} onChange={e => update("crumb_active_color", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                    <Input value={settings.crumb_active_color} onChange={e => update("crumb_active_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Current Page Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.crumb_inactive_color} onChange={e => update("crumb_inactive_color", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                    <Input value={settings.crumb_inactive_color} onChange={e => update("crumb_inactive_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Separator Symbol</Label>
                  <Input value={settings.separator_symbol} onChange={e => update("separator_symbol", e.target.value)} className="w-20" maxLength={3} />
                </div>
                <div>
                  <Label className="text-xs">Separator Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.separator_color} onChange={e => update("separator_color", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
                    <Input value={settings.separator_color} onChange={e => update("separator_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alignment */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Text Alignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Content Alignment</Label>
              <RadioGroup value={settings.text_alignment} onValueChange={v => update("text_alignment", v)} className="flex gap-4 mt-1">
                {["left", "center", "right"].map(a => (
                  <div key={a} className="flex items-center gap-2"><RadioGroupItem value={a} id={`align-${a}`} /><Label htmlFor={`align-${a}`} className="capitalize">{a}</Label></div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Vertical Position</Label>
              <RadioGroup value={settings.vertical_position} onValueChange={v => update("vertical_position", v)} className="flex gap-4 mt-1">
                {["top", "middle", "bottom"].map(a => (
                  <div key={a} className="flex items-center gap-2"><RadioGroupItem value={a} id={`vert-${a}`} /><Label htmlFor={`vert-${a}`} className="capitalize">{a}</Label></div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Breadcrumb Visibility Per Page Type</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {visibilityOptions.map(opt => (
                <div key={opt.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={!!settings.visibility_settings[opt.key]}
                    onCheckedChange={() => toggleVisibility(opt.key)}
                    id={`vis-${opt.key}`}
                  />
                  <Label htmlFor={`vis-${opt.key}`} className="text-sm">{opt.label}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminBreadcrumbSettings;
