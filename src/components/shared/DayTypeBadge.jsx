import React from "react";
import { cn } from "@/lib/utils";

const dayTypeConfig = {
  technical: {
    label: "Technical",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  primary: {
    label: "Primary Throws",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  indoor: {
    label: "Indoor Lift/Plyo",
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  tuneup: {
    label: "Tune-Up",
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
  },
  meet: {
    label: "Meet Day",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
  recovery: {
    label: "Recovery",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
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