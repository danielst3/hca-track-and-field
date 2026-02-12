import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

const drillDatabase = {
  "PP": {
    name: "Power Position",
    fullName: "Power Position Throws",
    events: ["Shot", "Discus"],
    description: "Start from final power position, focus on block and drive through release. Builds explosive power and proper finish mechanics."
  },
  "FT": {
    name: "Full Throw",
    fullName: "Full Throw",
    events: ["Shot", "Discus", "Javelin"],
    description: "Complete throwing motion from start to finish. Focus on rhythm and coordination throughout the entire movement."
  },
  "SA": {
    name: "South African",
    fullName: "South Africans",
    events: ["Shot"],
    description: "Standing throw with feet together, emphasizing chest drive and arm extension. Develops upper body power and coordination."
  },
  "IS": {
    name: "Impulse Step",
    fullName: "Impulse Steps",
    events: ["Discus"],
    description: "Quick rhythm steps to build momentum and timing. Helps develop smooth transitions in the throwing motion."
  },
  "MB": {
    name: "Medicine Ball",
    fullName: "Medicine Ball Work",
    events: ["Shot", "Discus", "Javelin"],
    description: "Overhead throws, chest passes, rotational throws. Develops core strength and explosive power."
  },
  "ER": {
    name: "External Rotation",
    fullName: "External Rotation Series",
    events: ["Javelin"],
    description: "Shoulder strengthening and mobility exercises. Critical for arm health and throwing efficiency."
  },
  "TQ": {
    name: "Technical Quality",
    fullName: "Technical Quality throws",
    events: ["Shot", "Discus", "Javelin"],
    description: "Focus on form over distance. Controlled throws emphasizing proper mechanics and consistency."
  },
};

export default function DrillLink({ code, children }) {
  const [open, setOpen] = useState(false);
  const drill = drillDatabase[code];

  if (!drill) {
    return <span>{children || code}</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold underline decoration-dotted cursor-pointer"
      >
        {children || code}
        <Info className="w-3 h-3" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-blue-600">{code}</span>
              <span>•</span>
              <span>{drill.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Events:</p>
              <div className="flex gap-2">
                {drill.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Description:</p>
              <p className="text-slate-700">{drill.description}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function parseDrillText(text) {
  if (!text) return text;
  
  const drillCodes = Object.keys(drillDatabase);
  const pattern = new RegExp(`\\b(${drillCodes.join('|')})\\b`, 'g');
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'drill', code: match[0] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}