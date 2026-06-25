import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface PickupLocation {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  hours: string | null;
  is_active: boolean;
  sort_order: number;
}

const empty: Omit<PickupLocation, "id"> = {
  name: "", address_line1: "", address_line2: "", city: "", state: "",
  pincode: "", phone: "", hours: "", is_active: true, sort_order: 0,
};

const AdminPickupLocations = () => {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PickupLocation, "id">>(empty);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pickup_locations" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setLocations((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (loc: PickupLocation) => {
    setEditingId(loc.id);
    setForm({ ...loc });
    setShowNew(false);
  };

  const cancelEdit = () => { setEditingId(null); setForm(empty); setShowNew(false); };

  const save = async () => {
    if (!form.name.trim() || !form.address_line1.trim() || !form.city.trim()) {
      toast.error("Name, address, and city are required");
      return;
    }
    const payload = { ...form, address_line2: form.address_line2 || null, state: form.state || null, pincode: form.pincode || null, phone: form.phone || null, hours: form.hours || null };
    if (editingId) {
      const { error } = await supabase.from("pickup_locations" as any).update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      toast.success("Location updated");
    } else {
      const { error } = await supabase.from("pickup_locations" as any).insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Location added");
    }
    cancelEdit();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this pickup location?")) return;
    const { error } = await supabase.from("pickup_locations" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const renderForm = () => (
    <div className="p-4 sm:p-6 rounded-xl bg-card border-2 border-primary/30 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div><Label>Address Line 1 *</Label><Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} /></div>
      <div><Label>Address Line 2</Label><Input value={form.address_line2 || ""} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>City *</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><Label>State</Label><Input value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
        <div><Label>Pincode</Label><Input value={form.pincode || ""} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
      </div>
      <div><Label>Pickup Hours</Label><Textarea placeholder="Mon–Sat: 10am – 7pm" value={form.hours || ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} rows={2} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
        <div className="flex items-end gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={save} className="gap-2"><Save className="h-4 w-4" />{editingId ? "Update" : "Create"}</Button>
        <Button variant="outline" onClick={cancelEdit} className="gap-2"><X className="h-4 w-4" />Cancel</Button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Pickup Locations</h1>
              <p className="text-sm text-muted-foreground">Manage self-pickup points customers can choose at checkout</p>
            </div>
          </div>
          {!showNew && !editingId && (
            <Button onClick={() => { setForm(empty); setShowNew(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Location</Button>
          )}
        </div>

        {(showNew || editingId) && <div className="mb-6">{renderForm()}</div>}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : locations.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-center text-sm text-muted-foreground">
            No pickup locations yet. Add one to enable Self Pickup at checkout.
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div key={loc.id} className="p-4 rounded-xl bg-card border border-border flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground">{loc.name}</h3>
                    {loc.is_active ? (
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {loc.address_line1}{loc.address_line2 ? `, ${loc.address_line2}` : ""}, {loc.city}{loc.state ? `, ${loc.state}` : ""}{loc.pincode ? ` – ${loc.pincode}` : ""}
                  </p>
                  {loc.phone && <p className="text-xs text-muted-foreground mt-0.5">📞 {loc.phone}</p>}
                  {loc.hours && <p className="text-xs text-muted-foreground mt-0.5">🕒 {loc.hours}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(loc)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(loc.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPickupLocations;
