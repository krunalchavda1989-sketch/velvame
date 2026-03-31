import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Loader2, MoveHorizontal, Save, X, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MarqueeItem {
  id: string;
  marquee_id: string;
  text: string;
  sort_order: number;
  is_active: boolean;
}

interface MarqueeSection {
  id: string;
  title: string;
  is_active: boolean;
  bg_color: string;
  text_color: string;
  font_family: string;
  font_size: number;
  font_weight: string;
  speed: number;
  height: number;
  direction: string;
  sort_order: number;
  items: MarqueeItem[];
}

const FONT_OPTIONS = [
  { value: "inherit", label: "Default" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Lato', sans-serif", label: "Lato" },
];

const AdminMarquee = () => {
  const [marquees, setMarquees] = useState<MarqueeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMarquees();
  }, []);

  const fetchMarquees = async () => {
    const { data: sections } = await supabase
      .from("marquee_sections" as any)
      .select("*")
      .order("sort_order");
    const { data: items } = await supabase
      .from("marquee_items" as any)
      .select("*")
      .order("sort_order");

    const mapped = ((sections as any[]) || []).map((s: any) => ({
      ...s,
      items: ((items as any[]) || []).filter((i: any) => i.marquee_id === s.id),
    }));
    setMarquees(mapped);
    setLoading(false);
  };

  const addMarquee = async () => {
    const { data, error } = await supabase
      .from("marquee_sections" as any)
      .insert({ title: `Marquee ${marquees.length + 1}`, sort_order: marquees.length } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to create"); return; }
    const newMarquee = { ...(data as any), items: [] };
    setMarquees([...marquees, newMarquee]);
    setExpandedId(newMarquee.id);
    toast.success("Marquee section created");
  };

  const deleteMarquee = async (id: string) => {
    await supabase.from("marquee_sections" as any).delete().eq("id", id);
    setMarquees(marquees.filter((m) => m.id !== id));
    toast.success("Deleted");
  };

  const updateMarquee = (id: string, field: string, value: any) => {
    setMarquees(marquees.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const saveMarquee = async (marquee: MarqueeSection) => {
    setSaving(true);
    const { items, ...settings } = marquee;
    await supabase
      .from("marquee_sections" as any)
      .update({ ...settings, updated_at: new Date().toISOString() } as any)
      .eq("id", marquee.id);

    // Save items
    for (const item of items) {
      if (item.id.startsWith("new-")) {
        await supabase.from("marquee_items" as any).insert({
          marquee_id: marquee.id,
          text: item.text,
          sort_order: item.sort_order,
          is_active: item.is_active,
        } as any);
      } else {
        await supabase
          .from("marquee_items" as any)
          .update({ text: item.text, sort_order: item.sort_order, is_active: item.is_active } as any)
          .eq("id", item.id);
      }
    }
    toast.success("Saved!");
    setSaving(false);
    fetchMarquees();
  };

  const addItem = (marqueeId: string) => {
    setMarquees(marquees.map((m) => {
      if (m.id !== marqueeId) return m;
      return {
        ...m,
        items: [...m.items, {
          id: `new-${Date.now()}`,
          marquee_id: marqueeId,
          text: "New marquee text ✦",
          sort_order: m.items.length,
          is_active: true,
        }],
      };
    }));
  };

  const removeItem = async (marqueeId: string, itemId: string) => {
    if (!itemId.startsWith("new-")) {
      await supabase.from("marquee_items" as any).delete().eq("id", itemId);
    }
    setMarquees(marquees.map((m) => {
      if (m.id !== marqueeId) return m;
      return { ...m, items: m.items.filter((i) => i.id !== itemId) };
    }));
  };

  const updateItem = (marqueeId: string, itemId: string, field: string, value: any) => {
    setMarquees(marquees.map((m) => {
      if (m.id !== marqueeId) return m;
      return {
        ...m,
        items: m.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
      };
    }));
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MoveHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Scrolling Marquee</h1>
              <p className="text-sm text-muted-foreground">Create and manage scrolling text banners</p>
            </div>
          </div>
          <Button onClick={addMarquee} className="gap-2">
            <Plus className="h-4 w-4" /> Add Marquee
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : marquees.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MoveHorizontal className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No marquee sections yet</p>
              <Button onClick={addMarquee} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Create First Marquee
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {marquees.map((marquee) => {
              const isExpanded = expandedId === marquee.id;
              return (
                <Card key={marquee.id} className="overflow-hidden">
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : marquee.id)}
                  >
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: marquee.bg_color }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{marquee.title || "Untitled"}</span>
                      <span className="text-xs text-muted-foreground ml-2">({marquee.items.length} items)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {marquee.is_active ? (
                        <Eye className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={marquee.is_active}
                        onCheckedChange={(v) => updateMarquee(marquee.id, "is_active", v)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div
                    className="overflow-hidden border-y border-border"
                    style={{
                      backgroundColor: marquee.bg_color,
                      height: `${marquee.height}px`,
                    }}
                  >
                    <motion.div
                      animate={{ x: marquee.direction === "right" ? [-1200, 0] : [0, -1200] }}
                      transition={{ duration: Math.max(5, 40 - marquee.speed), repeat: Infinity, ease: "linear" }}
                      className="flex items-center gap-10 whitespace-nowrap h-full"
                    >
                      {Array.from({ length: 12 }).map((_, i) => {
                        const item = marquee.items[i % Math.max(1, marquee.items.length)];
                        return (
                          <span
                            key={i}
                            style={{
                              color: marquee.text_color,
                              fontFamily: marquee.font_family,
                              fontSize: `${marquee.font_size}px`,
                              fontWeight: marquee.font_weight === "bold" ? 700 : marquee.font_weight === "semibold" ? 600 : marquee.font_weight === "medium" ? 500 : 400,
                            }}
                          >
                            {item?.text || "Add marquee text"}
                          </span>
                        );
                      })}
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 space-y-6">
                          {/* General Settings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Section Title</Label>
                              <Input value={marquee.title} onChange={(e) => updateMarquee(marquee.id, "title", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Background</Label>
                                <div className="flex gap-2">
                                  <input type="color" value={marquee.bg_color} onChange={(e) => updateMarquee(marquee.id, "bg_color", e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                                  <Input value={marquee.bg_color} onChange={(e) => updateMarquee(marquee.id, "bg_color", e.target.value)} className="flex-1" />
                                </div>
                              </div>
                              <div>
                                <Label>Text Color</Label>
                                <div className="flex gap-2">
                                  <input type="color" value={marquee.text_color} onChange={(e) => updateMarquee(marquee.id, "text_color", e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                                  <Input value={marquee.text_color} onChange={(e) => updateMarquee(marquee.id, "text_color", e.target.value)} className="flex-1" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Typography & Behavior */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Typography & Behavior</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Font Family</Label>
                                <Select value={marquee.font_family} onValueChange={(v) => updateMarquee(marquee.id, "font_family", v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {FONT_OPTIONS.map((f) => (
                                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Font Size (px)</Label>
                                <Input type="number" min={10} max={40} value={marquee.font_size} onChange={(e) => updateMarquee(marquee.id, "font_size", +e.target.value)} />
                              </div>
                              <div>
                                <Label>Font Weight</Label>
                                <Select value={marquee.font_weight} onValueChange={(v) => updateMarquee(marquee.id, "font_weight", v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="semibold">Semibold</SelectItem>
                                    <SelectItem value="bold">Bold</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Speed (1-40)</Label>
                                <Input type="number" min={1} max={40} value={marquee.speed} onChange={(e) => updateMarquee(marquee.id, "speed", +e.target.value)} />
                              </div>
                              <div>
                                <Label>Height (px)</Label>
                                <Input type="number" min={20} max={80} value={marquee.height} onChange={(e) => updateMarquee(marquee.id, "height", +e.target.value)} />
                              </div>
                              <div>
                                <Label>Direction</Label>
                                <Select value={marquee.direction} onValueChange={(v) => updateMarquee(marquee.id, "direction", v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="left">Left ←</SelectItem>
                                    <SelectItem value="right">Right →</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Marquee Items */}
                          <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                              <CardTitle className="text-sm">Marquee Text Items</CardTitle>
                              <Button size="sm" variant="outline" onClick={() => addItem(marquee.id)} className="gap-1">
                                <Plus className="h-3.5 w-3.5" /> Add Item
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {marquee.items.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No items yet. Add your first marquee text.</p>
                              )}
                              {marquee.items.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <Input
                                    value={item.text}
                                    onChange={(e) => updateItem(marquee.id, item.id, "text", e.target.value)}
                                    className="flex-1 bg-background"
                                    placeholder="Enter marquee text..."
                                  />
                                  <Switch
                                    checked={item.is_active}
                                    onCheckedChange={(v) => updateItem(marquee.id, item.id, "is_active", v)}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => removeItem(marquee.id, item.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMarquee(marquee.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Section
                            </Button>
                            <Button
                              onClick={() => saveMarquee(marquee)}
                              disabled={saving}
                              className="gap-2"
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMarquee;
