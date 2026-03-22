import { useState, useEffect } from "react";
import { Loader2, Eye, Trash2, Inbox, ArrowLeft, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Submission {
  id: string;
  submitted_data: any;
  status: string;
  ip_address: string | null;
  created_at: string;
}

const AdminContactSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Submission | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const viewSubmission = async (sub: Submission) => {
    setViewing(sub);
    if (sub.status === "new") {
      await supabase.from("contact_submissions").update({ status: "read" }).eq("id", sub.id);
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: "read" } : s));
    }
  };

  const markAsReplied = async (id: string) => {
    await supabase.from("contact_submissions").update({ status: "replied" }).eq("id", id);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: "replied" } : s));
    if (viewing?.id === id) setViewing(prev => prev ? { ...prev, status: "replied" } : null);
    toast.success("Marked as replied");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("contact_submissions").delete().eq("id", deleteId);
    setSubmissions(prev => prev.filter(s => s.id !== deleteId));
    if (viewing?.id === deleteId) setViewing(null);
    setDeleteId(null);
    toast.success("Submission deleted");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return <Badge className="bg-blue-500 text-white">New</Badge>;
      case "read": return <Badge variant="secondary">Read</Badge>;
      case "replied": return <Badge className="bg-green-600 text-white">Replied</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtered = submissions.filter(s => {
    const data = s.submitted_data || {};
    const text = Object.values(data).join(" ").toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const newCount = submissions.filter(s => s.status === "new").length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (viewing) {
    const data = viewing.submitted_data || {};
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Button variant="ghost" onClick={() => setViewing(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Submissions
          </Button>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Submission Details</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(viewing.status)}
                  {viewing.status !== "replied" && (
                    <Button size="sm" variant="outline" onClick={() => markAsReplied(viewing.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Mark as Replied
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => setDeleteId(viewing.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b border-border last:border-0">
                    <span className="font-medium text-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="col-span-2 text-muted-foreground whitespace-pre-wrap">{String(value)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-border">
                  <span className="font-medium text-foreground">Submitted At</span>
                  <span className="col-span-2 text-muted-foreground">
                    {format(new Date(viewing.created_at), "PPpp")}
                  </span>
                </div>
                {viewing.ip_address && (
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <span className="font-medium text-foreground">IP Address</span>
                    <span className="col-span-2 text-muted-foreground">{viewing.ip_address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Submission</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Inbox className="h-6 w-6" /> Contact Submissions
              {newCount > 0 && <Badge className="bg-blue-500 text-white">{newCount} New</Badge>}
            </h1>
            <p className="text-muted-foreground">View and manage contact form submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search submissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub, i) => {
                  const d = sub.submitted_data || {};
                  return (
                    <TableRow key={sub.id} className={sub.status === "new" ? "bg-blue-500/5" : ""}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">
                        {[d["First Name"] || d["first_name"], d["Last Name"] || d["last_name"]].filter(Boolean).join(" ") || "-"}
                      </TableCell>
                      <TableCell>{d["Email"] || d["email"] || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{d["Subject"] || d["subject"] || "-"}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewSubmission(sub)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(sub.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No submissions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminContactSubmissions;
