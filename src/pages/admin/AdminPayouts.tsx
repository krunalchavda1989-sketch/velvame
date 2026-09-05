import { useEffect, useMemo, useState } from "react";
import { format, isSameMonth, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CalendarClock, Clock, Users, Wallet, Search, Eye, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  aggregateLedger, aggregatePayouts, computePayoutFigures, nextPayoutDate,
} from "@/lib/payoutCalc";

interface Row {
  user_id: string;
  full_name: string;
  referral_code: string;
  phone: string;
  earned: number;
  paid: number;
  pending: number;
  lastPaidDate: string | null;
}

interface PayoutRow {
  id: string;
  user_id: string;
  amount: number;
  payment_mode: string | null;
  transaction_ref: string | null;
  payment_date: string;
  note: string | null;
  status: string | null;
}

const fetchAll = async (table: string, cols: string) => {
  const PAGE = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await (supabase as any).from(table).select(cols).range(from, from + PAGE - 1);
    if (error || !data) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
};

const AdminPayouts = () => {
  const { currencySymbol } = useLocalization();
  const [rows, setRows] = useState<Row[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payoutDay, setPayoutDay] = useState(5);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingDay, setSavingDay] = useState(false);
  const [historyUser, setHistoryUser] = useState<Row | null>(null);

  const fc = (n: number) => `${currencySymbol}${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [profiles, commissions, payoutRows, walletTxns, settings] = await Promise.all([
        fetchAll("profiles", "user_id, full_name, referral_code, phone"),
        fetchAll("commissions", "beneficiary_id, amount"),
        fetchAll("payout_transactions", "id, user_id, amount, payment_mode, transaction_ref, payment_date, note, status"),
        fetchAll("wallet_transactions", "user_id, amount, type, balance_type, description"),
        (supabase as any).from("payout_settings").select("*").limit(1).maybeSingle(),
      ]);

      if (settings?.data) {
        setSettingsId(settings.data.id);
        setPayoutDay(settings.data.payout_day_of_month ?? 5);
      }

      const commMap = new Map<string, number>();
      commissions.forEach((c: any) =>
        commMap.set(c.beneficiary_id, (commMap.get(c.beneficiary_id) || 0) + Number(c.amount)));

      const paidMap = aggregatePayouts(payoutRows as any);
      const ledgerMap = aggregateLedger(walletTxns as any);

      const built: Row[] = profiles.map((p: any) => {
        const paidInfo = paidMap.get(p.user_id) || { total: 0, lastDate: null };
        const f = computePayoutFigures(ledgerMap.get(p.user_id), paidInfo.total, commMap.get(p.user_id) || 0);
        return {
          user_id: p.user_id,
          full_name: p.full_name || "Unnamed",
          referral_code: p.referral_code || "",
          phone: p.phone || "",
          earned: f.earned,
          paid: f.paid,
          pending: f.pending,
          lastPaidDate: paidInfo.lastDate,
        };
      }).filter(r => r.earned > 0);

      built.sort((a, b) => b.pending - a.pending);
      setRows(built);
      setPayouts(payoutRows as PayoutRow[]);
      setLoading(false);
    })();
  }, []);

  const nextDate = useMemo(() => nextPayoutDate(payoutDay), [payoutDay]);

  const stats = useMemo(() => {
    const pendingUsers = rows.filter(r => r.pending > 0.01);
    const paidThisMonth = payouts
      .filter(p => isSameMonth(parseISO(p.payment_date), new Date()))
      .reduce((s, p) => s + Number(p.amount), 0);
    return {
      totalPending: pendingUsers.reduce((s, r) => s + r.pending, 0),
      pendingCount: pendingUsers.length,
      paidThisMonth,
    };
  }, [rows, payouts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      r.referral_code.toLowerCase().includes(q) ||
      r.phone.includes(q));
  }, [rows, search]);

  const userHistory = useMemo(
    () => payouts
      .filter(p => p.user_id === historyUser?.user_id)
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
    [payouts, historyUser],
  );

  const saveDay = async () => {
    setSavingDay(true);
    const day = Math.min(Math.max(Number(payoutDay) || 1, 1), 28);
    const { error } = settingsId
      ? await (supabase as any).from("payout_settings").update({ payout_day_of_month: day }).eq("id", settingsId)
      : await (supabase as any).from("payout_settings").insert({ payout_day_of_month: day }).select().single();
    setSavingDay(false);
    if (error) return toast.error(error.message);
    setPayoutDay(day);
    toast.success("Payout cycle updated");
  };

  const statCards = [
    { icon: Clock, label: "Total Pending Payout", value: fc(stats.totalPending), grad: "from-amber-500 to-amber-600" },
    { icon: Users, label: "Members Awaiting Payout", value: String(stats.pendingCount), grad: "from-blue-500 to-blue-600" },
    { icon: Wallet, label: "Paid This Month", value: fc(stats.paidThisMonth), grad: "from-emerald-500 to-emerald-600" },
    { icon: CalendarClock, label: "Next Payout Date", value: format(nextDate, "dd MMM yyyy"), grad: "from-purple-500 to-purple-600" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payout Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Plan payouts at a glance — pending amounts, next payout date and full payment history.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className={`bg-gradient-to-br ${s.grad} border-0`}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <p className="text-xs text-white/80">{s.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                </div>
                <s.icon className="h-5 w-5 text-white/80" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <Label className="text-xs">Search member</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Name, VM ID or mobile"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="w-full md:w-56">
              <Label className="text-xs">Payout day of month</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" min={1} max={28} value={payoutDay}
                  onChange={(e) => setPayoutDay(Number(e.target.value))} />
                <Button onClick={saveDay} disabled={savingDay}>
                  {savingDay ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{filtered.length} members</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Last Paid</TableHead>
                    <TableHead>Next Payout</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.user_id}>
                      <TableCell>
                        <Link to={`/admin/users/${r.user_id}`} className="font-medium text-sm hover:underline">
                          {r.full_name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{r.referral_code}</div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{fc(r.earned)}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-600">{fc(r.paid)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {r.pending > 0.01
                          ? <span className="text-amber-600">{fc(r.pending)}</span>
                          : <Badge variant="outline" className="text-[10px]">Settled</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.lastPaidDate ? format(parseISO(r.lastPaidDate), "dd MMM yyyy") : "Never"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.pending > 0.01 ? format(nextDate, "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setHistoryUser(r)}>
                          <Eye className="h-3.5 w-3.5 mr-1" />View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!historyUser} onOpenChange={(o) => !o && setHistoryUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout History — {historyUser?.full_name}</DialogTitle>
            <DialogDescription>
              Earned {fc(historyUser?.earned || 0)} · Paid {fc(historyUser?.paid || 0)} · Pending {fc(historyUser?.pending || 0)}
            </DialogDescription>
          </DialogHeader>
          {userHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No payouts recorded yet.</p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userHistory.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{format(parseISO(p.payment_date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fc(Number(p.amount))}</TableCell>
                      <TableCell className="text-xs capitalize">{(p.payment_mode || "").replace("_", " ")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.transaction_ref || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPayouts;
