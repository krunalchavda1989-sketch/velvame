import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization } from "@/hooks/useLocalization";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Clock, Filter, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  order_id: string | null;
  closing_balance: number;
  created_at: string;
}

const PAGE_SIZE = 15;

const WalletTransactionHistory = () => {
  const { user } = useAuth();
  const { currencySymbol } = useLocalization();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter !== "all") {
      query = query.eq("type", filter);
    }

    const { data } = await query;
    setTransactions((data as WalletTransaction[]) || []);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, filter, page]);

  const formatCurrency = (val: number) =>
    `${currencySymbol}${val.toLocaleString("en-IN")}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const filters: { label: string; value: "all" | "credit" | "debit" }[] = [
    { label: "All", value: "all" },
    { label: "Credits", value: "credit" },
    { label: "Deductions", value: "debit" },
  ];

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-display font-semibold text-foreground">Wallet Activity</h2>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => { setFilter(f.value); setPage(0); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          No wallet transactions yet.
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
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? "bg-green-500/10"
                          : "bg-red-500/10"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        {tx.description}
                        {tx.order_id && (
                          <Link
                            to={`/dashboard/orders/${tx.order_id}`}
                            className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Order
                          </Link>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(tx.created_at)}
                        <span className="ml-2">Balance: {formatCurrency(tx.closing_balance)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <span
                      className={`text-sm font-display font-bold ${
                        isCredit ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isCredit ? "+" : "−"} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
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
  );
};

export default WalletTransactionHistory;
