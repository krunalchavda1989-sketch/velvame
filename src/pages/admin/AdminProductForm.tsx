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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Plus, X, Save, Loader2, Tag, Layers, Globe, PackageX } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { toast } from "sonner";
import { generateSlugFromName } from "@/lib/productUrl";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortableImageItem from "@/components/admin/SortableImageItem";

interface ProductImage {
  id?: string;
  image_url: string;
  sort_order: number;
}

interface Variation {
  id?: string;
  attribute_name: string;
  attribute_value: string;
  price_adjustment: number;
  stock: number;
  sku: string;
  is_active: boolean;
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
  allow_backorder: false,
  seo_title: "",
  seo_slug: "",
  seo_description: "",
  seo_keywords: "",
};

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

  // Variations
  const [variations, setVariations] = useState<Variation[]>([]);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
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
      setForm({
        name: data.name || "",
        category: data.category || "General",
        retail_price: data.retail_price || 0,
        distributor_price: data.distributor_price || 0,
        stock: data.stock || 0,
        description: data.description || "",
        image_url: data.image_url || "",
        rating: data.rating || 0,
        active: data.active ?? true,
        allow_backorder: (data as any).allow_backorder ?? false,
        seo_title: (data as any).seo_title || "",
        seo_slug: (data as any).seo_slug || "",
        seo_description: (data as any).seo_description || "",
      });
      setPreviewUrl(data.image_url || null);

      // Load images, variations, tags in parallel
      const [imagesRes, variationsRes, tagsRes] = await Promise.all([
        supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("product_variations").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("product_tags").select("*").eq("product_id", id),
      ]);
      setAdditionalImages((imagesRes.data || []) as ProductImage[]);
      setVariations(
        (variationsRes.data || []).map((v: any) => ({
          id: v.id,
          attribute_name: v.attribute_name,
          attribute_value: v.attribute_value,
          price_adjustment: v.price_adjustment,
          stock: v.stock,
          sku: v.sku || "",
          is_active: v.is_active,
        }))
      );
      setTags((tagsRes.data || []).map((t: any) => t.tag));
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

  // Variation helpers
  const addVariation = () => {
    setVariations([...variations, { attribute_name: "", attribute_value: "", price_adjustment: 0, stock: 0, sku: "", is_active: true }]);
  };
  const updateVariation = (index: number, field: keyof Variation, value: any) => {
    setVariations((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };
  const removeVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  // Tag helpers
  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Auto-generate slug from name
  const generateSlug = () => {
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setForm({ ...form, seo_slug: slug });
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Product title is required"); return; }
    if (!form.retail_price || !form.distributor_price) { toast.error("Prices are required"); return; }

    setSaving(true);
    // Auto-generate slug from name if empty
    const finalSlug = form.seo_slug.trim() || generateSlugFromName(form.name);
    const payload: any = {
      name: form.name,
      category: form.category,
      retail_price: form.retail_price,
      distributor_price: form.distributor_price,
      stock: form.stock,
      description: form.description,
      image_url: form.image_url,
      rating: form.rating,
      active: form.active,
      allow_backorder: form.allow_backorder,
      seo_title: form.seo_title || form.name,
      seo_slug: finalSlug,
      seo_description: form.seo_description,
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

    // Save images
    await supabase.from("product_images").delete().eq("product_id", productId);
    if (additionalImages.length > 0) {
      const imagesToInsert = additionalImages.map((img, i) => ({ product_id: productId, image_url: img.image_url, sort_order: i }));
      const { error: imgError } = await supabase.from("product_images").insert(imagesToInsert);
      if (imgError) toast.error("Failed to save some images: " + imgError.message);
    }

    // Save variations
    await supabase.from("product_variations").delete().eq("product_id", productId);
    if (variations.length > 0) {
      const varsToInsert = variations.map((v, i) => ({
        product_id: productId,
        attribute_name: v.attribute_name,
        attribute_value: v.attribute_value,
        price_adjustment: v.price_adjustment,
        stock: v.stock,
        sku: v.sku,
        is_active: v.is_active,
        sort_order: i,
      }));
      const { error: varError } = await supabase.from("product_variations").insert(varsToInsert);
      if (varError) toast.error("Failed to save variations: " + varError.message);
    }

    // Save tags
    await supabase.from("product_tags").delete().eq("product_id", productId);
    if (tags.length > 0) {
      const tagsToInsert = tags.map((tag) => ({ product_id: productId, tag }));
      const { error: tagError } = await supabase.from("product_tags").insert(tagsToInsert);
      if (tagError) toast.error("Failed to save tags: " + tagError.message);
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
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
                <div className="mt-1.5">
                  <RichTextEditor
                    value={form.description || ""}
                    onChange={(val) => setForm({ ...form, description: val })}
                    placeholder="Write a detailed description of the product..."
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Describe the product in detail for better SEO and customer experience.</p>
              </div>
            </div>

            {/* Media Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Label className="text-sm font-semibold text-foreground mb-4 block">Media</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
              <input ref={additionalFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdditionalImageUpload} />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
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

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={additionalImages.map((_, i) => `img-${i}`)} strategy={rectSortingStrategy}>
                    {additionalImages.map((img, index) => (
                      <SortableImageItem key={`img-${index}`} id={`img-${index}`} imageUrl={img.image_url} index={index} onRemove={removeAdditionalImage} />
                    ))}
                  </SortableContext>
                </DndContext>

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

            {/* Variations Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Variations
                </Label>
                <Button size="sm" variant="outline" onClick={addVariation} className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Variation
                </Button>
              </div>

              {variations.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No variations yet. Add variations like Size, Color, etc.
                </div>
              ) : (
                <div className="space-y-3">
                  {variations.map((v, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Variation #{i + 1}</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={v.is_active}
                            onCheckedChange={(val) => updateVariation(i, "is_active", val)}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeVariation(i)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Attribute Name</Label>
                          <Input
                            value={v.attribute_name}
                            onChange={(e) => updateVariation(i, "attribute_name", e.target.value)}
                            placeholder="e.g. Size, Color, Weight"
                            className="mt-1 bg-background border-border text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Attribute Value</Label>
                          <Input
                            value={v.attribute_value}
                            onChange={(e) => updateVariation(i, "attribute_value", e.target.value)}
                            placeholder="e.g. Large, Red, 500g"
                            className="mt-1 bg-background border-border text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Price Adjustment (₹)</Label>
                          <Input
                            type="number"
                            value={v.price_adjustment || ""}
                            onChange={(e) => updateVariation(i, "price_adjustment", Number(e.target.value))}
                            placeholder="0"
                            className="mt-1 bg-background border-border text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Stock</Label>
                          <Input
                            type="number"
                            value={v.stock || ""}
                            onChange={(e) => updateVariation(i, "stock", Number(e.target.value))}
                            placeholder="0"
                            className="mt-1 bg-background border-border text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">SKU</Label>
                          <Input
                            value={v.sku}
                            onChange={(e) => updateVariation(i, "sku", e.target.value)}
                            placeholder="e.g. PROD-LG-RED"
                            className="mt-1 bg-background border-border text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">Variations allow customers to choose different options like size, color, or weight. Price adjustment is added to the base price.</p>
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

              {/* Back Order Toggle */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <PackageX className="h-4 w-4 text-primary" />
                      Allow Back Orders
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.allow_backorder
                        ? "Customers can place orders even when this product is out of stock"
                        : "Orders are blocked when stock reaches zero"}
                    </p>
                  </div>
                  <Switch
                    checked={form.allow_backorder}
                    onCheckedChange={(v) => setForm({ ...form, allow_backorder: v })}
                  />
                </div>
              </div>
            </div>

            {/* SEO Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Search Engine Optimization (SEO)
              </Label>

              {/* SEO Preview */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Search engine preview</p>
                <p className="text-sm font-medium text-blue-600 truncate">
                  {form.seo_title || form.name || "Product Title"}
                </p>
                <p className="text-xs text-green-700 truncate">
                  yoursite.com/product/{form.seo_slug || generateSlugFromName(form.name) || "product-slug"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {form.seo_description || form.description || "Product description will appear here..."}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">SEO Title</Label>
                <Input
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  placeholder={form.name || "Enter SEO title"}
                  className="mt-1.5 bg-background border-border"
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground mt-1">{form.seo_title.length}/70 characters</p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">URL Slug</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={generateSlug}>
                    Auto-generate
                  </Button>
                </div>
                <Input
                  value={form.seo_slug}
                  onChange={(e) => setForm({ ...form, seo_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="product-url-slug"
                  className="mt-1.5 bg-background border-border font-mono text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Meta Description</Label>
                <Textarea
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  placeholder="Write a concise description for search engines..."
                  rows={3}
                  className="mt-1.5 bg-background border-border resize-none"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">{form.seo_description.length}/160 characters</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">SEO Keywords</Label>
                <Input
                  value={form.seo_keywords}
                  onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                  className="mt-1.5 bg-background border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords for search engines</p>
              </div>
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

            {/* Tags Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Tags
              </Label>

              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag..."
                  className="bg-background border-border text-sm"
                />
                <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()} className="h-9 px-3">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Press Enter or comma to add. Tags help with search and filtering.</p>
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
                    <span className="text-muted-foreground">Variations</span>
                    <span className="text-foreground">{variations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tags</span>
                    <span className="text-foreground">{tags.length}</span>
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
