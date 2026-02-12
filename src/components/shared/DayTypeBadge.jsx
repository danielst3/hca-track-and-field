import React from "react";
import { cn } from "@/lib/utils";

const dayTypeConfig = {
  technical: { label: "Technical", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  primary: { label: "Primary Throws", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  indoor: { label: "Indoor Lift/Plyo", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  tuneup: { label: "Tune-Up", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  meet: { label: "Meet Day", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  recovery: { label: "Recovery", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  off: { label: "Off", color: "bg-slate-500/20 text-slate-500 border-slate-500/30" },
};

export const getDayTypeColor = (type) => {
  const config = dayTypeConfig[type];
  return config || dayTypeConfig.off;
};

export const getDayTypeDotColor = (type) => {
  const dotColors = {
    technical: "bg-blue-400",
    primary: "bg-emerald-400",
    indoor: "bg-orange-400",
    tuneup: "bg-purple-400",
    meet: "bg-red-400",
    recovery: "bg-slate-400",
    off: "bg-slate-500",
  };
  return dotColors[type] || "bg-slate-500";
};

export default function DayTypeBadge({ type, className }) {
  const config = getDayTypeColor(type);
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", config.color, className)}>
      {config.label}
    </span>
  );
}