import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ClipboardList, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StockLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string } | null;
}

interface LogEntry {
  id: string;
  previous_stock: number;
  new_stock: number;
  change_quantity: number;
  change_type: string;
  note: string;
  created_at: string;
}

const StockLogDialog = ({ open, onOpenChange, product }: StockLogDialogProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product) {
      setLoading(true);
      supabase
        .from("inventory_logs" as any)
        .select("id, previous_stock, new_stock, change_quantity, change_type, note, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setLogs((data as any as LogEntry[]) || []);
          setLoading(false);
        });
    }
  }, [open, product]);

  const getChangeLabel = (type: string) => {
    switch (type) {
      case "stock_added": return "Stock Added";
      case "stock_set": return "Stock Set";
      case "product_edit": return "Product Edit";
      case "order_deduct": return "Order Placed";
      case "order_restore": return "Order Cancelled";
      default: return type;
    }
  };

  const getChangeBadgeClass = (qty: number) => {
    if (qty > 0) return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    if (qty < 0) return "bg-red-500/10 text-red-700 border-red-200";
    return "bg-muted text-muted-foreground";
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Stock History — {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">No stock changes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                  <div className={`mt-0.5 p-1.5 rounded-full ${log.change_quantity > 0 ? "bg-emerald-500/10" : log.change_quantity < 0 ? "bg-red-500/10" : "bg-muted"}`}>
                    {log.change_quantity > 0 ? (
                      <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
                    ) : log.change_quantity < 0 ? (
                      <ArrowDown className="h-3.5 w-3.5 text-red-600" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={getChangeBadgeClass(log.change_quantity)}>
                        {log.change_quantity > 0 ? "+" : ""}{log.change_quantity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd MMM yyyy, hh:mm a")}</span>
                    </div>
                    <p className="text-sm mt-1 text-foreground">
                      {log.previous_stock} → {log.new_stock} <span className="text-muted-foreground ml-1">({getChangeLabel(log.change_type)})</span>
                    </p>
                    {log.note && <p className="text-xs text-muted-foreground mt-1 italic">"{log.note}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockLogDialog;
