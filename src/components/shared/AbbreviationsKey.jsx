import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
];

export default function AbbreviationsKey() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Key
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Abbreviations</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {abbreviations.map((item) => (
            <div key={item.abbr} className="flex items-center gap-4">
              <span className="font-mono text-sm font-bold text-blue-600 w-20">
                {item.abbr}
              </span>
              <span className="text-sm text-slate-700">{item.full}</span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}