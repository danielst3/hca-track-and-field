import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const eventColors = {
  shot: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: "🏋️" },
  discus: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", icon: "🥏" },
  javelin: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", icon: "🎯" },
};

export default function EventPlanCard({ event, plan }) {
  const [expanded, setExpanded] = useState(true);
  const colors = eventColors[event] || eventColors.shot;

  if (!plan) return null;

  return (
    <Card className={cn("border", colors.border, colors.bg, "bg-opacity-50 backdrop-blur-sm")}>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{colors.icon}</span>
            <div>
              <CardTitle className={cn("text-lg font-bold capitalize", colors.text)}>
                {event === "shot" ? "Shot Put" : event.charAt(0).toUpperCase() + event.slice(1)}
              </CardTitle>
              {plan.theme && (
                <p className="text-slate-400 text-sm mt-0.5">{plan.theme}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {plan.throw_count > 0 && (
              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                <Target className="w-3 h-3 mr-1" />
                {plan.throw_count} throws
              </Badge>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {plan.warmup && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Warm-up</p>
              <p className="text-slate-300 text-sm">{plan.warmup}</p>
            </div>
          )}

          {plan.drills && plan.drills.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Drill Sequence</p>
              <div className="space-y-2">
                {plan.drills.map((drill, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3"
                  >
                    <span className="text-xs font-bold text-slate-500 mt-0.5 w-5 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-200">{drill.name}</p>
                        {(drill.sets || drill.reps) && (
                          <span className="text-xs text-slate-400">
                            {drill.sets && `${drill.sets}×`}{drill.reps}
                          </span>
                        )}
                      </div>
                      {drill.cues && (
                        <p className="text-xs text-slate-400 mt-1 italic">"{drill.cues}"</p>
                      )}
                      {drill.notes && (
                        <p className="text-xs text-slate-500 mt-1">{drill.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.coaching_cues && plan.coaching_cues.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Key Cues</p>
              <div className="flex flex-wrap gap-2">
                {plan.coaching_cues.map((cue, i) => (
                  <span
                    key={i}
                    className={cn("px-2.5 py-1 rounded-md text-xs font-medium", colors.bg, colors.text, "border", colors.border)}
                  >
                    {cue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}