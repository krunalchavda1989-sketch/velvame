import { useState, useEffect } from "react";
import { BarChart3, Pencil, Loader2, Save, IndianRupee, Plus, Trash2 } from "lucide-react";
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
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<"level" | "repurchase">("level");
  const [form, setForm] = useState({ rate: 0, min_referrals: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Repurchase settings
  const [minMonthlyPurchase, setMinMonthlyPurchase] = useState(1000);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchLevels = async () => {
    const [{ data }, { data: settings }] = await Promise.all([
      supabase.from("commission_levels").select("*").order("commission_type").order("level"),
      (supabase as any).from("commission_settings").select("*").limit(1).single(),
    ]);
    setLevels((data as unknown as CommLevel[]) || []);
    if (settings) {
      setMinMonthlyPurchase(Number((settings as any).min_monthly_purchase) || 1000);
      setSettingsId(settings.id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLevels(); }, []);

  const openEdit = (l: CommLevel) => {
    setEditing(l);
    setIsAdding(false);
    setForm({ rate: l.rate, min_referrals: l.min_referrals, is_active: l.is_active });
    setDialogOpen(true);
  };

  const openAdd = (type: "level" | "repurchase") => {
    setEditing(null);
    setIsAdding(true);
    setAddType(type);
    setForm({ rate: 0, min_referrals: 0, is_active: true });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);

    if (isAdding) {
      const existingOfType = levels.filter((l) =>
        addType === "level" ? l.commission_type === "level" : l.commission_type === "repurchase"
      );
      const maxLevel = existingOfType.reduce((max, l) => Math.max(max, l.level), 0);
      const nextLevel = addType === "repurchase" ? (existingOfType.length === 0 ? 101 : maxLevel + 1) : maxLevel + 1;

      const { error } = await supabase.from("commission_levels").insert({
        level: nextLevel,
        commission_type: addType,
        rate: form.rate,
        min_referrals: form.min_referrals,
        is_active: form.is_active,
      } as any);

      if (error) toast.error("Failed to add level");
      else toast.success(`Level ${addType === "repurchase" ? nextLevel - 100 : nextLevel} added!`);
    } else if (editing) {
      const { error } = await supabase.from("commission_levels").update(form as any).eq("id", editing.id);
      if (error) toast.error("Failed to update");
      else toast.success("Commission level updated!");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchLevels();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("commission_levels").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else toast.success("Commission level deleted!");
    setDeleting(null);
    fetchLevels();
  };

  const handleSaveMinPurchase = async () => {
    if (!settingsId) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("commission_settings")
      .update({ min_monthly_purchase: minMonthlyPurchase } as any)
      .eq("id", settingsId);
    setSavingSettings(false);
    if (error) toast.error("Failed to update"); else toast.success("Minimum monthly purchase updated!");
  };

  const levelItems = levels.filter((l) => l.commission_type === "level");
  const repurchaseItems = levels.filter((l) => l.commission_type === "repurchase");

  const renderTable = (items: CommLevel[], type: "level" | "repurchase") => (
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
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={deleting === l.id}
                onClick={() => handleDelete(l.id)}
              >
                {deleting === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full mt-3 gap-2 border-dashed" onClick={() => openAdd(type)}>
        <Plus className="h-4 w-4" /> Add Level {type === "level" ? levelItems.length + 1 : repurchaseItems.length + 1}
      </Button>
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

            <TabsContent value="level">{renderTable(levelItems, "level")}</TabsContent>

            <TabsContent value="repurchase">
              <Card className="mb-4 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    Repurchase Qualification
                  </CardTitle>
                  <CardDescription>
                    Both the buyer and each upline must have at least this amount in purchases during the current month to qualify for repurchase commissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <div className="space-y-1.5 flex-1 max-w-xs">
                      <Label htmlFor="min-purchase">Minimum Monthly Purchase (₹)</Label>
                      <Input id="min-purchase" type="number" min={0} step={100} value={minMonthlyPurchase} onChange={(e) => setMinMonthlyPurchase(parseFloat(e.target.value) || 0)} />
                    </div>
                    <Button onClick={handleSaveMinPurchase} disabled={savingSettings} className="gap-1.5">
                      {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {renderTable(repurchaseItems, "repurchase")}
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAdding ? `Add ${addType === "level" ? "Level" : "Repurchase"} Commission` : "Edit Commission Level"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Commission Rate (%)</Label><Input type="number" step="0.5" min={0} max={100} value={form.rate} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Min Direct Referrals</Label><Input type="number" min={0} value={form.min_referrals} onChange={(e) => setForm({ ...form, min_referrals: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isAdding ? <Plus className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isAdding ? "Add Level" : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCommissionLevels;
