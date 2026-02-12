import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StrengthPlanCard({ strengthPlan, prehab }) {
  const [expanded, setExpanded] = useState(true);

  if (!strengthPlan && (!prehab || prehab.length === 0)) return null;

  return (
    <Card className="border-orange-500/20 bg-orange-500/5 backdrop-blur-sm">
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-orange-400" />
            <div>
              <CardTitle className="text-lg font-bold text-orange-400">
                Strength & Prehab
              </CardTitle>
              {strengthPlan?.type && (
                <p className="text-slate-400 text-sm mt-0.5">{strengthPlan.type}</p>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {strengthPlan?.exercises && strengthPlan.exercises.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Lifts</p>
              <div className="space-y-2">
                {strengthPlan.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{ex.name}</p>
                      {ex.notes && <p className="text-xs text-slate-500 mt-0.5">{ex.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">
                        {ex.sets}×{ex.reps}
                      </p>
                      {ex.load && <p className="text-xs text-slate-500">{ex.load}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prehab && prehab.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Prehab</p>
              <div className="space-y-2">
                {prehab.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{ex.name}</p>
                      {ex.notes && <p className="text-xs text-slate-500 mt-0.5">{ex.notes}</p>}
                    </div>
                    <p className="text-sm text-slate-300">
                      {ex.sets}×{ex.reps}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}