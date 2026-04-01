import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string; stock: number; image_url: string | null } | null;
  onSuccess: () => void;
}

const AddStockDialog = ({ open, onOpenChange, product, onSuccess }: AddStockDialogProps) => {
  const [quantity, setQuantity] = useState("");
  const [action, setAction] = useState<"add" | "set">("add");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!product) return;
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    setSaving(true);
    const newStock = action === "add" ? product.stock + qty : qty;

    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", product.id);
    if (error) {
      toast.error("Failed to update stock");
      setSaving(false);
      return;
    }

    // The trigger will auto-log the change. Update the note via a separate insert for custom note.
    if (note.trim()) {
      await supabase.from("inventory_logs" as any).update({ note: note.trim(), change_type: action === "add" ? "stock_added" : "stock_set" } as any)
        .eq("product_id", product.id)
        .eq("new_stock", newStock)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    toast.success(`Stock updated for ${product.name}`);
    setQuantity("");
    setNote("");
    setAction("add");
    setSaving(false);
    onOpenChange(false);
    onSuccess();
  };

  if (!product) return null;

  const previewStock = (() => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) return product.stock;
    return action === "add" ? product.stock + qty : qty;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Update Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
            {product.image_url?.startsWith("http") ? (
              <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-md object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground text-sm">{product.name}</p>
              <p className="text-xs text-muted-foreground">Current Stock: <span className="font-semibold text-foreground">{product.stock}</span></p>
            </div>
          </div>

          <div>
            <Label className="text-sm">Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as "add" | "set")}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add to current stock</SelectItem>
                <SelectItem value="set">Set exact stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Quantity</Label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={action === "add" ? "Units to add" : "New stock level"}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Restocked from supplier"
              className="mt-1.5 resize-none"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-sm text-muted-foreground">New stock will be:</span>
            <span className="text-lg font-bold text-primary">{previewStock}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !quantity}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockDialog;
