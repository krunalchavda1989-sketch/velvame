import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Copy, X, Check, ChevronRight, Crosshair, MousePointer, Clock, ArrowUp, Monitor, Upload, Loader2 } from "lucide-react";

interface Popup {
  id: string;
  name: string;
  type: string;
  title: string;
  description: string;
  image_url: string;
  btn1_text: string;
  btn1_link: string;
  btn2_text: string;
  btn2_action: string;
  bg_color: string;
  overlay_color: string;
  overlay_opacity: number;
  width: number;
  position: string;
  show_close_btn: boolean;
  close_on_overlay: boolean;
  status: boolean;
  sort_order: number;
}

interface PopupCondition {
  id?: string;
  popup_id?: string;
  include_exclude: string;
  scope: string;
  page_type: string;
  specific_page: string;
  sort_order: number;
}

interface PopupTriggers {
  on_page_load: boolean;
  page_load_delay: number;
  on_scroll: boolean;
  scroll_direction: string;
  scroll_percent: number;
  on_scroll_to_element: boolean;
  element_selector: string;
  on_click: boolean;
  click_count: number;
  after_inactivity: boolean;
  inactivity_seconds: number;
  on_exit_intent: boolean;
}

interface PopupAdvancedRules {
  show_after_pageviews: boolean;
  pageview_count: number;
  show_after_sessions: boolean;
  session_count: number;
  show_max_times: boolean;
  max_times: number;
  arriving_from_url: boolean;
  referrer_url: string;
  arriving_from_source: boolean;
  traffic_source: string;
  hide_logged_in: boolean;
  show_on_devices: boolean;
  device_type: string;
}

const defaultTriggers: PopupTriggers = {
  on_page_load: true, page_load_delay: 0,
  on_scroll: false, scroll_direction: "down", scroll_percent: 50,
  on_scroll_to_element: false, element_selector: "",
  on_click: false, click_count: 1,
  after_inactivity: false, inactivity_seconds: 30,
  on_exit_intent: false,
};

const defaultAdvanced: PopupAdvancedRules = {
  show_after_pageviews: false, pageview_count: 3,
  show_after_sessions: false, session_count: 2,
  show_max_times: false, max_times: 1,
  arriving_from_url: false, referrer_url: "",
  arriving_from_source: false, traffic_source: "any",
  hide_logged_in: false,
  show_on_devices: false, device_type: "all",
};

const POSITIONS = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

const PAGE_TYPES = [
  { value: "all", label: "All Pages" },
  { value: "homepage", label: "Homepage" },
  { value: "product", label: "Product Pages" },
  { value: "category", label: "Category Pages" },
  { value: "shop", label: "Shop Page" },
  { value: "contact", label: "Contact Page" },
  { value: "about", label: "About Page" },
  { value: "checkout", label: "Checkout Page" },
  { value: "custom", label: "Custom Page (specify)" },
];

const AdminPopups = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);


  const [form, setForm] = useState<Omit<Popup, "id" | "sort_order">>({
    name: "", type: "offer", title: "", description: "", image_url: "",
    btn1_text: "", btn1_link: "", btn2_text: "", btn2_action: "close",
    bg_color: "#ffffff", overlay_color: "#000000", overlay_opacity: 50,
    width: 500, position: "center", show_close_btn: true, close_on_overlay: true, status: true,
  });

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardPopupId, setWizardPopupId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [conditions, setConditions] = useState<PopupCondition[]>([]);
  const [triggers, setTriggers] = useState<PopupTriggers>(defaultTriggers);
  const [advanced, setAdvanced] = useState<PopupAdvancedRules>(defaultAdvanced);

  const fetchPopups = async () => {
    const { data } = await supabase.from("popups").select("*").order("sort_order");
    setPopups((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPopups(); }, []);

  const resetForm = () => {
    setForm({
      name: "", type: "offer", title: "", description: "", image_url: "",
      btn1_text: "", btn1_link: "", btn2_text: "", btn2_action: "close",
      bg_color: "#ffffff", overlay_color: "#000000", overlay_opacity: 50,
      width: 500, position: "center", show_close_btn: true, close_on_overlay: true, status: true,
    });
    setEditingId(null);
  };

  const handleSavePopup = async () => {
    if (!form.name.trim()) { toast.error("Popup name is required"); return; }
    if (editingId) {
      const { error } = await supabase.from("popups").update(form as any).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Popup updated");
    } else {
      const { data, error } = await supabase.from("popups").insert({ ...form, sort_order: popups.length } as any).select().single();
      if (error) { toast.error(error.message); return; }
      // Create default triggers and advanced rules
      await supabase.from("popup_triggers").insert({ popup_id: (data as any).id, ...defaultTriggers } as any);
      await supabase.from("popup_advanced_rules").insert({ popup_id: (data as any).id, ...defaultAdvanced } as any);
      // Create default condition
      await supabase.from("popup_conditions").insert({ popup_id: (data as any).id, include_exclude: "include", scope: "entire_site", page_type: "all", specific_page: "", sort_order: 0 } as any);
      toast.success("Popup created");
    }
    setShowForm(false);
    resetForm();
    fetchPopups();
  };

  const handleEdit = (p: Popup) => {
    setForm({ ...p });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDuplicate = async (p: Popup) => {
    const { id, ...rest } = p;
    const { error } = await supabase.from("popups").insert({ ...rest, name: `${rest.name} (Copy)`, sort_order: popups.length } as any);
    if (!error) { toast.success("Popup duplicated"); fetchPopups(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("popups").delete().eq("id", deleteId);
    toast.success("Popup deleted");
    setDeleteId(null);
    fetchPopups();
  };

  const toggleStatus = async (id: string, current: boolean) => {
    await supabase.from("popups").update({ status: !current } as any).eq("id", id);
    fetchPopups();
  };

  // Open wizard & load data
  const openWizard = async (popupId: string) => {
    setWizardPopupId(popupId);
    setWizardStep(0);
    const [cRes, tRes, aRes] = await Promise.all([
      supabase.from("popup_conditions").select("*").eq("popup_id", popupId).order("sort_order"),
      supabase.from("popup_triggers").select("*").eq("popup_id", popupId).single(),
      supabase.from("popup_advanced_rules").select("*").eq("popup_id", popupId).single(),
    ]);
    setConditions((cRes.data as any[]) || [{ include_exclude: "include", scope: "entire_site", page_type: "all", specific_page: "", sort_order: 0 }]);
    setTriggers(tRes.data ? { on_page_load: (tRes.data as any).on_page_load, page_load_delay: (tRes.data as any).page_load_delay, on_scroll: (tRes.data as any).on_scroll, scroll_direction: (tRes.data as any).scroll_direction, scroll_percent: (tRes.data as any).scroll_percent, on_scroll_to_element: (tRes.data as any).on_scroll_to_element, element_selector: (tRes.data as any).element_selector, on_click: (tRes.data as any).on_click, click_count: (tRes.data as any).click_count, after_inactivity: (tRes.data as any).after_inactivity, inactivity_seconds: (tRes.data as any).inactivity_seconds, on_exit_intent: (tRes.data as any).on_exit_intent } : defaultTriggers);
    setAdvanced(aRes.data ? { show_after_pageviews: (aRes.data as any).show_after_pageviews, pageview_count: (aRes.data as any).pageview_count, show_after_sessions: (aRes.data as any).show_after_sessions, session_count: (aRes.data as any).session_count, show_max_times: (aRes.data as any).show_max_times, max_times: (aRes.data as any).max_times, arriving_from_url: (aRes.data as any).arriving_from_url, referrer_url: (aRes.data as any).referrer_url, arriving_from_source: (aRes.data as any).arriving_from_source, traffic_source: (aRes.data as any).traffic_source, hide_logged_in: (aRes.data as any).hide_logged_in, show_on_devices: (aRes.data as any).show_on_devices, device_type: (aRes.data as any).device_type } : defaultAdvanced);
    setShowWizard(true);
  };

  const saveWizard = async () => {
    if (!wizardPopupId) return;
    // Save conditions
    await supabase.from("popup_conditions").delete().eq("popup_id", wizardPopupId);
    if (conditions.length > 0) {
      await supabase.from("popup_conditions").insert(conditions.map((c, i) => ({ popup_id: wizardPopupId, include_exclude: c.include_exclude, scope: c.scope, page_type: c.page_type, specific_page: c.specific_page, sort_order: i })) as any);
    }
    // Save triggers - upsert
    await supabase.from("popup_triggers").upsert({ popup_id: wizardPopupId, ...triggers } as any, { onConflict: "popup_id" });
    // Save advanced rules - upsert
    await supabase.from("popup_advanced_rules").upsert({ popup_id: wizardPopupId, ...advanced } as any, { onConflict: "popup_id" });
    toast.success("Popup settings saved");
    setShowWizard(false);
  };

  const addCondition = () => {
    setConditions([...conditions, { include_exclude: "include", scope: "entire_site", page_type: "all", specific_page: "", sort_order: conditions.length }]);
  };

  const removeCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, field: string, value: string) => {
    setConditions(conditions.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const wizardSteps = [
    { label: "Conditions", icon: Crosshair, desc: "Where to display" },
    { label: "Triggers", icon: MousePointer, desc: "When to open" },
    { label: "Advanced Rules", icon: Monitor, desc: "Who sees it" },
  ];

  const deleteName = popups.find(p => p.id === deleteId)?.name;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Popup Manager</h1>
            <p className="text-sm text-muted-foreground">Create and manage website popups with advanced display rules</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> Add Popup</Button>
        </div>

        {/* Popup List */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Popup Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : popups.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No popups created yet</TableCell></TableRow>
                ) : popups.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{p.type}</Badge></TableCell>
                    <TableCell className="capitalize">{p.position.replace("-", " ")}</TableCell>
                    <TableCell>
                      <Switch checked={p.status} onCheckedChange={() => toggleStatus(p.id, p.status)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPreviewPopup(p)} title="Preview"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openWizard(p.id)} title="Settings"><Crosshair className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(p)} title="Duplicate"><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} title="Delete" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Popup Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Popup" : "Add New Popup"}</DialogTitle>
            <DialogDescription>Configure the popup design and content</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Popup Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Welcome Offer" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Popup Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Headline shown in popup" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Body content / offer details" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Popup Image</Label>
              {form.image_url ? (
                <div className="relative w-full max-w-xs">
                  <img src={form.image_url} alt="Popup" className="w-full rounded-lg border border-border object-cover max-h-40" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  {uploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">{uploadingImage ? "Uploading..." : "Click to upload image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB allowed"); return; }
                      setUploadingImage(true);
                      const ext = file.name.split(".").pop();
                      const path = `popup-${Date.now()}.${ext}`;
                      const { error } = await supabase.storage.from("popup-images").upload(path, file);
                      if (error) { toast.error("Upload failed"); setUploadingImage(false); return; }
                      const { data: urlData } = supabase.storage.from("popup-images").getPublicUrl(path);
                      setForm({ ...form, image_url: urlData.publicUrl });
                      setUploadingImage(false);
                    }}
                  />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button 1 Text</Label>
                <Input value={form.btn1_text} onChange={e => setForm({ ...form, btn1_text: e.target.value })} placeholder="e.g., Grab Offer" />
              </div>
              <div className="space-y-2">
                <Label>Button 1 Link</Label>
                <Input value={form.btn1_link} onChange={e => setForm({ ...form, btn1_link: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button 2 Text</Label>
                <Input value={form.btn2_text} onChange={e => setForm({ ...form, btn2_text: e.target.value })} placeholder="e.g., No Thanks" />
              </div>
              <div className="space-y-2">
                <Label>Button 2 Action</Label>
                <Select value={form.btn2_action} onValueChange={v => setForm({ ...form, btn2_action: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="close">Close Popup</SelectItem>
                    <SelectItem value="url">Go to URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2"><Input type="color" value={form.bg_color} onChange={e => setForm({ ...form, bg_color: e.target.value })} className="w-12 h-10 p-1" /><Input value={form.bg_color} onChange={e => setForm({ ...form, bg_color: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Overlay Color</Label>
                <div className="flex gap-2"><Input type="color" value={form.overlay_color} onChange={e => setForm({ ...form, overlay_color: e.target.value })} className="w-12 h-10 p-1" /><Input value={form.overlay_color} onChange={e => setForm({ ...form, overlay_color: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Overlay Opacity (%)</Label>
                <Input type="number" min={0} max={100} value={form.overlay_opacity} onChange={e => setForm({ ...form, overlay_opacity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input type="number" min={200} max={1200} value={form.width} onChange={e => setForm({ ...form, width: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={form.position} onValueChange={v => setForm({ ...form, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.show_close_btn} onCheckedChange={v => setForm({ ...form, show_close_btn: v })} /><Label>Show Close Button</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.close_on_overlay} onCheckedChange={v => setForm({ ...form, close_on_overlay: v })} /><Label>Close on Overlay Click</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSavePopup}>{editingId ? "Update" : "Create"} Popup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" /> Delete Popup</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteName}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!previewPopup} onOpenChange={() => setPreviewPopup(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Popup Preview</DialogTitle>
            <DialogDescription>Preview of the popup design</DialogDescription>
          </DialogHeader>
          {previewPopup && (
            <div style={{ backgroundColor: previewPopup.bg_color, maxWidth: previewPopup.width }} className="p-6 relative">
              {previewPopup.show_close_btn && (
                <button className="absolute top-3 right-3 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
              )}
              {previewPopup.image_url && <img src={previewPopup.image_url} alt="" className="w-full rounded-md mb-4 object-cover max-h-48" />}
              {previewPopup.title && <h2 className="text-xl font-bold mb-2">{previewPopup.title}</h2>}
              {previewPopup.description && <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{previewPopup.description}</p>}
              <div className="flex gap-2">
                {previewPopup.btn1_text && <Button className="flex-1">{previewPopup.btn1_text}</Button>}
                {previewPopup.btn2_text && <Button variant="outline" className="flex-1">{previewPopup.btn2_text}</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 3-Step Wizard */}
      <Dialog open={showWizard} onOpenChange={() => setShowWizard(false)}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Popup Publish Settings</DialogTitle>
            <DialogDescription>Configure conditions, triggers, and advanced rules</DialogDescription>
          </DialogHeader>
          <div className="flex h-[70vh]">
            {/* Sidebar */}
            <div className="w-56 border-r bg-muted/30 p-4 flex flex-col gap-1">
              <h3 className="font-semibold mb-3 text-sm">Publish Settings</h3>
              {wizardSteps.map((s, i) => (
                <button key={i} onClick={() => setWizardStep(i)} className={`flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-colors ${wizardStep === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <s.icon className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-medium">{s.label}</div>
                    <div className={`text-xs ${wizardStep === i ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Where Do You Want to Display This Popup?</h3>
                    <p className="text-sm text-muted-foreground">Set conditions to determine where popup appears.</p>
                  </div>
                  {conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                      <Select value={c.include_exclude} onValueChange={v => updateCondition(i, "include_exclude", v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="include">Include</SelectItem>
                          <SelectItem value="exclude">Exclude</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={c.scope} onValueChange={v => updateCondition(i, "scope", v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entire_site">Entire Site</SelectItem>
                          <SelectItem value="singular">Singular</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={c.page_type} onValueChange={v => updateCondition(i, "page_type", v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>{PAGE_TYPES.map(pt => <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>)}</SelectContent>
                      </Select>
                      {c.page_type === "custom" && (
                        <Input value={c.specific_page} onChange={e => updateCondition(i, "specific_page", e.target.value)} placeholder="/page-slug" className="w-32" />
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removeCondition(i)} className="shrink-0"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addCondition}><Plus className="h-4 w-4 mr-2" /> Add Condition</Button>
                </div>
              )}

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">When Should This Popup Open?</h3>
                    <p className="text-sm text-muted-foreground">Enable one or more triggers.</p>
                  </div>
                  {/* On Page Load */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">On Page Load</div>
                        <div className="text-xs text-muted-foreground">Show after page loads</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Delay (sec)</Label>
                        <Input type="number" min={0} value={triggers.page_load_delay} onChange={e => setTriggers({ ...triggers, page_load_delay: Number(e.target.value) })} className="w-20 h-8" disabled={!triggers.on_page_load} />
                      </div>
                      <Switch checked={triggers.on_page_load} onCheckedChange={v => setTriggers({ ...triggers, on_page_load: v })} />
                    </div>
                  </div>
                  {/* On Scroll */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowUp className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">On Scroll</div>
                        <div className="text-xs text-muted-foreground">Trigger when user scrolls</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select value={triggers.scroll_direction} onValueChange={v => setTriggers({ ...triggers, scroll_direction: v })} disabled={!triggers.on_scroll}>
                        <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="down">Down</SelectItem>
                          <SelectItem value="up">Up</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Input type="number" min={1} max={100} value={triggers.scroll_percent} onChange={e => setTriggers({ ...triggers, scroll_percent: Number(e.target.value) })} className="w-16 h-8" disabled={!triggers.on_scroll} />
                        <span className="text-xs">%</span>
                      </div>
                      <Switch checked={triggers.on_scroll} onCheckedChange={v => setTriggers({ ...triggers, on_scroll: v })} />
                    </div>
                  </div>
                  {/* On Scroll To Element */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Crosshair className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">On Scroll To Element</div>
                        <div className="text-xs text-muted-foreground">CSS selector to watch</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input value={triggers.element_selector} onChange={e => setTriggers({ ...triggers, element_selector: e.target.value })} placeholder=".my-class" className="w-32 h-8" disabled={!triggers.on_scroll_to_element} />
                      <Switch checked={triggers.on_scroll_to_element} onCheckedChange={v => setTriggers({ ...triggers, on_scroll_to_element: v })} />
                    </div>
                  </div>
                  {/* On Click */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MousePointer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">On Click</div>
                        <div className="text-xs text-muted-foreground">After N clicks anywhere</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Clicks</Label>
                        <Input type="number" min={1} value={triggers.click_count} onChange={e => setTriggers({ ...triggers, click_count: Number(e.target.value) })} className="w-16 h-8" disabled={!triggers.on_click} />
                      </div>
                      <Switch checked={triggers.on_click} onCheckedChange={v => setTriggers({ ...triggers, on_click: v })} />
                    </div>
                  </div>
                  {/* After Inactivity */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">After Inactivity</div>
                        <div className="text-xs text-muted-foreground">No user activity for N seconds</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Input type="number" min={1} value={triggers.inactivity_seconds} onChange={e => setTriggers({ ...triggers, inactivity_seconds: Number(e.target.value) })} className="w-20 h-8" disabled={!triggers.after_inactivity} />
                        <Label className="text-xs">sec</Label>
                      </div>
                      <Switch checked={triggers.after_inactivity} onCheckedChange={v => setTriggers({ ...triggers, after_inactivity: v })} />
                    </div>
                  </div>
                  {/* Exit Intent */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowUp className="h-5 w-5 text-muted-foreground rotate-45" />
                      <div>
                        <div className="font-medium text-sm">On Page Exit Intent</div>
                        <div className="text-xs text-muted-foreground">Mouse moves toward browser top</div>
                      </div>
                    </div>
                    <Switch checked={triggers.on_exit_intent} onCheckedChange={v => setTriggers({ ...triggers, on_exit_intent: v })} />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Advanced Display Rules</h3>
                    <p className="text-sm text-muted-foreground">Control frequency, audience, and device targeting.</p>
                  </div>
                  {/* Page Views */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div><div className="font-medium text-sm">Show After X Page Views</div><div className="text-xs text-muted-foreground">Only show after user has visited N pages</div></div>
                    <div className="flex items-center gap-3">
                      <Input type="number" min={1} value={advanced.pageview_count} onChange={e => setAdvanced({ ...advanced, pageview_count: Number(e.target.value) })} className="w-20 h-8" disabled={!advanced.show_after_pageviews} />
                      <Switch checked={advanced.show_after_pageviews} onCheckedChange={v => setAdvanced({ ...advanced, show_after_pageviews: v })} />
                    </div>
                  </div>
                  {/* Sessions */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div><div className="font-medium text-sm">Show After X Sessions</div><div className="text-xs text-muted-foreground">Only from the Nth session onwards</div></div>
                    <div className="flex items-center gap-3">
                      <Input type="number" min={1} value={advanced.session_count} onChange={e => setAdvanced({ ...advanced, session_count: Number(e.target.value) })} className="w-20 h-8" disabled={!advanced.show_after_sessions} />
                      <Switch checked={advanced.show_after_sessions} onCheckedChange={v => setAdvanced({ ...advanced, show_after_sessions: v })} />
                    </div>
                  </div>
                  {/* Max Times */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div><div className="font-medium text-sm">Show Up to X Times</div><div className="text-xs text-muted-foreground">Max times per session</div></div>
                    <div className="flex items-center gap-3">
                      <Input type="number" min={1} value={advanced.max_times} onChange={e => setAdvanced({ ...advanced, max_times: Number(e.target.value) })} className="w-20 h-8" disabled={!advanced.show_max_times} />
                      <Switch checked={advanced.show_max_times} onCheckedChange={v => setAdvanced({ ...advanced, show_max_times: v })} />
                    </div>
                  </div>
                  {/* Referrer URL */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div><div className="font-medium text-sm">When Arriving From Specific URL</div><div className="text-xs text-muted-foreground">Show only from a specific referrer</div></div>
                    <div className="flex items-center gap-3">
                      <Input value={advanced.referrer_url} onChange={e => setAdvanced({ ...advanced, referrer_url: e.target.value })} placeholder="https://..." className="w-40 h-8" disabled={!advanced.arriving_from_url} />
                      <Switch checked={advanced.arriving_from_url} onCheckedChange={v => setAdvanced({ ...advanced, arriving_from_url: v })} />
                    </div>
                  </div>
                  {/* Traffic Source */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div><div className="font-medium text-sm">Show When Arriving From</div><div className="text-xs text-muted-foreground">Filter by traffic source</div></div>
                    <div className="flex items-center gap-3">
                      <Select value={advanced.traffic_source} onValueChange={v => setAdvanced({ ...advanced, traffic_source: v })} disabled={!advanced.arriving_from_source}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="search">Search Engines</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="external">External Links</SelectItem>
                        </SelectContent>
                      </Select>
                      <Switch checked={advanced.arriving_from_source} onCheckedChange={v => setAdvanced({ ...advanced, arriving_from_source: v })} />
                    </div>
                  </div>
                  {/* Hide Logged In */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div><div className="font-medium text-sm">Hide for Logged In Users</div><div className="text-xs text-muted-foreground">Only show to guest visitors</div></div>
                    <Switch checked={advanced.hide_logged_in} onCheckedChange={v => setAdvanced({ ...advanced, hide_logged_in: v })} />
                  </div>
                  {/* Device */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div><div className="font-medium text-sm">Show on Devices</div><div className="text-xs text-muted-foreground">Target specific device types</div></div>
                    <div className="flex items-center gap-3">
                      <Select value={advanced.device_type} onValueChange={v => setAdvanced({ ...advanced, device_type: v })} disabled={!advanced.show_on_devices}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Devices</SelectItem>
                          <SelectItem value="desktop">Desktop Only</SelectItem>
                          <SelectItem value="mobile">Mobile Only</SelectItem>
                          <SelectItem value="tablet">Tablet Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <Switch checked={advanced.show_on_devices} onCheckedChange={v => setAdvanced({ ...advanced, show_on_devices: v })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Wizard Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setShowWizard(false)}>Cancel</Button>
            <div className="flex gap-2">
              {wizardStep > 0 && <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>Back</Button>}
              {wizardStep < 2 ? (
                <Button onClick={() => setWizardStep(wizardStep + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
              ) : (
                <Button onClick={saveWizard}><Check className="h-4 w-4 mr-1" /> Save & Close</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPopups;
