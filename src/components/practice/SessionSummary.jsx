import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Trophy, ArrowLeft } from "lucide-react";
import { createPageUrl } from "../../utils";
import { cn } from "@/lib/utils";

export default function SessionSummary({ allDrills, completedDrills, drillLogs, date, user }) {
  const completedCount = completedDrills.size;
  const totalCount = allDrills.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const allThrows = Object.entries(drillLogs)
    .filter(([key]) => !key.startsWith("note-"))
    .flatMap(([drillIdx, logs]) => logs.map(l => ({ ...l, drillIdx: parseInt(drillIdx) })));

  const totalThrows = allThrows.length;
  const bestThrow = allThrows.length > 0
    ? Math.max(...allThrows.map(l => parseFloat(l.distance) || 0))
    : null;

  const message = completionPct === 100
    ? "🏆 Perfect session! Every drill completed."
    : completionPct >= 75
    ? "💪 Great effort — nearly a full session!"
    : completionPct >= 50
    ? "👍 Solid work today."
    : "✅ Session wrapped. Keep building!";

  return (
    <div className="min-h-screen bg-[var(--brand-secondary)] dark:bg-[#111] p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-6">
          <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Session Complete</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{message}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completionPct}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
            </CardContent>
          </Card>
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalThrows}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Throws Logged</p>
            </CardContent>
          </Card>
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {bestThrow ? `${bestThrow}'` : "—"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Best Throw</p>
            </CardContent>
          </Card>
        </div>

        {/* Drill Breakdown */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base dark:text-gray-100">Drill Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allDrills.map((drill, idx) => {
              const done = completedDrills.has(idx);
              const throws = drillLogs[idx] || [];
              const note = drillLogs[`note-${idx}`];
              return (
                <div key={drill.key} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  done ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-700/50"
                )}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{drill.line}</p>
                    <Badge variant="outline" className="text-xs mt-1">{drill.eventLabel}</Badge>
                    {throws.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {throws.map((t, i) => (
                          <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {t.distance} ft
                          </span>
                        ))}
                      </div>
                    )}
                    {note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">📝 {note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Button asChild className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white">
          <a href={createPageUrl("Today")}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Today</a>
        </Button>
      </div>
    </div>
  );
}