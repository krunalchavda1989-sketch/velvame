import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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

interface NavMenuItem {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  isNew?: boolean;
}

/* ───────── Sortable Row ───────── */
const SortableMenuItem = ({
  item,
  onUpdate,
  onRemove,
}: {
  item: NavMenuItem;
  onUpdate: (id: string, field: keyof NavMenuItem, value: any) => void;
  onRemove: (id: string, isNew?: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground p-1 rounded"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          placeholder="Label"
          value={item.label}
          onChange={(e) => onUpdate(item.id, "label", e.target.value)}
          className="text-sm h-9"
        />
        <Input
          placeholder="/path"
          value={item.href}
          onChange={(e) => onUpdate(item.id, "href", e.target.value)}
          className="text-sm h-9 font-mono"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Switch
            checked={item.is_active}
            onCheckedChange={(v) => onUpdate(item.id, "is_active", v)}
          />
          <Label className="text-xs text-muted-foreground sr-only">Active</Label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.id, item.isNew)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/* ───────── Main Component ───────── */
const AdminMenus = () => {
  const [items, setItems] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchMenus = async () => {
    const { data, error } = await supabase
      .from("nav_menus")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data);
    if (error) toast.error("Failed to load menus");
    setLoading(false);
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        href: "/",
        sort_order: prev.length,
        is_active: true,
        parent_id: null,
        isNew: true,
      },
    ]);
  };

  const updateItem = useCallback((id: string, field: keyof NavMenuItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  const removeItem = useCallback(async (id: string, isNew?: boolean) => {
    if (!isNew) {
      const { error } = await supabase.from("nav_menus").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete");
        return;
      }
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Menu item removed");
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((item, i) => ({ ...item, sort_order: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const newItems = items.filter((i) => i.isNew);
    const existingItems = items.filter((i) => !i.isNew);

    if (newItems.length > 0) {
      const { error } = await supabase.from("nav_menus").insert(
        newItems.map(({ isNew, ...item }) => item)
      );
      if (error) {
        toast.error("Failed to add new items");
        setSaving(false);
        return;
      }
    }

    for (const item of existingItems) {
      const { error } = await supabase
        .from("nav_menus")
        .update({
          label: item.label,
          href: item.href,
          sort_order: item.sort_order,
          is_active: item.is_active,
        })
        .eq("id", item.id);
      if (error) {
        toast.error(`Failed to update ${item.label}`);
        setSaving(false);
        return;
      }
    }

    toast.success("Menu saved successfully");
    setSaving(false);
    fetchMenus();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Menu Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop to reorder navigation menu items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menu Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No menu items yet. Click "Add Item" to get started.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableMenuItem
                    key={item.id}
                    item={item}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMenus;