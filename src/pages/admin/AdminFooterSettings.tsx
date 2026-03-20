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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Plus, Trash2, Pencil, ArrowUp, ArrowDown, Loader2, Eye, Monitor, Smartphone, GripVertical, Globe } from "lucide-react";

interface FooterSettings {
  id: string;
  layout_sections: number;
  bg_color: string;
  text_color: string;
  link_color: string;
  link_hover_color: string;
  heading_color: string;
  border_color: string;
  show_visit_counter: boolean;
  visit_counter_label: string;
  visit_counter_format: string;
  visit_counter_base: number;
  visit_counter_total: number;
  copyright_text: string;
  show_brand_section: boolean;
  brand_description: string;
}

interface FooterSection {
  id: string;
  heading: string;
  heading_color: string;
  heading_font_size: string;
  width_percentage: number;
  display_order: number;
  is_active: boolean;
  menu_items?: FooterMenuItem[];
}

interface FooterMenuItem {
  id: string;
  section_id: string;
  label: string;
  url: string;
  open_in_new_tab: boolean;
  display_order: number;
  is_active: boolean;
}

const defaultSettings: FooterSettings = {
  id: "", layout_sections: 4, bg_color: "#1a1a2e", text_color: "#ffffff",
  link_color: "#cccccc", link_hover_color: "#ff6600", heading_color: "#ffffff",
  border_color: "#333333", show_visit_counter: false, visit_counter_label: "Website Visits:",
  visit_counter_format: "formatted", visit_counter_base: 0, visit_counter_total: 0, copyright_text: "",
  show_brand_section: true, brand_description: "",
};

const AdminFooterSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [menuItems, setMenuItems] = useState<FooterMenuItem[]>([]);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Section dialog
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ heading: "", heading_color: "#ffffff", heading_font_size: "16px", width_percentage: 25 });

  // Menu item dialog
  const [menuDialog, setMenuDialog] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<FooterMenuItem | null>(null);
  const [menuItemSectionId, setMenuItemSectionId] = useState("");
  const [menuForm, setMenuForm] = useState({ label: "", url: "/", open_in_new_tab: false, is_active: true });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [settingsRes, sectionsRes, itemsRes] = await Promise.all([
      supabase.from("footer_settings").select("*").limit(1).single(),
      supabase.from("footer_sections").select("*").order("display_order"),
      supabase.from("footer_menu_items").select("*").order("display_order"),
    ]);
    if (settingsRes.data) setSettings(settingsRes.data as any);
    if (sectionsRes.data) setSections(sectionsRes.data as any);
    if (itemsRes.data) setMenuItems(itemsRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveSettings = async () => {
    setSaving(true);
    const { id, visit_counter_total, ...rest } = settings;
    const { error } = await supabase.from("footer_settings").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Failed to save settings");
    else toast.success("Footer settings saved!");
    setSaving(false);
  };

  // Layout change handler
  const handleLayoutChange = (val: string) => {
    const num = parseInt(val);
    setSettings(prev => ({ ...prev, layout_sections: num }));
    // Auto-adjust section widths
    const width = parseFloat((100 / num).toFixed(2));
    setSections(prev => prev.map(s => ({ ...s, width_percentage: width })));
  };

  const totalWidth = sections.reduce((sum, s) => sum + Number(s.width_percentage), 0);

  // Section CRUD
  const openAddSection = () => {
    const w = parseFloat((100 / Math.max(sections.length + 1, 1)).toFixed(2));
    setSectionForm({ heading: "", heading_color: settings.heading_color, heading_font_size: "16px", width_percentage: w });
    setEditingSection(null);
    setSectionDialog(true);
  };

  const openEditSection = (s: FooterSection) => {
    setSectionForm({ heading: s.heading, heading_color: s.heading_color, heading_font_size: s.heading_font_size, width_percentage: s.width_percentage });
    setEditingSection(s);
    setSectionDialog(true);
  };

  const saveSection = async () => {
    if (editingSection) {
      await supabase.from("footer_sections").update({ ...sectionForm, updated_at: new Date().toISOString() }).eq("id", editingSection.id);
    } else {
      await supabase.from("footer_sections").insert({ ...sectionForm, display_order: sections.length });
    }
    setSectionDialog(false);
    fetchAll();
    toast.success("Section saved!");
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section? All menu items inside will also be removed.")) return;
    await supabase.from("footer_sections").delete().eq("id", id);
    fetchAll();
    toast.success("Section deleted");
  };

  const moveSectionOrder = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const a = sections[idx], b = sections[newIdx];
    await Promise.all([
      supabase.from("footer_sections").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("footer_sections").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    fetchAll();
  };

  // Menu item CRUD
  const openAddMenuItem = (sectionId: string) => {
    setMenuItemSectionId(sectionId);
    setMenuForm({ label: "", url: "/", open_in_new_tab: false, is_active: true });
    setEditingMenuItem(null);
    setMenuDialog(true);
  };

  const openEditMenuItem = (item: FooterMenuItem) => {
    setMenuItemSectionId(item.section_id);
    setMenuForm({ label: item.label, url: item.url, open_in_new_tab: item.open_in_new_tab, is_active: item.is_active });
    setEditingMenuItem(item);
    setMenuDialog(true);
  };

  const saveMenuItem = async () => {
    if (editingMenuItem) {
      await supabase.from("footer_menu_items").update(menuForm).eq("id", editingMenuItem.id);
    } else {
      const sectionItems = menuItems.filter(i => i.section_id === menuItemSectionId);
      await supabase.from("footer_menu_items").insert({ ...menuForm, section_id: menuItemSectionId, display_order: sectionItems.length });
    }
    setMenuDialog(false);
    fetchAll();
    toast.success("Menu item saved!");
  };

  const deleteMenuItem = async (id: string) => {
    await supabase.from("footer_menu_items").delete().eq("id", id);
    fetchAll();
    toast.success("Menu item deleted");
  };

  const moveMenuOrder = async (items: FooterMenuItem[], idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const a = items[idx], b = items[newIdx];
    await Promise.all([
      supabase.from("footer_menu_items").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("footer_menu_items").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    fetchAll();
  };

  const getSectionItems = (sectionId: string) =>
    menuItems.filter(i => i.section_id === sectionId).sort((a, b) => a.display_order - b.display_order);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Footer Management</h1>
            <p className="text-muted-foreground text-sm">Configure your website footer layout, sections, menus, and appearance</p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Layout Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Configuration</CardTitle>
              <CardDescription>Choose the number of footer columns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Number of Sections</Label>
                <RadioGroup value={String(settings.layout_sections)} onValueChange={handleLayoutChange} className="flex gap-4 mt-2">
                  {[3, 4, 5].map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <RadioGroupItem value={String(n)} id={`layout-${n}`} />
                      <Label htmlFor={`layout-${n}`}>{n} Sections</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              {Math.abs(totalWidth - 100) > 0.5 && (
                <p className="text-sm text-destructive">⚠️ Total width is {totalWidth.toFixed(1)}% — should be 100%</p>
              )}
              <div>
                <Label>Copyright Text (leave empty for default)</Label>
                <Input value={settings.copyright_text} onChange={e => setSettings(p => ({ ...p, copyright_text: e.target.value }))} placeholder="© 2026 Company Name. All rights reserved." />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance Settings</CardTitle>
              <CardDescription>Colors for the footer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["bg_color", "Background"],
                  ["text_color", "Text"],
                  ["heading_color", "Headings"],
                  ["link_color", "Links"],
                  ["link_hover_color", "Link Hover"],
                  ["border_color", "Border/Divider"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <div className="flex gap-2">
                      <input type="color" value={(settings as any)[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} className="h-9 w-9 rounded border cursor-pointer" />
                      <Input value={(settings as any)[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} className="font-mono text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visit Counter Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5" /> Visit Counter Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.show_visit_counter} onCheckedChange={v => setSettings(p => ({ ...p, show_visit_counter: v }))} />
                <Label>Show in Footer</Label>
              </div>
              <div>
                <Label className="text-xs">Counter Label</Label>
                <Input value={settings.visit_counter_label} onChange={e => setSettings(p => ({ ...p, visit_counter_label: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Display Format</Label>
                <Select value={settings.visit_counter_format} onValueChange={v => setSettings(p => ({ ...p, visit_counter_format: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain">Plain Number</SelectItem>
                    <SelectItem value="formatted">Formatted (1,24,856)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Manual Base Count</Label>
                <Input type="number" value={settings.visit_counter_base} onChange={e => setSettings(p => ({ ...p, visit_counter_base: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total displayed = Base ({settings.visit_counter_base.toLocaleString()}) + System Count ({settings.visit_counter_total.toLocaleString()}) = {(settings.visit_counter_base + settings.visit_counter_total).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Sections Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Footer Sections</CardTitle>
              <CardDescription>Manage columns and their menu items</CardDescription>
            </div>
            <Button size="sm" onClick={openAddSection}><Plus className="h-4 w-4 mr-1" /> Add Section</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.sort((a, b) => a.display_order - b.display_order).map((section, idx) => {
              const items = getSectionItems(section.id);
              return (
                <div key={section.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-semibold text-foreground">{section.heading || "(No heading)"}</span>
                        <span className="text-xs text-muted-foreground ml-2">Width: {section.width_percentage}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => moveSectionOrder(idx, -1)} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => moveSectionOrder(idx, 1)} disabled={idx === sections.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditSection(section)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSection(section.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  {/* Menu items */}
                  <div className="ml-6 space-y-1">
                    {items.map((item, mIdx) => (
                      <div key={item.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={item.is_active ? "text-foreground" : "text-muted-foreground line-through"}>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.url}</span>
                          {item.open_in_new_tab && <span className="text-xs bg-muted px-1 rounded">↗</span>}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMenuOrder(items, mIdx, -1)} disabled={mIdx === 0}><ArrowUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMenuOrder(items, mIdx, 1)} disabled={mIdx === items.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditMenuItem(item)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteMenuItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="mt-1" onClick={() => openAddMenuItem(section.id)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Menu Item
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5" /> Live Footer Preview</CardTitle>
            <div className="flex gap-1">
              <Button variant={previewMode === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("desktop")}><Monitor className="h-4 w-4" /></Button>
              <Button variant={previewMode === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewMode("mobile")}><Smartphone className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg overflow-hidden mx-auto ${previewMode === "mobile" ? "max-w-sm" : "w-full"}`}>
              <div style={{ backgroundColor: settings.bg_color, color: settings.text_color, borderTop: `1px solid ${settings.border_color}` }} className="p-8">
                <div className={`${previewMode === "mobile" ? "flex flex-col gap-6" : "flex gap-4"}`} style={previewMode === "desktop" ? { display: "flex" } : {}}>
                  {sections.sort((a, b) => a.display_order - b.display_order).map(section => {
                    const items = getSectionItems(section.id).filter(i => i.is_active);
                    return (
                      <div key={section.id} style={previewMode === "desktop" ? { width: `${section.width_percentage}%` } : { width: "100%" }}>
                        <h4 style={{ color: section.heading_color || settings.heading_color, fontSize: section.heading_font_size }} className="font-semibold mb-3">{section.heading}</h4>
                        <ul className="space-y-1.5">
                          {items.map(item => (
                            <li key={item.id}>
                              <span style={{ color: settings.link_color }} className="text-sm cursor-pointer hover:underline">{item.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                {settings.show_visit_counter && (
                  <div className="mt-6 text-center text-sm" style={{ color: settings.text_color }}>
                    🌐 {settings.visit_counter_label} {settings.visit_counter_format === "formatted" ? (settings.visit_counter_base + settings.visit_counter_total).toLocaleString("en-IN") : (settings.visit_counter_base + settings.visit_counter_total)}
                  </div>
                )}
                <div className="mt-6 pt-4 text-center text-sm" style={{ borderTop: `1px solid ${settings.border_color}`, color: settings.text_color, opacity: 0.7 }}>
                  {settings.copyright_text || `© ${new Date().getFullYear()} Company Name. All rights reserved.`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Dialog */}
        <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
              <DialogDescription>Configure this footer column</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Section Heading</Label>
                <Input value={sectionForm.heading} onChange={e => setSectionForm(p => ({ ...p, heading: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width %</Label>
                  <Input type="number" min={10} max={100} value={sectionForm.width_percentage} onChange={e => setSectionForm(p => ({ ...p, width_percentage: parseFloat(e.target.value) || 25 }))} />
                </div>
                <div>
                  <Label>Heading Font Size</Label>
                  <Select value={sectionForm.heading_font_size} onValueChange={v => setSectionForm(p => ({ ...p, heading_font_size: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["14px", "16px", "18px", "20px", "24px"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Heading Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={sectionForm.heading_color} onChange={e => setSectionForm(p => ({ ...p, heading_color: e.target.value }))} className="h-9 w-9 rounded border cursor-pointer" />
                  <Input value={sectionForm.heading_color} onChange={e => setSectionForm(p => ({ ...p, heading_color: e.target.value }))} className="font-mono text-xs" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSectionDialog(false)}>Cancel</Button>
              <Button onClick={saveSection}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Menu Item Dialog */}
        <Dialog open={menuDialog} onOpenChange={setMenuDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
              <DialogDescription>Configure this footer link</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Menu Label</Label>
                <Input value={menuForm.label} onChange={e => setMenuForm(p => ({ ...p, label: e.target.value }))} placeholder="Home" />
              </div>
              <div>
                <Label>URL / Link</Label>
                <Input value={menuForm.url} onChange={e => setMenuForm(p => ({ ...p, url: e.target.value }))} placeholder="/about" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={menuForm.open_in_new_tab} onCheckedChange={v => setMenuForm(p => ({ ...p, open_in_new_tab: v }))} />
                  <Label>Open in New Tab</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={menuForm.is_active} onCheckedChange={v => setMenuForm(p => ({ ...p, is_active: v }))} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMenuDialog(false)}>Cancel</Button>
              <Button onClick={saveMenuItem}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFooterSettings;
