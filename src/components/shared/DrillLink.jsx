import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { drillsDatabase } from "../data/drillsDatabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

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

  // Build combined list: abbreviations first, then resources, then drills
  const allLinks = [
    ...abbrLinks,
    ...(resources || []).map((r) => ({ key: `resource:${r.id}`, title: r.title.trim(), type: "resource", id: r.id, resource: r })),
    ...drillsDatabase.map((d) => ({ key: `drill:${d.name}`, title: d.name, type: "drill", name: d.name, drill: d })),
  ];

  if (allLinks.length === 0) return [{ type: "text", content: text }];

  // Sort longest first so multi-word names match before substrings
  const sorted = [...allLinks].sort((a, b) => b.title.length - a.title.length);
  const escaped = sorted.map((item) => item.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  // Use word boundaries so "IS" doesn't match inside "Finish", etc.
  const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "g");
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

function DrillOverlayContent({ linkItem, resources }) {
  if (!linkItem) return null;

  if (linkItem.type === "abbreviation") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{linkItem.abbr} — {linkItem.full}</DialogTitle>
        </DialogHeader>
        <p className="text-gray-600 dark:text-gray-300 mt-2">{linkItem.full}</p>
      </>
    );
  }

  if (linkItem.type === "drill") {
    const drill = linkItem.drill || drillsDatabase.find((d) => d.name === linkItem.name);
    if (!drill) return null;
    return (
      <>
        <DialogHeader>
          <DialogTitle>{drill.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3 text-sm">
          {drill.purpose && (
            <p className="text-gray-600 dark:text-gray-300 italic">{drill.purpose}</p>
          )}
          {drill.setup && (
            <div>
              <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-1">Setup</p>
              <p className="text-gray-700 dark:text-gray-300">{drill.setup}</p>
            </div>
          )}
          {drill.executionSteps && drill.executionSteps.length > 0 && (
            <div>
              <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-1">Steps</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {drill.executionSteps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          )}
          {drill.cues && drill.cues.length > 0 && (
            <div>
              <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-1">Cues</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300">
                {drill.cues.map((cue, i) => <li key={i}>{cue}</li>)}
              </ul>
            </div>
          )}
          {drill.commonFaultsFixes && drill.commonFaultsFixes.length > 0 && (
            <div>
              <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-1">Common Faults & Fixes</p>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                {drill.commonFaultsFixes.map((ff, i) => <li key={i}>{ff}</li>)}
              </ul>
            </div>
          )}
        </div>
      </>
    );
  }

  if (linkItem.type === "resource") {
    const resource = linkItem.resource || (resources || []).find((r) => r.id === linkItem.id);
    if (!resource) return null;
    return (
      <>
        <DialogHeader>
          <DialogTitle>{resource.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3 text-sm">
          {resource.content && (
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{resource.content}</p>
          )}
          {resource.file_url && (
            <a
              href={resource.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 underline"
            >
              <ExternalLink className="w-3 h-3" /> View File
            </a>
          )}
          {resource.link_url && (
            <a
              href={resource.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 underline"
            >
              <ExternalLink className="w-3 h-3" /> Open Link
            </a>
          )}
        </div>
      </>
    );
  }

  return null;
}

export default function DrillLink({ displayText, linkItem, resources }) {
  const [open, setOpen] = useState(false);

  if (!linkItem) return <span>{displayText}</span>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-blue-600 dark:text-blue-400 underline decoration-dotted hover:decoration-solid font-medium cursor-pointer"
      >
        {displayText}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DrillOverlayContent linkItem={linkItem} resources={resources} />
        </DialogContent>
      </Dialog>
    </>
  );
}