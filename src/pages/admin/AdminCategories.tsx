import { useState, useEffect } from "react";
import { FolderTree, Plus, Pencil, Trash2, Loader2, Save, Upload, GripVertical, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { generateSlugFromName } from "@/lib/productUrl";

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  banner_url: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
}

const emptyCategory = {
  name: "", description: "", image_url: "", banner_url: "", slug: "", seo_title: "", seo_description: "", sort_order: 0, is_active: true,
};

const SortableCategoryRow = ({ cat, onEdit, onDelete }: { cat: Category; onEdit: (c: Category) => void; onDelete: (c: Category) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };

  return (
    <Card ref={setNodeRef} style={style} className={!cat.is_active ? "opacity-50" : ""}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
            <GripVertical className="h-5 w-5" />
          </button>
          {cat.image_url ? (
            <img src={cat.image_url} alt={cat.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderTree className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground">{cat.name}</p>
            <p className="text-xs text-muted-foreground">
              /{cat.slug} · {cat.product_count || 0} product{cat.product_count !== 1 ? "s" : ""}
              {cat.description && ` · ${cat.description}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cat.banner_url && <Badge variant="outline" className="text-xs"><Image className="h-3 w-3 mr-1" />Banner</Badge>}
          <Badge variant={cat.is_active ? "default" : "secondary"}>{cat.is_active ? "Active" : "Hidden"}</Badge>
          <Button variant="ghost" size="icon" onClick={() => onEdit(cat)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(cat)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyCategory);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"image" | "banner" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchCategories = async () => {
    const { data: cats } = await supabase.from("product_categories").select("*").order("sort_order");
    const { data: products } = await supabase.from("products").select("category");
    const countMap: Record<string, number> = {};
    (products || []).forEach((p: any) => { countMap[p.category] = (countMap[p.category] || 0) + 1; });
    setCategories(
      ((cats as unknown as Category[]) || []).map((c) => ({ ...c, product_count: countMap[c.name] || 0 }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyCategory); setDialogOpen(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", image_url: c.image_url || "", banner_url: c.banner_url || "", slug: c.slug || "", sort_order: c.sort_order, is_active: c.is_active });
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image_url" | "banner_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field === "image_url" ? "image" : "banner");
    const ext = file.name.split(".").pop();
    const path = `categories/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm({ ...form, [field]: urlData.publicUrl });
    setUploading(null);
    toast.success("Uploaded!");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    setSaving(true);
    const slug = form.slug.trim() || generateSlugFromName(form.name);
    const payload = { ...form, slug } as any;

    if (editing) {
      if (editing.name !== form.name) {
        await supabase.from("products").update({ category: form.name } as any).eq("category", editing.name);
      }
      const { error } = await supabase.from("product_categories").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message.includes("unique") ? "Category name or slug already exists" : error.message);
      else toast.success("Category updated!");
    } else {
      const { error } = await supabase.from("product_categories").insert(payload);
      if (error) toast.error(error.message.includes("unique") ? "Category name or slug already exists" : error.message);
      else toast.success("Category created!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async (cat: Category) => {
    if (cat.product_count && cat.product_count > 0) {
      toast.error(`Cannot delete — ${cat.product_count} products are assigned to "${cat.name}"`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    await supabase.from("product_categories").delete().eq("id", cat.id);
    toast.success("Deleted");
    fetchCategories();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    await Promise.all(
      reordered.map((c, i) => supabase.from("product_categories").update({ sort_order: i } as any).eq("id", c.id))
    );
    toast.success("Order updated");
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <FolderTree className="h-6 w-6 text-primary" />
              Product Categories
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Organize products into categories — drag to reorder</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {categories.map((c) => (
                  <SortableCategoryRow key={c.id} cat={c} onEdit={openEdit} onDelete={handleDelete} />
                ))}
                {categories.length === 0 && <p className="text-center text-muted-foreground py-10">No categories yet</p>}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={form.name} onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name, slug: editing ? form.slug : generateSlugFromName(name) });
                }} placeholder="e.g., Skincare" />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: generateSlugFromName(e.target.value) })} placeholder="e.g., skincare" />
                <p className="text-xs text-muted-foreground">/category/{form.slug || "..."}</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description" />
              </div>
              <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="flex items-center gap-3">
                  {form.image_url && <img src={form.image_url} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm">
                      {uploading === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading === "image" ? "Uploading..." : "Upload"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "image_url")} />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category Page Banner</Label>
                <p className="text-xs text-muted-foreground">Displayed below breadcrumb on the category page</p>
                <div className="flex flex-col gap-3">
                  {form.banner_url && (
                    <div className="relative">
                      <img src={form.banner_url} alt="Banner" className="w-full h-24 rounded-lg object-cover border border-border" />
                      <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 text-xs" onClick={() => setForm({ ...form, banner_url: "" })}>Remove</Button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm w-fit">
                      {uploading === "banner" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                      {uploading === "banner" ? "Uploading..." : "Upload Banner"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "banner_url")} />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
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

export default AdminCategories;
