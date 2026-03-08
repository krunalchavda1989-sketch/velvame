import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Search, Trash2, Download, RefreshCw, Users } from "lucide-react";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    if (error) {
      toast.error("Failed to load subscribers");
    } else {
      setSubscribers((data as unknown as Subscriber[]) || []);
    }
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update subscriber");
    } else {
      toast.success(currentStatus ? "Subscriber deactivated" : "Subscriber activated");
      fetchSubscribers();
    }
  };

  const deleteSubscriber = async (id: string) => {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete subscriber");
    } else {
      toast.success("Subscriber deleted");
      fetchSubscribers();
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .in("id", ids);
    if (error) {
      toast.error("Failed to delete subscribers");
    } else {
      toast.success(`${ids.length} subscriber(s) deleted`);
      fetchSubscribers();
    }
    setShowBulkDelete(false);
  };

  const exportCSV = () => {
    const filtered = filteredSubscribers;
    if (filtered.length === 0) return toast.error("No subscribers to export");
    const csv = [
      "Email,Subscribed At,Status",
      ...filtered.map(
        (s) =>
          `${s.email},${format(new Date(s.subscribed_at), "yyyy-MM-dd HH:mm")},${s.is_active ? "Active" : "Inactive"}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subscribers.filter((s) => s.is_active).length;

  const allFilteredSelected = filteredSubscribers.length > 0 && filteredSubscribers.every((s) => selected.has(s.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredSubscribers.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Newsletter Subscribers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage subscribers from the landing page newsletter form
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setShowBulkDelete(true)}>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete ({selected.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchSubscribers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{subscribers.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Mail className="h-3.5 w-3.5" /> Active
            </div>
            <p className="text-2xl font-display font-bold text-primary">{activeCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Mail className="h-3.5 w-3.5" /> Inactive
            </div>
            <p className="text-2xl font-display font-bold text-muted-foreground">{subscribers.length - activeCount}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No subscribers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscribers.map((sub) => (
                  <TableRow key={sub.id} className={selected.has(sub.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(sub.id)}
                        onCheckedChange={() => toggleSelect(sub.id)}
                        aria-label={`Select ${sub.email}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(sub.subscribed_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sub.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleActive(sub.id, sub.is_active)}
                      >
                        {sub.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(sub)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Single Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.email}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteTarget) {
                    deleteSubscriber(deleteTarget.id);
                    setDeleteTarget(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation */}
        <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selected.size} Subscriber{selected.size > 1 ? "s" : ""}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold text-foreground">{selected.size}</span> selected subscriber{selected.size > 1 ? "s" : ""}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={bulkDelete}
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletter;
