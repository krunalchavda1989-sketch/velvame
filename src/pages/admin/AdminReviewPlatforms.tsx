import { useState, useEffect } from "react";
import { Star, Plus, Save, Loader2, Trash2, Pencil, ExternalLink } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewPlatform {
  id: string;
  brand_name: string;
  platform: string;
  icon_url: string | null;
  review_url: string;
  rating: number | null;
  review_count: number | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY: Omit<ReviewPlatform, "id"> = {
  brand_name: "",
  platform: "",
  icon_url: "",
  review_url: "",
  rating: null,
  review_count: 0,
  description: "",
  is_active: true,
  sort_order: 0,
};

const AdminReviewPlatforms = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<ReviewPlatform[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewPlatform | null>(null);
  const [form, setForm] = useState<Omit<ReviewPlatform, "id">>(EMPTY);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("review_platforms")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Failed to load review platforms");
    setItems((data as ReviewPlatform[]) || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: items.length });
    setDialogOpen(true);
  };

  const openEdit = (item: ReviewPlatform) => {
    setEditing(item);
    const { id, ...rest } = item;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleIconUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Icon must be under 500KB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `review-platforms/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
    setForm((f) => ({ ...f, icon_url: data.publicUrl }));
    setUploading(false);
    toast.success("Icon uploaded");
  };

  const handleSave = async () => {
    if (!form.brand_name.trim() || !form.platform.trim() || !form.review_url.trim()) {
      toast.error("Brand name, platform and review URL are required");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await (supabase as any)
        .from("review_platforms")
        .update(form)
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Updated");
    } else {
      const { error } = await (supabase as any).from("review_platforms").insert(form);
      if (error) toast.error(error.message);
      else toast.success("Added");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review platform?")) return;
    const { error } = await (supabase as any).from("review_platforms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      fetchItems();
    }
  };

  const toggleActive = async (item: ReviewPlatform) => {
    await (supabase as any)
      .from("review_platforms")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    fetchItems();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Star className="h-6 w-6 text-primary" />
              Review Platforms
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage external review sources (Google, Facebook, Instagram, Trustpilot, etc.)
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Platform
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No review platforms yet. Click "Add Platform" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  {item.icon_url ? (
                    <img
                      src={item.icon_url}
                      alt={item.brand_name}
                      className="w-12 h-12 rounded-lg object-contain bg-muted p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{item.brand_name}</CardTitle>
                    <CardDescription className="capitalize">{item.platform}</CardDescription>
                  </div>
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? "Active" : "Hidden"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    {item.rating !== null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {item.rating}
                      </span>
                    )}
                    {!!item.review_count && (
                      <span className="text-muted-foreground">{item.review_count} reviews</span>
                    )}
                  </div>
                  <a
                    href={item.review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary inline-flex items-center gap-1 break-all"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {item.review_url}
                  </a>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                      <Label className="text-xs">Show on site</Label>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Review Platform</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Brand Name *</Label>
                  <Input
                    value={form.brand_name}
                    onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                    placeholder="Velvame"
                  />
                </div>
                <div>
                  <Label>Platform *</Label>
                  <Input
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    placeholder="Google / Facebook / Instagram"
                  />
                </div>
              </div>

              <div>
                <Label>Review URL *</Label>
                <Input
                  value={form.review_url}
                  onChange={(e) => setForm({ ...form, review_url: e.target.value })}
                  placeholder="https://g.page/r/..."
                />
              </div>

              <div>
                <Label>Icon / Logo</Label>
                <div className="flex items-center gap-3">
                  {form.icon_url && (
                    <img
                      src={form.icon_url}
                      alt=""
                      className="w-12 h-12 rounded object-contain bg-muted p-1"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])}
                    disabled={uploading}
                  />
                </div>
                <Input
                  className="mt-2"
                  value={form.icon_url || ""}
                  onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
                  placeholder="Or paste an icon URL"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Rating</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, rating: e.target.value ? Number(e.target.value) : null })
                    }
                    placeholder="4.8"
                  />
                </div>
                <div>
                  <Label>Review Count</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.review_count ?? 0}
                    onChange={(e) => setForm({ ...form, review_count: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description shown alongside this platform"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Active (visible on site)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminReviewPlatforms;
