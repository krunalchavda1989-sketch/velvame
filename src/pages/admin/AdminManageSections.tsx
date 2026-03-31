import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GripVertical, Eye, EyeOff, Save, LayoutList, Loader2 } from "lucide-react";

interface SectionItem {
  id: string;
  section_key: string;
  section_label: string;
  sort_order: number;
  is_visible: boolean;
}

const SECTION_ICONS: Record<string, string> = {
  banner: "🖼️",
  hero_stats: "📊",
  category: "🏷️",
  marquee_top: "📢",
  monthly_offers: "🎁",
  why_choose: "✅",
  featured_sections: "⭐",
  how_it_works: "⚙️",
  testimonials: "💬",
  marquee_bottom: "📢",
  newsletter: "📧",
  footer: "🦶",
};

const AdminManageSections = () => {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const { data } = await supabase
      .from("landing_section_order" as any)
      .select("*")
      .order("sort_order");
    if (data) setSections(data as any);
    setLoading(false);
  };

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = [...sections];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    // Re-assign sort_order
    updated.forEach((s, i) => (s.sort_order = i));
    setSections(updated);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const toggleVisibility = (idx: number) => {
    const updated = [...sections];
    updated[idx].is_visible = !updated[idx].is_visible;
    setSections(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of sections) {
        await supabase
          .from("landing_section_order" as any)
          .update({ sort_order: s.sort_order, is_visible: s.is_visible, updated_at: new Date().toISOString() } as any)
          .eq("id", s.id);
      }
      toast.success("Section order saved!");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manage Sections</h1>
              <p className="text-sm text-muted-foreground">Drag and drop to reorder landing page sections</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Order
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Section Order</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sections.map((section, idx) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 px-5 py-4 transition-all cursor-grab active:cursor-grabbing select-none ${
                      dragIdx === idx ? "opacity-50 bg-muted" : ""
                    } ${dragOverIdx === idx && dragIdx !== idx ? "border-t-2 border-primary" : ""} ${
                      !section.is_visible ? "opacity-60" : ""
                    } hover:bg-muted/50`}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xl flex-shrink-0">{SECTION_ICONS[section.section_key] || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{section.section_label}</span>
                      <span className="text-xs text-muted-foreground ml-2">#{idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.is_visible ? (
                        <Eye className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={section.is_visible}
                        onCheckedChange={() => toggleVisibility(idx)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Changes will reflect on the landing page after saving. Disabled sections will be hidden from visitors.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminManageSections;
