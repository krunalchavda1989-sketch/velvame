import { useState, useEffect } from "react";
import { Share2, Save, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLATFORM_OPTIONS = [
  { value: "facebook", label: "Facebook", icon: "facebook" },
  { value: "instagram", label: "Instagram", icon: "instagram" },
  { value: "twitter", label: "Twitter / X", icon: "twitter" },
  { value: "youtube", label: "YouTube", icon: "youtube" },
  { value: "linkedin", label: "LinkedIn", icon: "linkedin" },
  { value: "whatsapp", label: "WhatsApp", icon: "whatsapp" },
  { value: "telegram", label: "Telegram", icon: "telegram" },
  { value: "pinterest", label: "Pinterest", icon: "pinterest" },
  { value: "tiktok", label: "TikTok", icon: "tiktok" },
  { value: "snapchat", label: "Snapchat", icon: "snapchat" },
];

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const AdminSocialMedia = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("social_media_links")
      .select("*")
      .order("sort_order");
    if (data) setLinks(data as unknown as SocialLink[]);
    if (error) toast.error("Failed to load social media links");
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const link of links) {
      const { id, ...rest } = link;
      await supabase.from("social_media_links").update(rest as any).eq("id", id);
    }
    toast.success("Social media links saved!");
    setSaving(false);
  };

  const handleAdd = async () => {
    const { data, error } = await supabase
      .from("social_media_links")
      .insert({ platform: "Facebook", url: "", icon: "facebook", sort_order: links.length } as any)
      .select()
      .single();
    if (data) {
      setLinks([...links, data as unknown as SocialLink]);
      toast.success("Link added");
    }
    if (error) toast.error("Failed to add link");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("social_media_links").delete().eq("id", id);
    if (!error) {
      setLinks(links.filter((l) => l.id !== id));
      toast.success("Link removed");
    } else {
      toast.error("Failed to delete");
    }
  };

  const updateLink = (id: string, key: keyof SocialLink, value: any) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  };

  const handlePlatformChange = (id: string, platform: string) => {
    const opt = PLATFORM_OPTIONS.find((p) => p.value === platform);
    setLinks(
      links.map((l) =>
        l.id === id ? { ...l, platform: opt?.label || platform, icon: opt?.icon || platform } : l
      )
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Social Media Links
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage social media links shown in the website footer
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {links.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No social media links configured. Click "Add Link" to get started.
              </CardContent>
            </Card>
          )}

          {links.map((link, index) => (
            <Card key={link.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3 space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={PLATFORM_OPTIONS.find((p) => p.icon === link.icon)?.value || "facebook"}
                        onValueChange={(val) => handlePlatformChange(link.id, val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORM_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-6 space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, "url", e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2 pb-1">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(val) => updateLink(link.id, "is_active", val)}
                      />
                      <Label className="text-xs text-muted-foreground">
                        {link.is_active ? "Active" : "Hidden"}
                      </Label>
                    </div>
                    <div className="md:col-span-1 flex justify-end pb-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSocialMedia;
