import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    fetchProducts();
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Products</h1>
          <Button onClick={() => navigate("/admin/products/new")} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />Add Product
          </Button>
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
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                      <td className="p-3">
                        {p.image_url?.startsWith("http") ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-md object-cover border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                            {p.image_url ? <span className="text-lg">{p.image_url}</span> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium text-foreground">{p.name}</td>
                      <td className="p-3 text-muted-foreground">{p.category}</td>
                      <td className="p-3 text-foreground">₹{p.retail_price}</td>
                      <td className="p-3 text-primary font-medium">₹{p.distributor_price}</td>
                      <td className="p-3 text-foreground">{p.stock}</td>
                      <td className="p-3">
                        <Badge variant={p.active ? "default" : "outline"}
                          className={p.active ? "bg-success text-success-foreground" : "text-muted-foreground"}>
                          {p.active ? "Active" : "Draft"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
