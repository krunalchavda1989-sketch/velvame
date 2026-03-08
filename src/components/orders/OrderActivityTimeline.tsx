import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageSquare, Clock, Package, Truck, CheckCircle2,
  XCircle, Send, StickyNote, CreditCard, Activity,
} from "lucide-react";
import { toast } from "sonner";

interface OrderNote {
  id: string;
  order_id: string;
  user_id: string | null;
  note_type: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

interface OrderActivityTimelineProps {
  orderId: string;
  isAdmin: boolean;
  orderCreatedAt: string;
  orderStatus: string;
  orderUpdatedAt: string;
  paymentStatus?: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  created: <Package className="h-3.5 w-3.5" />,
  status_change: <Activity className="h-3.5 w-3.5" />,
  confirmed: <CheckCircle2 className="h-3.5 w-3.5" />,
  shipped: <Truck className="h-3.5 w-3.5" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
  payment: <CreditCard className="h-3.5 w-3.5" />,
  manual: <MessageSquare className="h-3.5 w-3.5" />,
  system: <StickyNote className="h-3.5 w-3.5" />,
};

const activityColors: Record<string, string> = {
  created: "bg-blue-500",
  confirmed: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  payment: "bg-emerald-500",
  manual: "bg-primary",
  system: "bg-muted-foreground",
  status_change: "bg-amber-500",
};

const OrderActivityTimeline = ({
  orderId,
  isAdmin,
  orderCreatedAt,
  orderStatus,
  orderUpdatedAt,
  paymentStatus,
}: OrderActivityTimelineProps) => {
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("order_notes")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (data) setNotes(data);
  };

  useEffect(() => {
    fetchNotes();
  }, [orderId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("order_notes").insert({
      order_id: orderId,
      user_id: user?.id || null,
      note_type: "manual",
      content: newNote.trim(),
      is_internal: isInternal,
    });

    if (error) {
      toast.error("Failed to add note");
    } else {
      toast.success("Note added");
      setNewNote("");
      fetchNotes();
    }
    setSubmitting(false);
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  // Build combined timeline: system events + notes
  const timelineItems: {
    id: string;
    type: string;
    content: string;
    created_at: string;
    is_internal?: boolean;
  }[] = [];

  // Order created event
  timelineItems.push({
    id: "sys-created",
    type: "created",
    content: "Order was placed",
    created_at: orderCreatedAt,
  });

  // Status change event (if different from pending)
  if (orderStatus !== "pending" && orderUpdatedAt !== orderCreatedAt) {
    timelineItems.push({
      id: "sys-status",
      type: orderStatus,
      content: `Order marked as ${orderStatus}`,
      created_at: orderUpdatedAt,
    });
  }

  // Payment event
  if (paymentStatus === "captured" || paymentStatus === "paid") {
    timelineItems.push({
      id: "sys-payment",
      type: "payment",
      content: "Payment received successfully",
      created_at: orderUpdatedAt,
    });
  }

  // Add notes
  notes.forEach((note) => {
    timelineItems.push({
      id: note.id,
      type: note.note_type,
      content: note.content,
      created_at: note.created_at,
      is_internal: note.is_internal,
    });
  });

  // Sort by date descending
  timelineItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-secondary/30">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Activity
        </h2>
      </div>

      {/* Add note form — admin only */}
      {isAdmin && (
        <div className="p-4 border-b border-border space-y-3">
          <Textarea
            placeholder="Write a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[70px] text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="internal-toggle"
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label htmlFor="internal-toggle" className="text-xs text-muted-foreground cursor-pointer">
                {isInternal ? "Internal only" : "Visible to customer"}
              </Label>
            </div>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || submitting}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Add note
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="p-4">
        <div className="space-y-0">
          {timelineItems.map((item, index) => {
            const icon = activityIcons[item.type] || activityIcons.system;
            const dotColor = activityColors[item.type] || activityColors.system;
            const isLast = index === timelineItems.length - 1;

            return (
              <div key={item.id} className="flex gap-3 relative">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
                )}
                {/* Dot */}
                <div
                  className={`w-[27px] h-[27px] rounded-full flex items-center justify-center flex-shrink-0 text-white ${dotColor}`}
                >
                  {icon}
                </div>
                {/* Content */}
                <div className={`flex-1 pb-5 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground leading-snug">
                      {item.content}
                    </p>
                    {item.is_internal && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex-shrink-0">
                        Internal
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatTime(item.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {timelineItems.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
        )}
      </div>
    </div>
  );
};

export default OrderActivityTimeline;
