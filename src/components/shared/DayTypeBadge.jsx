import React from "react";
import { cn } from "@/lib/utils";

const dayTypeConfig = {
  technical: {
    label: "Technical",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    dot: "bg-blue-500",
  },
  primary: {
    label: "Primary Throws",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-500",
  },
  indoor: {
    label: "Indoor Lift/Plyo",
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
    dot: "bg-orange-500",
  },
  tuneup: {
    label: "Tune-Up",
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
    dot: "bg-purple-500",
  },
  meet: {
    label: "Meet Day",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    dot: "bg-red-500",
  },
  recovery: {
    label: "Recovery",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
    dot: "bg-gray-400",
  },
};

export default function DayTypeBadge({ type, className }) {
  const config = dayTypeConfig[type] || dayTypeConfig.recovery;
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-semibold border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export const getDayTypeColors = (type) => {
  return dayTypeConfig[type] || dayTypeConfig.recovery;
};