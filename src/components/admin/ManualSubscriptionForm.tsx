import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Upload, CheckCircle, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online Payment" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "other", label: "Other" },
];

interface ManualSubscriptionFormProps {
  profile: any;
  onSubscriptionActivated: (updatedProfile: any) => void;
}

const ManualSubscriptionForm = ({ profile, onSubscriptionActivated }: ManualSubscriptionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadHistory = async () => {
    if (historyLoaded) return;
    const { data } = await supabase
      .from("manual_subscriptions")
      .select("*")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false });
    setHistory(data || []);
    setHistoryLoaded(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }
    setScreenshotFile(file);
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshotFile) return null;
    setUploading(true);
    const ext = screenshotFile.name.split(".").pop();
    const path = `subscriptions/${profile.user_id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, screenshotFile);
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleActivate = async () => {
    if (!user || !profile) return;
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    setSaving(true);

    let finalScreenshotUrl = screenshotUrl;
    if (screenshotFile) {
      const uploaded = await uploadScreenshot();
      if (uploaded) finalScreenshotUrl = uploaded;
    }

    // Insert manual subscription record
    const { error: insertError } = await supabase.from("manual_subscriptions").insert({
      user_id: profile.user_id,
      activated_by: user.id,
      payment_method: paymentMethod,
      amount: parsedAmount,
      screenshot_url: finalScreenshotUrl || null,
      notes: notes.trim() || null,
    });

    if (insertError) {
      toast({ title: "Error", description: "Failed to save subscription record.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Activate the user's subscription
    const updateData: any = {
      subscription_paid: true,
      subscription_date: new Date().toISOString(),
      membership_activated_at: new Date().toISOString(),
      membership_source: "paid",
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      toast({ title: "Error", description: "Failed to activate subscription.", variant: "destructive" });
      return;
    }

    const updatedProfile = { ...profile, ...updateData };
    onSubscriptionActivated(updatedProfile);
    setAmount("");
    setNotes("");
    setScreenshotFile(null);
    setScreenshotUrl("");
    setHistoryLoaded(false);
    toast({ title: "Subscription Activated", description: `${profile.full_name}'s subscription has been activated successfully.` });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Manual Subscription Activation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.subscription_paid && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">
                Subscription is already active
                {profile.membership_activated_at && ` (since ${format(new Date(profile.membership_activated_at), "dd MMM yyyy")})`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount Collected (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g. 2800"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Screenshot (Optional)</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {screenshotFile ? screenshotFile.name : "Choose file"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {screenshotFile && (
                <Button variant="ghost" size="sm" onClick={() => setScreenshotFile(null)}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Max 5MB. JPG, PNG accepted.</p>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any remarks about this subscription activation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          <Button
            onClick={handleActivate}
            disabled={saving || uploading}
            className="w-full gap-2"
          >
            {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {uploading ? "Uploading..." : saving ? "Activating..." : "Activate Subscription"}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={loadHistory}>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Subscription History</span>
            {!historyLoaded && (
              <Button variant="outline" size="sm" onClick={loadHistory}>Load History</Button>
            )}
          </CardTitle>
        </CardHeader>
        {historyLoaded && (
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No manual subscription records.</p>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {PAYMENT_METHODS.find(m => m.value === record.payment_method)?.label || record.payment_method}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">₹{record.amount}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(record.created_at), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground">{record.notes}</p>
                    )}
                    {record.screenshot_url && (
                      <a
                        href={record.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ImageIcon className="h-3 w-3" /> View Screenshot
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ManualSubscriptionForm;
