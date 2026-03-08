import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Plus, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortableImageItem from "@/components/admin/SortableImageItem";

interface ProductImage {
  id?: string;
  image_url: string;
  sort_order: number;
}

const emptyForm = {
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

const categories = ["General", "Health", "Beauty", "Nutrition", "Personal Care", "Wellness", "Supplements"];

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({ ...emptyForm });
  const [categories, setCategories] = useState<string[]>(["General"]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<ProductImage[]>([]);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    // Fetch dynamic categories
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("product_categories")
        .select("name")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setCategories(data.map((c: any) => c.name));
    };
    fetchCategories();
    if (isEditing) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    if (data) {
      setForm(data);
      setPreviewUrl(data.image_url || null);
      const { data: images } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("sort_order");
      setAdditionalImages((images || []) as ProductImage[]);
    }
    setLoading(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAdditionalImages((prev) => {
        const oldIndex = prev.findIndex((_, i) => `img-${i}` === active.id);
        const newIndex = prev.findIndex((_, i) => `img-${i}` === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return null; }
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) { setForm({ ...form, image_url: url }); setPreviewUrl(url); toast.success("Image uploaded"); }
    setUploading(false);
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAdditional(true);
    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i]);
      if (url) newImages.push({ image_url: url, sort_order: additionalImages.length + newImages.length });
    }
    setAdditionalImages((prev) => [...prev, ...newImages]);
    setUploadingAdditional(false);
    if (newImages.length > 0) toast.success(`${newImages.length} image(s) uploaded`);
    if (additionalFileInputRef.current) additionalFileInputRef.current.value = "";
  };

  const removeMainImage = () => {
    setForm({ ...form, image_url: "" }); setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Product title is required"); return; }
    if (!form.retail_price || !form.distributor_price) { toast.error("Prices are required"); return; }

    setSaving(true);
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
    if (isEditing) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      productId = id!;
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      productId = data.id;
    }

    await supabase.from("product_images").delete().eq("product_id", productId);
    if (additionalImages.length > 0) {
      const imagesToInsert = additionalImages.map((img, i) => ({ product_id: productId, image_url: img.image_url, sort_order: i }));
      const { error: imgError } = await supabase.from("product_images").insert(imagesToInsert);
      if (imgError) toast.error("Failed to save some images: " + imgError.message);
    }

    toast.success(isEditing ? "Product updated" : "Product created");
    setSaving(false);
    navigate("/admin/products");
  };

  const profit = form.retail_price - form.distributor_price;
  const margin = form.retail_price > 0 ? ((profit / form.retail_price) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/products")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground">
                {isEditing ? "Edit product" : "Add product"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? "Update product details and media" : "Fill in the details to create a new product"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/products")}>Discard</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isEditing ? "Save" : "Save product"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Description Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Title</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Short sleeve t-shirt"
                  className="mt-1.5 bg-background border-border"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">Description</Label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Write a detailed description of the product..."
                  rows={6}
                  className="mt-1.5 bg-background border-border resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Describe the product in detail for better SEO and customer experience.</p>
              </div>
            </div>

            {/* Media Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Label className="text-sm font-semibold text-foreground mb-4 block">Media</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
              <input ref={additionalFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdditionalImageUpload} />

              {/* Main + Additional images grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {/* Main image */}
                {previewUrl ? (
                  <div className="relative aspect-square rounded-lg border-2 border-primary/30 overflow-hidden bg-muted group">
                    <img src={previewUrl} alt="Main" className="w-full h-full object-cover" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium">
                      Main
                    </div>
                    <button onClick={removeMainImage} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground font-medium">Add main image</span>
                      </>
                    )}
                  </button>
                )}

                {/* Additional images with DnD */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={additionalImages.map((_, i) => `img-${i}`)} strategy={rectSortingStrategy}>
                    {additionalImages.map((img, index) => (
                      <SortableImageItem key={`img-${index}`} id={`img-${index}`} imageUrl={img.image_url} index={index} onRemove={removeAdditionalImage} />
                    ))}
                  </SortableContext>
                </DndContext>

                {/* Add more button */}
                <button
                  onClick={() => additionalFileInputRef.current?.click()}
                  disabled={uploadingAdditional}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 flex flex-col items-center justify-center gap-1.5 transition-colors"
                >
                  {uploadingAdditional ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground font-medium">Add images</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, WEBP · Max 5MB per file · Drag to reorder</p>
            </div>

            {/* Pricing Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Label className="text-sm font-semibold text-foreground mb-4 block">Pricing</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Retail Price (MRP)</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={form.retail_price || ""}
                      onChange={(e) => setForm({ ...form, retail_price: Number(e.target.value) })}
                      placeholder="0.00"
                      className="pl-7 bg-background border-border"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Distributor Price</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={form.distributor_price || ""}
                      onChange={(e) => setForm({ ...form, distributor_price: Number(e.target.value) })}
                      placeholder="0.00"
                      className="pl-7 bg-background border-border"
                    />
                  </div>
                </div>
              </div>
              {/* Profit summary */}
              {form.retail_price > 0 && form.distributor_price > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profit per unit</span>
                    <span className="font-medium text-foreground">₹{profit.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Margin</span>
                    <span className="font-medium text-foreground">{margin}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Label className="text-sm font-semibold text-foreground mb-4 block">Inventory</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Stock quantity</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    placeholder="0"
                    className="mt-1.5 bg-background border-border"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rating (0-5)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={form.rating || ""}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    placeholder="4.5"
                    className="mt-1.5 bg-background border-border"
                  />
                </div>
              </div>
              {form.stock > 0 && form.stock <= 10 && (
                <p className="text-xs text-orange-500 mt-2">⚠ Low stock — only {form.stock} units remaining</p>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Label className="text-sm font-semibold text-foreground mb-4 block">Status</Label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{form.active ? "Active" : "Draft"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {form.active ? "Visible to customers on the shop" : "Hidden from the shop — only you can see it"}
                  </p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </div>

            {/* Product Organization Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <Label className="text-sm font-semibold text-foreground block">Product organization</Label>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5 bg-background border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary Card */}
            {isEditing && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <Label className="text-sm font-semibold text-foreground block">Summary</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Images</span>
                    <span className="text-foreground">{(previewUrl ? 1 : 0) + additionalImages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock</span>
                    <span className="text-foreground">{form.stock} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={form.active ? "text-green-600" : "text-muted-foreground"}>
                      {form.active ? "Active" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductForm;
