import { useState, useEffect } from "react";
import { Shield, Upload, Loader2, CheckCircle, XCircle, Clock, FileText, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface KycDoc {
  id: string;
  document_type: string;
  document_number: string;
  document_url: string;
  status: string;
  admin_note: string;
  created_at: string;
}

const DOC_TYPES = [
  { key: "aadhar", label: "Aadhar Card", icon: "🪪", numberLabel: "Aadhar Number", pattern: /^\d{12}$/, hint: "12-digit Aadhar number" },
  { key: "pan", label: "PAN Card", icon: "📄", numberLabel: "PAN Number", pattern: /^[A-Z]{5}\d{4}[A-Z]$/, hint: "Format: ABCDE1234F" },
];

const statusConfig: Record<string, { icon: any; label: string; class: string }> = {
  pending: { icon: Clock, label: "Pending Review", class: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  approved: { icon: CheckCircle, label: "Verified", class: "bg-success/15 text-success border-success/30" },
  rejected: { icon: XCircle, label: "Rejected", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

const KYC = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [numbers, setNumbers] = useState<Record<string, string>>({});

  const fetchDocs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("user_id", user.id);
    setDocs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [user]);

  const getDoc = (type: string) => docs.find((d) => d.document_type === type);

  const allVerified = DOC_TYPES.every((dt) => getDoc(dt.key)?.status === "approved");

  const handleUpload = async (docType: typeof DOC_TYPES[0]) => {
    const docNumber = (numbers[docType.key] || "").trim().toUpperCase();
    if (!docType.pattern.test(docNumber)) {
      toast.error(`Invalid ${docType.numberLabel}. ${docType.hint}`);
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,.pdf";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be under 5MB");
        return;
      }

      setUploading(docType.key);
      try {
        const ext = file.name.split(".").pop();
        const path = `${user!.id}/${docType.key}_${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("kyc-documents")
          .upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;

        const existing = getDoc(docType.key);
        if (existing) {
          const { error } = await supabase
            .from("kyc_documents")
            .update({
              document_number: docNumber,
              document_url: path,
              status: "pending",
              admin_note: "",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("kyc_documents")
            .insert({
              user_id: user!.id,
              document_type: docType.key,
              document_number: docNumber,
              document_url: path,
            });
          if (error) throw error;
        }

        toast.success(`${docType.label} uploaded successfully`);
        fetchDocs();
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      }
      setUploading(null);
    };
    fileInput.click();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> KYC Verification
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Upload your identity documents for verification</p>
          </div>
          {allVerified && (
            <Badge className="bg-success/15 text-success border-success/30 gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> KYC Verified
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {DOC_TYPES.map((docType) => {
              const doc = getDoc(docType.key);
              const status = doc ? statusConfig[doc.status] : null;
              const StatusIcon = status?.icon;

              return (
                <Card key={docType.key} className={doc?.status === "approved" ? "border-success/30" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-lg">{docType.icon}</span> {docType.label}
                      </CardTitle>
                      {status && (
                        <Badge variant="outline" className={`gap-1 text-[10px] ${status.class}`}>
                          {StatusIcon && <StatusIcon className="h-3 w-3" />} {status.label}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {doc?.status === "rejected" && doc.admin_note && (
                      <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                        <strong>Reason:</strong> {doc.admin_note}
                      </div>
                    )}

                    {doc?.status === "approved" ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                        <FileText className="h-5 w-5 text-success" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{docType.numberLabel}: {doc.document_number}</p>
                          <p className="text-xs text-muted-foreground">Verified successfully</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>{docType.numberLabel} *</Label>
                          <Input
                            placeholder={docType.hint}
                            value={numbers[docType.key] || doc?.document_number || ""}
                            onChange={(e) => setNumbers({ ...numbers, [docType.key]: e.target.value.toUpperCase() })}
                            maxLength={docType.key === "aadhar" ? 12 : 10}
                            disabled={doc?.status === "pending"}
                          />
                        </div>

                        {doc?.status === "pending" ? (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-600">
                            <Clock className="h-4 w-4" />
                            Document uploaded and awaiting admin review.
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => handleUpload(docType)}
                            disabled={uploading === docType.key}
                          >
                            {uploading === docType.key ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : doc?.status === "rejected" ? (
                              <RefreshCw className="h-4 w-4" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {doc?.status === "rejected" ? "Re-upload Document" : "Upload Document"}
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-2">📋 Guidelines</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Upload clear, readable images of your documents (JPG, PNG, or PDF)</li>
                  <li>File size should not exceed 5MB</li>
                  <li>Ensure all details on the document are visible</li>
                  <li>Verification typically takes 1-2 business days</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KYC;
