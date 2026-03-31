import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Star, Check, X, Trash2, Eye, Upload, Download, Loader2, Search, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailReview, setDetailReview] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase
      .from("product_reviews")
      .select("*, products:product_id(name, image_url)")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterRating !== "all") query = query.eq("rating", Number(filterRating));

    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [filterStatus, filterRating]);

  const filteredReviews = reviews.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.reviewer_name?.toLowerCase().includes(s) || r.review_body?.toLowerCase().includes(s) || (r.products as any)?.name?.toLowerCase().includes(s);
  });

  const updateStatus = async (ids: string[], status: string) => {
    const { error } = await supabase.from("product_reviews").update({ status, updated_at: new Date().toISOString() } as any).in("id", ids);
    if (error) toast.error("Update failed");
    else { toast.success(`${ids.length} review(s) ${status}`); setSelected(new Set()); fetchReviews(); }
  };

  const deleteReviews = async (ids: string[]) => {
    const { error } = await supabase.from("product_reviews").delete().in("id", ids);
    if (error) toast.error("Delete failed");
    else { toast.success(`${ids.length} review(s) deleted`); setSelected(new Set()); fetchReviews(); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredReviews.length) setSelected(new Set());
    else setSelected(new Set(filteredReviews.map((r) => r.id)));
  };

  // Bulk Upload
  const downloadTemplate = () => {
    const csv = "product_id,reviewer_name,rating,review_title,review_body,review_date,status\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "review_upload_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsv = (text: string) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return obj;
    });
  };

  const handleBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    const text = await file.text();
    const rows = parseCsv(text);
    const errors: string[] = [];
    const valid: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      if (!row.product_id) { errors.push(`Row ${rowNum}: Missing product_id`); continue; }
      const rating = Number(row.rating);
      if (!rating || rating < 1 || rating > 5) { errors.push(`Row ${rowNum}: Invalid rating (must be 1-5)`); continue; }
      if (!row.review_body?.trim()) { errors.push(`Row ${rowNum}: Empty review body`); continue; }
      valid.push({
        product_id: row.product_id.trim(),
        reviewer_name: row.reviewer_name?.trim() || "Anonymous",
        rating,
        review_title: row.review_title?.trim() || "",
        review_body: row.review_body.trim(),
        review_date: row.review_date || new Date().toISOString(),
        status: row.status === "approved" ? "approved" : "pending",
        is_bulk_uploaded: true,
        is_verified_purchase: false,
        user_id: "00000000-0000-0000-0000-000000000000",
      });
    }
    setBulkData(valid);
    setBulkErrors(errors);
  };

  const importBulk = async () => {
    if (bulkData.length === 0) return;
    setImporting(true);
    const { error } = await supabase.from("product_reviews").insert(bulkData as any);
    if (error) toast.error("Import failed: " + error.message);
    else { toast.success(`${bulkData.length} reviews imported`); setShowBulkUpload(false); setBulkData([]); setBulkErrors([]); setBulkFile(null); fetchReviews(); }
    setImporting(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header - matching AdminCategories style */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
              <p className="text-sm text-muted-foreground">Manage and moderate customer reviews</p>
            </div>
          </div>
          <Button onClick={() => setShowBulkUpload(true)} variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Bulk Upload
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." className="pl-9" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} ★</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => updateStatus(Array.from(selected), "approved")} className="gap-1">
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus(Array.from(selected), "rejected")} className="gap-1">
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteReviews(Array.from(selected))} className="gap-1">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-xl">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left"><Checkbox checked={selected.size === filteredReviews.length && filteredReviews.length > 0} onCheckedChange={toggleAll} /></th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reviewer</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Review</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No reviews found</td></tr>
                  ) : (
                    filteredReviews.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} /></td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {(r.products as any)?.image_url ? (
                              <img src={(r.products as any).image_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{(r.products as any)?.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-foreground">{r.reviewer_name}</td>
                        <td className="p-3">
                          <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />)}</div>
                        </td>
                        <td className="p-3 hidden md:table-cell"><p className="text-sm text-muted-foreground truncate max-w-[200px]">{r.review_body}</p></td>
                        <td className="p-3"><Badge className={statusColors[r.status] || ""}>{r.status}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setDetailReview(r); setAdminNote(r.admin_note || ""); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {r.status !== "approved" && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateStatus([r.id], "approved")}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {r.status !== "rejected" && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => updateStatus([r.id], "rejected")}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteReviews([r.id])}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailReview} onOpenChange={() => setDetailReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review Detail</DialogTitle></DialogHeader>
          {detailReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-5 w-5 ${i < detailReview.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />)}</div>
                <Badge className={statusColors[detailReview.status]}>{detailReview.status}</Badge>
                {detailReview.is_verified_purchase && <Badge variant="outline" className="text-green-600 border-green-200">Verified Purchase</Badge>}
                {detailReview.is_bulk_uploaded && <Badge variant="outline">Bulk Upload</Badge>}
              </div>
              {detailReview.review_title && <h3 className="font-semibold text-foreground">{detailReview.review_title}</h3>}
              <p className="text-sm text-muted-foreground">{detailReview.review_body}</p>
              <p className="text-xs text-muted-foreground">By {detailReview.reviewer_name} on {new Date(detailReview.review_date).toLocaleDateString()}</p>

              {Array.isArray(detailReview.images) && detailReview.images.length > 0 && (
                <div className="flex gap-2">
                  {detailReview.images.map((img: string, i: number) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                      <img src={img} className="w-20 h-20 rounded-lg object-cover border border-border" alt="" />
                    </a>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Admin Note (internal)</label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="mt-1"
                  placeholder="Internal note..."
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={async () => {
                  await supabase.from("product_reviews").update({ status: "approved", admin_note: adminNote, updated_at: new Date().toISOString() } as any).eq("id", detailReview.id);
                  toast.success("Approved"); setDetailReview(null); fetchReviews();
                }}>Approve</Button>
                <Button variant="destructive" className="flex-1" onClick={async () => {
                  await supabase.from("product_reviews").update({ status: "rejected", admin_note: adminNote, updated_at: new Date().toISOString() } as any).eq("id", detailReview.id);
                  toast.success("Rejected"); setDetailReview(null); fetchReviews();
                }}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Bulk Upload Reviews</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2 w-full">
              <Download className="h-4 w-4" /> Download CSV Template
            </Button>

            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{bulkFile ? bulkFile.name : "Click or drag CSV file here"}</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleBulkFile} />
            </div>

            {bulkErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm max-h-32 overflow-y-auto">
                <p className="font-medium text-red-800 mb-1">❌ {bulkErrors.length} error(s):</p>
                {bulkErrors.map((e, i) => <p key={i} className="text-red-600 text-xs">{e}</p>)}
              </div>
            )}

            {bulkData.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                <p className="font-medium text-green-800">✅ {bulkData.length} valid row(s) ready to import</p>
              </div>
            )}

            <Button onClick={importBulk} disabled={bulkData.length === 0 || importing} className="w-full">
              {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : `Import ${bulkData.length} Reviews`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReviews;
