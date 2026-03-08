import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Info, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

const typeStyles: Record<string, { icon: any; bg: string; border: string; text: string }> = {
  success: { icon: CheckCircle, bg: "bg-success/10", border: "border-success/30", text: "text-success" },
  error: { icon: XCircle, bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
  info: { icon: Info, bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
};

const NotificationBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      setNotifications((data as any) || []);
    };

    fetch();

    // Listen for new notifications in realtime
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const dismiss = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        const style = typeStyles[n.type] || typeStyles.info;
        const Icon = style.icon;

        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border} cursor-pointer transition-opacity hover:opacity-90`}
            onClick={() => { if (n.link) navigate(n.link); dismiss(n.id); }}
          >
            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${style.text}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
              className="p-1 rounded hover:bg-background/50 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationBanner;
