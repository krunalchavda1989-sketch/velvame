import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MapPin, Star, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
}

const emptyForm = { label: "Home", name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" };

const Addresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({ label: addr.label, name: addr.name, line1: addr.line1, line2: addr.line2 || "", city: addr.city, state: addr.state, pincode: addr.pincode, phone: addr.phone });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.line1 || !form.city || !form.state || !form.pincode || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.pincode.length < 5 || form.pincode.length > 10) {
      toast.error("Enter a valid pincode");
      return;
    }
    if (form.phone.length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("user_addresses")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Address updated");
      } else {
        const isFirst = addresses.length === 0;
        const { error } = await supabase
          .from("user_addresses")
          .insert({ ...form, user_id: user!.id, is_default: isFirst });
        if (error) throw error;
        toast.success("Address added");
      }
      setDialogOpen(false);
      fetchAddresses();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_addresses").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Address deleted");
    fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user!.id);
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    toast.success("Default address updated");
    fetchAddresses();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> My Addresses
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your delivery addresses</p>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Address
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No addresses saved yet.</p>
              <Button onClick={openAdd} variant="outline" className="mt-4 gap-1.5">
                <Plus className="h-4 w-4" /> Add your first address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {addresses.map((addr) => (
              <Card key={addr.id} className={`transition-colors ${addr.is_default ? "border-primary/40 bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{addr.label}</Badge>
                        {addr.is_default && (
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] gap-1">
                            <Star className="h-2.5 w-2.5 fill-current" /> Default
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-foreground text-sm">{addr.name}</p>
                      <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} – {addr.pincode}</p>
                      <p className="text-sm text-muted-foreground">📞 {addr.phone}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {!addr.is_default && (
                        <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => handleSetDefault(addr.id)}>
                          Set Default
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(addr)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(addr.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Address" : "Add New Address"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Select value={form.label} onValueChange={(v) => setForm({ ...form, label: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 1 *</Label>
                <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} maxLength={200} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={50} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pincode *</Label>
                  <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 15) })} maxLength={15} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Addresses;
