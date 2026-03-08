import { useState, useEffect } from "react";
import { BarChart3, Pencil, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CommLevel {
  id: string;
  level: number;
  commission_type: string;
  rate: number;
  min_referrals: number;
  is_active: boolean;
}

const AdminCommissionLevels = () => {
  const [levels, setLevels] = useState<CommLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommLevel | null>(null);
  const [form, setForm] = useState({ rate: 0, min_referrals: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const fetchLevels = async () => {
    const { data } = await supabase.from("commission_levels").select("*").order("commission_type").order("level");
    setLevels((data as unknown as CommLevel[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLevels(); }, []);

  const openEdit = (l: CommLevel) => {
    setEditing(l);
    setForm({ rate: l.rate, min_referrals: l.min_referrals, is_active: l.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("commission_levels").update(form as any).eq("id", editing.id);
    if (error) toast.error("Failed to update"); else toast.success("Commission level updated!");
    setSaving(false);
    setDialogOpen(false);
    fetchLevels();
  };

  const levelItems = levels.filter((l) => l.commission_type === "level");
  const repurchaseItems = levels.filter((l) => l.commission_type === "repurchase");

  const renderTable = (items: CommLevel[], label: string) => (
    <div className="space-y-2">
      {items.map((l) => (
        <Card key={l.id} className={!l.is_active ? "opacity-50" : ""}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                L{l.commission_type === "repurchase" ? l.level - 100 : l.level}
              </div>
              <div>
                <p className="font-semibold text-foreground">{l.rate}% Commission</p>
                <p className="text-xs text-muted-foreground">Min {l.min_referrals} direct referrals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={l.is_active ? "default" : "secondary"}>{l.is_active ? "Active" : "Off"}</Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Commission Levels
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure commission rates and qualification criteria</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="level">
            <TabsList className="mb-4">
              <TabsTrigger value="level">Level Income ({levelItems.length})</TabsTrigger>
              <TabsTrigger value="repurchase">Repurchase Income ({repurchaseItems.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="level">{renderTable(levelItems, "Level")}</TabsContent>
            <TabsContent value="repurchase">{renderTable(repurchaseItems, "Repurchase")}</TabsContent>
          </Tabs>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Commission Level</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Commission Rate (%)</Label><Input type="number" step="0.5" min={0} max={100} value={form.rate} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Min Direct Referrals</Label><Input type="number" min={0} value={form.min_referrals} onChange={(e) => setForm({ ...form, min_referrals: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Update</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCommissionLevels;
