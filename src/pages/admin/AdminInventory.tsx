import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, AlertTriangle, CheckCircle, XCircle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ProductStock {
  id: string;
  name: string;
  category: string;
  stock: number;
  allow_backorder: boolean;
  active: boolean;
  image_url: string | null;
  sku?: string;
}

const LOW_STOCK_THRESHOLD = 10;

const CARD_GRADIENTS = [
  { from: "#4f46e5", to: "#6366f1" },
  { from: "#10b981", to: "#34d399" },
  { from: "#f59e0b", to: "#fbbf24" },
  { from: "#ef4444", to: "#f87171" },
];

const AdminInventory = () => {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out" | "in">("all");
  const [editedStocks, setEditedStocks] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [statColors, setStatColors] = useState(CARD_GRADIENTS);

  const fetchProducts = async () => {
    const [{ data }, { data: brandData }] = await Promise.all([
      supabase.from("products").select("id, name, category, stock, allow_backorder, active, image_url").order("name", { ascending: true }),
      supabase.from("brand_settings").select("stat_color_1, stat_color_2, stat_color_3, stat_color_4").limit(1).maybeSingle(),
    ]);
    setProducts((data as ProductStock[]) || []);
    if (brandData) {
      const bd = brandData as any;
      setStatColors([
        { from: bd.stat_color_1 || "#4f46e5", to: `${bd.stat_color_1 || "#4f46e5"}cc` },
        { from: bd.stat_color_2 || "#10b981", to: `${bd.stat_color_2 || "#10b981"}cc` },
        { from: bd.stat_color_3 || "#f59e0b", to: `${bd.stat_color_3 || "#f59e0b"}cc` },
        { from: bd.stat_color_4 || "#ec4899", to: `${bd.stat_color_4 || "#ec4899"}cc` },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "low") return p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD;
    if (filter === "out") return p.stock <= 0;
    if (filter === "in") return p.stock > LOW_STOCK_THRESHOLD;
    return true;
  });

  const totalProducts = products.length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const inStock = products.filter((p) => p.stock > LOW_STOCK_THRESHOLD).length;

  const handleStockChange = (id: string, value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return;
    setEditedStocks((prev) => ({ ...prev, [id]: num }));
  };

  const hasChanges = Object.keys(editedStocks).length > 0;

  const handleSaveAll = async () => {
    setSaving(true);
    const entries = Object.entries(editedStocks);
    for (const [id, stock] of entries) {
      const { error } = await supabase.from("products").update({ stock }).eq("id", id);
      if (error) {
        toast.error(`Failed to update stock for product`);
        setSaving(false);
        return;
      }
    }
    toast.success(`Updated stock for ${entries.length} product(s)`);
    setEditedStocks({});
    setSaving(false);
    fetchProducts();
  };

  const statCards = [
    { label: "Total Products", value: totalProducts, icon: Package, filterKey: "all" as const },
    { label: "In Stock", value: inStock, icon: CheckCircle, filterKey: "in" as const },
    { label: "Low Stock", value: lowStock, icon: AlertTriangle, filterKey: "low" as const },
    { label: "Out of Stock", value: outOfStock, icon: XCircle, filterKey: "out" as const },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Inventory Management</h1>
              <p className="text-sm text-muted-foreground">Track and manage product stock levels</p>
            </div>
          </div>
          {hasChanges && (
            <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : `Save Changes (${Object.keys(editedStocks).length})`}
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`cursor-pointer p-4 rounded-2xl text-white relative overflow-hidden hover:scale-[1.02] transition-transform ${filter === stat.filterKey ? "ring-2 ring-white/50 ring-offset-2 ring-offset-background" : ""}`}
              style={{
                background: `linear-gradient(135deg, ${statColors[i].from}, ${statColors[i].to})`,
                boxShadow: `0 8px 24px -4px ${statColors[i].from}44`,
              }}
              onClick={() => setFilter(stat.filterKey)}
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
              <stat.icon className="h-5 w-5 mb-2 opacity-90" />
              <div className="text-2xl font-display font-bold">{stat.value}</div>
              <div className="text-xs opacity-85">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">Product</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Category</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Current Stock</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Update Stock</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Back Order</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const currentStock = editedStocks[p.id] ?? p.stock;
                      const isEdited = p.id in editedStocks;
                      const stockStatus =
                        currentStock <= 0 ? "out" : currentStock <= LOW_STOCK_THRESHOLD ? "low" : "in";

                      return (
                        <tr key={p.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {p.image_url?.startsWith("http") ? (
                                <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-md object-cover border border-border" />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <span className="font-medium text-foreground">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{p.category}</td>
                          <td className="p-3 font-medium text-foreground">{p.stock}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min={0}
                              value={currentStock}
                              onChange={(e) => handleStockChange(p.id, e.target.value)}
                              className={`w-24 ${isEdited ? "border-primary ring-1 ring-primary" : ""}`}
                            />
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={stockStatus === "out" ? "destructive" : stockStatus === "low" ? "outline" : "default"}
                              className={
                                stockStatus === "in"
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                                  : stockStatus === "low"
                                  ? "bg-amber-500/10 text-amber-700 border-amber-200"
                                  : ""
                              }
                            >
                              {stockStatus === "out" ? "Out of Stock" : stockStatus === "low" ? "Low Stock" : "In Stock"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className={p.allow_backorder ? "text-primary border-primary/30" : "text-muted-foreground"}>
                              {p.allow_backorder ? "Enabled" : "Disabled"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
