import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { drillsDatabase } from "../data/drillsDatabase";

export function useResourceTitles() {
  const { data: resources = [] } = useQuery({
    queryKey: ["resources-for-drill-links"],
    queryFn: () => base44.entities.Resource.list(),
  });
  return resources;
}

// Parse text and identify drill names that match resource titles OR drillsDatabase entries
export function parseDrillText(text, resources) {
  if (!text) return [{ type: "text", content: text }];

  // Build combined list: custom resources + drillsDatabase entries
  const allLinks = [
    ...(resources || []).map((r) => ({ key: `resource:${r.id}`, title: r.title.trim(), type: "resource", id: r.id })),
    ...drillsDatabase.map((d) => ({ key: `drill:${d.name}`, title: d.name, type: "drill", name: d.name })),
  ];

  if (allLinks.length === 0) return [{ type: "text", content: text }];

  const sorted = [...allLinks].sort((a, b) => b.title.length - a.title.length);
  const escaped = sorted.map((item) => item.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const matched = match[0];
    const link = sorted.find((item) => item.title.toLowerCase() === matched.toLowerCase());
    parts.push({ type: "drill", linkItem: link, displayText: matched });
    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
}

export default function DrillLink({ displayText, linkItem }) {
  if (!linkItem) return <span>{displayText}</span>;

  if (linkItem.type === "resource") {
    return (
      <Link
        to={createPageUrl(`Resources?highlight=${linkItem.id}`)}
        className="text-blue-600 dark:text-blue-400 underline decoration-dotted hover:decoration-solid font-medium"
      >
        {displayText}
      </Link>
    );
  }

  // drillsDatabase entry
  const categoryMap = {
    "Shot": "drills-shot",
    "Discus": "drills-discus",
    "Javelin": "drills-javelin",
    "Strength": "drills-strength",
    "Prehab": "drills-prehab",
    "Warm-up": "drills-warmup",
  };
  const drill = drillsDatabase.find((d) => d.name === linkItem.name);
  const section = drill ? (categoryMap[drill.category] || "drills-shot") : "drills-shot";
  const encodedName = encodeURIComponent(linkItem.name);

  return (
    <Link
      to={createPageUrl(`Resources?section=${section}&highlight=${encodedName}`)}
      className="text-blue-600 dark:text-blue-400 underline decoration-dotted hover:decoration-solid font-medium"
    >
      {displayText}
    </Link>
  );
}