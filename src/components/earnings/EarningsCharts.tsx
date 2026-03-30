import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { EarningRecord } from "@/hooks/useEarningsData";

const COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6",
];

const chartConfig = {
  level: { label: "Level Income", color: "hsl(var(--primary))" },
  repurchase: { label: "Repurchase Income", color: "hsl(var(--chart-2, 160 60% 45%))" },
  total: { label: "Total", color: "hsl(var(--primary))" },
  amount: { label: "Amount", color: "hsl(var(--primary))" },
};

interface Props {
  earnings: EarningRecord[];
}

export default function EarningsCharts({ earnings }: Props) {
  const monthlyData = useMemo(() => {
    const groups = new Map<string, { month: string; level: number; repurchase: number; total: number; sortKey: string }>();
    earnings.forEach(e => {
      const d = parseISO(e.created_at);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yy");
      if (!groups.has(key)) groups.set(key, { month: label, level: 0, repurchase: 0, total: 0, sortKey: key });
      const g = groups.get(key)!;
      const amt = Number(e.amount);
      if (e.commission_type === "level") g.level += amt;
      else g.repurchase += amt;
      g.total += amt;
    });
    return [...groups.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [earnings]);

  const levelPieData = useMemo(() => {
    const groups: Record<number, number> = {};
    earnings.forEach(e => { groups[e.level] = (groups[e.level] || 0) + Number(e.amount); });
    return Object.entries(groups)
      .map(([lvl, value]) => ({ name: `Level ${lvl}`, value }))
      .sort((a, b) => parseInt(a.name.split(" ")[1]) - parseInt(b.name.split(" ")[1]));
  }, [earnings]);

  if (earnings.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Income Charts</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
            <p>No data to visualize</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Income Charts</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bar">Monthly Breakdown</TabsTrigger>
            <TabsTrigger value="pie">By Level</TabsTrigger>
            <TabsTrigger value="line">Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="bar">
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="level" name="Level Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="repurchase" name="Repurchase" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="pie">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ChartContainer config={chartConfig} className="h-64 w-64">
                <PieChart>
                  <Pie data={levelPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                    {levelPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="space-y-2">
                {levelPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground">{d.name}</span>
                    <span className="text-muted-foreground ml-auto">₹{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="line">
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Total Income" />
                <Line type="monotone" dataKey="level" stroke="hsl(var(--chart-3, 30 80% 55%))" strokeWidth={2} dot={{ r: 3 }} name="Level" />
                <Line type="monotone" dataKey="repurchase" stroke="hsl(var(--chart-2, 160 60% 45%))" strokeWidth={2} dot={{ r: 3 }} name="Repurchase" />
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
