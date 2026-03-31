import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Plus, Trash2, Upload, X, Eye, GripVertical, type LucideIcon, Truck, Shield, BadgeCheck, MapPin, Heart, Star, Zap, Award, Globe, Gift, ShoppingBag, Users, TrendingUp, Package, Smartphone, Lock, Clock, ThumbsUp, Sparkles, Leaf, Gem } from "lucide-react";

const availableIcons: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "truck", label: "Truck", Icon: Truck },
  { value: "eye", label: "Eye", Icon: Eye },
  { value: "badge-check", label: "Badge Check", Icon: BadgeCheck },
  { value: "map-pin", label: "Map Pin", Icon: MapPin },
  { value: "shield", label: "Shield", Icon: Shield },
  { value: "heart", label: "Heart", Icon: Heart },
  { value: "star", label: "Star", Icon: Star },
  { value: "zap", label: "Zap", Icon: Zap },
  { value: "award", label: "Award", Icon: Award },
  { value: "globe", label: "Globe", Icon: Globe },
  { value: "gift", label: "Gift", Icon: Gift },
  { value: "shopping-bag", label: "Shopping Bag", Icon: ShoppingBag },
  { value: "users", label: "Users", Icon: Users },
  { value: "trending-up", label: "Trending Up", Icon: TrendingUp },
  { value: "package", label: "Package", Icon: Package },
  { value: "smartphone", label: "Smartphone", Icon: Smartphone },
  { value: "lock", label: "Lock", Icon: Lock },
  { value: "clock", label: "Clock", Icon: Clock },
  { value: "thumbs-up", label: "Thumbs Up", Icon: ThumbsUp },
  { value: "sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "leaf", label: "Leaf", Icon: Leaf },
  { value: "gem", label: "Gem", Icon: Gem },
];

const iconMap: Record<string, LucideIcon> = Object.fromEntries(availableIcons.map(i => [i.value, i.Icon]));

interface Settings {
  id: string;
  title: string;
  subtitle: string;
  bg_color: string;
  bg_image_url: string;
  display_style: string;
  icon_size: number;
  icon_color: string;
  title_font_size: number;
  title_color: string;
  desc_font_size: number;
  desc_color: string;
  card_bg_color: string;
  is_active: boolean;
}

interface WhyItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const displayStyleOptions = [
  { value: "minimal", label: "Minimal (No Card)" },
  { value: "card", label: "Card with Background" },
  { value: "outline", label: "Outline Card" },
];

const AdminWhyChoose = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [items, setItems] = useState<WhyItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: s }, { data: itms }] = await Promise.all([
        supabase.from("why_choose_settings" as any).select("*").limit(1).single(),
        supabase.from("why_choose_items" as any).select("*").order("sort_order"),
      ]);
      if (s) setSettings(s as any);
      if (itms) setItems(itms as any);
    };
    load();
  }, []);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !settings) return;
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const filePath = `why-choose/bg-${Date.now()}.${ext}`;
    setUploading(true);
    const { error } = await supabase.storage.from("banners").upload(filePath, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(filePath);
    setSettings({ ...settings, bg_image_url: publicUrl });
    setUploading(false);
    toast.success("Background image uploaded!");
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    await supabase.from("why_choose_settings" as any).update({ ...rest, updated_at: new Date().toISOString() } as any).eq("id", id);

    // Save items
    for (const item of items) {
      const { id: itemId, ...itemRest } = item;
      await supabase.from("why_choose_items" as any).update(itemRest as any).eq("id", itemId);
    }
    setSaving(false);
    toast.success("Why Choose section saved!");
  };

  const addItem = async () => {
    const { data, error } = await supabase.from("why_choose_items" as any).insert({ icon: "shield", title: "New Feature", description: "Description here", sort_order: items.length } as any).select().single();
    if (data) setItems([...items, data as any]);
    if (error) toast.error("Failed to add item");
  };

  const deleteItem = async (id: string) => {
    await supabase.from("why_choose_items" as any).delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
    toast.success("Item deleted");
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const newItems = [...items];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    newItems.forEach((item, i) => item.sort_order = i);
    setItems(newItems);
  };

  if (!settings) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;

  const PreviewIcon = ({ icon, size }: { icon: string; size: number }) => {
    const IC = iconMap[icon] || Shield;
    return <IC style={{ width: size, height: size }} />;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Why Choose Section</h1>
            <p className="text-sm text-muted-foreground">Manage the 'Why Choose' feature highlights on your landing page</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section Settings */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Section Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Section Enabled</Label>
                <Switch checked={settings.is_active} onCheckedChange={v => setSettings({ ...settings, is_active: v })} />
              </div>
              <div>
                <Label>Section Title</Label>
                <Input value={settings.title} onChange={e => setSettings({ ...settings, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={settings.subtitle} onChange={e => setSettings({ ...settings, subtitle: e.target.value })} />
              </div>
              <div>
                <Label>Display Style</Label>
                <Select value={settings.display_style} onValueChange={v => setSettings({ ...settings, display_style: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {displayStyleOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Background</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={settings.bg_color} onChange={e => setSettings({ ...settings, bg_color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={settings.bg_color} onChange={e => setSettings({ ...settings, bg_color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Background Image (optional)</Label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                {settings.bg_image_url ? (
                  <div className="mt-1 relative rounded-lg overflow-hidden border border-border">
                    <img src={settings.bg_image_url} alt="Background" className="w-full h-24 object-cover" />
                    <button onClick={() => setSettings({ ...settings, bg_image_url: "" })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full mt-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />{uploading ? "Uploading..." : "Upload Background Image"}
                  </Button>
                )}
              </div>
              {settings.display_style !== "minimal" && (
                <div>
                  <Label>Card Background Color</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="color" value={settings.card_bg_color} onChange={e => setSettings({ ...settings, card_bg_color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={settings.card_bg_color} onChange={e => setSettings({ ...settings, card_bg_color: e.target.value })} className="flex-1" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Icon Styling</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Icon Size ({settings.icon_size}px)</Label>
                <Input type="number" min={16} max={48} value={settings.icon_size} onChange={e => setSettings({ ...settings, icon_size: parseInt(e.target.value) || 24 })} />
              </div>
              <div>
                <Label>Icon Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={settings.icon_color} onChange={e => setSettings({ ...settings, icon_color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={settings.icon_color} onChange={e => setSettings({ ...settings, icon_color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Text Styling</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title Font Size ({settings.title_font_size}px)</Label>
                <Input type="number" min={10} max={28} value={settings.title_font_size} onChange={e => setSettings({ ...settings, title_font_size: parseInt(e.target.value) || 14 })} />
              </div>
              <div>
                <Label>Title Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={settings.title_color} onChange={e => setSettings({ ...settings, title_color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={settings.title_color} onChange={e => setSettings({ ...settings, title_color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Description Font Size ({settings.desc_font_size}px)</Label>
                <Input type="number" min={10} max={20} value={settings.desc_font_size} onChange={e => setSettings({ ...settings, desc_font_size: parseInt(e.target.value) || 12 })} />
              </div>
              <div>
                <Label>Description Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={settings.desc_color} onChange={e => setSettings({ ...settings, desc_color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={settings.desc_color} onChange={e => setSettings({ ...settings, desc_color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Feature Items</CardTitle>
              <Button size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="flex gap-3 items-start p-4 rounded-xl border border-border bg-card">
                <div className="flex flex-col gap-1 pt-2">
                  <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><GripVertical className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Icon</Label>
                    <Select value={item.icon} onValueChange={v => updateItem(item.id, "icon", v)}>
                      <SelectTrigger className="mt-1">
                        <div className="flex items-center gap-2">
                          <PreviewIcon icon={item.icon} size={16} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map(ic => (
                          <SelectItem key={ic.value} value={ic.value}>
                            <span className="flex items-center gap-2"><ic.Icon className="h-4 w-4" />{ic.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input className="mt-1" value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea className="mt-1 min-h-[38px]" rows={1} value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={item.is_active} onCheckedChange={v => updateItem(item.id, "is_active", v)} />
                  <button onClick={() => deleteItem(item.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No items yet. Click "Add Item" to get started.</p>}
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="h-4 w-4" /> Live Preview</CardTitle></CardHeader>
          <CardContent>
            <div
              className="rounded-xl p-10"
              style={{
                backgroundColor: settings.bg_color,
                backgroundImage: settings.bg_image_url ? `url(${settings.bg_image_url})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold" style={{ color: settings.title_color }}>{settings.title}</h2>
                <p className="mt-1" style={{ color: settings.desc_color, fontSize: `${settings.desc_font_size}px` }}>{settings.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {items.filter(i => i.is_active).map(item => {
                  const cardStyle = settings.display_style === "card"
                    ? { backgroundColor: settings.card_bg_color, borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : settings.display_style === "outline"
                    ? { backgroundColor: settings.card_bg_color, borderRadius: "1rem", padding: "1.5rem", border: "1px solid #e5e7eb" }
                    : {};
                  return (
                    <div key={item.id} className="text-center" style={cardStyle}>
                      <div className="w-16 h-16 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto mb-3" style={{ borderColor: `${settings.icon_color}30` }}>
                        <PreviewIcon icon={item.icon} size={settings.icon_size} />
                      </div>
                      <h3 className="font-semibold mb-1" style={{ fontSize: `${settings.title_font_size}px`, color: settings.title_color }}>{item.title}</h3>
                      <p style={{ fontSize: `${settings.desc_font_size}px`, color: settings.desc_color }}>{item.description}</p>
                    </div>
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

export default AdminWhyChoose;
