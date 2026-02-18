import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Wallet, Users, TrendingUp, ShoppingBag, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const stats = [
  { icon: Wallet, label: "Total Earnings", value: "₹24,580", change: "+12%" },
  { icon: Users, label: "Team Size", value: "147", change: "+8" },
  { icon: TrendingUp, label: "This Month", value: "₹3,200", change: "+18%" },
  { icon: ShoppingBag, label: "Orders", value: "23", change: "+3" },
];

const recentTeam = [
  { name: "Rahul Sharma", level: "L1", date: "2 days ago", status: "Active" },
  { name: "Priya Patel", level: "L1", date: "5 days ago", status: "Active" },
  { name: "Amit Kumar", level: "L2", date: "1 week ago", status: "Active" },
  { name: "Sneha Gupta", level: "L3", date: "2 weeks ago", status: "Pending" },
];

const Dashboard = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://nexamlm.com/ref/USR12345";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome back, User</h1>
          <p className="text-sm text-muted-foreground">Here's your network overview</p>
        </div>

        {/* Referral link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-card border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">Your Referral Link</div>
            <div className="text-sm text-foreground font-mono truncate">{referralLink}</div>
          </div>
          <Button size="sm" onClick={handleCopy} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-success font-medium">{s.change}</span>
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent team */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Recent Team Members</h2>
          </div>
          <div className="divide-y divide-border">
            {recentTeam.map((member) => (
              <div key={member.name} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{member.name[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{member.level}</span>
                  <span className={`text-xs ${member.status === "Active" ? "text-success" : "text-muted-foreground"}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
