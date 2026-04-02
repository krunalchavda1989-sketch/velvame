import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, Users, Crown, Loader2,
  Shield, Search, X, Eye, ArrowLeft, List, GitFork
} from "lucide-react";
import { getAvatarUrl, getInitial } from "@/lib/avatarUtils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VerticalTreeGraph from "@/components/genealogy/VerticalTreeGraph";

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
  total_team: number;
  active_team: number;
}

interface BreadcrumbItem {
  profile_id: string;
  full_name: string;
}

const buildTree = (flatList: TreeMember[]): TreeNode | null => {
  if (flatList.length === 0) return null;

  // For admin: multiple roots possible (referred_by IS NULL)
  const nodesMap = new Map<string, TreeNode>();
  flatList.forEach((m) => {
    nodesMap.set(m.profile_id, { ...m, children: [], total_team: 0, active_team: 0 });
  });

  const roots: TreeNode[] = [];
  flatList.forEach((m) => {
    const node = nodesMap.get(m.profile_id)!;
    if (m.referred_by && nodesMap.has(m.referred_by)) {
      nodesMap.get(m.referred_by)!.children.push(node);
    } else if (m.depth === 0) {
      roots.push(node);
    }
  });

  // Compute total_team and active_team bottom-up
  const computeStats = (node: TreeNode): { total: number; active: number } => {
    let total = 0;
    let active = 0;
    for (const child of node.children) {
      total += 1;
      if (child.subscription_paid) active += 1;
      const sub = computeStats(child);
      total += sub.total;
      active += sub.active;
    }
    node.total_team = total;
    node.active_team = active;
    return { total, active };
  };
  roots.forEach(computeStats);

  // If single root, return it. If multiple, wrap in virtual root.
  if (roots.length === 1) return roots[0];
  if (roots.length === 0) return null;

  const virtualRoot: TreeNode = {
    profile_id: "virtual-root",
    user_id: "",
    full_name: "All Users",
    referral_code: "",
    title: "System",
    subscription_paid: true,
    avatar_url: null,
    referred_by: null,
    direct_referral_count: roots.length,
    depth: 0,
    children: roots.map((r) => ({ ...r, depth: 1, children: r.children.map(c => adjustDepth(c, 1)) })),
  };
  return virtualRoot;
};

const adjustDepth = (node: TreeNode, offset: number): TreeNode => ({
  ...node,
  depth: node.depth + offset,
  children: node.children.map((c) => adjustDepth(c, offset)),
});

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

const TreeNodeCard = ({
  node,
  defaultOpen = false,
  searchQuery = "",
  onEnterTree,
}: {
  node: TreeNode;
  defaultOpen?: boolean;
  searchQuery?: string;
  onEnterTree: (profileId: string, name: string) => void;
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const hasChildren = node.children.length > 0;
  const borderColor = levelColors[node.depth] || "border-border";

  const matchesSearch =
    searchQuery.length > 1 &&
    (node.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.referral_code.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    if (searchQuery.length > 1 && hasChildren) {
      const hasMatchInSubtree = (n: TreeNode): boolean => {
        if (
          n.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.referral_code.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return true;
        return n.children.some(hasMatchInSubtree);
      };
      if (node.children.some(hasMatchInSubtree)) setExpanded(true);
    }
  }, [searchQuery]);

  if (node.profile_id === "virtual-root") {
    return (
      <div>
        <div className="mb-3">
          <Badge variant="outline" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            System Root — {node.children.length} top-level users
          </Badge>
        </div>
        <div className="ml-0 space-y-2">
          {node.children.map((child) => (
            <TreeNodeCard
              key={child.profile_id}
              node={child}
              defaultOpen={true}
              searchQuery={searchQuery}
              onEnterTree={onEnterTree}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border-2 ${borderColor} ${matchesSearch ? "ring-2 ring-primary/40 bg-primary/5" : "bg-card"} p-4 hover:shadow-md transition-all`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => hasChildren && setExpanded(!expanded)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
          >
            {hasChildren ? (
              expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
            )}
          </button>

           <div className="relative flex-shrink-0">
            {getAvatarUrl(node.avatar_url) ? (
              <img src={getAvatarUrl(node.avatar_url)!} alt={node.full_name} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{getInitial(node.full_name)}</span>
              </div>
            )}
            {node.subscription_paid && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                <Shield className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground truncate">{node.full_name || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-muted-foreground">{node.referral_code}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">{node.title}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">L{node.depth}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {node.total_team > 0 && (
              <div className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full" title="Total Team / Active Team">
                <Users className="h-3 w-3" />
                <span>{node.active_team}/{node.total_team}</span>
              </div>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] ${node.subscription_paid ? "border-green-500/50 text-green-600 bg-green-500/10" : "border-muted text-muted-foreground"}`}
            >
              {node.subscription_paid ? "Active" : "Inactive"}
            </Badge>
            {node.direct_referral_count > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterTree(node.profile_id, node.full_name);
                }}
                title={`View ${node.full_name}'s tree`}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-5 mt-1 pl-5 border-l-2 border-border space-y-2 overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeCard
                key={child.profile_id}
                node={child}
                searchQuery={searchQuery}
                onEnterTree={onEnterTree}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminGenealogyTree = () => {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, levels: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = useCallback(async (rootProfileId?: string) => {
    setLoading(true);
    const params: any = {};
    if (rootProfileId) params._root_profile_id = rootProfileId;

    const { data, error } = await supabase.rpc("get_admin_genealogy_tree" as any, params);
    if (error) {
      console.error("Admin genealogy fetch error:", error);
      setLoading(false);
      return;
    }

    const members = (data || []) as TreeMember[];
    const root = buildTree(members);
    setTree(root);

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.subscription_paid).length;
    const maxLevel = members.reduce((max, m) => Math.max(max, m.depth), 0);
    setStats({ total: totalMembers, active: activeMembers, levels: maxLevel });
    setLoading(false);
  }, []);

  const handleEnterTree = (profileId: string, name: string) => {
    setBreadcrumbs((prev) => [...prev, { profile_id: profileId, full_name: name }]);
    setSearchQuery("");
    fetchTree(profileId);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setSearchQuery("");
      fetchTree();
    } else {
      const item = breadcrumbs[index];
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
      setSearchQuery("");
      fetchTree(item.profile_id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Genealogy Tree
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete system-wide referral network hierarchy
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === "graph" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("graph")}
            >
              <GitFork className="h-3.5 w-3.5" />
              Graph
            </Button>
          </div>
        </div>

        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => handleBreadcrumbClick(-1)}>
              <ArrowLeft className="h-3 w-3 mr-1" />
              All Users
            </Button>
            {breadcrumbs.map((bc, i) => (
              <div key={bc.profile_id} className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">/</span>
                <Button
                  variant={i === breadcrumbs.length - 1 ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleBreadcrumbClick(i)}
                >
                  {bc.full_name}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or referral code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-card border-border"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Members", value: stats.total, icon: Users, gradient: "from-blue-500 to-blue-600" },
            { label: "Active Members", value: stats.active, icon: Shield, gradient: "from-emerald-500 to-emerald-600" },
            { label: "Deepest Level", value: stats.levels, icon: Crown, gradient: "from-purple-500 to-purple-600" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl bg-gradient-to-br ${s.gradient} p-4 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-80">{s.label}</span>
                <s.icon className="h-4 w-4 opacity-80" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tree ? (
          viewMode === "list" ? (
            <div className="space-y-2">
              <TreeNodeCard
                node={tree}
                defaultOpen={true}
                searchQuery={searchQuery}
                onEnterTree={handleEnterTree}
              />
            </div>
          ) : (
            <VerticalTreeGraph
              tree={tree}
              searchQuery={searchQuery}
              onEnterTree={handleEnterTree}
              isOwnTree={false}
            />
          )
        ) : (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No users yet</h3>
            <p className="text-sm text-muted-foreground">No users have registered in the system.</p>
          </div>
        )}

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
    </AdminLayout>
  );
};

export default AdminGenealogyTree;
