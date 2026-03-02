import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { drillsDatabase } from "../data/drillsDatabase";
import { toast } from "sonner";

export function useResourceTitles() {
  const { data: resources = [] } = useQuery({
    queryKey: ["resources-for-drill-links"],
    queryFn: () => base44.entities.Resource.list(),
  });
  return resources;
}

export function useAbbreviations() {
  const { data: abbreviations = [] } = useQuery({
    queryKey: ["abbreviations"],
    queryFn: () => base44.entities.Abbreviation.list(),
    staleTime: 60000,
  });
  return abbreviations;
}

// Parse text and identify drill names / abbreviations that match resource titles OR drillsDatabase entries
export function parseDrillText(text, resources, abbreviations) {
  if (!text) return [{ type: "text", content: text }];

  // All abbreviations get links showing their full meaning
  const abbrLinks = (abbreviations || []).map((ab) => ({
    key: `abbr:${ab.id}`,
    title: ab.abbr.trim(),
    type: "abbreviation",
    abbr: ab.abbr.trim(),
    full: ab.full.trim(),
  }));

  // Build combined list: abbreviations first (shorter, so sorted by length anyway), then resources, then drills
  const allLinks = [
    ...abbrLinks,
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

function DrillToast({ drill, resource }) {
  if (drill) {
    return (
      <div className="text-sm max-w-xs">
        <p className="font-bold text-base mb-1">{drill.name}</p>
        {drill.purpose && <p className="text-gray-600 dark:text-gray-300 mb-2 italic">{drill.purpose}</p>}
        {drill.cues && drill.cues.length > 0 && (
          <div>
            <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-1">Cues</p>
            <ul className="list-disc list-inside space-y-0.5">
              {drill.cues.map((cue, i) => <li key={i}>{cue}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }
  if (resource) {
    return (
      <div className="text-sm max-w-xs">
        <p className="font-bold text-base mb-1">{resource.title}</p>
        {resource.content && <p className="text-gray-600 dark:text-gray-300">{resource.content}</p>}
      </div>
    );
  }
  return null;
}

export default function DrillLink({ displayText, linkItem, resources }) {
  if (!linkItem) return <span>{displayText}</span>;

  const handleClick = (e) => {
    e.preventDefault();
    if (linkItem.type === "drill") {
      const drill = drillsDatabase.find((d) => d.name === linkItem.name);
      if (drill) {
        toast(<DrillToast drill={drill} />, { duration: 6000 });
      }
    } else if (linkItem.type === "resource") {
      const resource = (resources || []).find((r) => r.id === linkItem.id);
      if (resource) {
        toast(<DrillToast resource={resource} />, { duration: 6000 });
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 dark:text-blue-400 underline decoration-dotted hover:decoration-solid font-medium cursor-pointer"
    >
      {displayText}
    </button>
  );
}