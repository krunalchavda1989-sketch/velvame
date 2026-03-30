import React from "react";

/** Vibrant color palette for all admin charts */
export const VIBRANT_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
];

/** Gradient definitions to drop inside <defs> of any SVG chart */
export const ChartGradients = () => (
  <>
    <linearGradient id="grad-indigo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="grad-emerald" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="grad-violet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
    </linearGradient>
  </>
);

/** Shared styled tooltip */
export const chartTooltipStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(99, 102, 241, 0.3)",
  borderRadius: 12,
  fontSize: 12,
  color: "#e2e8f0",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  padding: "8px 12px",
};

/** Common axis tick style */
export const axisTick = { fontSize: 11, fill: "#94a3b8" };
