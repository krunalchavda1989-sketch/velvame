import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Truck, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ShippingSettings {
  id: string;
  courier_enabled: boolean;
  pickup_enabled: boolean;
  courier_charge: number;
  free_courier_above: number | null;
  pickup_charge: number;
}

const AdminShippingSettings = () => {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("shipping_settings" as any).select("*").maybeSingle();
      if (data) setSettings(data as any);
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("shipping_settings" as any).update({
      courier_enabled: settings.courier_enabled,
      pickup_enabled: settings.pickup_enabled,
      courier_charge: Number(settings.courier_charge) || 0,
      free_courier_above: settings.free_courier_above === null || settings.free_courier_above === undefined || String(settings.free_courier_above) === "" ? null : Number(settings.free_courier_above),
      pickup_charge: Number(settings.pickup_charge) || 0,
    }).eq("id", settings.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Shipping settings saved");
  };

  if (loading || !settings) return <AdminLayout><div className="p-8 text-sm text-muted-foreground">Loading…</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Shipping & Delivery</h1>
            <p className="text-sm text-muted-foreground">Configure courier charges and self-pickup options shown at checkout</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Courier Delivery</h2>
                <p className="text-xs text-muted-foreground">Ship orders to customer address</p>
              </div>
              <Switch checked={settings.courier_enabled} onCheckedChange={(v) => setSettings({ ...settings, courier_enabled: v })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Courier Charge (₹)</Label>
                <Input type="number" min={0} step="0.01" value={settings.courier_charge} onChange={(e) => setSettings({ ...settings, courier_charge: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Free Courier Above (₹) <span className="text-muted-foreground text-xs">— optional</span></Label>
                <Input type="number" min={0} step="0.01" placeholder="Leave blank to disable" value={settings.free_courier_above ?? ""} onChange={(e) => setSettings({ ...settings, free_courier_above: e.target.value === "" ? null : parseFloat(e.target.value) })} />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Self Pickup</h2>
                <p className="text-xs text-muted-foreground">Let customers collect orders from pickup points</p>
              </div>
              <Switch checked={settings.pickup_enabled} onCheckedChange={(v) => setSettings({ ...settings, pickup_enabled: v })} />
            </div>
            <div>
              <Label>Pickup Charge (₹)</Label>
              <Input type="number" min={0} step="0.01" value={settings.pickup_charge} onChange={(e) => setSettings({ ...settings, pickup_charge: parseFloat(e.target.value) || 0 })} />
            </div>
            <Link to="/admin/pickup-locations" className="text-sm text-primary underline">Manage pickup locations →</Link>
          </div>

          <Button onClick={save} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? "Saving…" : "Save Settings"}</Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminShippingSettings;
