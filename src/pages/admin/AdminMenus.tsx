import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

interface NavMenuItem {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  isNew?: boolean;
}

const AdminMenus = () => {
  const [items, setItems] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const updateItem = (id: string, field: keyof NavMenuItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = async (id: string, isNew?: boolean) => {
    if (!isNew) {
      const { error } = await supabase.from("nav_menus").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete");
        return;
      }
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Menu item removed");
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    newItems.forEach((item, i) => (item.sort_order = i));
    setItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);

    const newItems = items.filter((i) => i.isNew);
    const existingItems = items.filter((i) => !i.isNew);

    // Insert new items
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

    // Update existing items
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
              Manage navigation menu items shown on the website
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
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >
                    ▲
                  </button>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <button
                    onClick={() => moveItem(index, "down")}
                    disabled={index === items.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, "label", e.target.value)}
                    className="text-sm h-9"
                  />
                  <Input
                    placeholder="/path"
                    value={item.href}
                    onChange={(e) => updateItem(item.id, "href", e.target.value)}
                    className="text-sm h-9 font-mono"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(v) => updateItem(item.id, "is_active", v)}
                    />
                    <Label className="text-xs text-muted-foreground sr-only">Active</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id, item.isNew)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMenus;
