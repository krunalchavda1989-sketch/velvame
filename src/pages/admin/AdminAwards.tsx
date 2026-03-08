import { useState, useEffect } from "react";
import { Trophy, Plus, Pencil, Trash2, Loader2, Save } from "lucide-react";
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

interface Award {
  id: string;
  title_name: string;
  reward_type: string;
  cash_amount: number;
  gift_name: string;
  gift_description: string;
  gift_image_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyAward = {
  title_name: "", reward_type: "cash", cash_amount: 0, gift_name: "", gift_description: "", gift_image_url: "", sort_order: 0, is_active: true,
};

const AdminAwards = () => {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Award | null>(null);
  const [form, setForm] = useState(emptyAward);
  const [saving, setSaving] = useState(false);

  const fetchAwards = async () => {
    const { data } = await supabase.from("awards_rewards").select("*").order("sort_order");
    setAwards((data as unknown as Award[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAwards(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyAward); setDialogOpen(true); };
  const openEdit = (a: Award) => { setEditing(a); setForm(a); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.title_name.trim()) { toast.error("Title name is required"); return; }
    setSaving(true);
    if (editing) {
      const { id, ...rest } = form as any;
      const { error } = await supabase.from("awards_rewards").update(rest).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else toast.success("Award updated!");
    } else {
      const { error } = await supabase.from("awards_rewards").insert(form as any);
      if (error) toast.error("Failed to create"); else toast.success("Award created!");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchAwards();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this award?")) return;
    await supabase.from("awards_rewards").delete().eq("id", id);
    toast.success("Deleted");
    fetchAwards();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Awards & Rewards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Configure rewards for title achievements</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Award</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {awards.map((a) => (
              <Card key={a.id} className={!a.is_active ? "opacity-50" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{a.title_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.reward_type === "cash" ? `₹${a.cash_amount.toLocaleString()} Cash Bonus` :
                         a.reward_type === "gift" ? `Gift: ${a.gift_name}` :
                         `₹${a.cash_amount.toLocaleString()} + ${a.gift_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{a.reward_type}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {awards.length === 0 && <p className="text-center text-muted-foreground py-10">No awards configured</p>}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Award" : "Add Award"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>For Title</Label><Input value={form.title_name} onChange={(e) => setForm({ ...form, title_name: e.target.value })} placeholder="e.g., Diamond" /></div>
              <div className="space-y-2">
                <Label>Reward Type</Label>
                <Select value={form.reward_type} onValueChange={(v) => setForm({ ...form, reward_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash Bonus</SelectItem>
                    <SelectItem value="gift">Gift/Prize</SelectItem>
                    <SelectItem value="both">Cash + Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.reward_type === "cash" || form.reward_type === "both") && (
                <div className="space-y-2"><Label>Cash Amount (₹)</Label><Input type="number" min={0} value={form.cash_amount} onChange={(e) => setForm({ ...form, cash_amount: parseFloat(e.target.value) || 0 })} /></div>
              )}
              {(form.reward_type === "gift" || form.reward_type === "both") && (
                <>
                  <div className="space-y-2"><Label>Gift Name</Label><Input value={form.gift_name} onChange={(e) => setForm({ ...form, gift_name: e.target.value })} placeholder="e.g., iPhone 15" /></div>
                  <div className="space-y-2"><Label>Gift Description</Label><Textarea value={form.gift_description} onChange={(e) => setForm({ ...form, gift_description: e.target.value })} rows={2} /></div>
                  <div className="space-y-2"><Label>Gift Image URL</Label><Input value={form.gift_image_url} onChange={(e) => setForm({ ...form, gift_image_url: e.target.value })} placeholder="https://..." /></div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Sort Order</Label><Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
                <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              </div>
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

export default AdminAwards;
