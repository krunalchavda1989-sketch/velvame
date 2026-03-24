import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, UserPlus, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminDefaultPlacement = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [placeholderName, setPlaceholderName] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("default_placement_settings")
      .select("*")
      .limit(1)
      .single();
    if (data) {
      setCode(data.default_referral_code);
      lookupName(data.default_referral_code);
    }
    setLoading(false);
  };

  const lookupName = async (refCode: string) => {
    if (!refCode) { setPlaceholderName(""); return; }
    const { data } = await supabase
      .from("profiles")
      .select("full_name, referral_code")
      .eq("referral_code", refCode)
      .single();
    setPlaceholderName(data ? data.full_name : "");
  };

  const handleSave = async () => {
    if (!code.trim()) {
      toast.error("Referral code cannot be empty");
      return;
    }
    setValidating(true);
    const { data: isValid } = await supabase.rpc("validate_referral_code", { _code: code.trim() });
    setValidating(false);
    if (!isValid) {
      toast.error("Invalid referral code. No user found with this code.");
      return;
    }

    setSaving(true);
    const { data: existing } = await supabase
      .from("default_placement_settings")
      .select("id")
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from("default_placement_settings")
        .update({ default_referral_code: code.trim(), updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    toast.success("Default placement referral code updated!");
    lookupName(code.trim());
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Default Placement Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Default Referral Placement
            </CardTitle>
            <CardDescription>
              When a user registers without a referral code, they will be automatically placed under this referral code in the network tree.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Changing this will only affect <strong>new registrations</strong>. Existing users will not be moved.
              </AlertDescription>
            </Alert>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="defaultCode">Default Referral Code</Label>
                  <Input
                    id="defaultCode"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VM501"
                    className="mt-1 max-w-xs"
                  />
                  {placeholderName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Current placement: <span className="font-medium text-foreground">{placeholderName}</span>
                    </p>
                  )}
                </div>

                <Button onClick={handleSave} disabled={saving || validating}>
                  {saving || validating ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {validating ? "Validating..." : "Saving..."}</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDefaultPlacement;
