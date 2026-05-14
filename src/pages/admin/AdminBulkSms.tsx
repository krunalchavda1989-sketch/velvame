import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Plus, Send, Clock, Users, FileText, Trash2,
  Loader2, Search, Filter, Eye, CheckCircle,
  XCircle, AlertTriangle, Save, Smartphone, Phone,
  Image, Video, Paperclip, Link as LinkIcon, Upload, X
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";

const AUDIENCE_TYPES = [
  { value: "all", label: "All Users", desc: "Send to all registered users" },
  { value: "active", label: "Active Members", desc: "Users with active subscriptions" },
  { value: "inactive", label: "Inactive Members", desc: "Users without active subscriptions" },
  { value: "custom", label: "Custom Numbers", desc: "Paste phone numbers manually" },
];

const TEMPLATE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "promotional", label: "Promotional" },
  { value: "transactional", label: "Transactional" },
  { value: "reminder", label: "Reminder" },
  { value: "welcome", label: "Welcome" },
];

const PLACEHOLDERS = [
  { tag: "{{name}}", desc: "User's full name" },
  { tag: "{{phone}}", desc: "Phone number" },
  { tag: "{{referral_code}}", desc: "Referral code" },
  { tag: "{{title}}", desc: "User title" },
  { tag: "{{brand}}", desc: "Brand name" },
];

const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { value: "whatsapp", label: "WhatsApp", icon: Phone, color: "text-green-600", bg: "bg-green-500/10 border-green-500/20" },
  { value: "both", label: "Both", icon: Send, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
];

const channelBadge = (channel: string) => {
  if (channel === "whatsapp") return <Badge variant="outline" className="text-[10px] gap-1 border-green-500/30 text-green-600"><Phone className="h-2.5 w-2.5" />WhatsApp</Badge>;
  if (channel === "both") return <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary"><Send className="h-2.5 w-2.5" />Both</Badge>;
  return <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/30 text-blue-500"><MessageSquare className="h-2.5 w-2.5" />SMS</Badge>;
};

const defaultForm = { name: "", message: "", audience_type: "all", custom_numbers: "", schedule: false, scheduled_at: "", channel: "sms", media_url: "", media_type: "", link_url: "", link_text: "" };

const WHATSAPP_MEDIA_TYPES = [
  { value: "", label: "No Media", icon: MessageSquare, accept: "", maxSize: 0 },
  { value: "image", label: "Image", icon: Image, accept: "image/jpeg,image/png,image/webp", maxSize: 5 * 1024 * 1024, hint: "JPG, PNG, WebP · Max 5 MB" },
  { value: "video", label: "Video", icon: Video, accept: "video/mp4,video/3gpp", maxSize: 16 * 1024 * 1024, hint: "MP4, 3GP · Max 16 MB" },
  { value: "document", label: "Document", icon: Paperclip, accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt", maxSize: 100 * 1024 * 1024, hint: "PDF, DOC, XLS, PPT · Max 100 MB" },
];

const AdminBulkSms = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ ...defaultForm });
  const [savingCampaign, setSavingCampaign] = useState(false);

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", content: "", category: "general" });
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [userCount, setUserCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("admin-bulksms-profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => { fetchAll(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [campaignRes, templateRes, totalRes, activeRes] = await Promise.all([
      supabase.from("sms_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("sms_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_paid", true),
    ]);
    if (campaignRes.data) setCampaigns(campaignRes.data);
    if (templateRes.data) setTemplates(templateRes.data);
    setUserCount(totalRes.count || 0);
    setActiveCount(activeRes.count || 0);
    setLoading(false);
  };

  const getRecipientCount = (type: string) => {
    switch (type) {
      case "all": return userCount;
      case "active": return activeCount;
      case "inactive": return userCount - activeCount;
      case "custom": return campaignForm.custom_numbers.split("\n").filter((n) => n.trim()).length;
      default: return 0;
    }
  };

  const maxChars = campaignForm.channel === "whatsapp" ? 1024 : campaignForm.channel === "both" ? 160 : 160;

  const handleCreateCampaign = async (sendNow: boolean) => {
    if (!campaignForm.name.trim()) { toast.error("Campaign name is required"); return; }
    if (!campaignForm.message.trim()) { toast.error("Message content is required"); return; }
    if (campaignForm.message.length > maxChars) {
      toast.error(`Message should be within ${maxChars} characters`);
      return;
    }

    setSavingCampaign(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const recipientCount = getRecipientCount(campaignForm.audience_type);
      const payload: any = {
        name: campaignForm.name.trim(),
        message: campaignForm.message.trim(),
        audience_type: campaignForm.audience_type,
        channel: campaignForm.channel,
        recipient_count: recipientCount,
        created_by: user.id,
        status: sendNow ? "sent" : campaignForm.schedule ? "scheduled" : "draft",
        audience_filter: campaignForm.audience_type === "custom"
          ? { numbers: campaignForm.custom_numbers.split("\n").filter((n) => n.trim()) }
          : {},
        scheduled_at: campaignForm.schedule && campaignForm.scheduled_at
          ? new Date(campaignForm.scheduled_at).toISOString()
          : null,
        sent_at: sendNow ? new Date().toISOString() : null,
        sent_count: sendNow ? recipientCount : 0,
        failed_count: 0,
      };

      // Add WhatsApp media fields
      if (campaignForm.channel === "whatsapp" || campaignForm.channel === "both") {
        payload.media_url = campaignForm.media_url || "";
        payload.media_type = campaignForm.media_type || "";
        payload.link_url = campaignForm.link_url || "";
        payload.link_text = campaignForm.link_text || "";
      }

      await supabase.from("sms_campaigns").insert(payload);
      toast.success(sendNow ? "Campaign sent successfully!" : "Campaign saved!");
      setShowCampaignDialog(false);
      setCampaignForm({ ...defaultForm });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    }
    setSavingCampaign(false);
  };

  const handleDeleteCampaign = async (id: string) => {
    await supabase.from("sms_campaigns").delete().eq("id", id);
    toast.success("Campaign deleted");
    fetchAll();
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      toast.error("Name and content are required");
      return;
    }
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await supabase.from("sms_templates").update({
          name: templateForm.name.trim(),
          content: templateForm.content.trim(),
          category: templateForm.category,
          updated_at: new Date().toISOString(),
        }).eq("id", editingTemplate);
        toast.success("Template updated");
      } else {
        await supabase.from("sms_templates").insert({
          name: templateForm.name.trim(),
          content: templateForm.content.trim(),
          category: templateForm.category,
        });
        toast.success("Template created");
      }
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      setTemplateForm({ name: "", content: "", category: "general" });
      fetchAll();
    } catch {
      toast.error("Failed to save template");
    }
    setSavingTemplate(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from("sms_templates").delete().eq("id", id);
    toast.success("Template deleted");
    fetchAll();
  };

  const useTemplate = (template: any) => {
    setCampaignForm((prev) => ({ ...prev, message: template.content, name: prev.name || template.name }));
    setShowCampaignDialog(true);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const selectedMediaType = WHATSAPP_MEDIA_TYPES.find((m) => m.value === campaignForm.media_type);
    if (selectedMediaType && selectedMediaType.maxSize > 0 && file.size > selectedMediaType.maxSize) {
      toast.error(`File too large. Max size: ${(selectedMediaType.maxSize / (1024 * 1024)).toFixed(0)} MB`);
      return;
    }

    setUploadingMedia(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("campaign-media").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("campaign-media").getPublicUrl(path);
      setCampaignForm((p) => ({ ...p, media_url: publicUrl }));
      toast.success("Media uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploadingMedia(false);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const removeMedia = () => {
    setCampaignForm((p) => ({ ...p, media_url: "", media_type: "" }));
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      draft: { variant: "secondary", icon: FileText },
      scheduled: { variant: "outline", icon: Clock },
      sending: { variant: "default", icon: Loader2 },
      sent: { variant: "default", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle },
    };
    const s = map[status] || map.draft;
    const Icon = s.icon;
    return (
      <Badge variant={s.variant} className="gap-1 text-xs">
        <Icon className={`h-3 w-3 ${status === "sending" ? "animate-spin" : ""}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCampaigns = campaigns
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter((c) => channelFilter === "all" || c.channel === channelFilter)
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((a, c) => a + (c.failed_count || 0), 0);
  const whatsappCampaigns = campaigns.filter((c) => c.channel === "whatsapp" || c.channel === "both").length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Bulk Messaging
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage SMS & WhatsApp campaigns</p>
          </div>
          <Button onClick={() => setShowCampaignDialog(true)} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total Campaigns", value: campaigns.length, icon: MessageSquare, gradient: "from-blue-500 to-blue-600" },
            { label: "Messages Sent", value: totalSent, icon: Send, gradient: "from-emerald-500 to-emerald-600" },
            { label: "Failed", value: totalFailed, icon: AlertTriangle, gradient: "from-red-500 to-red-600" },
            { label: "WhatsApp Campaigns", value: whatsappCampaigns, icon: Phone, gradient: "from-green-500 to-green-600" },
            { label: "Total Users", value: userCount, icon: Users, gradient: "from-purple-500 to-purple-600" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-xl bg-gradient-to-br ${s.gradient} p-4 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-80">{s.label}</span>
                <s.icon className="h-4 w-4 opacity-80" />
              </div>
              <p className="text-xl font-bold">{s.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Templates
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="sms">SMS Only</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No campaigns found. Create your first campaign!</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Campaign</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Audience</TableHead>
                          <TableHead>Recipients</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.message}</p>
                              </div>
                            </TableCell>
                            <TableCell>{channelBadge(c.channel || "sms")}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">{c.audience_type}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{c.recipient_count}</TableCell>
                            <TableCell className="text-sm">
                              <span className="text-green-600">{c.sent_count || 0}</span>
                              {c.failed_count > 0 && <span className="text-destructive ml-1">/ {c.failed_count} failed</span>}
                            </TableCell>
                            <TableCell>{statusBadge(c.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(c.created_at), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPreviewCampaign(c); setPreviewDialog(true); }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {c.status === "draft" && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCampaign(c.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({ name: "", content: "", category: "general" });
                  setShowTemplateDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> New Template
              </Button>
            </div>

            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No templates yet. Create reusable message templates!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((t) => (
                  <Card key={t.id} className="group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">{t.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] mt-1 capitalize">{t.category}</Badge>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingTemplate(t.id);
                              setTemplateForm({ name: t.name, content: t.content, category: t.category });
                              setShowTemplateDialog(true);
                            }}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTemplate(t.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed border rounded-lg p-2.5 bg-muted/30 min-h-[60px]">
                        {t.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{t.content.length} chars</span>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => useTemplate(t)}>
                          <Send className="h-3 w-3 mr-1" /> Use in Campaign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Create Campaign
            </DialogTitle>
            <DialogDescription>Compose and send bulk messages via SMS, WhatsApp, or both</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Channel Selector */}
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <div className="grid grid-cols-3 gap-2">
                {CHANNEL_OPTIONS.map((ch) => {
                  const Icon = ch.icon;
                  const selected = campaignForm.channel === ch.value;
                  return (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => setCampaignForm((p) => ({ ...p, channel: ch.value }))}
                      className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        selected
                          ? `${ch.bg} border-current ring-2 ring-primary/20`
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${ch.color}`} />
                      {ch.label}
                      {selected && <CheckCircle className="absolute top-1 right-1 h-3 w-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g. March Promo Campaign"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Select
                value={campaignForm.audience_type}
                onValueChange={(v) => setCampaignForm((p) => ({ ...p, audience_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      <div>
                        <span>{a.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">— {a.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Estimated recipients: <strong>{getRecipientCount(campaignForm.audience_type)}</strong>
              </p>
            </div>

            {campaignForm.audience_type === "custom" && (
              <div className="space-y-1.5">
                <Label>Phone Numbers (one per line)</Label>
                <Textarea
                  placeholder={"+919876543210\n+919876543211\n+919876543212"}
                  value={campaignForm.custom_numbers}
                  onChange={(e) => setCampaignForm((p) => ({ ...p, custom_numbers: e.target.value }))}
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Message</Label>
                <span className={`text-xs ${campaignForm.message.length > maxChars ? "text-destructive" : "text-muted-foreground"}`}>
                  {campaignForm.message.length}/{maxChars}
                </span>
              </div>
              <Textarea
                placeholder={campaignForm.channel === "whatsapp" ? "Type your WhatsApp message here..." : "Type your message here..."}
                value={campaignForm.message}
                onChange={(e) => setCampaignForm((p) => ({ ...p, message: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() => setCampaignForm((prev) => ({ ...prev, message: prev.message + p.tag }))}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                    title={p.desc}
                  >
                    {p.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Media Attachments - only for whatsapp/both */}
            {(campaignForm.channel === "whatsapp" || campaignForm.channel === "both") && (
              <div className="space-y-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10 p-4">
                <p className="text-sm font-medium flex items-center gap-1.5 text-green-700 dark:text-green-400">
                  <Phone className="h-4 w-4" /> WhatsApp Media & Links
                </p>
                <p className="text-xs text-muted-foreground">Attach media or add a CTA button per WhatsApp message criteria</p>

                {/* Media Type Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Media Type</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {WHATSAPP_MEDIA_TYPES.map((mt) => {
                      const Icon = mt.icon;
                      const selected = campaignForm.media_type === mt.value;
                      return (
                        <button
                          key={mt.value}
                          type="button"
                          onClick={() => setCampaignForm((p) => ({ ...p, media_type: mt.value, media_url: mt.value !== p.media_type ? "" : p.media_url }))}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                            selected
                              ? "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "border-border bg-card hover:border-green-300"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {mt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Media Upload */}
                {campaignForm.media_type && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Upload {campaignForm.media_type.charAt(0).toUpperCase() + campaignForm.media_type.slice(1)}
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      {WHATSAPP_MEDIA_TYPES.find((m) => m.value === campaignForm.media_type)?.hint}
                    </p>

                    {campaignForm.media_url ? (
                      <div className="relative rounded-lg border border-border bg-card p-3">
                        {campaignForm.media_type === "image" && (
                          <img src={campaignForm.media_url} alt="Preview" className="max-h-40 rounded-md object-contain mx-auto" />
                        )}
                        {campaignForm.media_type === "video" && (
                          <video src={campaignForm.media_url} controls className="max-h-40 rounded-md mx-auto" />
                        )}
                        {campaignForm.media_type === "document" && (
                          <div className="flex items-center gap-2 text-sm">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{campaignForm.media_url.split("/").pop()}</span>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={removeMedia}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          ref={mediaInputRef}
                          type="file"
                          accept={WHATSAPP_MEDIA_TYPES.find((m) => m.value === campaignForm.media_type)?.accept || ""}
                          onChange={handleMediaUpload}
                          className="hidden"
                          id="wa-media-upload"
                        />
                        <label
                          htmlFor="wa-media-upload"
                          className={`flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                            uploadingMedia
                              ? "border-muted-foreground/30 bg-muted/50"
                              : "border-green-300 dark:border-green-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20"
                          }`}
                        >
                          {uploadingMedia ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <Upload className="h-6 w-6 text-green-600" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {uploadingMedia ? "Uploading..." : "Click to upload or drag & drop"}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <Separator className="bg-green-200 dark:bg-green-800" />

                {/* Link / CTA Button */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5" /> CTA Link Button (optional)
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Add a clickable button at the bottom of your WhatsApp message</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="e.g. Shop Now"
                        value={campaignForm.link_text}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, link_text: e.target.value.slice(0, 25) }))}
                        className="h-8 text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground">{campaignForm.link_text.length}/25</span>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">URL</Label>
                      <Input
                        placeholder="https://example.com"
                        value={campaignForm.link_url}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, link_url: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                {campaignForm.channel === "whatsapp" ? (
                  <><Phone className="h-3.5 w-3.5 text-green-600" /> WhatsApp Preview</>
                ) : campaignForm.channel === "both" ? (
                  <><Send className="h-3.5 w-3.5" /> Message Preview (SMS + WhatsApp)</>
                ) : (
                  <><Smartphone className="h-3.5 w-3.5" /> SMS Preview</>
                )}
              </p>
              {/* Media preview in message */}
              {campaignForm.media_url && (campaignForm.channel === "whatsapp" || campaignForm.channel === "both") && (
                <div className="mb-2 rounded-lg overflow-hidden border border-green-200 dark:border-green-800">
                  {campaignForm.media_type === "image" && (
                    <img src={campaignForm.media_url} alt="Media" className="w-full max-h-32 object-cover" />
                  )}
                  {campaignForm.media_type === "video" && (
                    <div className="bg-muted/50 p-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Video className="h-4 w-4" /> Video attached
                    </div>
                  )}
                  {campaignForm.media_type === "document" && (
                    <div className="bg-muted/50 p-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Paperclip className="h-4 w-4" /> Document attached
                    </div>
                  )}
                </div>
              )}
              <div className={`rounded-lg p-3 border text-sm leading-relaxed whitespace-pre-wrap min-h-[60px] ${
                campaignForm.channel === "whatsapp"
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : "bg-card border-border"
              }`}>
                {campaignForm.message || <span className="text-muted-foreground italic">Your message will appear here...</span>}
              </div>
              {/* Link button preview */}
              {campaignForm.link_text && campaignForm.link_url && (campaignForm.channel === "whatsapp" || campaignForm.channel === "both") && (
                <div className="mt-2 border border-green-200 dark:border-green-800 rounded-lg p-2.5 text-center">
                  <span className="text-xs font-medium text-blue-600 flex items-center justify-center gap-1">
                    <LinkIcon className="h-3 w-3" /> {campaignForm.link_text}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Schedule */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Schedule for later</p>
                <p className="text-xs text-muted-foreground">Send at a specific date & time</p>
              </div>
              <Switch
                checked={campaignForm.schedule}
                onCheckedChange={(v) => setCampaignForm((p) => ({ ...p, schedule: v }))}
              />
            </div>

            {campaignForm.schedule && (
              <div className="space-y-1.5">
                <Label>Scheduled Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={campaignForm.scheduled_at}
                  onChange={(e) => setCampaignForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => handleCreateCampaign(false)} disabled={savingCampaign}>
              {savingCampaign ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save as Draft
            </Button>
            <Button onClick={() => handleCreateCampaign(true)} disabled={savingCampaign} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              {savingCampaign ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>Save reusable message templates for SMS & WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g. Welcome Message"
                value={templateForm.name}
                onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={templateForm.category} onValueChange={(v) => setTemplateForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Content</Label>
                <span className="text-xs text-muted-foreground">{templateForm.content.length} chars</span>
              </div>
              <Textarea
                placeholder="Type template content..."
                value={templateForm.content}
                onChange={(e) => setTemplateForm((p) => ({ ...p, content: e.target.value }))}
                rows={4}
              />
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() => setTemplateForm((prev) => ({ ...prev, content: prev.content + p.tag }))}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {p.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
              {savingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingTemplate ? "Update" : "Save"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          {previewCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{previewCampaign.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Channel</p>
                  {channelBadge(previewCampaign.channel || "sms")}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  {statusBadge(previewCampaign.status)}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Audience</p>
                  <p className="capitalize">{previewCampaign.audience_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Recipients</p>
                  <p>{previewCampaign.recipient_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Sent / Failed</p>
                  <p>
                    <span className="text-green-600">{previewCampaign.sent_count || 0}</span>
                    {" / "}
                    <span className="text-destructive">{previewCampaign.failed_count || 0}</span>
                  </p>
                </div>
              </div>
              <Separator />
              {/* Media attachment in preview */}
              {previewCampaign.media_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Media Attachment</p>
                  <div className="rounded-lg border border-border p-2">
                    {previewCampaign.media_type === "image" && (
                      <img src={previewCampaign.media_url} alt="Campaign media" className="max-h-32 rounded object-contain mx-auto" />
                    )}
                    {previewCampaign.media_type === "video" && (
                      <video src={previewCampaign.media_url} controls className="max-h-32 rounded mx-auto" />
                    )}
                    {previewCampaign.media_type === "document" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        <a href={previewCampaign.media_url} target="_blank" rel="noopener noreferrer" className="underline truncate">
                          {previewCampaign.media_url.split("/").pop()}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Link button in preview */}
              {previewCampaign.link_text && previewCampaign.link_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CTA Button</p>
                  <div className="rounded-lg border border-border p-2.5 text-center">
                    <a href={previewCampaign.link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 flex items-center justify-center gap-1">
                      <LinkIcon className="h-3 w-3" /> {previewCampaign.link_text}
                    </a>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <div className={`rounded-lg p-3 border text-sm whitespace-pre-wrap ${
                  (previewCampaign.channel || "sms") === "whatsapp"
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : "bg-muted/30 border-border"
                }`}>
                  {previewCampaign.message}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {format(new Date(previewCampaign.created_at), "dd MMM yyyy, hh:mm a")}
                {previewCampaign.sent_at && (
                  <> · Sent: {format(new Date(previewCampaign.sent_at), "dd MMM yyyy, hh:mm a")}</>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBulkSms;
