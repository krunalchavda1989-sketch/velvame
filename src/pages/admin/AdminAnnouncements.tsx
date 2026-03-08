import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, Eye, EyeOff } from "lucide-react";
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
  starts_at: string;
  ends_at: string | null;
  sort_order: number;
  created_at: string;
}

const defaultForm = {
  title: "",
  message: "",
  type: "info",
  is_active: true,
  bg_color: "#3b82f6",
  text_color: "#ffffff",
  link_url: "",
  link_text: "",
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: "",
  sort_order: 0,
};

const typeOptions = [
  { value: "info", label: "Info", color: "#3b82f6" },
  { value: "success", label: "Success", color: "#22c55e" },
  { value: "warning", label: "Warning", color: "#f59e0b" },
  { value: "error", label: "Error / Urgent", color: "#ef4444" },
  { value: "promo", label: "Promotion", color: "#a855f7" },
];

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setAnnouncements(data as Announcement[]);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      type: a.type,
      is_active: a.is_active,
      bg_color: a.bg_color,
      text_color: a.text_color,
      link_url: a.link_url || "",
      link_text: a.link_text || "",
      starts_at: a.starts_at ? new Date(a.starts_at).toISOString().slice(0, 16) : "",
      ends_at: a.ends_at ? new Date(a.ends_at).toISOString().slice(0, 16) : "",
      sort_order: a.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    const payload: any = {
      title: form.title,
      message: form.message,
      type: form.type,
      is_active: form.is_active,
      bg_color: form.bg_color,
      text_color: form.text_color,
      link_url: form.link_url || null,
      link_text: form.link_text || null,
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

  const handleTypeChange = (type: string) => {
    const opt = typeOptions.find(t => t.value === type);
    setForm(f => ({ ...f, type, bg_color: opt?.color || f.bg_color }));
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" /> Announcements
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage announcement bars shown in user dashboard</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New Announcement</Button>
        </div>

        {/* Preview */}
        {announcements.filter(a => a.is_active).length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Live Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {announcements.filter(a => a.is_active).map(a => (
                <div
                  key={a.id}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between"
                  style={{ backgroundColor: a.bg_color, color: a.text_color }}
                >
                  <span>{a.message}</span>
                  {a.link_url && a.link_text && (
                    <span className="underline ml-2 text-xs opacity-80">{a.link_text}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : announcements.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No announcements yet. Create one to get started.</CardContent></Card>
          ) : (
            announcements.map(a => (
              <Card key={a.id} className={`${!a.is_active ? "opacity-60" : ""}`}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.bg_color }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{a.title}</span>
                        <Badge variant="outline" className="text-xs">{a.type}</Badge>
                        {!a.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{a.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Announcement" : "New Announcement"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Festive Sale Live!" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="The text shown in the announcement bar" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={handleTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="w-10 h-9 rounded border cursor-pointer" />
                    <Input value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="w-10 h-9 rounded border cursor-pointer" />
                    <Input value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Link URL (optional)</Label>
                  <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <Label>Link Text</Label>
                  <Input value={form.link_text} onChange={e => setForm(f => ({ ...f, link_text: e.target.value }))} placeholder="Learn more" />
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

              {/* Preview in dialog */}
              {form.message && (
                <div className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: form.bg_color, color: form.text_color }}>
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
