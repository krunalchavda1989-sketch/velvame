import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EarningRecord } from "@/hooks/useEarningsData";
import { exportEarningsCSV } from "@/hooks/useEarningsData";

interface Props {
  earnings: EarningRecord[];
  currencySymbol: string;
}

const PAGE_SIZE = 20;

export default function TransactionLog({ earnings, currencySymbol }: Props) {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    if (typeFilter === "all") return earnings;
    return earnings.filter(e => e.commission_type === typeFilter);
  }, [earnings, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base">Transaction Log</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="level">Level Income</SelectItem>
                <SelectItem value="repurchase">Repurchase Income</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportEarningsCSV(filtered, currencySymbol)}
              disabled={filtered.length === 0}
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-40" />
            <p>No transactions for this period</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Source User</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead className="text-right">Order Amount</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(e => (
                    <TableRow key={e.commission_id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(parseISO(e.created_at), "dd MMM yyyy, hh:mm a")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{e.source_user_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{e.source_referral_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">Level {e.level}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {e.commission_type === "level" ? "Level" : "Repurchase"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{e.order_number || e.order_id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {currencySymbol}{Number(e.order_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {currencySymbol}{Number(e.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.status === "paid" ? "default" : "outline"} className="text-xs capitalize">
                          {e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
