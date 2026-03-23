import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import BannerSliderSettings from "@/components/admin/BannerSliderSettings";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface Banner {
  id: string;
  desktop_image_url: string;
  mobile_image_url: string;
  destination_link: string;
  link_target: string;
  alt_text: string;
  is_active: boolean;
  sort_order: number;
  desktop_display_mode: string;
  mobile_display_mode: string;
  custom_duration: number | null;
}

const displayModes = [
  { value: "global", label: "Use Global Default" },
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
  { value: "auto", label: "Auto" },
];

const SortableBannerRow = ({
  banner,
  onEdit,
  onDelete,
  onToggle,
}: {
  banner: Banner;
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, current: boolean) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={!banner.is_active ? "opacity-60" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="flex gap-3 flex-1 min-w-0">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Desktop</span>
                {banner.desktop_image_url ? (
                  <img src={banner.desktop_image_url} alt="Desktop" className="h-16 w-28 object-cover rounded border" />
                ) : (
                  <div className="h-16 w-28 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Mobile</span>
                {banner.mobile_image_url ? (
                  <img src={banner.mobile_image_url} alt="Mobile" className="h-16 w-20 object-cover rounded border" />
                ) : (
                  <div className="h-16 w-20 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{banner.alt_text || "No alt text"}</p>
                {banner.destination_link ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <ExternalLink className="h-3 w-3" /> {banner.destination_link}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No link</p>
                )}
                {banner.custom_duration && (
                  <p className="text-xs text-muted-foreground">Duration: {banner.custom_duration}ms</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={banner.is_active} onCheckedChange={() => onToggle(banner.id, banner.is_active)} />
              <Button size="icon" variant="ghost" onClick={() => onEdit(banner)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(banner.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [useCustomDuration, setUseCustomDuration] = useState(false);

  const [form, setForm] = useState({
    desktop_image_url: "",
    mobile_image_url: "",
    destination_link: "",
    link_target: "_self",
    alt_text: "",
    is_active: true,
    sort_order: 0,
    desktop_display_mode: "",
    mobile_display_mode: "",
    custom_duration: null as number | null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchBanners = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetForm = () => {
    setForm({
      desktop_image_url: "", mobile_image_url: "", destination_link: "",
      link_target: "_self", alt_text: "", is_active: true, sort_order: banners.length,
      desktop_display_mode: "", mobile_display_mode: "", custom_duration: null,
    });
    setUseCustomDuration(false);
    setEditing(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      desktop_image_url: b.desktop_image_url, mobile_image_url: b.mobile_image_url,
      destination_link: b.destination_link, link_target: b.link_target,
      alt_text: b.alt_text, is_active: b.is_active, sort_order: b.sort_order,
      desktop_display_mode: b.desktop_display_mode, mobile_display_mode: b.mobile_display_mode,
      custom_duration: b.custom_duration,
    });
    setUseCustomDuration(!!b.custom_duration);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File, type: "desktop" | "mobile") => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${type}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    setForm(prev => ({ ...prev, [type === "desktop" ? "desktop_image_url" : "mobile_image_url"]: publicUrl }));
    setUploading(false);
    toast.success(`${type === "desktop" ? "Desktop" : "Mobile"} image uploaded`);
  };

  const handleSave = async () => {
    if (!form.desktop_image_url && !form.mobile_image_url) { toast.error("Please upload at least one image"); return; }
    const payload = { ...form, custom_duration: useCustomDuration ? form.custom_duration : null };

    if (editing) {
      const { error } = await supabase.from("banners").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Banner updated");
    } else {
      const { error } = await supabase.from("banners").insert(payload);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex(b => b.id === active.id);
    const newIndex = banners.findIndex(b => b.id === over.id);
    const reordered = arrayMove(banners, oldIndex, newIndex);
    setBanners(reordered);

    const updates = reordered.map((b, i) => ({ id: b.id, sort_order: i }));
    for (const u of updates) {
      await supabase.from("banners").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    toast.success("Banner order updated");
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

        <BannerSliderSettings />

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
            <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {banners.map(b => (
                  <SortableBannerRow key={b.id} banner={b} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
              {form.desktop_image_url && <img src={form.desktop_image_url} alt="Desktop preview" className="w-full h-32 object-cover rounded border" />}
              <Input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, "desktop"); }} />
            </div>

            {/* Desktop Display Mode */}
            <div className="space-y-2">
              <Label>Desktop Display Mode</Label>
              <Select value={form.desktop_display_mode} onValueChange={v => setForm(p => ({ ...p, desktop_display_mode: v }))}>
                <SelectTrigger><SelectValue placeholder="Use Global Default" /></SelectTrigger>
                <SelectContent>
                  {displayModes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Image */}
            <div className="space-y-2">
              <Label>Mobile Banner Image</Label>
              <p className="text-xs text-muted-foreground">Recommended: 768 × 400px</p>
              {form.mobile_image_url && <img src={form.mobile_image_url} alt="Mobile preview" className="w-full h-32 object-cover rounded border" />}
              <Input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, "mobile"); }} />
            </div>

            {/* Mobile Display Mode */}
            <div className="space-y-2">
              <Label>Mobile Display Mode</Label>
              <Select value={form.mobile_display_mode} onValueChange={v => setForm(p => ({ ...p, mobile_display_mode: v }))}>
                <SelectTrigger><SelectValue placeholder="Use Global Default" /></SelectTrigger>
                <SelectContent>
                  {displayModes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Destination Link */}
            <div className="space-y-2">
              <Label>Destination Link (optional)</Label>
              <Input placeholder="/products or https://example.com" value={form.destination_link} onChange={e => setForm(p => ({ ...p, destination_link: e.target.value }))} />
            </div>

            {/* Link Target */}
            <div className="space-y-2">
              <Label>Open Link In</Label>
              <Select value={form.link_target} onValueChange={v => setForm(p => ({ ...p, link_target: v }))}>
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
              <Input placeholder="Describe the banner image" value={form.alt_text} onChange={e => setForm(p => ({ ...p, alt_text: e.target.value }))} />
            </div>

            {/* Custom Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Slide Duration</Label>
                <Switch checked={useCustomDuration} onCheckedChange={v => { setUseCustomDuration(v); if (!v) setForm(p => ({ ...p, custom_duration: null })); }} />
              </div>
              {useCustomDuration && (
                <div className="space-y-1">
                  <Input type="number" min={1000} max={30000} step={500} placeholder="e.g. 5000"
                    value={form.custom_duration || ""} onChange={e => setForm(p => ({ ...p, custom_duration: parseInt(e.target.value) || null }))} />
                  <p className="text-xs text-muted-foreground">Overrides global auto-play speed for this banner only</p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={uploading}>{editing ? "Update" : "Add"} Banner</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBanners;
