import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization } from "@/hooks/useLocalization";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, CreditCard, Eye, Loader2, Users, DollarSign, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PayoutUser {
  user_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  referral_code: string;
  total_earned: number;
  total_paid: number;
  pending_payout: number;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  upi_id: string;
  last_paid_date: string | null;
  email: string;
}

interface PayoutHistory {
  id: string;
  amount: number;
  payment_mode: string;
  transaction_ref: string;
  payment_date: string;
  note: string;
  status: string;
  created_at: string;
  admin_name: string;
}

const STAT_GRADIENTS = [
  "from-amber-500 to-amber-600",
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
];

const PayoutReport = () => {
  const { user: adminUser } = useAuth();
  const { currencySymbol } = useLocalization();
  const [users, setUsers] = useState<PayoutUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");

  // Mark as paid dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PayoutUser | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [refWarning, setRefWarning] = useState("");

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyUser, setHistoryUser] = useState<PayoutUser | null>(null);
  const [historyData, setHistoryData] = useState<PayoutHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Helper to fetch ALL rows from a table, paginating past the 1000-row limit
  const fetchAllRows = async (
    tableName: string,
    selectCols: string,
    orderCol?: string,
  ): Promise<any[]> => {
    const PAGE = 1000;
    let allRows: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      let q = (supabase.from(tableName) as any).select(selectCols).range(from, from + PAGE - 1);
      if (orderCol) q = q.order(orderCol);
      const { data, error } = await q;
      if (error || !data) break;
      allRows = allRows.concat(data);
      hasMore = data.length === PAGE;
      from += PAGE;
    }
    return allRows;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch all profiles (paginated)
    const profiles = await fetchAllRows("profiles", "user_id, full_name, first_name, last_name, phone, referral_code", "full_name");
    if (!profiles.length) { setLoading(false); return; }

    const commissions = await fetchAllRows("commissions", "beneficiary_id, amount");

    const payouts = await fetchAllRows("payout_transactions", "user_id, amount, payment_date");

    const bankDetails = await fetchAllRows("bank_details", "user_id, bank_name, account_holder_name, account_number, ifsc_code, branch_name, upi_id");

    // Aggregate commissions per user
    const earningsMap = new Map<string, number>();
    commissions.forEach(c => {
      earningsMap.set(c.beneficiary_id, (earningsMap.get(c.beneficiary_id) || 0) + Number(c.amount));
    });

    // Aggregate payouts per user
    const paidMap = new Map<string, { total: number; lastDate: string | null }>();
    payouts.forEach(p => {
      const prev = paidMap.get(p.user_id) || { total: 0, lastDate: null };
      prev.total += Number(p.amount);
      if (!prev.lastDate || p.payment_date > prev.lastDate) prev.lastDate = p.payment_date;
      paidMap.set(p.user_id, prev);
    });

    // Bank details map
    const bankMap = new Map(bankDetails.map(b => [b.user_id, b]));

    const result: PayoutUser[] = profiles.map(p => {
      const earned = earningsMap.get(p.user_id) || 0;
      const paidInfo = paidMap.get(p.user_id) || { total: 0, lastDate: null };
      const bank = bankMap.get(p.user_id);
      return {
        user_id: p.user_id,
        full_name: p.full_name || "",
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        phone: p.phone || "",
        referral_code: p.referral_code || "",
        total_earned: earned,
        total_paid: paidInfo.total,
        pending_payout: earned - paidInfo.total,
        bank_name: bank?.bank_name || "",
        account_holder_name: bank?.account_holder_name || "",
        account_number: bank?.account_number || "",
        ifsc_code: bank?.ifsc_code || "",
        branch_name: bank?.branch_name || "",
        upi_id: bank?.upi_id || "",
        last_paid_date: paidInfo.lastDate,
        email: "",
      };
    }).filter(u => u.total_earned > 0); // Only show users with earnings

    setUsers(result);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter users
  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(u =>
        u.full_name.toLowerCase().includes(s) ||
        u.first_name.toLowerCase().includes(s) ||
        u.last_name.toLowerCase().includes(s) ||
        u.phone.includes(s) ||
        u.referral_code.toLowerCase().includes(s)
      );
    }
    if (statusFilter === "pending") list = list.filter(u => u.pending_payout > 0);
    else if (statusFilter === "partially_paid") list = list.filter(u => u.total_paid > 0 && u.pending_payout > 0);
    else if (statusFilter === "fully_paid") list = list.filter(u => u.pending_payout <= 0 && u.total_paid > 0);
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) list = list.filter(u => u.pending_payout >= min);
    }
    return list.sort((a, b) => b.pending_payout - a.pending_payout);
  }, [users, searchTerm, statusFilter, minAmount]);

  // Summary stats
  const stats = useMemo(() => ({
    pendingUsers: users.filter(u => u.pending_payout > 0).length,
    pendingAmount: users.reduce((s, u) => s + Math.max(0, u.pending_payout), 0),
    totalPaid: users.reduce((s, u) => s + u.total_paid, 0),
    totalEarned: users.reduce((s, u) => s + u.total_earned, 0),
  }), [users]);

  const fc = (val: number) => `${currencySymbol}${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  // Open pay dialog
  const openPayDialog = (u: PayoutUser) => {
    setSelectedUser(u);
    setPayAmount(String(Math.max(0, u.pending_payout).toFixed(2)));
    setPayMode("bank_transfer");
    setPayRef("");
    setPayDate(format(new Date(), "yyyy-MM-dd"));
    setPayNote("");
    setRefWarning("");
    setPayDialogOpen(true);
  };

  // Check duplicate ref
  const checkRefDuplicate = async (ref: string) => {
    if (!ref.trim()) { setRefWarning(""); return; }
    const { data } = await supabase
      .from("payout_transactions")
      .select("id")
      .eq("transaction_ref", ref.trim())
      .maybeSingle();
    if (data) {
      setRefWarning("⚠️ This transaction reference number has already been used. Please verify before proceeding.");
    } else {
      setRefWarning("");
    }
  };

  // Confirm payment
  const handleConfirmPayment = async () => {
    if (!selectedUser || !adminUser) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount > selectedUser.pending_payout + 0.01) { toast.error("Amount exceeds pending payout"); return; }
    if (!payRef.trim()) { toast.error("Transaction reference is mandatory"); return; }
    if (refWarning) { toast.error("Please resolve the duplicate reference warning first"); return; }

    setPaying(true);

    const { error } = await supabase.from("payout_transactions").insert({
      user_id: selectedUser.user_id,
      amount,
      payment_mode: payMode,
      transaction_ref: payRef.trim(),
      payment_date: payDate,
      paid_by_admin_id: adminUser.id,
      note: payNote || "",
      status: "paid",
    });

    if (error) {
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        toast.error("This transaction reference has already been used");
      } else {
        toast.error("Failed to record payout: " + error.message);
      }
      setPaying(false);
      return;
    }

    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: selectedUser.user_id,
      title: "Payout Processed ✅",
      message: `Your payout of ${fc(amount)} has been processed. Transaction Ref: ${payRef.trim()}. Check your Earnings panel for details.`,
      type: "success",
      link: "/dashboard/earnings",
    });

    toast.success(`Payout of ${fc(amount)} recorded for ${selectedUser.full_name}`);
    setPayDialogOpen(false);
    setPaying(false);
    fetchData();
  };

  // Open history dialog
  const openHistory = async (u: PayoutUser) => {
    setHistoryUser(u);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);

    const { data } = await supabase
      .from("payout_transactions")
      .select("*")
      .eq("user_id", u.user_id)
      .order("payment_date", { ascending: false });

    // Get admin names
    const adminIds = [...new Set((data || []).map((p: any) => p.paid_by_admin_id))];
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", adminIds);
    const adminMap = new Map(adminProfiles?.map(p => [p.user_id, p.full_name]) || []);

    setHistoryData((data || []).map((p: any) => ({
      ...p,
      admin_name: adminMap.get(p.paid_by_admin_id) || "Admin",
    })));
    setHistoryLoading(false);
  };

  // Export to Excel (CSV)
  const exportExcel = (mode: "all" | "pending" | "filtered") => {
    let exportData = mode === "all" ? users : mode === "pending" ? users.filter(u => u.pending_payout > 0) : filteredUsers;

    const headers = [
      "User ID", "Full Name", "First Name", "Last Name", "Mobile", "Referral Code",
      "Total Earned", "Total Paid", "Pending Payout",
      "Bank Name", "Account Holder", "Account Number", "IFSC Code", "Branch",
      "UPI ID", "Last Paid Date", "Payment Status",
    ];

    const rows = exportData.map(u => [
      u.user_id.slice(0, 8), u.full_name, u.first_name, u.last_name, u.phone, u.referral_code,
      u.total_earned.toFixed(2), u.total_paid.toFixed(2), u.pending_payout.toFixed(2),
      u.bank_name, u.account_holder_name, u.account_number, u.ifsc_code, u.branch_name,
      u.upi_id, u.last_paid_date || "Never",
      u.pending_payout <= 0 ? "Fully Paid" : u.total_paid > 0 ? "Partially Paid" : "Pending",
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payout_Report_${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPaymentStatus = (u: PayoutUser) => {
    if (u.pending_payout <= 0 && u.total_paid > 0) return "fully_paid";
    if (u.total_paid > 0 && u.pending_payout > 0) return "partially_paid";
    return "pending";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "fully_paid": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]" variant="outline">Fully Paid</Badge>;
      case "partially_paid": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]" variant="outline">Partially Paid</Badge>;
      default: return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]" variant="outline">Pending</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Users with Pending Payout", value: stats.pendingUsers, icon: Users, gradient: STAT_GRADIENTS[0] },
          { label: "Total Pending Amount", value: fc(stats.pendingAmount), icon: Clock, gradient: STAT_GRADIENTS[1] },
          { label: "Total Paid (All Time)", value: fc(stats.totalPaid), icon: CheckCircle2, gradient: STAT_GRADIENTS[2] },
          { label: "Total Earnings (All Time)", value: fc(stats.totalEarned), icon: DollarSign, gradient: STAT_GRADIENTS[3] },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl bg-gradient-to-br ${s.gradient} p-4 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-80">{s.label}</span>
              <s.icon className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{typeof s.value === "number" ? s.value : s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name, mobile, referral code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="w-[160px]">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="fully_paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <Label className="text-xs">Min Pending ({currencySymbol})</Label>
              <Input type="number" placeholder="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(v) => exportExcel(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <Download className="h-4 w-4 mr-1" /> Export
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="filtered">Current View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="px-4 pt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filteredUsers.length} users</p>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">#</TableHead>
                  <TableHead className="text-xs font-semibold">User</TableHead>
                  <TableHead className="text-xs font-semibold">Mobile</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Total Earned</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Total Paid</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Pending</TableHead>
                  <TableHead className="text-xs font-semibold">Bank / UPI</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Last Paid</TableHead>
                  <TableHead className="text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No users found</TableCell></TableRow>
                ) : filteredUsers.map((u, i) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{u.full_name || `${u.first_name} ${u.last_name}`}</div>
                      <div className="text-xs text-muted-foreground">{u.referral_code}</div>
                    </TableCell>
                    <TableCell className="text-xs">{u.phone || "—"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fc(u.total_earned)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600">{fc(u.total_paid)}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-primary">{fc(Math.max(0, u.pending_payout))}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {u.bank_name ? <span>{u.bank_name} · {u.account_number?.slice(-4) ? `****${u.account_number.slice(-4)}` : ""}</span> : null}
                        {u.upi_id ? <div className="text-muted-foreground">{u.upi_id}</div> : null}
                        {!u.bank_name && !u.upi_id && <span className="text-destructive">Not provided</span>}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(getPaymentStatus(u))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.last_paid_date ? format(new Date(u.last_paid_date), "dd MMM yyyy") : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {u.pending_payout > 0 && (
                          <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => openPayDialog(u)}>
                            <CreditCard className="h-3 w-3" /> Pay
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openHistory(u)}>
                          <Eye className="h-3 w-3" /> History
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mark as Paid Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Confirm Payout
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `${selectedUser.full_name} — Pending: ${fc(Math.max(0, selectedUser.pending_payout))}`}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* User bank info */}
              <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Bank:</span><span>{selectedUser.bank_name || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Account:</span><span>{selectedUser.account_number || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IFSC:</span><span>{selectedUser.ifsc_code || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">UPI:</span><span>{selectedUser.upi_id || "N/A"}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount to Pay *</Label>
                  <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} max={selectedUser.pending_payout} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Mode *</Label>
                  <Select value={payMode} onValueChange={setPayMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Transaction Reference / UTR *</Label>
                <Input
                  value={payRef}
                  onChange={e => { setPayRef(e.target.value); checkRefDuplicate(e.target.value); }}
                  placeholder="Enter UTR or reference number"
                />
                {refWarning && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{refWarning}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Date</Label>
                  <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Note (optional)</Label>
                  <Input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Internal note" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmPayment} disabled={paying || !!refWarning}>
              {paying ? "Processing…" : "✅ Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout History — {historyUser?.full_name}</DialogTitle>
            {historyUser && (
              <div className="flex gap-4 text-sm mt-2">
                <span>Earned: <strong className="text-primary">{fc(historyUser.total_earned)}</strong></span>
                <span>Paid: <strong className="text-green-600">{fc(historyUser.total_paid)}</strong></span>
                <span>Pending: <strong className="text-amber-600">{fc(Math.max(0, historyUser.pending_payout))}</strong></span>
              </div>
            )}
          </DialogHeader>

          {historyLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : historyData.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">No payout history yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Mode</TableHead>
                  <TableHead className="text-xs">Txn Ref</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Paid By</TableHead>
                  <TableHead className="text-xs">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((h, i) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell className="text-sm font-medium text-green-600">{fc(h.amount)}</TableCell>
                    <TableCell className="text-xs capitalize">{h.payment_mode.replace("_", " ")}</TableCell>
                    <TableCell className="text-xs font-mono">{h.transaction_ref}</TableCell>
                    <TableCell className="text-xs">{format(new Date(h.payment_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-xs">{h.admin_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{h.note || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutReport;
