import { useState, useEffect } from "react";
import {
  MessageSquare, Plus, Send, Clock, Users, FileText, Trash2,
  Loader2, Search, Filter, Eye, CheckCircle,
  XCircle, AlertTriangle, Save, Smartphone
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

const AdminBulkSms = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Campaign form
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    message: "",
    audience_type: "all",
    custom_numbers: "",
    schedule: false,
    scheduled_at: "",
  });
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Template form
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", content: "", category: "general" });
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Preview
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);

  // Stats
  const [userCount, setUserCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [campaignRes, templateRes, profileRes] = await Promise.all([
      supabase.from("sms_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("sms_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, subscription_paid"),
    ]);
    if (campaignRes.data) setCampaigns(campaignRes.data);
    if (templateRes.data) setTemplates(templateRes.data);
    if (profileRes.data) {
      setUserCount(profileRes.data.length);
      setActiveCount(profileRes.data.filter((p) => p.subscription_paid).length);
    }
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

  const handleCreateCampaign = async (sendNow: boolean) => {
    if (!campaignForm.name.trim()) { toast.error("Campaign name is required"); return; }
    if (!campaignForm.message.trim()) { toast.error("Message content is required"); return; }
    if (campaignForm.message.length > 160) { toast.error("SMS message should be within 160 characters"); return; }

    setSavingCampaign(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        name: campaignForm.name.trim(),
        message: campaignForm.message.trim(),
        audience_type: campaignForm.audience_type,
        recipient_count: recipientCount,
        created_by: user.id,
        status: sendNow ? "sending" : campaignForm.schedule ? "scheduled" : "draft",
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
      if (sendNow) {
        payload.status = "sent";
      }

      await supabase.from("sms_campaigns").insert(payload);
      toast.success(sendNow ? "Campaign sent successfully!" : "Campaign saved!");
      setShowCampaignDialog(false);
      setCampaignForm({ name: "", message: "", audience_type: "all", custom_numbers: "", schedule: false, scheduled_at: "" });
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
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((a, c) => a + (c.failed_count || 0), 0);

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
              Bulk SMS Marketing
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage SMS campaigns for your users</p>
          </div>
          <Button onClick={() => setShowCampaignDialog(true)} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Campaigns", value: campaigns.length, icon: MessageSquare, color: "text-primary" },
            { label: "Messages Sent", value: totalSent, icon: Send, color: "text-green-500" },
            { label: "Failed", value: totalFailed, icon: AlertTriangle, color: "text-destructive" },
            { label: "Total Users", value: userCount, icon: Users, color: "text-blue-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => { setPreviewCampaign(c); setPreviewDialog(true); }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {c.status === "draft" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteCampaign(c.id)}
                                  >
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
                  <p className="text-muted-foreground">No templates yet. Create reusable SMS templates!</p>
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
                        <span className="text-[10px] text-muted-foreground">{t.content.length}/160 chars</span>
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
              Create SMS Campaign
            </DialogTitle>
            <DialogDescription>Compose and send bulk SMS to your users</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                <span className={`text-xs ${campaignForm.message.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                  {campaignForm.message.length}/160
                </span>
              </div>
              <Textarea
                placeholder="Type your SMS message here..."
                value={campaignForm.message}
                onChange={(e) => setCampaignForm((p) => ({ ...p, message: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              {/* Placeholder tags */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() =>
                      setCampaignForm((prev) => ({
                        ...prev,
                        message: prev.message + p.tag,
                      }))
                    }
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                    title={p.desc}
                  >
                    {p.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone preview */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Message Preview
              </p>
              <div className="bg-card rounded-lg p-3 border border-border text-sm leading-relaxed whitespace-pre-wrap min-h-[60px]">
                {campaignForm.message || <span className="text-muted-foreground italic">Your message will appear here...</span>}
              </div>
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
            <DialogDescription>Save reusable SMS message templates</DialogDescription>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <span className={`text-xs ${templateForm.content.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                  {templateForm.content.length}/160
                </span>
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
                  <p className="text-muted-foreground text-xs">Sent</p>
                  <p className="text-green-600">{previewCampaign.sent_count || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Failed</p>
                  <p className="text-destructive">{previewCampaign.failed_count || 0}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <div className="bg-muted/30 rounded-lg p-3 border border-border text-sm whitespace-pre-wrap">
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
