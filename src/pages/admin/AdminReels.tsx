import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GripVertical, Plus, Pencil, Trash2, Film, Settings, Loader2, ExternalLink, Play } from "lucide-react";

interface ReelVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  platform: string;
  video_id: string;
  thumbnail_url: string;
  custom_thumbnail_url: string;
  destination_link: string;
  link_target: string;
  is_active: boolean;
  sort_order: number;
}

interface ReelsSettings {
  id: string;
  section_title: string;
  section_subtitle: string;
  is_enabled: boolean;
  show_platform_badge: boolean;
  show_title: boolean;
  show_description: boolean;
  cards_desktop: number;
  cards_mobile: number;
  show_arrows: boolean;
  enable_swipe: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  facebook: "#1877F2",
  instagram: "#E4405F",
};

const detectPlatform = (url: string): { platform: string; videoId: string } | null => {
  // YouTube
  let match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return { platform: "youtube", videoId: match[1] };
  // Facebook
  match = url.match(/(?:facebook\.com\/(?:watch\/?\?v=|reel\/)|fb\.watch\/)([a-zA-Z0-9_-]+)/);
  if (match) return { platform: "facebook", videoId: match[1] };
  // Instagram
  match = url.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
  if (match) return { platform: "instagram", videoId: match[1] };
  return null;
};

const getAutoThumbnail = (platform: string, videoId: string): string => {
  if (platform === "youtube") return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return "";
};

const AdminReels = () => {
  const [videos, setVideos] = useState<ReelVideo[]>([]);
  const [settings, setSettings] = useState<ReelsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [editVideo, setEditVideo] = useState<ReelVideo | null>(null);

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDestLink, setFormDestLink] = useState("");
  const [formLinkTarget, setFormLinkTarget] = useState("_blank");
  const [formActive, setFormActive] = useState(true);
  const [formCustomThumb, setFormCustomThumb] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState("");
  const [detectedVideoId, setDetectedVideoId] = useState("");
  const [autoThumb, setAutoThumb] = useState("");
  const [urlError, setUrlError] = useState("");

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: vids }, { data: sett }] = await Promise.all([
      supabase.from("reels_videos" as any).select("*").order("sort_order"),
      supabase.from("reels_settings" as any).select("*").limit(1).single(),
    ]);
    setVideos((vids as any[]) || []);
    if (sett) setSettings(sett as any);
    setLoading(false);
  };

  const handleUrlChange = (url: string) => {
    setFormUrl(url);
    setUrlError("");
    if (!url.trim()) { setDetectedPlatform(""); setDetectedVideoId(""); setAutoThumb(""); return; }
    const result = detectPlatform(url.trim());
    if (result) {
      setDetectedPlatform(result.platform);
      setDetectedVideoId(result.videoId);
      setAutoThumb(getAutoThumbnail(result.platform, result.videoId));
    } else {
      setDetectedPlatform("");
      setDetectedVideoId("");
      setAutoThumb("");
      setUrlError("Unsupported URL format. Please use a YouTube, Facebook, or Instagram video URL.");
    }
  };

  const resetForm = () => {
    setFormUrl(""); setFormTitle(""); setFormDesc(""); setFormDestLink(""); setFormLinkTarget("_blank");
    setFormActive(true); setFormCustomThumb(""); setDetectedPlatform(""); setDetectedVideoId("");
    setAutoThumb(""); setUrlError(""); setEditVideo(null);
  };

  const openAdd = () => { resetForm(); setFormOpen(true); };
  const openEdit = (v: ReelVideo) => {
    setEditVideo(v);
    setFormUrl(v.video_url); setFormTitle(v.title); setFormDesc(v.description);
    setFormDestLink(v.destination_link); setFormLinkTarget(v.link_target);
    setFormActive(v.is_active); setFormCustomThumb(v.custom_thumbnail_url);
    const r = detectPlatform(v.video_url);
    if (r) { setDetectedPlatform(r.platform); setDetectedVideoId(r.videoId); setAutoThumb(getAutoThumbnail(r.platform, r.videoId)); }
    setFormOpen(true);
  };

  const handleSaveVideo = async () => {
    if (!formUrl.trim() || !detectedPlatform) { toast.error("Please enter a valid video URL"); return; }
    if (!formTitle.trim()) { toast.error("Please enter a title"); return; }
    setSaving(true);
    const thumbUrl = formCustomThumb || autoThumb;
    const payload = {
      title: formTitle.trim(), description: formDesc.trim(), video_url: formUrl.trim(),
      platform: detectedPlatform, video_id: detectedVideoId, thumbnail_url: thumbUrl,
      custom_thumbnail_url: formCustomThumb, destination_link: formDestLink.trim(),
      link_target: formLinkTarget, is_active: formActive, updated_at: new Date().toISOString(),
    };
    if (editVideo) {
      await supabase.from("reels_videos" as any).update(payload as any).eq("id", editVideo.id);
      toast.success("Video updated");
    } else {
      const newOrder = videos.length;
      await supabase.from("reels_videos" as any).insert({ ...payload, sort_order: newOrder } as any);
      toast.success("Video added");
    }
    setSaving(false); setFormOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("reels_videos" as any).delete().eq("id", deleteId);
    toast.success("Video deleted"); setDeleteId(null); fetchAll();
  };

  const handleToggle = async (v: ReelVideo) => {
    await supabase.from("reels_videos" as any).update({ is_active: !v.is_active, updated_at: new Date().toISOString() } as any).eq("id", v.id);
    setVideos(prev => prev.map(x => x.id === v.id ? { ...x, is_active: !x.is_active } : x));
  };

  // Drag and drop
  const handleDrop = async (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const updated = [...videos];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    updated.forEach((s, i) => (s.sort_order = i));
    setVideos(updated); setDragIdx(null); setDragOverIdx(null);
    for (const s of updated) {
      await supabase.from("reels_videos" as any).update({ sort_order: s.sort_order } as any).eq("id", s.id);
    }
    toast.success("Video order updated successfully");
  };

  // Settings save
  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await supabase.from("reels_settings" as any).update({ ...settings, updated_at: new Date().toISOString() } as any).eq("id", settings.id);
    toast.success("Settings saved");
    setSaving(false);
  };

  const thumbPreview = formCustomThumb || autoThumb;
  const platformBadge = (p: string) => (
    <Badge style={{ backgroundColor: PLATFORM_COLORS[p] || "#666", color: "#fff" }} className="text-xs capitalize">{p}</Badge>
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Film className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reels / Video Slider</h1>
              <p className="text-sm text-muted-foreground">Manage videos displayed on the landing page</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="videos">
          <TabsList className="mb-4">
            <TabsTrigger value="videos"><Film className="h-4 w-4 mr-1" /> Videos</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <div className="flex justify-end mb-4">
              <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Video</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No videos added yet. Click "Add Video" to get started.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {videos.map((v, idx) => (
                      <div
                        key={v.id} draggable
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                        className={`flex items-center gap-3 px-4 py-3 transition-all cursor-grab active:cursor-grabbing select-none hover:bg-muted/50 ${dragIdx === idx ? "opacity-50 bg-muted" : ""} ${dragOverIdx === idx && dragIdx !== idx ? "border-t-2 border-primary" : ""}`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                        <div className="w-14 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                          {(v.custom_thumbnail_url || v.thumbnail_url) ? (
                            <img src={v.custom_thumbnail_url || v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Play className="h-5 w-5 text-muted-foreground" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{v.title || "Untitled"}</div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">{v.video_url}</div>
                        </div>
                        <div className="flex-shrink-0">{platformBadge(v.platform)}</div>
                        <Switch checked={v.is_active} onCheckedChange={() => handleToggle(v)} />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteId(v.id); setDeleteTitle(v.title); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            {settings && (
              <Card>
                <CardHeader><CardTitle>Section Display Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Section Title</Label><Input value={settings.section_title} onChange={e => setSettings({ ...settings, section_title: e.target.value })} /></div>
                    <div><Label>Section Subtitle</Label><Input value={settings.section_subtitle} onChange={e => setSettings({ ...settings, section_subtitle: e.target.value })} /></div>
                  </div>
                  <div className="flex items-center gap-3"><Switch checked={settings.is_enabled} onCheckedChange={v => setSettings({ ...settings, is_enabled: v })} /><Label>Section Enabled</Label></div>
                  <div className="border-t pt-4"><h3 className="font-semibold mb-3">Card Display</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2"><Switch checked={settings.show_platform_badge} onCheckedChange={v => setSettings({ ...settings, show_platform_badge: v })} /><Label>Show Platform Badge</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={settings.show_title} onCheckedChange={v => setSettings({ ...settings, show_title: v })} /><Label>Show Title</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={settings.show_description} onCheckedChange={v => setSettings({ ...settings, show_description: v })} /><Label>Show Description</Label></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div><Label>Cards per Row (Desktop)</Label>
                        <Select value={String(settings.cards_desktop)} onValueChange={v => setSettings({ ...settings, cards_desktop: Number(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{[3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Cards per Row (Mobile)</Label>
                        <Select value={String(settings.cards_mobile)} onValueChange={v => setSettings({ ...settings, cards_mobile: Number(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{[1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4"><h3 className="font-semibold mb-3">Navigation</h3>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2"><Switch checked={settings.show_arrows} onCheckedChange={v => setSettings({ ...settings, show_arrows: v })} /><Label>Show Arrows</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={settings.enable_swipe} onCheckedChange={v => setSettings({ ...settings, enable_swipe: v })} /><Label>Enable Swipe</Label></div>
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Settings</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={o => { if (!o) { setFormOpen(false); resetForm(); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editVideo ? "Edit Video" : "Add Video"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Video URL *</Label>
                <Input placeholder="Paste YouTube, Facebook, or Instagram URL" value={formUrl} onChange={e => handleUrlChange(e.target.value)} />
                {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
                {detectedPlatform && <div className="mt-1">{platformBadge(detectedPlatform)}</div>}
              </div>
              {thumbPreview && (
                <div>
                  <Label>Thumbnail Preview</Label>
                  <div className="w-24 h-36 rounded-lg overflow-hidden bg-muted mt-1"><img src={thumbPreview} alt="Thumbnail" className="w-full h-full object-cover" /></div>
                </div>
              )}
              <div>
                <Label>Custom Thumbnail URL (optional)</Label>
                <Input placeholder="Override auto-fetched thumbnail" value={formCustomThumb} onChange={e => setFormCustomThumb(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to use auto-fetched thumbnail. For Facebook/Instagram, paste thumbnail URL manually if auto-fetch fails.</p>
              </div>
              <div><Label>Video Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
              <div><Label>Short Description</Label><Textarea rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>
              <div><Label>Destination Link</Label><Input placeholder="Optional redirect URL on click" value={formDestLink} onChange={e => setFormDestLink(e.target.value)} /></div>
              <div><Label>Link Target</Label>
                <Select value={formLinkTarget} onValueChange={setFormLinkTarget}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="_self">Same Tab</SelectItem><SelectItem value="_blank">New Tab</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3"><Switch checked={formActive} onCheckedChange={setFormActive} /><Label>Active</Label></div>
              <Button onClick={handleSaveVideo} disabled={saving} className="w-full gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {editVideo ? "Update Video" : "Add Video"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>🗑️ Delete Video</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete "{deleteTitle}"? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminReels;
