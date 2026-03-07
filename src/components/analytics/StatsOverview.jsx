import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, TrendingUp, Target, Flame } from "lucide-react";

export default function StatsOverview({ logs, isTimeBased = false }) {
  if (!logs.length) return null;

  const getValue = (l) => isTimeBased ? parseFloat(l.time) || 0 : (l.best_distance || 0);
  // For time, lower is better (PR = min); for distance, higher is better (PR = max)
  const pr = isTimeBased
    ? Math.min(...logs.map(getValue))
    : Math.max(...logs.map(getValue));
  const avg = logs.reduce((s, l) => s + getValue(l), 0) / logs.length;
  const totalAttempts = logs.reduce((s, l) => s + (l.attempts?.length || 1), 0);

  // Consistency: % of sessions within 5% of PR
  const consistentSessions = isTimeBased
    ? logs.filter(l => getValue(l) <= pr * 1.05).length
    : logs.filter(l => getValue(l) >= pr * 0.95).length;
  const consistency = logs.length > 0 ? Math.round((consistentSessions / logs.length) * 100) : 0;

  const formatMark = (v) => isTimeBased ? `${v.toFixed(2)}s` : `${v.toFixed(1)}'`;

  const stats = [
    { icon: Award, label: "Personal Best", value: formatMark(pr), color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { icon: TrendingUp, label: "Session Average", value: formatMark(avg), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { icon: Target, label: "Total Efforts", value: totalAttempts, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { icon: Flame, label: "Consistency", value: `${consistency}%`, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, color, bg }) => (
        <Card key={label} className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}