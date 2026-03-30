import { useState, useEffect } from "react";
import { MessageSquareQuote, Plus, Pencil, Trash2, Loader2, Save, Star, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  name: "",
  text: "",
  rating: 5,
  avatar_url: "",
  is_active: true,
  sort_order: 0,
};

const AdminTestimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sectionBgColor, setSectionBgColor] = useState('#ffffff');
  const [savingBg, setSavingBg] = useState(false);

  const fetchData = async () => {
    const [{ data }, { data: bgSetting }] = await Promise.all([
      supabase.from("testimonials").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("site_settings").select("value").eq("key", "testimonial_section_bg_color").single(),
    ]);
    setItems((data as unknown as Testimonial[]) || []);
    if (bgSetting) setSectionBgColor((bgSetting as any).value as string);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveBgColor = async () => {
    setSavingBg(true);
    await supabase.from("site_settings").update({ value: JSON.stringify(sectionBgColor) as any, updated_at: new Date().toISOString() }).eq("key", "testimonial_section_bg_color");
    toast.success("Section background color saved!");
    setSavingBg(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: items.length });
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      name: t.name,
      text: t.text,
      rating: t.rating,
      avatar_url: t.avatar_url || "",
      is_active: t.is_active,
      sort_order: t.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.text.trim()) {
      toast.error("Name and testimonial text are required");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("testimonials")
        .update(form)
        .eq("id", editing.id);
      if (error) toast.error("Failed to update");
      else toast.success("Testimonial updated!");
    } else {
      const { error } = await supabase.from("testimonials").insert(form);
      if (error) toast.error("Failed to create");
      else toast.success("Testimonial added!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  const toggleActive = async (t: Testimonial) => {
    await supabase
      .from("testimonials")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <MessageSquareQuote className="h-6 w-6 text-primary" />
              Testimonials
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage customer reviews displayed on the landing page
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Testimonial
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <MessageSquareQuote className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No testimonials yet. Add your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <Card key={t.id} className={!t.is_active ? "opacity-50" : ""}>
                <CardContent className="flex items-start justify-between p-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-primary fill-primary" />
                        ))}
                      </div>
                      {!t.is_active && (
                        <Badge variant="secondary" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      "{t.text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Switch
                      checked={t.is_active}
                      onCheckedChange={() => toggleActive(t)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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
              <DialogTitle>
                {editing ? "Edit Testimonial" : "Add Testimonial"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Priya S."
                />
              </div>
              <div className="space-y-2">
                <Label>Testimonial</Label>
                <Textarea
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="What did the customer say?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={form.rating}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        rating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Avatar URL (optional)</Label>
                <Input
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Visible on landing page</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
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

export default AdminTestimonials;
