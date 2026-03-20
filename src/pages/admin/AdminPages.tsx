import { useState, useEffect } from "react";
import { FileText, Pencil, Loader2, Save, Plus, Trash2, Eye, EyeOff, Globe, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PageContent {
  id: string;
  page_slug: string;
  title: string;
  subtitle: string | null;
  content: any;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

// System page slugs that have their own custom editors
const SYSTEM_SLUGS = ["about", "contact", "pwa-settings", "captcha-settings", "payment-gateway-settings", "shipping-settings", "shipping-methods", "smtp-settings"];

const AdminPages = () => {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "General", sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  // Custom page form
  const [customPageDialogOpen, setCustomPageDialogOpen] = useState(false);
  const [customPageForm, setCustomPageForm] = useState({
    id: "",
    page_slug: "",
    title: "",
    subtitle: "",
    content_body: "",
    meta_title: "",
    meta_description: "",
    is_published: true,
  });
  const [isEditingCustomPage, setIsEditingCustomPage] = useState(false);

  // About page fields
  const [aboutForm, setAboutForm] = useState({ title: "", subtitle: "", mission: "", vision: "", values: "" as string });
  // Contact page fields
  const [contactForm, setContactForm] = useState({ title: "", subtitle: "", email: "", phone: "", address: "", working_hours: "" });

  const fetchData = async () => {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("pages_content").select("*").order("created_at", { ascending: false }),
      supabase.from("faqs").select("*").order("sort_order"),
    ]);
    setPages((p as unknown as PageContent[]) || []);
    setFaqs((f as unknown as FAQ[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Filter out system/settings pages for the custom pages list
  const systemPages = pages.filter((p) => SYSTEM_SLUGS.includes(p.page_slug));
  const customPages = pages.filter((p) => !SYSTEM_SLUGS.includes(p.page_slug));

  const openEditPage = (page: PageContent) => {
    setEditingPage(page);
    if (page.page_slug === "about") {
      const c = page.content || {};
      setAboutForm({
        title: page.title, subtitle: page.subtitle || "",
        mission: c.mission || "", vision: c.vision || "",
        values: (c.values || []).join(", "),
      });
    } else if (page.page_slug === "contact") {
      const c = page.content || {};
      setContactForm({
        title: page.title, subtitle: page.subtitle || "",
        email: c.email || "", phone: c.phone || "",
        address: c.address || "", working_hours: c.working_hours || "",
      });
    }
    setPageDialogOpen(true);
  };

  const savePage = async () => {
    if (!editingPage) return;
    setSaving(true);
    let payload: any = {};
    if (editingPage.page_slug === "about") {
      payload = {
        title: aboutForm.title, subtitle: aboutForm.subtitle,
        content: { mission: aboutForm.mission, vision: aboutForm.vision, values: aboutForm.values.split(",").map((v: string) => v.trim()).filter(Boolean) },
      };
    } else if (editingPage.page_slug === "contact") {
      payload = {
        title: contactForm.title, subtitle: contactForm.subtitle,
        content: { email: contactForm.email, phone: contactForm.phone, address: contactForm.address, working_hours: contactForm.working_hours },
      };
    }
    payload.updated_at = new Date().toISOString();
    const { error } = await supabase.from("pages_content").update(payload as any).eq("id", editingPage.id);
    if (error) toast.error("Failed to save"); else toast.success("Page updated!");
    setSaving(false);
    setPageDialogOpen(false);
    fetchData();
  };

  const togglePublish = async (page: PageContent) => {
    await supabase.from("pages_content").update({ is_published: !page.is_published } as any).eq("id", page.id);
    toast.success(page.is_published ? "Page unpublished" : "Page published");
    fetchData();
  };

  // Custom page CRUD
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  };

  const openAddCustomPage = () => {
    setIsEditingCustomPage(false);
    setCustomPageForm({
      id: "",
      page_slug: "",
      title: "",
      subtitle: "",
      content_body: "",
      meta_title: "",
      meta_description: "",
      is_published: true,
    });
    setCustomPageDialogOpen(true);
  };

  const openEditCustomPage = (page: PageContent) => {
    setIsEditingCustomPage(true);
    const body = typeof page.content === "object" && page.content?.body ? page.content.body : "";
    setCustomPageForm({
      id: page.id,
      page_slug: page.page_slug,
      title: page.title,
      subtitle: page.subtitle || "",
      content_body: body,
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      is_published: page.is_published,
    });
    setCustomPageDialogOpen(true);
  };

  const saveCustomPage = async () => {
    if (!customPageForm.title.trim()) {
      toast.error("Page name is required");
      return;
    }
    const slug = customPageForm.page_slug || generateSlug(customPageForm.title);
    if (!slug) {
      toast.error("Could not generate a valid slug");
      return;
    }

    // Check for duplicate slug (only for new pages)
    if (!isEditingCustomPage) {
      const existing = pages.find((p) => p.page_slug === slug);
      if (existing) {
        toast.error("A page with this slug already exists");
        return;
      }
    }

    setSaving(true);

    const payload: any = {
      title: customPageForm.title.trim(),
      subtitle: customPageForm.subtitle.trim() || null,
      page_slug: slug,
      content: { body: customPageForm.content_body },
      meta_title: customPageForm.meta_title.trim() || null,
      meta_description: customPageForm.meta_description.trim() || null,
      is_published: customPageForm.is_published,
      updated_at: new Date().toISOString(),
    };

    if (isEditingCustomPage && customPageForm.id) {
      const { error } = await supabase.from("pages_content").update(payload as any).eq("id", customPageForm.id);
      if (error) toast.error("Failed to save"); else toast.success("Page updated!");
    } else {
      const { error } = await supabase.from("pages_content").insert(payload as any);
      if (error) toast.error("Failed to create page"); else toast.success("Page created!");
    }

    setSaving(false);
    setCustomPageDialogOpen(false);
    fetchData();
  };

  const deleteCustomPage = async (page: PageContent) => {
    if (!confirm(`Delete page "${page.title}"? This action cannot be undone.`)) return;
    const { error } = await supabase.from("pages_content").delete().eq("id", page.id);
    if (error) toast.error("Failed to delete"); else toast.success("Page deleted");
    fetchData();
  };

  // FAQ CRUD
  const openAddFaq = () => { setEditingFaq(null); setFaqForm({ question: "", answer: "", category: "General", sort_order: faqs.length, is_active: true }); setFaqDialogOpen(true); };
  const openEditFaq = (f: FAQ) => { setEditingFaq(f); setFaqForm(f); setFaqDialogOpen(true); };

  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) { toast.error("Question and answer required"); return; }
    setSaving(true);
    if (editingFaq) {
      const { id, ...rest } = faqForm as any;
      const { error } = await supabase.from("faqs").update(rest).eq("id", editingFaq.id);
      if (error) toast.error("Failed"); else toast.success("FAQ updated!");
    } else {
      const { error } = await supabase.from("faqs").insert(faqForm as any);
      if (error) toast.error("Failed"); else toast.success("FAQ created!");
    }
    setSaving(false);
    setFaqDialogOpen(false);
    fetchData();
  };

  const deleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await supabase.from("faqs").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Page Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage website pages, content, and FAQs</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="pages">
            <TabsList className="mb-6">
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="faqs">FAQs ({faqs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pages">
              <div className="space-y-6">
                {/* System pages (About, Contact) */}
                {systemPages.filter((p) => ["about", "contact"].includes(p.page_slug)).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Pages</h3>
                    {systemPages
                      .filter((p) => ["about", "contact"].includes(p.page_slug))
                      .map((p) => (
                        <Card key={p.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{p.title}</p>
                                <p className="text-xs text-muted-foreground">/{p.page_slug}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={p.is_published ? "default" : "secondary"}>
                                {p.is_published ? "Published" : "Draft"}
                              </Badge>
                              <Button variant="ghost" size="icon" onClick={() => togglePublish(p)}>
                                {p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditPage(p)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}

                <Separator />

                {/* Custom pages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Custom Pages</h3>
                    <Button onClick={openAddCustomPage} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Add Page
                    </Button>
                  </div>

                  {customPages.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No custom pages yet. Create your first page!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    customPages.map((p) => (
                      <Card key={p.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Globe className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{p.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">/{p.page_slug}</p>
                                {p.meta_title && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">SEO</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={p.is_published ? "default" : "secondary"}>
                              {p.is_published ? "Published" : "Draft"}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => togglePublish(p)}>
                              {p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditCustomPage(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteCustomPage(p)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faqs">
              <div className="flex justify-end mb-4">
                <Button onClick={openAddFaq}><Plus className="h-4 w-4 mr-2" /> Add FAQ</Button>
              </div>
              <div className="space-y-3">
                {faqs.map((f) => (
                  <Card key={f.id} className={!f.is_active ? "opacity-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{f.question}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.answer}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-xs">{f.category}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => openEditFaq(f)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteFaq(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Edit System Page Dialog (About / Contact) */}
        <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit {editingPage?.page_slug === "about" ? "About" : "Contact"} Page</DialogTitle></DialogHeader>
            {editingPage?.page_slug === "about" && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Page Title</Label><Input value={aboutForm.title} onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Subtitle</Label><Input value={aboutForm.subtitle} onChange={(e) => setAboutForm({ ...aboutForm, subtitle: e.target.value })} /></div>
                <div className="space-y-2"><Label>Mission</Label><Textarea value={aboutForm.mission} onChange={(e) => setAboutForm({ ...aboutForm, mission: e.target.value })} rows={3} /></div>
                <div className="space-y-2"><Label>Vision</Label><Textarea value={aboutForm.vision} onChange={(e) => setAboutForm({ ...aboutForm, vision: e.target.value })} rows={3} /></div>
                <div className="space-y-2"><Label>Values (comma-separated)</Label><Input value={aboutForm.values} onChange={(e) => setAboutForm({ ...aboutForm, values: e.target.value })} placeholder="Transparency, Quality, Trust" /></div>
              </div>
            )}
            {editingPage?.page_slug === "contact" && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Page Title</Label><Input value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Subtitle</Label><Input value={contactForm.subtitle} onChange={(e) => setContactForm({ ...contactForm, subtitle: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Address</Label><Textarea value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} rows={2} /></div>
                <div className="space-y-2"><Label>Working Hours</Label><Input value={contactForm.working_hours} onChange={(e) => setContactForm({ ...contactForm, working_hours: e.target.value })} /></div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setPageDialogOpen(false)}>Cancel</Button>
              <Button onClick={savePage} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom Page Create/Edit Dialog */}
        <Dialog open={customPageDialogOpen} onOpenChange={setCustomPageDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditingCustomPage ? "Edit Page" : "Create New Page"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {/* Page Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Page Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={customPageForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setCustomPageForm((prev) => ({
                      ...prev,
                      title,
                      page_slug: isEditingCustomPage ? prev.page_slug : generateSlug(title),
                    }));
                  }}
                  placeholder="e.g. Terms & Conditions"
                  maxLength={100}
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/</span>
                  <Input
                    value={customPageForm.page_slug}
                    onChange={(e) => setCustomPageForm((prev) => ({ ...prev, page_slug: generateSlug(e.target.value) }))}
                    placeholder="terms-and-conditions"
                    className="font-mono text-sm"
                    disabled={isEditingCustomPage}
                    maxLength={60}
                  />
                </div>
              </div>

              <Separator />

              {/* Page Content Editor */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Page Content</Label>
                <RichTextEditor
                  value={customPageForm.content_body}
                  onChange={(val) => setCustomPageForm((prev) => ({ ...prev, content_body: val }))}
                  placeholder="Write your page content here..."
                />
              </div>

              <Separator />

              {/* SEO Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-foreground">SEO Settings</h4>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">SEO Title</Label>
                  <Input
                    value={customPageForm.meta_title}
                    onChange={(e) => setCustomPageForm((prev) => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="Page title for search engines"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {customPageForm.meta_title.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">SEO Description</Label>
                  <Textarea
                    value={customPageForm.meta_description}
                    onChange={(e) => setCustomPageForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="Brief description for search engine results"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {customPageForm.meta_description.length}/160 characters
                  </p>
                </div>

                {/* SEO Preview */}
                {(customPageForm.meta_title || customPageForm.title) && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Search Preview</p>
                    <p className="text-sm text-primary font-medium truncate">
                      {customPageForm.meta_title || customPageForm.title}
                    </p>
                    <p className="text-xs text-success truncate">
                      yoursite.com/{customPageForm.page_slug || "page-url"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {customPageForm.meta_description || "No description provided"}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Publish / Draft */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {customPageForm.is_published ? "Page will be visible to visitors" : "Page is saved as draft"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={customPageForm.is_published ? "default" : "secondary"}>
                    {customPageForm.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Switch
                    checked={customPageForm.is_published}
                    onCheckedChange={(v) => setCustomPageForm((prev) => ({ ...prev, is_published: v }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setCustomPageDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveCustomPage} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isEditingCustomPage ? "Update Page" : "Create Page"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* FAQ Dialog */}
        <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Question</Label><Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} /></div>
              <div className="space-y-2"><Label>Answer</Label><Textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} rows={4} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category</Label><Input value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} /></div>
                <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={faqForm.sort_order} onChange={(e) => setFaqForm({ ...faqForm, sort_order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={faqForm.is_active} onCheckedChange={(v) => setFaqForm({ ...faqForm, is_active: v })} /><Label>Active</Label></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFaqDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveFaq} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{editingFaq ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPages;