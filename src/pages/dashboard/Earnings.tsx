import { useRef } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { useEarningsData } from "@/hooks/useEarningsData";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EarningsDateFilter from "@/components/earnings/EarningsDateFilter";
import EarningsSummaryCards from "@/components/earnings/EarningsSummaryCards";
import IncomeByLevelTable from "@/components/earnings/IncomeByLevelTable";
import DownlineSearch from "@/components/earnings/DownlineSearch";
import TransactionLog from "@/components/earnings/TransactionLog";
import EarningsCharts from "@/components/earnings/EarningsCharts";
import PayoutHistory from "@/components/earnings/PayoutHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Earnings = () => {
  const { currencySymbol } = useLocalization();
  const {
    earnings, isLoading, summary, levelSummaries, repurchaseSummaries,
    preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd, user,
  } = useEarningsData();

  const levelRef = useRef<HTMLDivElement>(null);
  const repurchaseRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const scrollTo = (section: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement>> = {
      level: levelRef, repurchase: repurchaseRef, search: searchRef, log: logRef,
    };
    refs[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earning Report</h1>
          <p className="text-sm text-muted-foreground">Comprehensive income analysis & breakdown</p>
        </div>

        <Tabs defaultValue="earnings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="earnings">Earnings Report</TabsTrigger>
            <TabsTrigger value="payouts">Payout History</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-6">
            {/* Date Filter */}
            <EarningsDateFilter
              preset={preset}
              setPreset={setPreset}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
            />

            {/* Summary Cards */}
            <EarningsSummaryCards
              summary={summary}
              currencySymbol={currencySymbol}
              onCardClick={scrollTo}
            />

            {/* Level Income */}
            <div ref={levelRef}>
              <IncomeByLevelTable
                title="Level / Referral Income"
                summaries={levelSummaries}
                currencySymbol={currencySymbol}
              />
            </div>

            {/* Repurchase Income */}
            <div ref={repurchaseRef}>
              <IncomeByLevelTable
                title="Repurchase Income"
                summaries={repurchaseSummaries}
                currencySymbol={currencySymbol}
              />
            </div>

            {/* Downline Search */}
            <div ref={searchRef}>
              {user && (
                <DownlineSearch
                  earnings={earnings}
                  userId={user.id}
                  currencySymbol={currencySymbol}
                />
              )}
            </div>

            {/* Transaction Log */}
            <div ref={logRef}>
              <TransactionLog earnings={earnings} currencySymbol={currencySymbol} />
            </div>

            {/* Charts */}
            <EarningsCharts earnings={earnings} />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Earnings;
