import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalization, formatPrice } from "@/hooks/useLocalization";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  BarChart3,
  Calendar,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

const LEVEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1, 220 70% 50%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "hsl(200 70% 50%)",
  "hsl(120 60% 45%)",
  "hsl(60 70% 50%)",
];

const chartConfig = {
  amount: { label: "Amount", color: "hsl(var(--primary))" },
  level: { label: "Level", color: "hsl(var(--primary))" },
  standard: { label: "Standard", color: "hsl(var(--primary))" },
  repurchase: { label: "Repurchase", color: "hsl(var(--chart-2, 160 60% 45%))" },
};

const Earnings = () => {
  const { user } = useAuth();
  const { currencySymbol } = useLocalization();
  const [period, setPeriod] = useState<"6m" | "12m">("6m");

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["earnings-commissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .eq("beneficiary_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const months = period === "6m" ? 6 : 12;

  const monthlyData = useMemo(() => {
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthCommissions = commissions.filter((c) => {
        const d = parseISO(c.created_at);
        return d >= start && d <= end;
      });
      const standard = monthCommissions
        .filter((c) => c.commission_type === "level")
        .reduce((s, c) => s + Number(c.amount), 0);
      const repurchase = monthCommissions
        .filter((c) => c.commission_type === "repurchase")
        .reduce((s, c) => s + Number(c.amount), 0);
      result.push({
        month: format(date, "MMM yy"),
        standard,
        repurchase,
        total: standard + repurchase,
      });
    }
    return result;
  }, [commissions, months]);

  const levelBreakdown = useMemo(() => {
    const map: Record<number, number> = {};
    commissions.forEach((c) => {
      map[c.level] = (map[c.level] || 0) + Number(c.amount);
    });
    return Object.entries(map)
      .map(([level, amount]) => ({ level: `L${level}`, amount, levelNum: Number(level) }))
      .sort((a, b) => a.levelNum - b.levelNum);
  }, [commissions]);

  const totalEarned = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const thisMonth = monthlyData[monthlyData.length - 1]?.total || 0;
  const lastMonth = monthlyData[monthlyData.length - 2]?.total || 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  const avgMonthly = monthlyData.reduce((s, m) => s + m.total, 0) / monthlyData.length || 0;

  const stats = [
    { label: "Total Earned", value: `₹${totalEarned.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: "This Month", value: `₹${thisMonth.toLocaleString()}`, icon: Calendar, color: "text-green-500" },
    {
      label: "Growth",
      value: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
      icon: growth >= 0 ? TrendingUp : TrendingDown,
      color: growth >= 0 ? "text-green-500" : "text-red-500",
    },
    { label: "Avg / Month", value: `₹${avgMonthly.toFixed(0)}`, icon: BarChart3, color: "text-blue-500" },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
            <p className="text-sm text-muted-foreground">Commission trends & analytics</p>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setPeriod("6m")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${period === "6m" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              6 Months
            </button>
            <button
              onClick={() => setPeriod("12m")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${period === "12m" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              12 Months
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trend">Monthly Trend</TabsTrigger>
            <TabsTrigger value="levels">By Level</TabsTrigger>
            <TabsTrigger value="breakdown">Type Breakdown</TabsTrigger>
          </TabsList>

          {/* Monthly Trend */}
          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Commission Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.every((m) => m.total === 0) ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
                    <p>No commission data yet</p>
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-72 w-full">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="standard" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Standard" />
                      <Line type="monotone" dataKey="repurchase" stroke="hsl(var(--chart-2, 160 60% 45%))" strokeWidth={2} dot={{ r: 4 }} name="Repurchase" />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Level */}
          <TabsContent value="levels">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Earnings by Commission Level</CardTitle>
              </CardHeader>
              <CardContent>
                {levelBreakdown.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Layers className="h-10 w-10 mb-2 opacity-40" />
                    <p>No level data yet</p>
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-72 w-full">
                    <BarChart data={levelBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="level" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" name="Earned" radius={[4, 4, 0, 0]}>
                        {levelBreakdown.map((_, i) => (
                          <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Type Breakdown */}
          <TabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Commission Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <DollarSign className="h-10 w-10 mb-2 opacity-40" />
                    <p>No commission data yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ChartContainer config={chartConfig} className="h-64 w-64">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Standard", value: commissions.filter((c) => c.commission_type === "level").reduce((s, c) => s + Number(c.amount), 0) },
                            { name: "Repurchase", value: commissions.filter((c) => c.commission_type === "repurchase").reduce((s, c) => s + Number(c.amount), 0) },
                          ].filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                        >
                          <Cell fill="hsl(var(--primary))" />
                          <Cell fill="hsl(var(--chart-2, 160 60% 45%))" />
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm text-foreground">Standard Commission</span>
                        <Badge variant="secondary">
                          ₹{commissions.filter((c) => c.commission_type === "level").reduce((s, c) => s + Number(c.amount), 0).toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: "hsl(var(--chart-2, 160 60% 45%))" }} />
                        <span className="text-sm text-foreground">Repurchase Commission</span>
                        <Badge variant="secondary">
                          ₹{commissions.filter((c) => c.commission_type === "repurchase").reduce((s, c) => s + Number(c.amount), 0).toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Earnings;
