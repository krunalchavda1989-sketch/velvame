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

const NODE_WIDTH = 160;
const NODE_HEIGHT = 68;
const H_GAP = 32;
const V_GAP = 56;

const getSubtreeWidth = (node: TreeNode): number => {
  if (node.children.length === 0) return NODE_WIDTH;
  const childrenWidth = node.children.reduce(
    (sum, child) => sum + getSubtreeWidth(child) + H_GAP,
    -H_GAP
  );
  return Math.max(NODE_WIDTH, childrenWidth);
};

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

  const totalChildrenWidth = node.children.reduce(
    (sum, child) => sum + getSubtreeWidth(child) + H_GAP,
    -H_GAP
  );

  let currentX = x + NODE_WIDTH / 2 - totalChildrenWidth / 2;
  const childY = y + NODE_HEIGHT + V_GAP;

  node.children.forEach((child) => {
    const childWidth = getSubtreeWidth(child);
    const childX = currentX + childWidth / 2 - NODE_WIDTH / 2;

    const childPos: NodePosition = { x: childX, y: childY, node: child };
    edges.push({ from: pos, to: childPos });

    layoutTree(child, childX, childY, positions, edges);
    currentX += childWidth + H_GAP;
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
      transition={{ delay: node.depth * 0.06 }}
    >
      <foreignObject x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT}>
        <div
          className={`h-full rounded-xl border bg-gradient-to-br ${colors} p-2 cursor-pointer hover:shadow-lg transition-shadow ${
            matchesSearch ? "ring-2 ring-primary shadow-lg" : ""
          }`}
          onClick={() => {
            if (node.depth > 0 && node.direct_referral_count > 0) {
              onEnterTree(node.profile_id, node.full_name);
            }
          }}
        >
          <div className="flex items-center gap-2 h-full">
            <div className="relative flex-shrink-0">
              {node.avatar_url ? (
                <img
                  src={node.avatar_url}
                  alt={node.full_name}
                  className="w-8 h-8 rounded-full object-cover border border-border/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-background/60 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {node.subscription_paid && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <Shield className="h-2 w-2 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-foreground truncate block max-w-[80px]">
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

const VerticalTreeGraph = ({
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
  const [pan, setPan] = useState({ x: 0, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const positions: NodePosition[] = [];
  const edges: { from: NodePosition; to: NodePosition }[] = [];

  const totalWidth = getSubtreeWidth(tree);
  const startX = totalWidth / 2 - NODE_WIDTH / 2;
  layoutTree(tree, startX, 0, positions, edges);

  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x + NODE_WIDTH));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y + NODE_HEIGHT));

  const svgWidth = maxX - minX + 80;
  const svgHeight = maxY - minY + 80;

  const offsetX = -minX + 40;
  const offsetY = -minY + 40;

  // Center horizontally on mount
  useEffect(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth;
      const scale = Math.min(1, (containerW - 40) / svgWidth);
      setZoom(scale);
      setPan({
        x: (containerW - svgWidth * scale) / 2,
        y: 20,
      });
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

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const oldZoom = zoom;
    const newZoom = Math.min(2, Math.max(0.1, oldZoom - e.deltaY * 0.001));
    
    // Zoom toward mouse position
    const scale = newZoom / oldZoom;
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * scale,
      y: mouseY - (mouseY - prev.y) * scale,
    }));
    setZoom(newZoom);
  }, [zoom]);

  // Use native wheel event to allow preventDefault on passive listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel as any, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel as any);
  }, [handleWheel]);

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

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={() => setZoom((z) => Math.min(2, z + 0.15))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={() => setZoom((z) => Math.max(0.15, z - 0.15))}>
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
        className="w-full h-[500px] lg:h-[650px] cursor-grab active:cursor-grabbing select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            overflow: "visible",
          }}
        >
          {/* Edges - vertical connectors */}
          {edges.map((edge, i) => {
            const x1 = edge.from.x + offsetX + NODE_WIDTH / 2;
            const y1 = edge.from.y + offsetY + NODE_HEIGHT;
            const x2 = edge.to.x + offsetX + NODE_WIDTH / 2;
            const y2 = edge.to.y + offsetY;
            const midY = (y1 + y2) / 2;

            return (
              <motion.path
                key={i}
                d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: i * 0.015 }}
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

export default VerticalTreeGraph;
