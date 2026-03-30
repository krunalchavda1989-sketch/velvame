import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, Package } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FeaturedSection {
  id: string;
  title: string;
  selection_type: string;
  category_filter: string;
  bg_color: string;
  sort_order: number;
  is_active: boolean;
  products?: { product_id: string; sort_order: number }[];
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  category: string;
}

interface Category {
  id: string;
  name: string;
}

const SortableSectionRow = ({ section, onEdit, onDelete, onToggle }: {
  section: FeaturedSection;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="w-8 h-8 rounded-md border border-border flex-shrink-0" style={{ backgroundColor: section.bg_color }} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{section.title || "Untitled Section"}</p>
        <p className="text-xs text-muted-foreground">
          {section.selection_type === "category" ? `Category: ${section.category_filter}` : `Manual (${section.products?.length || 0} products)`}
        </p>
      </div>
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
        {section.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
};

const AdminFeaturedSections = () => {
  const [sections, setSections] = useState<FeaturedSection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<FeaturedSection | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("manual");
  const [formCategory, setFormCategory] = useState("");
  const [formBgColor, setFormBgColor] = useState("#ffffff");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSelectedProducts, setFormSelectedProducts] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchData = async () => {
    setLoading(true);
    const [{ data: secs }, { data: prods }, { data: cats }] = await Promise.all([
      supabase.from("featured_sections" as any).select("*").order("sort_order"),
      supabase.from("products").select("id, name, image_url, category").eq("active", true).order("name"),
      supabase.from("product_categories").select("id, name").eq("is_active", true).order("sort_order"),
    ]);

    const sectionsData = (secs as any[] || []) as FeaturedSection[];

    // Fetch products for each section
    if (sectionsData.length > 0) {
      const { data: sectionProducts } = await supabase
        .from("featured_section_products" as any)
        .select("section_id, product_id, sort_order")
        .in("section_id", sectionsData.map((s) => s.id))
        .order("sort_order");

      sectionsData.forEach((s) => {
        s.products = ((sectionProducts as any[]) || []).filter((sp: any) => sp.section_id === s.id);
      });
    }

    setSections(sectionsData);
    setAllProducts((prods || []) as Product[]);
    setCategories((cats || []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateDialog = () => {
    setEditingSection(null);
    setFormTitle("");
    setFormType("manual");
    setFormCategory("");
    setFormBgColor("#ffffff");
    setFormIsActive(true);
    setFormSelectedProducts([]);
    setDialogOpen(true);
  };

  const openEditDialog = (section: FeaturedSection) => {
    setEditingSection(section);
    setFormTitle(section.title);
    setFormType(section.selection_type);
    setFormCategory(section.category_filter);
    setFormBgColor(section.bg_color);
    setFormIsActive(section.is_active);
    setFormSelectedProducts(section.products?.map((p) => p.product_id) || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Section title is required"); return; }

    if (editingSection) {
      const { error } = await supabase.from("featured_sections" as any).update({
        title: formTitle, selection_type: formType, category_filter: formCategory,
        bg_color: formBgColor, is_active: formIsActive, updated_at: new Date().toISOString(),
      } as any).eq("id", editingSection.id);
      if (error) { toast.error("Failed to update"); return; }

      // Update products for manual type
      if (formType === "manual") {
        await supabase.from("featured_section_products" as any).delete().eq("section_id", editingSection.id);
        if (formSelectedProducts.length > 0) {
          await supabase.from("featured_section_products" as any).insert(
            formSelectedProducts.map((pid, i) => ({ section_id: editingSection.id, product_id: pid, sort_order: i })) as any
          );
        }
      }
      toast.success("Section updated");
    } else {
      const newSortOrder = sections.length;
      const { data, error } = await supabase.from("featured_sections" as any).insert({
        title: formTitle, selection_type: formType, category_filter: formCategory,
        bg_color: formBgColor, is_active: formIsActive, sort_order: newSortOrder,
      } as any).select().single();
      if (error || !data) { toast.error("Failed to create"); return; }

      if (formType === "manual" && formSelectedProducts.length > 0) {
        await supabase.from("featured_section_products" as any).insert(
          formSelectedProducts.map((pid, i) => ({ section_id: (data as any).id, product_id: pid, sort_order: i })) as any
        );
      }
      toast.success("Section created");
    }

    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    await supabase.from("featured_sections" as any).delete().eq("id", id);
    toast.success("Section deleted");
    fetchData();
  };

  const handleToggle = async (section: FeaturedSection) => {
    await supabase.from("featured_sections" as any).update({ is_active: !section.is_active } as any).eq("id", section.id);
    fetchData();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);

    await Promise.all(reordered.map((s, i) =>
      supabase.from("featured_sections" as any).update({ sort_order: i } as any).eq("id", s.id)
    ));
  };

  const toggleProduct = (productId: string) => {
    setFormSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId]
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Featured Sections</h1>
            <p className="text-sm text-muted-foreground mt-1">Create product carousel sections for the landing page</p>
          </div>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" /> Add Section</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No featured sections yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sections.map((section) => (
                  <SortableSectionRow
                    key={section.id}
                    section={section}
                    onEdit={() => openEditDialog(section)}
                    onDelete={() => handleDelete(section.id)}
                    onToggle={() => handleToggle(section)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Best Sellers" />
              </div>

              <div>
                <Label>Selection Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (pick products)</SelectItem>
                    <SelectItem value="category">By Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formType === "category" && (
                <div>
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formType === "manual" && (
                <div>
                  <Label>Select Products ({formSelectedProducts.length} selected)</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                    {allProducts.map((product) => (
                      <label key={product.id} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formSelectedProducts.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          className="rounded"
                        />
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs">📦</div>
                        )}
                        <span className="text-sm truncate">{product.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{product.category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <Input value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} className="w-32" />
                  <div className="flex-1 h-10 rounded-md border border-border" style={{ backgroundColor: formBgColor }} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingSection ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturedSections;
