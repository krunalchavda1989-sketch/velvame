import { useState, useEffect, useRef } from "react";
import { Megaphone, Plus, Pencil, Trash2, Loader2, Save, Image, Tag, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  offer_type: string;
  discount_percentage: number;
  product_id: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Product { id: string; name: string; }

const today = new Date().toISOString().split("T")[0];
const emptyOffer = {
  title: "", description: "", image_url: "", offer_type: "banner", discount_percentage: 0, product_id: null as string | null, start_date: today, end_date: today, is_active: true,
};

const AdminOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState(emptyOffer);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const [{ data: o }, { data: p }] = await Promise.all([
      supabase.from("monthly_offers").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name").eq("active", true),
    ]);
    setOffers((o as unknown as Offer[]) || []);
    setProducts((p as unknown as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyOffer); setDialogOpen(true); };
  const openEdit = (o: Offer) => { setEditing(o); setForm(o); setDialogOpen(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `offer-${Date.now()}.${ext}`;
    const filePath = `offers/${fileName}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    toast.success("Image uploaded!");
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImage = () => {
    setForm((prev) => ({ ...prev, image_url: "" }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload: any = { ...form };
    if (payload.offer_type === "banner") { payload.product_id = null; payload.discount_percentage = 0; }
    if (editing) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("monthly_offers").update(rest).eq("id", editing.id);
      if (error) toast.error("Failed"); else toast.success("Offer updated!");
    } else {
      const { error } = await supabase.from("monthly_offers").insert(payload);
      if (error) toast.error("Failed"); else toast.success("Offer created!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    await supabase.from("monthly_offers").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  const isExpired = (end: string) => new Date(end) < new Date();

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Monthly Offers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Publish promotional offers and product discounts</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Offer</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => (
              <Card key={o.id} className={!o.is_active || isExpired(o.end_date) ? "opacity-50" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {o.image_url ? (
                      <img src={o.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {o.offer_type === "banner" ? <Image className="h-5 w-5 text-primary" /> : <Tag className="h-5 w-5 text-primary" />}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{o.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.start_date} → {o.end_date}
                        {o.offer_type === "product_discount" && ` | ${o.discount_percentage}% off`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpired(o.end_date) && <Badge variant="destructive">Expired</Badge>}
                    <Badge variant="outline">{o.offer_type === "banner" ? "Banner" : "Discount"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {offers.length === 0 && <p className="text-center text-muted-foreground py-10">No offers yet</p>}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Offer" : "Add Offer"}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Offer Image</Label>
                {form.image_url ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={form.image_url} alt="Offer" className="w-full h-40 object-cover" />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload image</span>
                        <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
                      </div>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {/* Fallback: manual URL */}
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="Or paste image URL..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>Offer Type</Label>
                <Select value={form.offer_type} onValueChange={(v) => setForm({ ...form, offer_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner / Promotional</SelectItem>
                    <SelectItem value="product_discount">Product Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.offer_type === "product_discount" && (
                <>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={form.product_id || ""} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Discount %</Label><Input type="number" min={0} max={100} value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: parseFloat(e.target.value) || 0 })} /></div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{editing ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;
