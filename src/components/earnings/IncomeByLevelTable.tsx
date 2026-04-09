import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LevelSummary } from "@/hooks/useEarningsData";

interface Props {
  title: string;
  summaries: LevelSummary[];
  currencySymbol: string;
}

export default function IncomeByLevelTable({ title, summaries, currencySymbol }: Props) {
  const [openLevels, setOpenLevels] = useState<Set<number>>(new Set());

  const toggle = (level: number) => {
    setOpenLevels(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const total = summaries.reduce((s, l) => s + l.incomeEarned, 0);

  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Layers className="h-10 w-10 mb-2 opacity-40" />
            <p>No income data for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Active Members</TableHead>
                <TableHead className="text-right">Total Business Volume</TableHead>
                <TableHead className="text-right">Income Earned</TableHead>
                <TableHead className="text-right">Rate %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(lvl => (
                <LevelRow
                  key={lvl.level}
                  lvl={lvl}
                  isOpen={openLevels.has(lvl.level)}
                  onToggle={() => toggle(lvl.level)}
                  currencySymbol={currencySymbol}
                />
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell />
                <TableCell>Total</TableCell>
                <TableCell />
                <TableCell className="text-right">
                  {currencySymbol}{summaries.reduce((s, l) => s + l.totalBusinessVolume, 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {currencySymbol}{total.toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelRow({ lvl, isOpen, onToggle, currencySymbol }: {
  lvl: LevelSummary; isOpen: boolean; onToggle: () => void; currencySymbol: string;
}) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/30" onClick={onToggle}>
        <TableCell>
          <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
        </TableCell>
        <TableCell className="font-medium">Level {lvl.level}</TableCell>
        <TableCell className="text-right">{lvl.activeMembers}</TableCell>
        <TableCell className="text-right">{currencySymbol}{lvl.totalBusinessVolume.toLocaleString()}</TableCell>
        <TableCell className="text-right font-medium">{currencySymbol}{lvl.incomeEarned.toLocaleString()}</TableCell>
        <TableCell className="text-right">{parseFloat(Number(lvl.rate).toFixed(2))}%</TableCell>
      </TableRow>
      {isOpen && lvl.transactions.map(txn => (
        <TableRow key={txn.commission_id} className="bg-muted/20 text-sm">
          <TableCell />
          <TableCell className="text-muted-foreground">{txn.source_referral_code || "—"}</TableCell>
          <TableCell>{txn.source_user_name || "Unknown"}</TableCell>
          <TableCell className="text-right text-muted-foreground">
            {format(parseISO(txn.created_at), "dd MMM yyyy")}
          </TableCell>
          <TableCell className="text-right">
            {currencySymbol}{Number(txn.order_amount || 0).toLocaleString()}
          </TableCell>
          <TableCell className="text-right font-medium">
            {currencySymbol}{Number(txn.amount).toLocaleString()}
          </TableCell>
        </TableRow>
      ))}
      {isOpen && lvl.transactions.length === 0 && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-3">
            No transactions at this level
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
