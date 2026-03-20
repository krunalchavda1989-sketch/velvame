import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Image as ImageIcon, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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

const SortableProductRow = ({ product, onEdit, onDelete }: { product: any; onEdit: (id: string) => void; onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : undefined };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-secondary/30 transition-colors border-b border-border">
      <td className="p-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground p-1">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="p-3">
        {product.image_url?.startsWith("http") ? (
          <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-md object-cover border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
            {product.image_url ? <span className="text-lg">{product.image_url}</span> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
          </div>
        )}
      </td>
      <td className="p-3 font-medium text-foreground cursor-pointer" onClick={() => onEdit(product.id)}>{product.name}</td>
      <td className="p-3 text-muted-foreground">{product.category}</td>
      <td className="p-3 text-foreground">₹{product.retail_price}</td>
      <td className="p-3 text-primary font-medium">₹{product.distributor_price}</td>
      <td className="p-3 text-foreground">{product.stock}</td>
      <td className="p-3">
        <Badge variant={product.active ? "default" : "outline"} className={product.active ? "bg-success text-success-foreground" : "text-muted-foreground"}>
          {product.active ? "Active" : "Draft"}
        </Badge>
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(product.id)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </td>
    </tr>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
    setHasOrderChanged(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    fetchProducts();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setProducts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((p, i) => ({ ...p, sort_order: i }));
    });
    setHasOrderChanged(true);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    for (const p of products) {
      const { error } = await supabase.from("products").update({ sort_order: p.sort_order }).eq("id", p.id);
      if (error) { toast.error("Failed to save order"); setSaving(false); return; }
    }
    toast.success("Product order saved");
    setSaving(false);
    setHasOrderChanged(false);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Products</h1>
          <div className="flex items-center gap-2">
            {hasOrderChanged && (
              <Button size="sm" onClick={handleSaveOrder} disabled={saving} className="gap-1.5">
                <Save className="h-4 w-4" />{saving ? "Saving..." : "Save Order"}
              </Button>
            )}
            <Button onClick={() => navigate("/admin/products/new")} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />Add Product
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first product.</p>
            <Button onClick={() => navigate("/admin/products/new")} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />Add Product
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium w-10"></th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Image</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Product</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Category</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Retail ₹</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Dist. ₹</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Stock</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                  <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <tbody>
                      {products.map((p) => (
                        <SortableProductRow key={p.id} product={p} onEdit={(id) => navigate(`/admin/products/${id}/edit`)} onDelete={handleDelete} />
                      ))}
                    </tbody>
                  </SortableContext>
                </DndContext>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
