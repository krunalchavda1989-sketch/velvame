import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Shield, Users, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface NodePosition {
  x: number;
  y: number;
  node: TreeNode;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 72;
const H_GAP = 60;
const V_GAP = 24;

// Calculate subtree height
const getSubtreeHeight = (node: TreeNode): number => {
  if (node.children.length === 0) return NODE_HEIGHT;
  const childrenHeight = node.children.reduce(
    (sum, child) => sum + getSubtreeHeight(child) + V_GAP,
    -V_GAP
  );
  return Math.max(NODE_HEIGHT, childrenHeight);
};

// Layout nodes horizontally
const layoutTree = (
  node: TreeNode,
  x: number,
  y: number,
  positions: NodePosition[],
  edges: { from: NodePosition; to: NodePosition }[]
): void => {
  const pos: NodePosition = { x, y, node };
  positions.push(pos);

  if (node.children.length === 0) return;

  const totalChildrenHeight = node.children.reduce(
    (sum, child) => sum + getSubtreeHeight(child) + V_GAP,
    -V_GAP
  );

  let currentY = y - totalChildrenHeight / 2 + NODE_HEIGHT / 2;
  const childX = x + NODE_WIDTH + H_GAP;

  node.children.forEach((child) => {
    const childHeight = getSubtreeHeight(child);
    const childY = currentY + childHeight / 2 - NODE_HEIGHT / 2;

    const childPos: NodePosition = { x: childX, y: childY, node: child };
    edges.push({ from: pos, to: childPos });

    layoutTree(child, childX, childY, positions, edges);
    currentY += childHeight + V_GAP;
  });
};

const tierColors: Record<number, string> = {
  0: "from-primary/20 to-primary/5 border-primary/50",
  1: "from-blue-500/20 to-blue-500/5 border-blue-500/50",
  2: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/50",
  3: "from-amber-500/20 to-amber-500/5 border-amber-500/50",
  4: "from-purple-500/20 to-purple-500/5 border-purple-500/50",
  5: "from-pink-500/20 to-pink-500/5 border-pink-500/50",
  6: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/50",
  7: "from-orange-500/20 to-orange-500/5 border-orange-500/50",
  8: "from-rose-500/20 to-rose-500/5 border-rose-500/50",
  9: "from-teal-500/20 to-teal-500/5 border-teal-500/50",
};

const GraphNode = ({
  pos,
  searchQuery,
  onEnterTree,
  isOwnTree,
}: {
  pos: NodePosition;
  searchQuery: string;
  onEnterTree: (profileId: string, name: string) => void;
  isOwnTree: boolean;
}) => {
  const { node, x, y } = pos;
  const colors = tierColors[node.depth] || tierColors[0];

  const matchesSearch =
    searchQuery.length > 1 &&
    (node.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.referral_code.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: node.depth * 0.05 }}
    >
      <foreignObject x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT}>
        <div
          className={`h-full rounded-xl border bg-gradient-to-br ${colors} p-2.5 cursor-pointer hover:shadow-lg transition-shadow ${
            matchesSearch ? "ring-2 ring-primary shadow-lg" : ""
          }`}
          onClick={() => {
            if (node.depth > 0 && node.direct_referral_count > 0) {
              onEnterTree(node.profile_id, node.full_name);
            }
          }}
        >
          <div className="flex items-center gap-2 h-full">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {node.avatar_url ? (
                <img
                  src={node.avatar_url}
                  alt={node.full_name}
                  className="w-9 h-9 rounded-full object-cover border border-border/50"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-background/60 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {node.subscription_paid && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <Shield className="h-2 w-2 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-foreground truncate block max-w-[90px]">
                  {node.full_name || "Unknown"}
                </span>
                {node.depth === 0 && isOwnTree && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-primary text-primary">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground truncate">{node.referral_code}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-muted-foreground">{node.title}</span>
                {node.direct_referral_count > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <Users className="h-2.5 w-2.5" />
                    {node.direct_referral_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
    </motion.g>
  );
};

const HorizontalTreeGraph = ({
  tree,
  searchQuery,
  onEnterTree,
  isOwnTree,
}: {
  tree: TreeNode;
  searchQuery: string;
  onEnterTree: (profileId: string, name: string) => void;
  isOwnTree: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layout calculation
  const positions: NodePosition[] = [];
  const edges: { from: NodePosition; to: NodePosition }[] = [];

  const totalHeight = getSubtreeHeight(tree);
  const startY = totalHeight / 2;
  layoutTree(tree, 0, startY, positions, edges);

  // Find bounds
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x + NODE_WIDTH));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y + NODE_HEIGHT));

  const svgWidth = maxX - minX + 80;
  const svgHeight = maxY - minY + 80;

  // Center vertically on mount
  useEffect(() => {
    if (containerRef.current) {
      const containerH = containerRef.current.clientHeight;
      const offsetY = (containerH - svgHeight * zoom) / 2;
      setPan((prev) => ({ ...prev, y: Math.max(offsetY, 0) }));
    }
  }, [tree]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.2, z - e.deltaY * 0.001)));
  }, []);

  const fitToScreen = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scaleX = (cw - 40) / svgWidth;
    const scaleY = (ch - 40) / svgHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(newZoom);
    setPan({
      x: (cw - svgWidth * newZoom) / 2,
      y: (ch - svgHeight * newZoom) / 2,
    });
  };

  // Offset positions so min is at (40, 40)
  const offsetX = -minX + 40;
  const offsetY = -minY + 40;

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={() => setZoom((z) => Math.min(2, z + 0.15))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={() => setZoom((z) => Math.max(0.2, z - 0.15))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={fitToScreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-3 left-3 z-10">
        <Badge variant="secondary" className="text-[10px]">
          {Math.round(zoom * 100)}%
        </Badge>
      </div>

      <div
        ref={containerRef}
        className="w-full h-[500px] lg:h-[600px] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const x1 = edge.from.x + offsetX + NODE_WIDTH;
            const y1 = edge.from.y + offsetY + NODE_HEIGHT / 2;
            const x2 = edge.to.x + offsetX;
            const y2 = edge.to.y + offsetY + NODE_HEIGHT / 2;
            const midX = (x1 + x2) / 2;

            return (
              <motion.path
                key={i}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
              />
            );
          })}

          {/* Nodes */}
          {positions.map((pos) => (
            <GraphNode
              key={pos.node.profile_id}
              pos={{ ...pos, x: pos.x + offsetX, y: pos.y + offsetY }}
              searchQuery={searchQuery}
              onEnterTree={onEnterTree}
              isOwnTree={isOwnTree}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default HorizontalTreeGraph;
