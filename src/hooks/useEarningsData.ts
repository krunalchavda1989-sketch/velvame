import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  startOfDay, endOfDay, startOfWeek, startOfMonth,
  startOfQuarter, subMonths, startOfYear, format, parseISO,
} from "date-fns";

export type DatePreset = "today" | "week" | "month" | "quarter" | "half_year" | "year" | "custom";

export interface EarningRecord {
  commission_id: string;
  amount: number;
  rate: number;
  level: number;
  commission_type: string;
  status: string;
  created_at: string;
  order_id: string;
  order_number: string | null;
  order_amount: number | null;
  source_user_id: string;
  source_user_name: string | null;
  source_referral_code: string | null;
}

export interface LevelSummary {
  level: number;
  activeMembers: number;
  totalBusinessVolume: number;
  incomeEarned: number;
  rate: number;
  transactions: EarningRecord[];
}

export function getDateRange(preset: DatePreset, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  switch (preset) {
    case "today": return { start: startOfDay(now), end: endOfDay(now) };
    case "week": return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now) };
    case "month": return { start: startOfMonth(now), end: endOfDay(now) };
    case "quarter": return { start: startOfQuarter(now), end: endOfDay(now) };
    case "half_year": return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) };
    case "year": return { start: startOfYear(now), end: endOfDay(now) };
    case "custom": return {
      start: customStart ? startOfDay(customStart) : startOfMonth(now),
      end: customEnd ? endOfDay(customEnd) : endOfDay(now),
    };
  }
}

export function exportEarningsCSV(data: EarningRecord[], currencySymbol: string) {
  const headers = ["Date", "Source User", "Referral Code", "Level", "Income Type", "Order #", "Order Amount", "Income Earned", "Status"];
  const rows = data.map(e => [
    format(parseISO(e.created_at), "dd MMM yyyy, hh:mm a"),
    e.source_user_name || "N/A",
    e.source_referral_code || "N/A",
    `Level ${e.level}`,
    e.commission_type === "level" ? "Level Income" : "Repurchase Income",
    e.order_number || e.order_id?.slice(0, 8) || "N/A",
    e.order_amount ? `${currencySymbol}${Number(e.order_amount).toLocaleString()}` : "N/A",
    `${currencySymbol}${Number(e.amount).toLocaleString()}`,
    e.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `earnings_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useEarningsData() {
  const { user } = useAuth();
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const dateRange = useMemo(() => getDateRange(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ["earnings-report", user?.id, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_earnings_report" as any, {
        _user_id: user!.id,
        _start_date: dateRange.start.toISOString(),
        _end_date: dateRange.end.toISOString(),
      });
      if (error) throw error;
      return (data || []) as EarningRecord[];
    },
    enabled: !!user,
  });

  const { data: commissionLevels = [] } = useQuery({
    queryKey: ["commission-levels-active"],
    queryFn: async () => {
      const { data } = await supabase.from("commission_levels").select("*").eq("is_active", true).order("level");
      return data || [];
    },
  });

  const summary = useMemo(() => ({
    total: earnings.reduce((s, e) => s + Number(e.amount), 0),
    levelIncome: earnings.filter(e => e.commission_type === "level").reduce((s, e) => s + Number(e.amount), 0),
    repurchaseIncome: earnings.filter(e => e.commission_type === "repurchase").reduce((s, e) => s + Number(e.amount), 0),
    pending: earnings.filter(e => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0),
  }), [earnings]);

  const { levelSummaries, repurchaseSummaries } = useMemo(() => {
    const build = (type: "level" | "repurchase"): LevelSummary[] => {
      const filtered = earnings.filter(e => e.commission_type === type);
      const configLevels = commissionLevels.filter(cl => cl.commission_type === type);
      
      // For repurchase, master admin stores levels as 101,102,103 etc.
      // Normalize to display levels 1,2,3 by detecting offset
      const hasOffset = type === "repurchase" && configLevels.length > 0 && configLevels.every(cl => cl.level >= 100);
      const offset = hasOffset ? 100 : 0;
      
      // Get normalized config levels (subtract offset)
      const normalizedConfigLevels = configLevels.map(cl => cl.level - offset);
      const configMax = normalizedConfigLevels.length > 0 ? Math.max(...normalizedConfigLevels) : 0;
      const dataMax = filtered.reduce((max, e) => Math.max(max, e.level), 0);
      const maxLevel = Math.max(configMax, dataMax);
      if (maxLevel === 0 && configLevels.length === 0) return [];

      const result: LevelSummary[] = [];
      const levelCount = Math.max(maxLevel, configLevels.length > 0 ? configLevels.length : 0);
      for (let lvl = 1; lvl <= levelCount; lvl++) {
        const txns = filtered.filter(e => e.level === lvl);
        // Look up master admin rate using the offset
        const configLevel = commissionLevels.find(cl => cl.level === (lvl + offset) && cl.commission_type === type);
        result.push({
          level: lvl,
          activeMembers: new Set(txns.map(e => e.source_user_id)).size,
          totalBusinessVolume: txns.reduce((s, e) => s + Number(e.order_amount || 0), 0),
          incomeEarned: txns.reduce((s, e) => s + Number(e.amount), 0),
          rate: configLevel?.rate ?? (txns[0]?.rate ? (txns[0].rate < 1 ? txns[0].rate * 100 : txns[0].rate) : 0),
          transactions: txns,
        });
      }
      return result;
    };
    return { levelSummaries: build("level"), repurchaseSummaries: build("repurchase") };
  }, [earnings, commissionLevels]);

  return {
    earnings, isLoading, summary, levelSummaries, repurchaseSummaries,
    preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd, dateRange,
    user,
  };
}
