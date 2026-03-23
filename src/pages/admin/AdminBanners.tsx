import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Image, ExternalLink } from "lucide-react";

interface Banner {
  id: string;
  desktop_image_url: string;
  mobile_image_url: string;
  destination_link: string;
  link_target: string;
  alt_text: string;
  is_active: boolean;
  sort_order: number;
}

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    desktop_image_url: "",
    mobile_image_url: "",
    destination_link: "",
    link_target: "_self",
    alt_text: "",
    is_active: true,
    sort_order: 0,
  });

  const fetchBanners = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order");
    setBanners((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetForm = () => {
    setForm({
      desktop_image_url: "",
      mobile_image_url: "",
      destination_link: "",
      link_target: "_self",
      alt_text: "",
      is_active: true,
      sort_order: banners.length,
    });
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      desktop_image_url: b.desktop_image_url,
      mobile_image_url: b.mobile_image_url,
      destination_link: b.destination_link,
      link_target: b.link_target,
      alt_text: b.alt_text,
      is_active: b.is_active,
      sort_order: b.sort_order,
    });
    setDialogOpen(true);
  };

  const uploadImage = async (file: File, type: "desktop" | "mobile") => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${type}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    setForm(prev => ({
      ...prev,
      [type === "desktop" ? "desktop_image_url" : "mobile_image_url"]: publicUrl,
    }));
    setUploading(false);
    toast.success(`${type === "desktop" ? "Desktop" : "Mobile"} image uploaded`);
  };

  const handleSave = async () => {
    if (!form.desktop_image_url && !form.mobile_image_url) {
      toast.error("Please upload at least one image");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("banners")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Banner updated");
    } else {
      const { error } = await supabase.from("banners").insert(form);
      if (error) { toast.error(error.message); return; }
      toast.success("Banner added");
    }
    setDialogOpen(false);
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Banner deleted");
    fetchBanners();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("banners").update({ is_active: !current }).eq("id", id);
    fetchBanners();
  };

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= banners.length) return;
    const updates = [
      { id: banners[index].id, sort_order: banners[swapIndex].sort_order },
      { id: banners[swapIndex].id, sort_order: banners[index].sort_order },
    ];
    for (const u of updates) {
      await supabase.from("banners").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    fetchBanners();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Banner Management</h1>
            <p className="text-sm text-muted-foreground">Manage landing page image slider banners</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Banner</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No banners yet. Add your first banner.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {banners.map((b, i) => (
              <Card key={b.id} className={!b.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveOrder(i, "up")}
                        disabled={i === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                      >▲</button>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() => moveOrder(i, "down")}
                        disabled={i === banners.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                      >▼</button>
                    </div>

                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Desktop</span>
                        {b.desktop_image_url ? (
                          <img src={b.desktop_image_url} alt="Desktop" className="h-16 w-28 object-cover rounded border" />
                        ) : (
                          <div className="h-16 w-28 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">No image</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Mobile</span>
                        {b.mobile_image_url ? (
                          <img src={b.mobile_image_url} alt="Mobile" className="h-16 w-20 object-cover rounded border" />
                        ) : (
                          <div className="h-16 w-20 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">No image</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">{b.alt_text || "No alt text"}</p>
                        {b.destination_link ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <ExternalLink className="h-3 w-3" /> {b.destination_link}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">No link</p>
                        )}
                        <p className="text-xs text-muted-foreground">Order: {b.sort_order}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Desktop Image */}
            <div className="space-y-2">
              <Label>Desktop Banner Image</Label>
              <p className="text-xs text-muted-foreground">Recommended: 1920 × 600px</p>
              {form.desktop_image_url && (
                <img src={form.desktop_image_url} alt="Desktop preview" className="w-full h-32 object-cover rounded border" />
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, "desktop");
                }}
              />
            </div>

            {/* Mobile Image */}
            <div className="space-y-2">
              <Label>Mobile Banner Image</Label>
              <p className="text-xs text-muted-foreground">Recommended: 768 × 400px</p>
              {form.mobile_image_url && (
                <img src={form.mobile_image_url} alt="Mobile preview" className="w-full h-32 object-cover rounded border" />
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, "mobile");
                }}
              />
            </div>

            {/* Destination Link */}
            <div className="space-y-2">
              <Label>Destination Link (optional)</Label>
              <Input
                placeholder="/products or https://example.com"
                value={form.destination_link}
                onChange={(e) => setForm(p => ({ ...p, destination_link: e.target.value }))}
              />
            </div>

            {/* Link Target */}
            <div className="space-y-2">
              <Label>Open Link In</Label>
              <Select value={form.link_target} onValueChange={(v) => setForm(p => ({ ...p, link_target: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Same Tab</SelectItem>
                  <SelectItem value="_blank">New Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <Label>Alt Text (for SEO & accessibility)</Label>
              <Input
                placeholder="Describe the banner image"
                value={form.alt_text}
                onChange={(e) => setForm(p => ({ ...p, alt_text: e.target.value }))}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={uploading}>
                {editing ? "Update" : "Add"} Banner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBanners;
