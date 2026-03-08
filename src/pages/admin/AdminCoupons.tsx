import { useState, useEffect } from "react";
import { Ticket, Plus, Pencil, Trash2, Loader2, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const today = new Date().toISOString().split("T")[0];
const emptyCoupon = {
  code: "", discount_type: "percentage", discount_value: 0, min_order_amount: 0, max_discount_amount: 0, max_uses: 0, used_count: 0, start_date: today, end_date: today, is_active: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyCoupon);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as unknown as Coupon[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...emptyCoupon, code: generateCode() }); setDialogOpen(true); };
  const openEdit = (c: Coupon) => { setEditing(c); setForm(c); setDialogOpen(true); };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return "NXM" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    setSaving(true);
    if (editing) {
      const { id, used_count, ...rest } = form as any;
      const { error } = await supabase.from("coupons").update(rest).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("Coupon updated!");
    } else {
      const { used_count, ...rest } = form;
      const { error } = await supabase.from("coupons").insert(rest as any);
      if (error) toast.error(error.message.includes("unique") ? "Code already exists" : error.message);
      else toast.success("Coupon created!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Deleted");
    fetchCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  const isExpired = (end: string) => new Date(end) < new Date();

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Ticket className="h-6 w-6 text-primary" />
              Coupon Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage discount coupons for checkout</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Create Coupon</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <Card key={c.id} className={!c.is_active || isExpired(c.end_date) ? "opacity-50" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-foreground">{c.code}</p>
                        <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                        {c.min_order_amount > 0 && ` (min ₹${c.min_order_amount})`}
                        {" | "}Used: {c.used_count}{c.max_uses > 0 ? `/${c.max_uses}` : ""} | {c.start_date} → {c.end_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpired(c.end_date) && <Badge variant="destructive">Expired</Badge>}
                    {c.max_uses > 0 && c.used_count >= c.max_uses && <Badge variant="secondary">Exhausted</Badge>}
                    <Badge variant="outline">{c.discount_type === "percentage" ? "%" : "₹"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {coupons.length === 0 && <p className="text-center text-muted-foreground py-10">No coupons created</p>}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <div className="flex gap-2">
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="font-mono" />
                  {!editing && <Button variant="outline" size="sm" onClick={() => setForm({ ...form, code: generateCode() })}>Generate</Button>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Discount Value {form.discount_type === "percentage" ? "(%)" : "(₹)"}</Label><Input type="number" min={0} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Min Order (₹)</Label><Input type="number" min={0} value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Max Discount (₹)</Label><Input type="number" min={0} value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-2"><Label>Max Uses (0 = unlimited)</Label><Input type="number" min={0} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 0 })} /></div>
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

export default AdminCoupons;
