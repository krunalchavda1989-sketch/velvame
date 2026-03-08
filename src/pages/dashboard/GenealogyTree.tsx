import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, User, Users, Crown, Loader2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TreeMember {
  profile_id: string;
  user_id: string;
  full_name: string;
  referral_code: string;
  title: string;
  subscription_paid: boolean;
  avatar_url: string | null;
  referred_by: string | null;
  direct_referral_count: number;
  depth: number;
}

interface TreeNode extends TreeMember {
  children: TreeNode[];
}

const buildTree = (flatList: TreeMember[]): TreeNode | null => {
  if (flatList.length === 0) return null;
  const root = { ...flatList[0], children: [] as TreeNode[] };
  const map = new Map<string, TreeNode>();
  map.set(root.profile_id, root);

  for (let i = 1; i < flatList.length; i++) {
    const node: TreeNode = { ...flatList[i], children: [] };
    map.set(node.profile_id, node);
    const parent = node.referred_by ? map.get(node.referred_by) : null;
    if (parent) parent.children.push(node);
  }
  return root;
};

const levelColors: Record<number, string> = {
  0: "border-primary",
  1: "border-blue-500",
  2: "border-emerald-500",
  3: "border-amber-500",
  4: "border-purple-500",
  5: "border-pink-500",
  6: "border-cyan-500",
  7: "border-orange-500",
  8: "border-rose-500",
  9: "border-teal-500",
};

const TreeNodeCard = ({ node, defaultOpen = false }: { node: TreeNode; defaultOpen?: boolean }) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const hasChildren = node.children.length > 0;
  const borderColor = levelColors[node.depth] || "border-border";

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border-2 ${borderColor} bg-card p-4 cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {node.avatar_url ? (
              <img src={node.avatar_url} alt={node.full_name} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {node.subscription_paid && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                <Shield className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground truncate">{node.full_name || "Unknown"}</span>
              {node.depth === 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">You</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-muted-foreground">{node.referral_code}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">{node.title}</span>
            </div>
          </div>

          {/* Stats & expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {node.direct_referral_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Users className="h-3 w-3" />
                <span>{node.direct_referral_count}</span>
              </div>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] ${node.subscription_paid ? "border-green-500/50 text-green-600 bg-green-500/10" : "border-muted text-muted-foreground"}`}
            >
              {node.subscription_paid ? "Active" : "Inactive"}
            </Badge>
            {hasChildren && (
              <div className="text-muted-foreground">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-5 mt-1 pl-5 border-l-2 border-border space-y-2 overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeCard key={child.profile_id} node={child} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GenealogyTree = () => {
  const { user } = useAuth();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, levels: 0 });

  useEffect(() => {
    if (!user) return;
    fetchTree();
  }, [user]);

  const fetchTree = async () => {
    const { data, error } = await supabase.rpc("get_genealogy_tree", { _user_id: user!.id });
    if (error) {
      console.error("Genealogy fetch error:", error);
      setLoading(false);
      return;
    }

    const members = (data || []) as TreeMember[];
    const root = buildTree(members);
    setTree(root);

    const totalMembers = members.length - 1; // exclude self
    const activeMembers = members.filter((m, i) => i > 0 && m.subscription_paid).length;
    const maxLevel = members.reduce((max, m) => Math.max(max, m.depth), 0);
    setStats({ total: totalMembers, active: activeMembers, levels: maxLevel });
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Genealogy Tree
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual overview of your referral network hierarchy
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Members</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Members</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.levels}</p>
            <p className="text-xs text-muted-foreground mt-1">Deepest Level</p>
          </div>
        </div>

        {/* Tree */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tree ? (
          <div className="space-y-2">
            <TreeNodeCard node={tree} defaultOpen={true} />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No network yet</h3>
            <p className="text-sm text-muted-foreground">Share your referral link to start building your team.</p>
          </div>
        )}

        {/* Level Legend */}
        <div className="mt-8 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Level Colors</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full border-2 ${levelColors[i]}`} />
                <span className="text-[11px] text-muted-foreground">L{i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GenealogyTree;
