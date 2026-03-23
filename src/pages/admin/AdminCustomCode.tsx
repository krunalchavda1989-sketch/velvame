import { useState, useEffect, useCallback } from "react";
import { Code, Save, RotateCcw, Copy, Eye, EyeOff, History, AlertTriangle, Loader2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TABS = [
  { key: "css", label: "Custom CSS", icon: Code },
  { key: "js", label: "Custom JavaScript", icon: Code },
  { key: "history", label: "Version History", icon: History },
];

const AdminCustomCode = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("css");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [customCss, setCustomCss] = useState("");
  const [customJs, setCustomJs] = useState("");
  const [jsPosition, setJsPosition] = useState("body");
  const [cssEnabled, setCssEnabled] = useState(false);
  const [jsEnabled, setJsEnabled] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [confirmReset, setConfirmReset] = useState<"css" | "js" | null>(null);
  const [previewCss, setPreviewCss] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("custom_code_settings" as any)
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      const d = data as any;
      setSettingsId(d.id);
      setCustomCss(d.custom_css || "");
      setCustomJs(d.custom_js || "");
      setJsPosition(d.js_injection_position || "body");
      setCssEnabled(d.css_enabled || false);
      setJsEnabled(d.js_enabled || false);
    }
    setLoading(false);
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from("custom_code_history" as any)
      .select("*")
      .order("saved_at", { ascending: false })
      .limit(20);
    setHistory((data as any[]) || []);
    setHistoryLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if (activeTab === "history") fetchHistory(); }, [activeTab, fetchHistory]);

  const saveCss = async () => {
    if (!settingsId) return;
    setSaving(true);
    // Save history
    await supabase.from("custom_code_history" as any).insert({ type: "css", content: customCss, saved_by: user?.id } as any);
    // Trim history to last 10
    const { data: allH } = await supabase.from("custom_code_history" as any).select("id, saved_at").eq("type", "css").order("saved_at", { ascending: false });
    if (allH && allH.length > 10) {
      const idsToDelete = (allH as any[]).slice(10).map((h: any) => h.id);
      await supabase.from("custom_code_history" as any).delete().in("id", idsToDelete);
    }
    const { error } = await supabase.from("custom_code_settings" as any).update({ custom_css: customCss, css_enabled: cssEnabled, updated_at: new Date().toISOString() } as any).eq("id", settingsId);
    setSaving(false);
    if (error) { toast.error("Failed to save CSS"); return; }
    toast.success("Custom CSS saved successfully");
  };

  const saveJs = async () => {
    if (!settingsId) return;
    setSaving(true);
    await supabase.from("custom_code_history" as any).insert({ type: "js", content: customJs, saved_by: user?.id } as any);
    const { data: allH } = await supabase.from("custom_code_history" as any).select("id, saved_at").eq("type", "js").order("saved_at", { ascending: false });
    if (allH && allH.length > 10) {
      const idsToDelete = (allH as any[]).slice(10).map((h: any) => h.id);
      await supabase.from("custom_code_history" as any).delete().in("id", idsToDelete);
    }
    const { error } = await supabase.from("custom_code_settings" as any).update({ custom_js: customJs, js_enabled: jsEnabled, js_injection_position: jsPosition, updated_at: new Date().toISOString() } as any).eq("id", settingsId);
    setSaving(false);
    if (error) { toast.error("Failed to save JS"); return; }
    toast.success("Custom JavaScript saved successfully");
  };

  const handleReset = async (type: "css" | "js") => {
    if (type === "css") setCustomCss("");
    else setCustomJs("");
    setConfirmReset(null);
    toast.success(`Custom ${type.toUpperCase()} cleared`);
  };

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${type} copied to clipboard`);
  };

  const restoreVersion = (item: any) => {
    if (item.type === "css") {
      setCustomCss(item.content);
      setActiveTab("css");
      toast.success("CSS version restored — click Save to apply");
    } else {
      setCustomJs(item.content);
      setActiveTab("js");
      toast.success("JS version restored — click Save to apply");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">Custom Code</h2>
      </div>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </>
  );

  return (
    <AdminLayout>
      <div className="flex min-h-[calc(100vh-64px)] relative">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border p-4 space-y-1 pt-16 transition-transform duration-200 lg:static lg:z-auto lg:w-56 lg:pt-4 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground lg:hidden">
            <X className="h-5 w-5" />
          </button>
          <SidebarContent />
        </aside>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-secondary lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <Code className="h-6 w-6 text-primary" />
                {TABS.find(t => t.key === activeTab)?.label || "Custom Code"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Add custom CSS and JavaScript that applies globally across all frontend pages
              </p>
            </div>
          </div>

          {activeTab === "css" && (
            <div className="space-y-4">
              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  Custom CSS applies globally to all frontend pages. Incorrect CSS may affect website layout. Please test carefully.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">CSS Editor</CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch checked={cssEnabled} onCheckedChange={setCssEnabled} id="css-toggle" />
                        <Label htmlFor="css-toggle" className="text-sm">{cssEnabled ? "Enabled" : "Disabled"}</Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(customCss, "CSS")} disabled={!customCss}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPreviewCss(!previewCss)}>
                        {previewCss ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                        {previewCss ? "Hide Preview" : "Preview"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmReset("css")} disabled={!customCss}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                      </Button>
                      <Button size="sm" onClick={saveCss} disabled={saving}>
                        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        Save CSS
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
                      <span className="text-xs text-muted-foreground font-mono">style.css</span>
                      <Badge variant="outline" className="text-xs">{customCss.split("\n").length} lines</Badge>
                    </div>
                    <textarea
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                      placeholder="/* Add your custom CSS here. Changes will apply globally across all frontend pages. */"
                      className="w-full min-h-[400px] p-4 font-mono text-sm bg-transparent resize-y outline-none text-foreground placeholder:text-muted-foreground/50"
                      spellCheck={false}
                    />
                  </div>
                  {previewCss && customCss && (
                    <div className="rounded-lg border border-border p-4 bg-muted/20">
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">CSS Preview (formatted)</h4>
                      <pre className="text-xs font-mono whitespace-pre-wrap text-foreground overflow-auto max-h-60">{customCss}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "js" && (
            <div className="space-y-4">
              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  Custom JavaScript runs on all frontend pages. Malformed JS can break website functionality. Please test carefully before saving.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">JavaScript Editor</CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch checked={jsEnabled} onCheckedChange={setJsEnabled} id="js-toggle" />
                        <Label htmlFor="js-toggle" className="text-sm">{jsEnabled ? "Enabled" : "Disabled"}</Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(customJs, "JavaScript")} disabled={!customJs}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmReset("js")} disabled={!customJs}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                      </Button>
                      <Button size="sm" onClick={saveJs} disabled={saving}>
                        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        Save JS
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm whitespace-nowrap">Injection Position:</Label>
                    <Select value={jsPosition} onValueChange={setJsPosition}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="head">Before &lt;/head&gt;</SelectItem>
                        <SelectItem value="body">Before &lt;/body&gt; (recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
                      <span className="text-xs text-muted-foreground font-mono">script.js</span>
                      <Badge variant="outline" className="text-xs">{customJs.split("\n").length} lines</Badge>
                    </div>
                    <textarea
                      value={customJs}
                      onChange={(e) => setCustomJs(e.target.value)}
                      placeholder="// Add your custom JavaScript here. Code will execute on all frontend pages."
                      className="w-full min-h-[400px] p-4 font-mono text-sm bg-transparent resize-y outline-none text-foreground placeholder:text-muted-foreground/50"
                      spellCheck={false}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "history" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Version History</CardTitle>
                <CardDescription>Last 10 saved versions of Custom CSS and JavaScript. Click Restore to load a previous version.</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No version history yet. Save CSS or JS to create your first version.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={item.type === "css" ? "default" : "secondary"} className="text-xs uppercase">{item.type}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(item.saved_at).toLocaleString()}</span>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground truncate">{item.content?.substring(0, 100) || "(empty)"}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => restoreVersion(item)}>Restore</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={!!confirmReset} onOpenChange={() => setConfirmReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Custom {confirmReset?.toUpperCase()}?</DialogTitle>
            <DialogDescription>This will clear all custom {confirmReset?.toUpperCase()} content from the editor. You'll still need to click Save to persist the change.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmReset && handleReset(confirmReset)}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCustomCode;
