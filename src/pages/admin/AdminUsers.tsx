import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search, Shield, Users, UserCheck, FileCheck, Landmark,
  Download, CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [kycMap, setKycMap] = useState<Record<string, string>>({});
  const [bankMap, setBankMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [filterKyc, setFilterKyc] = useState("all");
  const [filterBank, setFilterBank] = useState("all");
  const [filterSub, setFilterSub] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Email map for search
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const [{ data: profiles }, { data: kyc }, { data: banks }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("kyc_documents").select("user_id, status"),
        supabase.from("bank_details").select("user_id"),
      ]);
      setUsers(profiles || []);

      // KYC map
      const grouped = new Map<string, string[]>();
      (kyc || []).forEach((k: any) => {
        const arr = grouped.get(k.user_id) || [];
        arr.push(k.status);
        grouped.set(k.user_id, arr);
      });
      const kMap: Record<string, string> = {};
      grouped.forEach((statuses, uid) => {
        if (statuses.length >= 2 && statuses.every((s) => s === "approved")) kMap[uid] = "verified";
        else if (statuses.some((s) => s === "pending")) kMap[uid] = "pending";
        else if (statuses.some((s) => s === "rejected")) kMap[uid] = "rejected";
        else kMap[uid] = "partial";
      });
      setKycMap(kMap);

      // Bank map
      const bMap: Record<string, boolean> = {};
      (banks || []).forEach((b: any) => { bMap[b.user_id] = true; });
      setBankMap(bMap);

      // Fetch emails via edge function
      try {
        const userIds = (profiles || []).map((p: any) => p.user_id);
        if (userIds.length > 0) {
          const { data: emailData } = await supabase.functions.invoke("admin-settings", {
            body: { action: "get_user_emails", user_ids: userIds },
          });
          if (emailData?.emails) {
            const eMap: Record<string, string> = {};
            emailData.emails.forEach((e: any) => { eMap[e.id] = e.email; });
            setEmailMap(eMap);
          }
        }
      } catch { /* ignore */ }

      setLoading(false);
    };
    fetchUsers();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const subscribers = users.filter((u) => u.subscription_paid).length;
    const nonSubscribers = total - subscribers;
    const kycCompleted = Object.values(kycMap).filter((s) => s === "verified").length;
    const bankCompleted = Object.values(bankMap).filter(Boolean).length;
    return { total, subscribers, nonSubscribers, kycCompleted, bankCompleted };
  }, [users, kycMap, bankMap]);

  // Filtered users
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (searchName && !u.full_name?.toLowerCase().includes(searchName.toLowerCase()) &&
          !u.referral_code?.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (searchEmail) {
        const email = emailMap[u.user_id] || "";
        if (!email.toLowerCase().includes(searchEmail.toLowerCase())) return false;
      }
      if (searchPhone && !u.phone?.includes(searchPhone)) return false;
      if (filterKyc !== "all") {
        const status = kycMap[u.user_id] || "not_submitted";
        if (filterKyc === "verified" && status !== "verified") return false;
        if (filterKyc === "pending" && status !== "pending") return false;
        if (filterKyc === "not_submitted" && status !== undefined && kycMap[u.user_id]) return false;
        if (filterKyc === "not_submitted" && kycMap[u.user_id]) return false;
      }
      if (filterBank === "completed" && !bankMap[u.user_id]) return false;
      if (filterBank === "not_completed" && bankMap[u.user_id]) return false;
      if (filterSub === "paid" && !u.subscription_paid) return false;
      if (filterSub === "pending" && u.subscription_paid) return false;
      if (dateFrom) {
        const d = new Date(u.created_at);
        if (d < dateFrom) return false;
      }
      if (dateTo) {
        const d = new Date(u.created_at);
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [users, searchName, searchEmail, searchPhone, filterKyc, filterBank, filterSub, dateFrom, dateTo, kycMap, bankMap, emailMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [searchName, searchEmail, searchPhone, filterKyc, filterBank, filterSub, dateFrom, dateTo, pageSize]);

  const kycBadge = (userId: string) => {
    const status = kycMap[userId];
    if (status === "verified") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1"><Shield className="h-2.5 w-2.5" />Verified</Badge>;
    if (status === "pending") return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">Pending</Badge>;
    if (status === "rejected") return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">Rejected</Badge>;
    if (status === "partial") return <Badge variant="outline" className="text-[10px]">Partial</Badge>;
    return <Badge variant="outline" className="text-[10px] text-muted-foreground">Not Submitted</Badge>;
  };

  const exportToExcel = async () => {
    const rows = filtered.map((u) => ({
      Code: u.referral_code || "",
      Name: u.full_name || "",
      "First Name": u.first_name || "",
      "Last Name": u.last_name || "",
      Title: u.title || "",
      Phone: u.phone || "",
      Email: emailMap[u.user_id] || "",
      KYC: kycMap[u.user_id] || "Not Submitted",
      "Bank Details": bankMap[u.user_id] ? "Completed" : "Not Completed",
      Referrals: u.direct_referral_count || 0,
      Subscription: u.subscription_paid ? "Paid" : "Pending",
      Joined: new Date(u.created_at).toLocaleDateString(),
    }));
    const headers = Object.keys(rows[0] || {});
    const csvContent = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported successfully!");
  };

  const STAT_CARDS = [
    { label: "Total Users", value: stats.total, icon: Users, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Subscribers", value: stats.subscribers, icon: UserCheck, gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", sub: `${stats.nonSubscribers} Non-Subscriber` },
    { label: "KYC Completed", value: stats.kycCompleted, icon: FileCheck, gradient: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Bank Details", value: stats.bankCompleted, icon: Landmark, gradient: "from-orange-500 to-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
              <p className="text-sm text-muted-foreground">{users.length} registered users</p>
            </div>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => (
            <Card key={s.label} className={cn("border-0 shadow-sm", s.bg)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", s.gradient)}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  {s.sub && <p className="text-[10px] text-muted-foreground">{s.sub}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="relative col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Name / Code" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="pl-9 h-9 text-xs" />
              </div>
              <Input placeholder="Email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="h-9 text-xs" />
              <Input placeholder="Phone" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} className="h-9 text-xs" />
              <Select value={filterKyc} onValueChange={setFilterKyc}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="KYC" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBank} onValueChange={setFilterBank}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Bank" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bank</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="not_completed">Not Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSub} onValueChange={setFilterSub}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Subscription" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscription</SelectItem>
                  <SelectItem value="paid">Subscriber</SelectItem>
                  <SelectItem value="pending">Non-Subscriber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs gap-1.5 h-9", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs gap-1.5 h-9", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "dd MMM yyyy") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {(searchName || searchEmail || searchPhone || filterKyc !== "all" || filterBank !== "all" || filterSub !== "all" || dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => {
                  setSearchName(""); setSearchEmail(""); setSearchPhone("");
                  setFilterKyc("all"); setFilterBank("all"); setFilterSub("all");
                  setDateFrom(undefined); setDateTo(undefined);
                }}>Clear All</Button>
              )}
              <span className="ml-auto text-xs text-muted-foreground">{filtered.length} results</span>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Code</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Name</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Title</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Phone</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Email</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">KYC</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Referrals</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Subscription</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-primary text-xs">{u.referral_code}</td>
                      <td className="p-3 font-medium text-foreground">
                        <Link to={`/admin/users/${u.id}`} className="text-primary hover:underline">{u.full_name || "—"}</Link>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{u.title}</td>
                      <td className="p-3 text-muted-foreground text-xs">{u.phone || "—"}</td>
                      <td className="p-3 text-muted-foreground text-xs max-w-[160px] truncate">{emailMap[u.user_id] || "—"}</td>
                      <td className="p-3">{kycBadge(u.user_id)}</td>
                      <td className="p-3 text-foreground text-center">{u.direct_referral_count}</td>
                      <td className="p-3">
                        <Badge variant={u.subscription_paid ? "default" : "outline"}
                          className={u.subscription_paid ? "bg-emerald-500 text-white text-[10px]" : "text-muted-foreground text-[10px]"}>
                          {u.subscription_paid ? "Paid" : "Pending"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
            )}

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Show</span>
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                  <span className="ml-2">|</span>
                  <span className="ml-2">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(1)}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
