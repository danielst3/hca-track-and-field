import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { drillsDatabase } from "../data/drillsDatabase";

// Build static drill map from the local database
const buildStaticDrillMap = () => {
  const map = {};
  drillsDatabase.forEach(drill => {
    map[drill.name.toLowerCase()] = drill;
  });
  return map;
};

const staticDrillMap = buildStaticDrillMap();

// Hook to get all resource titles for pattern building
export function useResourceTitles() {
  const { data: resources = [] } = useQuery({
    queryKey: ["resources-for-linking"],
    queryFn: () => base44.entities.Resource.list(),
    staleTime: 60000,
  });
  return resources;
}

export default function DrillLink({ drillKey, displayText, resources = [] }) {
  const [open, setOpen] = useState(false);
  
  const lowerKey = drillKey.toLowerCase();
  
  // First check static database
  const staticDrill = staticDrillMap[lowerKey];
  
  // Then check dynamic resources (by title match)
  const resourceDrill = !staticDrill 
    ? resources.find(r => r.title.toLowerCase() === lowerKey)
    : null;

  const drill = staticDrill || null;
  const resourceMatch = resourceDrill || null;

  if (!drill && !resourceMatch) {
    return <span>{displayText}</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)] font-semibold underline decoration-dotted cursor-pointer"
      >
        {displayText}
        <Info className="w-3 h-3" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl">{drill?.name || resourceMatch?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {drill ? (
              <>
                {drill.purpose && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Purpose:</p>
                    <p className="text-slate-600 dark:text-gray-400">{drill.purpose}</p>
                  </div>
                )}
                {drill.setup && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Setup:</p>
                    <p className="text-slate-600 dark:text-gray-400">{drill.setup}</p>
                  </div>
                )}
                {drill.executionSteps && drill.executionSteps.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Execution:</p>
                    <ol className="space-y-2">
                      {drill.executionSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-300">
                          <span className="font-semibold text-[var(--brand-primary)] min-w-[20px]">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {drill.cues && drill.cues.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Coaching Cues:</p>
                    <div className="flex flex-wrap gap-2">
                      {drill.cues.map((cue, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[var(--brand-secondary)] text-[var(--brand-primary)] text-sm rounded-full font-medium dark:bg-gray-700 dark:text-gray-200">
                          "{cue}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {drill.commonFaultsFixes && drill.commonFaultsFixes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Common Faults & Fixes:</p>
                    <div className="space-y-2">
                      {drill.commonFaultsFixes.map((item, idx) => (
                        <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-sm">
                          <span className="text-slate-700 dark:text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Dynamic resource from DB
              <div>
                <p className="text-slate-600 dark:text-gray-300 whitespace-pre-wrap">{resourceMatch.content}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function parseDrillText(text, resourceTitles = []) {
  if (!text) return [{ type: 'text', content: '' }];

  // All known keys: static drills + dynamic resource titles
  const staticKeys = Object.keys(staticDrillMap);
  const dynamicKeys = resourceTitles.map(r => r.title.toLowerCase());
  const allKeys = Array.from(new Set([...staticKeys, ...dynamicKeys]));
  
  // Sort by length (longest first) to match longer phrases before shorter ones
  allKeys.sort((a, b) => b.length - a.length);

  if (allKeys.length === 0) return [{ type: 'text', content: text }];

  const pattern = new RegExp(`(${allKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'drill', drillKey: match[0], displayText: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}