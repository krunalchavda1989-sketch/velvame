import { useState, useEffect, useRef } from "react";
import { Map, Plus, Pencil, Trash2, Loader2, Save, X, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TitleRow {
  id: string;
  title_name: string;
  required_referrals: number;
  sort_order: number;
  badge_color: string;
  description: string;
  is_active: boolean;
  image_url: string;
}

const emptyTitle: Omit<TitleRow, "id"> = {
  title_name: "", required_referrals: 0, sort_order: 0, badge_color: "#3b82f6", description: "", is_active: true, image_url: "",
};

const AdminTitleRoadmap = () => {
  const [titles, setTitles] = useState<TitleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TitleRow | null>(null);
  const [form, setForm] = useState(emptyTitle);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTitles = async () => {
    const { data } = await supabase.from("title_roadmap").select("*").order("sort_order");
    setTitles((data as unknown as TitleRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTitles(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyTitle); setDialogOpen(true); };
  const openEdit = (t: TitleRow) => { setEditing(t); setForm(t); setDialogOpen(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `title-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("title-images").upload(fileName, file, { upsert: true });
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("title-images").getPublicUrl(fileName);
    setForm({ ...form, image_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  };

  const handleSave = async () => {
    if (!form.title_name.trim()) { toast.error("Title name is required"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("title_roadmap").update(form as any).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else toast.success("Title updated!");
    } else {
      const { error } = await supabase.from("title_roadmap").insert(form as any);
      if (error) toast.error("Failed to create"); else toast.success("Title created!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchTitles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this title?")) return;
    await supabase.from("title_roadmap").delete().eq("id", id);
    toast.success("Deleted");
    fetchTitles();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Map className="h-6 w-6 text-primary" />
              Title Roadmap
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage rank/title progression milestones (based on all active downline members)</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Title</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {titles.map((t) => (
              <Card key={t.id} className={!t.is_active ? "opacity-50" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.title_name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: t.badge_color }}>
                        {t.sort_order + 1}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{t.title_name}</p>
                      <p className="text-xs text-muted-foreground">{t.required_referrals} active members required</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {titles.length === 0 && <p className="text-center text-muted-foreground py-10">No titles configured</p>}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Title" : "Add Title"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title Name</Label><Input value={form.title_name} onChange={(e) => setForm({ ...form, title_name: e.target.value })} /></div>
              
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Title Image</Label>
                <div className="flex items-center gap-3">
                  {form.image_url ? (
                    <div className="relative">
                      <img src={form.image_url} alt="Title" className="h-16 w-16 rounded-full object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: "" })}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border border-dashed border-border">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Used as title badge icon</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Required Active Members</Label><Input type="number" min={0} value={form.required_referrals} onChange={(e) => setForm({ ...form, required_referrals: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Sort Order</Label><Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-2"><Label>Badge Color</Label><div className="flex gap-2"><Input type="color" value={form.badge_color} onChange={(e) => setForm({ ...form, badge_color: e.target.value })} className="w-14 h-10 p-1" /><Input value={form.badge_color} onChange={(e) => setForm({ ...form, badge_color: e.target.value })} /></div></div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{editing ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTitleRoadmap;
