import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.referral_code?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
          <Badge variant="outline" className="text-muted-foreground">{users.length} users</Badge>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Code</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Title</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Phone</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Referrals</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Subscription</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">{u.full_name || "—"}</td>
                      <td className="p-3 font-mono text-primary text-xs">{u.referral_code}</td>
                      <td className="p-3 text-muted-foreground">{u.title}</td>
                      <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                      <td className="p-3 text-foreground">{u.direct_referral_count}</td>
                      <td className="p-3">
                        <Badge variant={u.subscription_paid ? "default" : "outline"}
                          className={u.subscription_paid ? "bg-success text-success-foreground" : "text-muted-foreground"}>
                          {u.subscription_paid ? "Paid" : "Pending"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
