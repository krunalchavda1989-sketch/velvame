import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortableImageItem from "@/components/admin/SortableImageItem";

const emptyProduct = {
  name: "",
  category: "General",
  retail_price: 0,
  distributor_price: 0,
  stock: 0,
  description: "",
  image_url: "",
  rating: 0,
  active: true,
};

interface ProductImage {
  id?: string;
  image_url: string;
  sort_order: number;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<ProductImage[]>([]);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const fetchProductImages = async (productId: string) => {
    const { data } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    return (data || []) as ProductImage[];
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyProduct });
    setPreviewUrl(null);
    setAdditionalImages([]);
    setDialogOpen(true);
  };

  const openEdit = async (p: any) => {
    setEditing(p);
    setForm({ ...p });
    setPreviewUrl(p.image_url || null);
    const images = await fetchProductImages(p.id);
    setAdditionalImages(images);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return null;
    }

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error("Upload failed: " + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setForm({ ...form, image_url: url });
      setPreviewUrl(url);
      toast.success("Main image uploaded");
    }
    setUploading(false);
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAdditional(true);

    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i]);
      if (url) {
        newImages.push({
          image_url: url,
          sort_order: additionalImages.length + newImages.length,
        });
      }
    }

    setAdditionalImages((prev) => [...prev, ...newImages]);
    setUploadingAdditional(false);
    if (newImages.length > 0) toast.success(`${newImages.length} image(s) uploaded`);
    if (additionalFileInputRef.current) additionalFileInputRef.current.value = "";
  };

  const removeMainImage = () => {
    setForm({ ...form, image_url: "" });
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name || !form.retail_price || !form.distributor_price) {
      toast.error("Name and prices are required");
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      retail_price: form.retail_price,
      distributor_price: form.distributor_price,
      stock: form.stock,
      description: form.description,
      image_url: form.image_url,
      rating: form.rating,
      active: form.active,
    };

    let productId: string;

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      productId = editing.id;
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      productId = data.id;
    }

    // Sync additional images
    // Delete existing images for this product
    await supabase.from("product_images").delete().eq("product_id", productId);

    // Insert current images
    if (additionalImages.length > 0) {
      const imagesToInsert = additionalImages.map((img, i) => ({
        product_id: productId,
        image_url: img.image_url,
        sort_order: i,
      }));
      const { error: imgError } = await supabase.from("product_images").insert(imagesToInsert);
      if (imgError) {
        toast.error("Failed to save some images: " + imgError.message);
      }
    }

    toast.success(editing ? "Product updated" : "Product created");
    setDialogOpen(false);
    fetchProducts();
  };

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
          <Button onClick={openCreate} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />Add Product
          </Button>
        </div>

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
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
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
                          {p.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
              {/* Main Image Upload */}
              <div>
                <Label>Main Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMainImageUpload}
                />
                {previewUrl ? (
                  <div className="relative mt-2 w-full h-40 rounded-lg border border-border overflow-hidden bg-muted">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      onClick={removeMainImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background border border-border"
                    >
                      <X className="h-4 w-4 text-foreground" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center justify-center gap-2 transition-colors"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload main image</span>
                        <span className="text-xs text-muted-foreground/60">Max 5MB · JPG, PNG, WEBP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Additional Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Additional Images</Label>
                  <span className="text-xs text-muted-foreground">{additionalImages.length} image(s)</span>
                </div>
                <input
                  ref={additionalFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAdditionalImageUpload}
                />

                {/* Image Grid */}
                {additionalImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {additionalImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted group">
                        <img src={img.image_url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 text-[10px] text-muted-foreground">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => additionalFileInputRef.current?.click()}
                  disabled={uploadingAdditional}
                  className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  {uploadingAdditional ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add more images</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-background border-border" />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="bg-background border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Retail Price ₹</Label>
                  <Input type="number" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: Number(e.target.value) })} className="bg-background border-border" />
                </div>
                <div>
                  <Label>Distributor Price ₹</Label>
                  <Input type="number" value={form.distributor_price} onChange={(e) => setForm({ ...form, distributor_price: Number(e.target.value) })} className="bg-background border-border" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-background border-border" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSave} className="bg-gradient-gold text-primary-foreground hover:opacity-90 w-full">
                {editing ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
