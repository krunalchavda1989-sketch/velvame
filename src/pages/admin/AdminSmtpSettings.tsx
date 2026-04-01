import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Save, TestTube, RefreshCw } from "lucide-react";

const AdminSmtpSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    from_email: "",
    from_name: "",
    use_tls: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("pages_content")
      .select("content")
      .eq("page_slug", "smtp-settings")
      .maybeSingle();

    if (data?.content) {
      const c = data.content as any;
      setForm({
        smtp_host: c.smtp_host || "",
        smtp_port: c.smtp_port || "587",
        smtp_user: c.smtp_user || "",
        smtp_password: c.smtp_password ? "••••••••" : "",
        from_email: c.from_email || "",
        from_name: c.from_name || "",
        use_tls: c.use_tls !== false,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const payload: any = {
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port,
        smtp_user: form.smtp_user,
        from_email: form.from_email,
        from_name: form.from_name,
        use_tls: form.use_tls,
      };
      // Password is now stored as a backend secret (SMTP_PASSWORD)
      // Do not persist it in the database

      const { data: existing } = await supabase
        .from("pages_content")
        .select("id")
        .eq("page_slug", "smtp-settings")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("pages_content")
          .update({ content: payload, title: "SMTP Settings", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("pages_content").insert({
          page_slug: "smtp-settings",
          title: "SMTP Settings",
          content: payload,
          is_published: false,
        });
      }

      toast.success("SMTP settings saved successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("smtp-test", {
        body: { to_email: form.from_email },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.success) {
        toast.success("Test email sent successfully!");
      } else {
        toast.error(res.data?.error || "Test failed");
      }
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">SMTP Settings</h1>
            <p className="text-sm text-muted-foreground">Configure email server for sending transactional emails</p>
          </div>
        </div>

        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">SMTP Host</Label>
              <Input
                value={form.smtp_host}
                onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-foreground">SMTP Port</Label>
              <Input
                value={form.smtp_port}
                onChange={(e) => setForm({ ...form, smtp_port: e.target.value })}
                placeholder="587"
                className="mt-1 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Username</Label>
              <Input
                value={form.smtp_user}
                onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
                placeholder="your@email.com"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-foreground">Password</Label>
              <div className="mt-1 px-3 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground">
                Managed securely as a backend secret
              </div>
              <p className="text-xs text-muted-foreground mt-1">SMTP password is stored securely and cannot be viewed here.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">From Email</Label>
              <Input
                value={form.from_email}
                onChange={(e) => setForm({ ...form, from_email: e.target.value })}
                placeholder="noreply@yoursite.com"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-foreground">From Name</Label>
              <Input
                value={form.from_name}
                onChange={(e) => setForm({ ...form, from_name: e.target.value })}
                placeholder="Velvame"
                className="mt-1 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={form.use_tls}
              onCheckedChange={(checked) => setForm({ ...form, use_tls: checked })}
            />
            <Label className="text-foreground">Use TLS/STARTTLS</Label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
              Send Test Email
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSmtpSettings;
