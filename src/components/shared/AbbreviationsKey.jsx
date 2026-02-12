import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookOpen } from "lucide-react";

const abbreviations = [
  { abbr: "PP", full: "Power Position" },
  { abbr: "FT", full: "Full Throw" },
  { abbr: "SA", full: "South African" },
  { abbr: "IS", full: "Impulse Step" },
  { abbr: "MB", full: "Medicine Ball" },
  { abbr: "ER", full: "External Rotation" },
  { abbr: "TQ", full: "Technical Quality throws" },
  { abbr: "Lift-H", full: "Strength emphasis" },
  { abbr: "Lift-P", full: "Power emphasis" },
  { abbr: "RDL", full: "Romanian Deadlift" },
];

export default function AbbreviationsKey() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-2">
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Key</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-slate-900 border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-white">Abbreviations</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {abbreviations.map((item) => (
            <div key={item.abbr} className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-blue-400 w-16 shrink-0">
                {item.abbr}
              </span>
              <span className="text-slate-300 text-sm">{item.full}</span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}