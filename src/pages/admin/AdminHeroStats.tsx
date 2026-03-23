import { useState, useEffect } from "react";
import { BarChart3, Plus, Pencil, Trash2, Loader2, Save, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ICON_OPTIONS = [
  { value: "users", label: "Users" },
  { value: "trending-up", label: "Trending Up" },
  { value: "award", label: "Award" },
  { value: "zap", label: "Zap / Lightning" },
  { value: "shield", label: "Shield" },
  { value: "shopping-bag", label: "Shopping Bag" },
  { value: "heart", label: "Heart" },
  { value: "gift", label: "Gift" },
  { value: "star", label: "Star" },
  { value: "globe", label: "Globe" },
];

interface HeroStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = { label: "", value: "", icon: "users", sort_order: 0, is_active: true };

const AdminHeroStats = () => {
  const [items, setItems] = useState<HeroStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroStat | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [togglingHero, setTogglingHero] = useState(false);

  const fetchData = async () => {
    const [{ data }, { data: settings }] = await Promise.all([
      supabase.from("hero_stats").select("*").order("sort_order"),
      supabase.from("banner_settings").select("hero_section_enabled").limit(1).single(),
    ]);
    setItems((data as unknown as HeroStat[]) || []);
    setHeroEnabled((settings as any)?.hero_section_enabled ?? true);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleHeroSection = async (enabled: boolean) => {
    setTogglingHero(true);
    const { data: row } = await supabase.from("banner_settings").select("id").limit(1).single();
    if (row) {
      await supabase.from("banner_settings").update({ hero_section_enabled: enabled } as any).eq("id", (row as any).id);
    }
    setHeroEnabled(enabled);
    setTogglingHero(false);
    toast.success(enabled ? "Hero section enabled" : "Hero section disabled");
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: items.length });
    setDialogOpen(true);
  };

  const openEdit = (s: HeroStat) => {
    setEditing(s);
    setForm({ label: s.label, value: s.value, icon: s.icon, sort_order: s.sort_order, is_active: s.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.value.trim()) {
      toast.error("Label and value are required");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("hero_stats").update(form).eq("id", editing.id);
      if (error) toast.error("Failed"); else toast.success("Stat updated!");
    } else {
      const { error } = await supabase.from("hero_stats").insert(form);
      if (error) toast.error("Failed"); else toast.success("Stat added!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this stat?")) return;
    await supabase.from("hero_stats").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  const toggleActive = async (s: HeroStat) => {
    await supabase.from("hero_stats").update({ is_active: !s.is_active }).eq("id", s.id);
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Hero Stats
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the statistics displayed in the homepage hero section
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border rounded-lg px-4 py-2">
              <Label htmlFor="hero-toggle" className="text-sm font-medium">Hero Section</Label>
              <Switch
                id="hero-toggle"
                checked={heroEnabled}
                disabled={togglingHero}
                onCheckedChange={toggleHeroSection}
              />
            </div>
            <Button onClick={openAdd} disabled={items.length >= 6}>
              <Plus className="h-4 w-4 mr-2" /> Add Stat
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hero stats configured yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => (
              <Card key={s.id} className={!s.is_active ? "opacity-50" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-xs font-mono w-5 text-center">{s.sort_order}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {s.icon}
                    </span>
                    <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Stat" : "Add Stat"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Display Value</Label>
                <Input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="e.g. 50,000+"
                />
                <p className="text-xs text-muted-foreground">The big number shown on the card</p>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Happy Customers"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Visible on homepage</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {editing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminHeroStats;
