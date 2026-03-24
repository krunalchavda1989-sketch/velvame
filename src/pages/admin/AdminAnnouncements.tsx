import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, Eye, EyeOff, GripVertical, Save, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  bg_color: string;
  text_color: string;
  link_url: string | null;
  link_text: string | null;
  link_target: string;
  starts_at: string;
  ends_at: string | null;
  sort_order: number;
  created_at: string;
}

interface BarSettings {
  id: string;
  transition_effect: string;
  display_duration: number;
  transition_speed: number;
  auto_play: boolean;
  loop_enabled: boolean;
  pause_on_hover: boolean;
  show_arrows: boolean;
  show_dots: boolean;
  swipe_mobile: boolean;
  bg_color: string;
  text_color: string;
  font_size: number;
  font_weight: string;
  bar_height: number;
  text_align: string;
  bar_position: string;
  show_close_button: boolean;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
  is_enabled: boolean;
}

const defaultForm = {
  title: "",
  message: "",
  type: "info",
  is_active: true,
  bg_color: "",
  text_color: "",
  link_url: "",
  link_text: "",
  link_target: "_self",
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: "",
  sort_order: 0,
};

const transitionEffects = [
  { value: "slide", label: "Slide" },
  { value: "fade", label: "Fade" },
  { value: "marquee", label: "Scroll / Marquee" },
  { value: "flip", label: "Flip" },
  { value: "zoom", label: "Zoom" },
  { value: "typewriter", label: "Typewriter" },
  { value: "rollup", label: "Roll Up" },
];

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [settings, setSettings] = useState<BarSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setAnnouncements(data as Announcement[]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("announcement_bar_settings" as any)
      .select("*")
      .limit(1)
      .single();
    if (data) setSettings(data as any);
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchSettings();
  }, []);

  const activeCount = announcements.filter(a => a.is_active).length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, sort_order: announcements.length });
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      type: a.type,
      is_active: a.is_active,
      bg_color: a.bg_color || "",
      text_color: a.text_color || "",
      link_url: a.link_url || "",
      link_text: a.link_text || "",
      link_target: a.link_target || "_self",
      starts_at: a.starts_at ? new Date(a.starts_at).toISOString().slice(0, 16) : "",
      ends_at: a.ends_at ? new Date(a.ends_at).toISOString().slice(0, 16) : "",
      sort_order: a.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.message.trim()) {
      toast.error("Announcement text is required");
      return;
    }

    const payload: any = {
      title: form.title || form.message.slice(0, 50),
      message: form.message,
      type: form.type,
      is_active: form.is_active,
      bg_color: form.bg_color || (settings?.bg_color ?? "#000000"),
      text_color: form.text_color || (settings?.text_color ?? "#ffffff"),
      link_url: form.link_url || null,
      link_text: form.link_text || null,
      link_target: form.link_target,
      starts_at: form.starts_at || new Date().toISOString(),
      ends_at: form.ends_at || null,
      sort_order: form.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("announcements").update(payload).eq("id", editingId);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Announcement updated");
    } else {
      const { error } = await supabase.from("announcements").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Announcement created");
    }

    setDialogOpen(false);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    fetchAnnouncements();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("announcements").update({ is_active: !current, updated_at: new Date().toISOString() }).eq("id", id);
    fetchAnnouncements();
  };

  // Drag and drop reorder
  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const reordered = [...announcements];
    const [removed] = reordered.splice(draggedIdx, 1);
    reordered.splice(idx, 0, removed);
    setAnnouncements(reordered);
    setDraggedIdx(idx);
  };
  const handleDragEnd = async () => {
    setDraggedIdx(null);
    // Auto-save sort order
    const updates = announcements.map((a, i) =>
      supabase.from("announcements").update({ sort_order: i }).eq("id", a.id)
    );
    await Promise.all(updates);
  };

  // Save bar settings
  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { id, ...rest } = settings;
    await supabase
      .from("announcement_bar_settings" as any)
      .update({ ...rest, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    toast.success("Settings saved");
    setSavingSettings(false);
  };

  const updateSetting = (key: keyof BarSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" /> Announcement Bar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage announcements displayed across the website — Shopify-style slider
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">{activeCount} Active</Badge>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Announcement</Button>
          </div>
        </div>

        <Tabs defaultValue="announcements">
          <TabsList>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="slider">Slider Settings</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
          </TabsList>

          {/* TAB: Announcements */}
          <TabsContent value="announcements" className="space-y-3 mt-4">
            {/* Live Preview */}
            {activeCount > 0 && settings && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Live Preview</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {announcements.filter(a => a.is_active).map(a => (
                    <div
                      key={a.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-between"
                      style={{
                        backgroundColor: a.bg_color || settings.bg_color,
                        color: a.text_color || settings.text_color,
                        height: settings.bar_height,
                        fontSize: settings.font_size,
                        fontWeight: settings.font_weight === "bold" ? 700 : settings.font_weight === "medium" ? 500 : 400,
                        textAlign: settings.text_align as any,
                      }}
                    >
                      <span className="flex-1">{a.message}</span>
                      {a.link_url && a.link_text && (
                        <span className="underline ml-2 text-xs opacity-80 flex items-center gap-1">
                          {a.link_text} <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Announcements List */}
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : announcements.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No announcements yet. Click "Add Announcement" to create one.
                </CardContent>
              </Card>
            ) : (
              announcements.map((a, idx) => (
                <Card
                  key={a.id}
                  className={`${!a.is_active ? "opacity-60" : ""} ${draggedIdx === idx ? "ring-2 ring-primary" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <CardContent className="py-3 flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0" />
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.bg_color || settings?.bg_color || "#000" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate max-w-[300px]">
                          "{a.message.length > 60 ? a.message.slice(0, 60) + "..." : a.message}"
                        </span>
                        {a.link_url && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <LinkIcon className="h-3 w-3" /> {a.link_url}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant={a.is_active ? "default" : "secondary"} className="text-xs">
                        {a.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => toggleActive(a.id, a.is_active)} title={a.is_active ? "Deactivate" : "Activate"}>
                        {a.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB: Slider Settings */}
          <TabsContent value="slider" className="mt-4">
            {settings && (
              <Card>
                <CardHeader><CardTitle>Slider / Animation Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Transition Effect</Label>
                      <Select value={settings.transition_effect} onValueChange={v => updateSetting("transition_effect", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {transitionEffects.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Display Duration (ms)</Label>
                      <Input type="number" value={settings.display_duration} onChange={e => updateSetting("display_duration", Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Transition Speed (ms)</Label>
                      <Input type="number" value={settings.transition_speed} onChange={e => updateSetting("transition_speed", Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {([
                      ["auto_play", "Auto Play"],
                      ["loop_enabled", "Loop"],
                      ["pause_on_hover", "Pause on Hover"],
                      ["show_arrows", "Show Arrows"],
                      ["show_dots", "Show Dots"],
                      ["swipe_mobile", "Swipe on Mobile"],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch checked={(settings as any)[key]} onCheckedChange={v => updateSetting(key as any, v)} />
                        <Label>{label}</Label>
                      </div>
                    ))}
                  </div>

                  <Button onClick={saveSettings} disabled={savingSettings}>
                    <Save className="h-4 w-4 mr-2" /> Save Slider Settings
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Design */}
          <TabsContent value="design" className="mt-4">
            {settings && (
              <Card>
                <CardHeader><CardTitle>Global Bar Design</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Background Color</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={settings.bg_color} onChange={e => updateSetting("bg_color", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
                        <Input value={settings.bg_color} onChange={e => updateSetting("bg_color", e.target.value)} className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <Label>Text Color</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={settings.text_color} onChange={e => updateSetting("text_color", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
                        <Input value={settings.text_color} onChange={e => updateSetting("text_color", e.target.value)} className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <Label>Font Size (px)</Label>
                      <Input type="number" value={settings.font_size} onChange={e => updateSetting("font_size", Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Font Weight</Label>
                      <Select value={settings.font_weight} onValueChange={v => updateSetting("font_weight", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bar Height (px)</Label>
                      <Input type="number" value={settings.bar_height} onChange={e => updateSetting("bar_height", Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Text Alignment</Label>
                      <Select value={settings.text_align} onValueChange={v => updateSetting("text_align", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bar Position</Label>
                      <Select value={settings.bar_position} onValueChange={v => updateSetting("bar_position", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above Navigation Menu</SelectItem>
                          <SelectItem value="below">Below Navigation Menu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {([
                      ["show_close_button", "Close Button"],
                      ["show_on_mobile", "Show on Mobile"],
                      ["show_on_desktop", "Show on Desktop"],
                      ["is_enabled", "Bar Enabled (Master Toggle)"],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch checked={(settings as any)[key]} onCheckedChange={v => updateSetting(key as any, v)} />
                        <Label>{label}</Label>
                      </div>
                    ))}
                  </div>

                  <Button onClick={saveSettings} disabled={savingSettings}>
                    <Save className="h-4 w-4 mr-2" /> Save Design Settings
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Announcement" : "New Announcement"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Announcement Text *</Label>
                <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="e.g. Free shipping on orders above ₹999" rows={3} />
                <p className="text-xs text-muted-foreground mt-1">Use new lines for multi-line display</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Link URL (optional)</Label>
                  <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://... or /page" />
                </div>
                <div>
                  <Label>Link Text</Label>
                  <Input value={form.link_text} onChange={e => setForm(f => ({ ...f, link_text: e.target.value }))} placeholder="Learn more" />
                </div>
              </div>
              <div>
                <Label>Link Target</Label>
                <Select value={form.link_target} onValueChange={v => setForm(f => ({ ...f, link_target: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Same Tab</SelectItem>
                    <SelectItem value="_blank">New Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Text Color (override)</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.text_color || "#ffffff"} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="w-10 h-9 rounded border cursor-pointer" />
                    <Input value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} placeholder="Use global" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Background Color (override)</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.bg_color || "#000000"} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="w-10 h-9 rounded border cursor-pointer" />
                    <Input value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} placeholder="Use global" className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Starts At</Label>
                  <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                </div>
                <div>
                  <Label>Ends At (optional)</Label>
                  <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>

              {/* Inline Preview */}
              {form.message && (
                <div
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: form.bg_color || settings?.bg_color || "#000",
                    color: form.text_color || settings?.text_color || "#fff",
                    textAlign: (settings?.text_align as any) || "center",
                  }}
                >
                  {form.message}
                  {form.link_text && <span className="underline ml-2 text-xs opacity-80">{form.link_text}</span>}
                </div>
              )}

              <Button onClick={handleSave} className="w-full">{editingId ? "Update" : "Create"} Announcement</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
