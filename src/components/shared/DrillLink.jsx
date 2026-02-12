import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { drillsDatabase } from "../data/drillsDatabase";

// Build searchable drill map from database
const buildDrillMap = () => {
  const map = {};
  
  drillsDatabase.forEach(drill => {
    // Add by full name (case insensitive key)
    const key = drill.name.toLowerCase();
    map[key] = drill;
    
    // Add common abbreviations
    if (drill.name.includes("PP")) map["pp"] = drill;
    if (drill.name.includes("Power Position")) map["power position"] = drill;
    if (drill.name.includes("Full Throw")) map["ft"] = drill;
    if (drill.name.includes("South African")) map["sa"] = drill;
    if (drill.name.includes("Impulse Step")) map["is"] = drill;
    if (drill.name.includes("Medicine Ball")) map["mb"] = drill;
    if (drill.name.includes("External Rotation")) map["er"] = drill;
    if (drill.name.includes("Technical Quality")) map["tq"] = drill;
    if (drill.name.includes("Step-In")) map["step-in"] = drill;
    if (drill.name.includes("Block Freeze")) map["block freeze"] = drill;
    if (drill.name.includes("Stand Throw")) map["stand throw"] = drill;
    if (drill.name.includes("Finish Freeze")) map["finish freeze"] = drill;
    if (drill.name.includes("Wheel")) map["wheel"] = drill;
    if (drill.name.includes("3-Step")) map["3-step"] = drill;
    if (drill.name.includes("Carry")) map["carry"] = drill;
    if (drill.name.includes("Rhythm Runs")) map["rhythm runs"] = drill;
    if (drill.name.includes("Trap Bar Jump")) map["trap bar jump"] = drill;
    if (drill.name.includes("Push Press")) map["push press"] = drill;
    if (drill.name.includes("Back Squat")) map["back squat"] = drill;
    if (drill.name.includes("Front Squat")) map["front squat"] = drill;
    if (drill.name.includes("RDL") || drill.name.includes("Romanian Deadlift")) map["rdl"] = drill;
    if (drill.name.includes("Copenhagen")) map["copenhagen"] = drill;
    if (drill.name.includes("Scap Row")) map["scap row"] = drill;
  });
  
  return map;
};

const drillMap = buildDrillMap();

export default function DrillLink({ drillKey, displayText }) {
  const [open, setOpen] = useState(false);
  const drill = drillMap[drillKey.toLowerCase()];

  if (!drill) {
    return <span>{displayText}</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold underline decoration-dotted cursor-pointer"
      >
        {displayText}
        <Info className="w-3 h-3" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl">{drill.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {drill.purpose && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Purpose:</p>
                <p className="text-slate-600">{drill.purpose}</p>
              </div>
            )}
            
            {drill.setup && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Setup:</p>
                <p className="text-slate-600">{drill.setup}</p>
              </div>
            )}
            
            {drill.executionSteps && drill.executionSteps.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Execution:</p>
                <ol className="space-y-2">
                  {drill.executionSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="font-semibold text-blue-600 min-w-[20px]">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            {drill.cues && drill.cues.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Coaching Cues:</p>
                <div className="flex flex-wrap gap-2">
                  {drill.cues.map((cue, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium"
                    >
                      "{cue}"
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {drill.commonFaultsFixes && drill.commonFaultsFixes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Common Faults & Fixes:</p>
                <div className="space-y-2">
                  {drill.commonFaultsFixes.map((item, idx) => (
                    <div key={idx} className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function parseDrillText(text) {
  if (!text) return [{ type: 'text', content: '' }];
  
  // Create pattern for all drill keys
  const drillKeys = Object.keys(drillMap);
  // Sort by length (longest first) to match longer phrases before shorter ones
  drillKeys.sort((a, b) => b.length - a.length);
  
  const pattern = new RegExp(`\\b(${drillKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
  
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