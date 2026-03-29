import { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle, XCircle, Clock, FileText, RefreshCw, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  {
    key: "aadhar",
    label: "Aadhar Card",
    icon: "🪪",
    numberLabel: "Aadhar Number",
    pattern: /^\d{12}$/,
    hint: "12-digit Aadhar number",
    inputType: "numeric",
    sides: [
      { sideKey: "aadhar_front", sideLabel: "Front Side" },
      { sideKey: "aadhar_back", sideLabel: "Back Side" },
    ],
  },
  {
    key: "pan",
    label: "PAN Card",
    icon: "📄",
    numberLabel: "PAN Number",
    pattern: /^[A-Z]{5}\d{4}[A-Z]$/,
    hint: "Format: ABCDE1234F (5 letters, 4 digits, 1 letter)",
    inputType: "text",
    sides: [{ sideKey: "pan", sideLabel: "Document" }],
  },
];

const statusConfig: Record<string, { icon: any; label: string; class: string }> = {
  pending: { icon: Clock, label: "Pending Review", class: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  approved: { icon: CheckCircle, label: "Verified", class: "bg-success/15 text-success border-success/30" },
  rejected: { icon: XCircle, label: "Rejected", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

const MAX_FILE_SIZE = 300 * 1024; // 300KB

async function compressImage(file: File, maxSizeKB: number = 300): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        
        // Scale down if very large
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob && (blob.size <= maxSizeKB * 1024 || quality <= 0.2)) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            "image/jpeg",
            quality
          );
        };
        tryCompress();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const KYCSection = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const fetchDocs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("user_id", user.id);
    setDocs((data as any) || []);
    setLoading(false);

    // Generate signed URLs for previews
    if (data) {
      for (const doc of data as any[]) {
        if (doc.document_url) {
          const { data: urlData } = await supabase.storage
            .from("kyc-documents")
            .createSignedUrl(doc.document_url, 3600);
          if (urlData?.signedUrl) {
            setPreviews((prev) => ({ ...prev, [doc.document_type]: urlData.signedUrl }));
          }
        }
      }
    }
  };

  useEffect(() => { fetchDocs(); }, [user]);

  const getDoc = (type: string) => docs.find((d) => d.document_type === type);

  const getOverallStatus = (docType: typeof DOC_TYPES[0]) => {
    if (docType.sides.length === 1) {
      return getDoc(docType.sides[0].sideKey)?.status;
    }
    const statuses = docType.sides.map((s) => getDoc(s.sideKey)?.status);
    if (statuses.every((s) => s === "approved")) return "approved";
    if (statuses.some((s) => s === "rejected")) return "rejected";
    if (statuses.some((s) => s === "pending")) return "pending";
    return undefined;
  };

  const allVerified = DOC_TYPES.every((dt) => getOverallStatus(dt) === "approved");

  const handleAadharInput = (value: string) => {
    // Only allow digits
    const numeric = value.replace(/\D/g, "").slice(0, 12);
    setNumbers({ ...numbers, aadhar: numeric });
  };

  const handlePanInput = (value: string) => {
    // Auto-uppercase, max 10 chars
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setNumbers({ ...numbers, pan: cleaned });
  };

  const handleUpload = async (sideKey: string, docType: typeof DOC_TYPES[0]) => {
    const docNumber = (numbers[docType.key] || "").trim().toUpperCase();
    if (!docType.pattern.test(docNumber)) {
      toast.error(`Invalid ${docType.numberLabel}. ${docType.hint}`);
      return;
    }

    // Additional PAN validation
    if (docType.key === "pan") {
      const panRegex = /^[A-Z]{3}[PCHABGJLFT][A-Z]\d{4}[A-Z]$/;
      if (!panRegex.test(docNumber)) {
        toast.error("Invalid PAN format. 4th character must be P, C, H, A, B, G, J, L, F, or T.");
        return;
      }
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/jpg,image/webp";
    fileInput.onchange = async (e: any) => {
      let file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Only image files (JPG, PNG, WebP) are allowed.");
        return;
      }

      // Check original size
      if (file.size > MAX_FILE_SIZE) {
        toast.info("Compressing image...");
        file = await compressImage(file, 300);
        if (file.size > MAX_FILE_SIZE) {
          toast.error("Image is too large even after compression. Please use a smaller image (max 300KB).");
          return;
        }
      }

      setUploading(sideKey);
      try {
        const ext = "jpg";
        const path = `${user!.id}/${sideKey}_${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("kyc-documents")
          .upload(path, file, { upsert: true, contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;

        const existing = getDoc(sideKey);
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
              document_type: sideKey,
              document_number: docNumber,
              document_url: path,
            });
          if (error) throw error;
        }

        toast.success("Uploaded successfully");
        fetchDocs();
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      }
      setUploading(null);
    };
    fileInput.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> KYC Verification
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Upload your identity documents for verification</p>
        </div>
        {allVerified && (
          <Badge className="bg-success/15 text-success border-success/30 gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> KYC Verified
          </Badge>
        )}
      </div>

      {!allVerified && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700">
          ⚠️ KYC verification is mandatory. Please upload all required documents to continue using the platform.
        </div>
      )}

      {DOC_TYPES.map((docType) => {
        const overallStatus = getOverallStatus(docType);
        const statusInfo = overallStatus ? statusConfig[overallStatus] : null;
        const StatusIcon = statusInfo?.icon;
        const existingNumber = docType.sides.map((s) => getDoc(s.sideKey)?.document_number).find(Boolean);

        return (
          <Card key={docType.key} className={overallStatus === "approved" ? "border-success/30" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-lg">{docType.icon}</span> {docType.label}
                </CardTitle>
                {statusInfo && (
                  <Badge variant="outline" className={`gap-1 text-[10px] ${statusInfo.class}`}>
                    {StatusIcon && <StatusIcon className="h-3 w-3" />} {statusInfo.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Rejection notes */}
              {docType.sides.map((side) => {
                const sideDoc = getDoc(side.sideKey);
                if (sideDoc?.status === "rejected" && sideDoc.admin_note) {
                  return (
                    <div key={side.sideKey} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                      <strong>{side.sideLabel} rejected:</strong> {sideDoc.admin_note}
                    </div>
                  );
                }
                return null;
              })}

              {overallStatus === "approved" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                    <FileText className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{docType.numberLabel}: {existingNumber}</p>
                      <p className="text-xs text-muted-foreground">Verified successfully</p>
                    </div>
                  </div>
                  {/* Preview approved documents */}
                  <div className={`grid gap-3 ${docType.sides.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {docType.sides.map((side) => {
                      const previewUrl = previews[side.sideKey];
                      if (!previewUrl) return null;
                      return (
                        <Dialog key={side.sideKey}>
                          <DialogTrigger asChild>
                            <div className="cursor-pointer rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors">
                              <img src={previewUrl} alt={side.sideLabel} className="w-full h-32 object-cover" />
                              <p className="text-xs text-center py-1.5 text-muted-foreground">{side.sideLabel}</p>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <img src={previewUrl} alt={side.sideLabel} className="w-full rounded-lg" />
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>{docType.numberLabel} *</Label>
                    <Input
                      placeholder={docType.hint}
                      value={numbers[docType.key] || existingNumber || ""}
                      onChange={(e) => {
                        if (docType.key === "aadhar") {
                          handleAadharInput(e.target.value);
                        } else {
                          handlePanInput(e.target.value);
                        }
                      }}
                      maxLength={docType.key === "aadhar" ? 12 : 10}
                      disabled={overallStatus === "pending"}
                      inputMode={docType.key === "aadhar" ? "numeric" : "text"}
                      pattern={docType.key === "aadhar" ? "[0-9]*" : undefined}
                    />
                  </div>

                  {/* Upload buttons and previews for each side */}
                  <div className={`grid gap-3 ${docType.sides.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {docType.sides.map((side) => {
                      const sideDoc = getDoc(side.sideKey);
                      const sideStatus = sideDoc?.status;
                      const previewUrl = previews[side.sideKey];

                      if (sideStatus === "approved") {
                        return (
                          <div key={side.sideKey} className="space-y-2">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/20 text-sm text-success">
                              <CheckCircle className="h-4 w-4" />
                              {side.sideLabel} verified
                            </div>
                            {previewUrl && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <img src={previewUrl} alt={side.sideLabel} className="w-full h-28 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity" />
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <img src={previewUrl} alt={side.sideLabel} className="w-full rounded-lg" />
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        );
                      }

                      if (sideStatus === "pending") {
                        return (
                          <div key={side.sideKey} className="space-y-2">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-600">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{side.sideLabel} awaiting review</span>
                            </div>
                            {previewUrl && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <img src={previewUrl} alt={side.sideLabel} className="w-full h-28 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity" />
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <img src={previewUrl} alt={side.sideLabel} className="w-full rounded-lg" />
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Button
                          key={side.sideKey}
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => handleUpload(side.sideKey, docType)}
                          disabled={uploading === side.sideKey}
                        >
                          {uploading === side.sideKey ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : sideStatus === "rejected" ? (
                            <RefreshCw className="h-4 w-4" />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                          {sideStatus === "rejected" ? `Re-upload ${side.sideLabel}` : `Upload ${side.sideLabel}`}
                        </Button>
                      );
                    })}
                  </div>
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
            <li>Upload clear, readable images of your documents (JPG, PNG only)</li>
            <li>For Aadhar Card, upload both front and back sides</li>
            <li>Maximum file size: 300KB per image (auto-compressed if larger)</li>
            <li>Ensure all details on the document are visible</li>
            <li>PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)</li>
            <li>Verification typically takes 1-2 business days</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCSection;
