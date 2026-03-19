import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Search, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EarningRecord } from "@/hooks/useEarningsData";

interface Props {
  earnings: EarningRecord[];
  userId: string;
  currencySymbol: string;
}

interface DownlineMember {
  profile_id: string;
  user_id: string;
  full_name: string;
  referral_code: string;
  depth: number;
}

export default function DownlineSearch({ earnings, userId, currencySymbol }: Props) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<DownlineMember | null>(null);

  const { data: downline = [] } = useQuery({
    queryKey: ["downline-for-search", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_genealogy_tree", {
        _user_id: userId,
        _max_depth: 9,
      });
      if (error) throw error;
      return ((data || []) as DownlineMember[]).filter(m => m.depth > 0);
    },
    enabled: !!userId,
  });

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return downline
      .filter(m => m.full_name.toLowerCase().includes(q) || m.referral_code.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, downline]);

  const userEarnings = useMemo(() => {
    if (!selectedUser) return [];
    return earnings.filter(e => e.source_user_id === selectedUser.user_id);
  }, [earnings, selectedUser]);

  const levelEarnings = userEarnings.filter(e => e.commission_type === "level");
  const repurchaseEarnings = userEarnings.filter(e => e.commission_type === "repurchase");
  const levelTotal = levelEarnings.reduce((s, e) => s + Number(e.amount), 0);
  const repurchaseTotal = repurchaseEarnings.reduce((s, e) => s + Number(e.amount), 0);

  const handleSelect = (member: DownlineMember) => {
    setSelectedUser(member);
    setQuery("");
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Downline Member Income Lookup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or referral code..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedUser(null); }}
            className="pl-9"
          />
          {suggestions.length > 0 && !selectedUser && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map(m => (
                <button
                  key={m.profile_id}
                  onClick={() => handleSelect(m)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left text-sm"
                >
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.referral_code} • Level {m.depth}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Per-User Report */}
        {selectedUser && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  Income Report for: {selectedUser.full_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.referral_code} — Level {selectedUser.depth} Member
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            </div>

            {/* Section A: Level Income */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Level Income from this User</h4>
              {levelEarnings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead className="text-right">Order Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Income</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {levelEarnings.map(e => (
                        <TableRow key={e.commission_id}>
                          <TableCell className="text-sm">{format(parseISO(e.created_at), "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-sm">{e.order_number || e.order_id?.slice(0, 8)}</TableCell>
                          <TableCell className="text-right">{currencySymbol}{Number(e.order_amount || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">Level {e.level}</Badge></TableCell>
                          <TableCell className="text-right font-medium">{currencySymbol}{Number(e.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={e.status === "paid" ? "default" : "outline"} className="text-xs capitalize">{e.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-3">No level income from this user in selected period.</p>
              )}
            </div>

            {/* Section B: Repurchase Income */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Repurchase Income from this User</h4>
              {repurchaseEarnings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead className="text-right">Order Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Income</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repurchaseEarnings.map(e => (
                        <TableRow key={e.commission_id}>
                          <TableCell className="text-sm">{format(parseISO(e.created_at), "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-sm">{e.order_number || e.order_id?.slice(0, 8)}</TableCell>
                          <TableCell className="text-right">{currencySymbol}{Number(e.order_amount || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">Repurchase</Badge></TableCell>
                          <TableCell className="text-right font-medium">{currencySymbol}{Number(e.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={e.status === "paid" ? "default" : "outline"} className="text-xs capitalize">{e.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-3">No repurchase income from this user in selected period.</p>
              )}
            </div>

            {/* Section C: Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Level Income Total:</span>
                <span className="font-medium">{currencySymbol}{levelTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repurchase Income Total:</span>
                <span className="font-medium">{currencySymbol}{repurchaseTotal.toLocaleString()}</span>
              </div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between text-sm font-bold">
                <span>Total Income from User:</span>
                <span>{currencySymbol}{(levelTotal + repurchaseTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {!selectedUser && !query && (
          <p className="text-sm text-muted-foreground">Search for any downline member to view income earned from them.</p>
        )}
      </CardContent>
    </Card>
  );
}
