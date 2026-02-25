import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export function useResourceTitles() {
  const { data: resources = [] } = useQuery({
    queryKey: ["resources-for-drill-links"],
    queryFn: () => base44.entities.Resource.list(),
  });
  return resources;
}

// Parse text and identify drill names that match resource titles
export function parseDrillText(text, resources) {
  if (!text || !resources || resources.length === 0) return [{ type: "text", content: text }];

  const titles = resources.map((r) => r.title);
  // Sort by length descending to match longer titles first
  const sorted = [...titles].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (escaped.length === 0) return [{ type: "text", content: text }];

  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const matched = match[0];
    const resource = resources.find((r) => r.title.toLowerCase() === matched.toLowerCase());
    parts.push({ type: "drill", drillKey: resource?.id, displayText: matched, resourceId: resource?.id });
    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
}

export default function DrillLink({ drillKey, displayText, resources }) {
  const resource = resources?.find((r) => r.id === drillKey);
  if (!resource) return <span>{displayText}</span>;

  return (
    <Link
      to={createPageUrl(`Resources?highlight=${resource.id}`)}
      className="text-blue-600 dark:text-blue-400 underline decoration-dotted hover:decoration-solid font-medium"
    >
      {displayText}
    </Link>
  );
}