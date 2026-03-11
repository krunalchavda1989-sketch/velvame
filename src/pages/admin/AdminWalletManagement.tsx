import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import { motion } from "framer-motion";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, Search, Plus, Minus, Filter,
  ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  order_id: string | null;
  closing_balance: number;
  created_at: string;
  profile?: { full_name: string; referral_code: string } | null;
}

interface UserOption {
  user_id: string;
  full_name: string;
  referral_code: string;
}

const PAGE_SIZE = 20;

const AdminWalletManagement = () => {
  const { currencySymbol } = useLocalization();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Adjust dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, referral_code");
    const profileMap = new Map(
      (profilesData || []).map((p) => [p.user_id, p])
    );

    let query = supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter !== "all") {
      query = query.eq("type", filter);
    }

    const { data } = await query;
    const enriched = (data || []).map((tx: any) => ({
      ...tx,
      profile: profileMap.get(tx.user_id) || null,
    }));

    // Client-side search filter
    const filtered = searchQuery
      ? enriched.filter(
          (tx) =>
            tx.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.profile?.referral_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : enriched;

    setTransactions(filtered);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter, page]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); fetchTransactions(); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Search users for adjust dialog
  useEffect(() => {
    if (userSearch.length < 2) { setUserOptions([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, referral_code")
        .or(`full_name.ilike.%${userSearch}%,referral_code.ilike.%${userSearch}%`)
        .limit(10);
      setUserOptions((data as UserOption[]) || []);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const handleAdjust = async () => {
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!selectedUserId) { toast.error("Select a user"); return; }
    if (!adjustDesc.trim()) { toast.error("Enter a description"); return; }

    setSubmitting(true);
    const { data, error } = await supabase.rpc("admin_wallet_adjust", {
      _user_id: selectedUserId,
      _amount: amount,
      _type: adjustType,
      _description: adjustDesc.trim(),
    });

    if (error || !(data as any)?.success) {
      toast.error((data as any)?.error || "Failed to adjust wallet");
    } else {
      toast.success(`Wallet ${adjustType === "credit" ? "credited" : "debited"} successfully`);
      setDialogOpen(false);
      setAdjustAmount("");
      setAdjustDesc("");
      setSelectedUserId("");
      setUserSearch("");
      fetchTransactions();
    }
    setSubmitting(false);
  };

  const formatCurrency = (val: number) =>
    `${currencySymbol}${val.toLocaleString("en-IN")}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const filters: { label: string; value: "all" | "credit" | "debit" }[] = [
    { label: "All", value: "all" },
    { label: "Credits", value: "credit" },
    { label: "Deductions", value: "debit" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" /> Wallet Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all wallet transactions and manually adjust user balances
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Wallet className="h-4 w-4" /> Adjust Balance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust Wallet Balance</DialogTitle>
                <DialogDescription>
                  Credit or debit a user's wallet balance manually.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Search User</Label>
                  <Input
                    placeholder="Search by name or referral code..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setSelectedUserId(""); }}
                  />
                  {userOptions.length > 0 && !selectedUserId && (
                    <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border">
                      {userOptions.map((u) => (
                        <button
                          key={u.user_id}
                          onClick={() => {
                            setSelectedUserId(u.user_id);
                            setUserSearch(`${u.full_name} (${u.referral_code})`);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          {u.full_name} <span className="text-muted-foreground">· {u.referral_code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "credit" | "debit")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Credit (+)</SelectItem>
                        <SelectItem value="debit">Debit (−)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ({currencySymbol})</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="e.g., Admin Credit, Bonus, Adjustment..."
                    value={adjustDesc}
                    onChange={(e) => setAdjustDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdjust} disabled={submitting}>
                  {submitting ? "Processing…" : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setFilter(f.value); setPage(0); }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Transactions list */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No wallet transactions found.
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {transactions.map((tx, i) => {
                  const isCredit = tx.type === "credit";
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.015 }}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCredit ? "bg-green-500/10" : "bg-red-500/10"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {tx.profile?.full_name || "Unknown User"}
                            <span className="text-muted-foreground ml-1.5 text-xs">
                              {tx.profile?.referral_code}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                            <Clock className="h-3 w-3" />
                            {formatDate(tx.created_at)}
                            <span>· {tx.description}</span>
                            {tx.order_id && (
                              <Link
                                to={`/admin/orders/${tx.order_id}`}
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                <ExternalLink className="h-3 w-3" /> Order
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-sm font-display font-bold ${
                              isCredit ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isCredit ? "+" : "−"} {formatCurrency(tx.amount)}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            Bal: {formatCurrency(tx.closing_balance)}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isCredit
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}
                        >
                          {tx.type}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {page + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setPage(page + 1)}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWalletManagement;
