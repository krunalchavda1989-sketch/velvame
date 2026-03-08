import { useState, useEffect } from "react";
import { BarChart3, Pencil, Loader2, Save, IndianRupee, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

interface BinarySettings {
  id: string;
  is_active: boolean;
  matching_percentage: number;
  cap_amount: number;
  min_bv_for_payout: number;
  payout_frequency: string;
  min_monthly_purchase: number;
}

const AdminCommissionLevels = () => {
  const [levels, setLevels] = useState<CommLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommLevel | null>(null);
  const [form, setForm] = useState({ rate: 0, min_referrals: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  // Repurchase settings
  const [minMonthlyPurchase, setMinMonthlyPurchase] = useState(1000);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Binary settings
  const [binarySettings, setBinarySettings] = useState<BinarySettings | null>(null);
  const [savingBinary, setSavingBinary] = useState(false);

  const fetchLevels = async () => {
    const [{ data }, { data: settings }] = await Promise.all([
      supabase.from("commission_levels").select("*").order("commission_type").order("level"),
      supabase.from("binary_settings").select("*").limit(1).single(),
    ]);
    setLevels((data as unknown as CommLevel[]) || []);
    if (settings) {
      setMinMonthlyPurchase(Number((settings as any).min_monthly_purchase) || 1000);
      setSettingsId(settings.id);
      setBinarySettings({
        id: settings.id,
        is_active: settings.is_active,
        matching_percentage: Number(settings.matching_percentage),
        cap_amount: Number(settings.cap_amount),
        min_bv_for_payout: Number(settings.min_bv_for_payout),
        payout_frequency: settings.payout_frequency,
        min_monthly_purchase: Number((settings as any).min_monthly_purchase),
      });
    }
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

  const handleSaveMinPurchase = async () => {
    if (!settingsId) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("binary_settings")
      .update({ min_monthly_purchase: minMonthlyPurchase } as any)
      .eq("id", settingsId);
    setSavingSettings(false);
    if (error) toast.error("Failed to update"); else toast.success("Minimum monthly purchase updated!");
  };

  const handleSaveBinary = async () => {
    if (!binarySettings) return;
    setSavingBinary(true);
    const { error } = await supabase
      .from("binary_settings")
      .update({
        is_active: binarySettings.is_active,
        matching_percentage: binarySettings.matching_percentage,
        cap_amount: binarySettings.cap_amount,
        min_bv_for_payout: binarySettings.min_bv_for_payout,
        payout_frequency: binarySettings.payout_frequency,
      })
      .eq("id", binarySettings.id);
    setSavingBinary(false);
    if (error) toast.error("Failed to save"); else toast.success("Binary income settings saved!");
  };

  const levelItems = levels.filter((l) => l.commission_type === "level");
  const repurchaseItems = levels.filter((l) => l.commission_type === "repurchase");

  const renderTable = (items: CommLevel[]) => (
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
          <p className="text-sm text-muted-foreground mt-1">Configure commission rates, binary income, and qualification criteria</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="level">
            <TabsList className="mb-4">
              <TabsTrigger value="level">Level Income ({levelItems.length})</TabsTrigger>
              <TabsTrigger value="repurchase">Repurchase Income ({repurchaseItems.length})</TabsTrigger>
              <TabsTrigger value="binary" className="gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" />Binary Income</TabsTrigger>
            </TabsList>

            <TabsContent value="level">{renderTable(levelItems)}</TabsContent>

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
              {renderTable(repurchaseItems)}
            </TabsContent>

            <TabsContent value="binary">
              {binarySettings && (
                <div className="space-y-6">
                  {/* Enable/Disable */}
                  <Card className={!binarySettings.is_active ? "border-destructive/30" : "border-primary/20"}>
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="font-semibold text-foreground">Binary Income Status</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {binarySettings.is_active
                            ? "Users will receive binary matching income based on left/right leg BV"
                            : "Binary income is disabled — users will NOT receive any binary payouts"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={binarySettings.is_active ? "default" : "destructive"}>
                          {binarySettings.is_active ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={binarySettings.is_active}
                          onCheckedChange={(v) => setBinarySettings({ ...binarySettings, is_active: v })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Settings (shown regardless, but visually muted when disabled) */}
                  <div className={!binarySettings.is_active ? "opacity-50 pointer-events-none" : ""}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4 text-primary" />
                          Binary Income Configuration
                        </CardTitle>
                        <CardDescription>
                          Configure matching percentage, payout caps, and minimum BV requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Matching Percentage (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={binarySettings.matching_percentage}
                              onChange={(e) => setBinarySettings({ ...binarySettings, matching_percentage: Number(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">Percentage of weak leg BV paid as income</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Payout Cap (₹)</Label>
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              value={binarySettings.cap_amount}
                              onChange={(e) => setBinarySettings({ ...binarySettings, cap_amount: Number(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">Maximum payout per cycle per user</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Minimum BV for Payout</Label>
                            <Input
                              type="number"
                              min={0}
                              step={10}
                              value={binarySettings.min_bv_for_payout}
                              onChange={(e) => setBinarySettings({ ...binarySettings, min_bv_for_payout: Number(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-muted-foreground">Weak leg must have at least this BV to qualify</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Payout Frequency</Label>
                            <Select
                              value={binarySettings.payout_frequency}
                              onValueChange={(v) => setBinarySettings({ ...binarySettings, payout_frequency: v })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">How often binary income is calculated</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Preview */}
                        <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-1">
                          <p className="text-xs font-medium text-foreground">Payout Preview</p>
                          <p className="text-xs text-muted-foreground">
                            If a user has Left BV = 5,000 and Right BV = 3,000:
                          </p>
                          <p className="text-sm text-foreground">
                            Weak leg = 3,000 → Payout = 3,000 × {binarySettings.matching_percentage}% ={" "}
                            <span className="font-bold text-primary">
                              ₹{Math.min(3000 * binarySettings.matching_percentage / 100, binarySettings.cap_amount).toLocaleString()}
                            </span>
                            {3000 * binarySettings.matching_percentage / 100 > binarySettings.cap_amount && (
                              <span className="text-destructive text-xs ml-1">(capped at ₹{binarySettings.cap_amount.toLocaleString()})</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Carry forward: 2,000 BV on strong (left) leg
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveBinary} disabled={savingBinary} className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-1.5">
                      {savingBinary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Binary Settings
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
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
