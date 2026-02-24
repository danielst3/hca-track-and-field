import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, TrendingUp, Target, Flame } from "lucide-react";

export default function StatsOverview({ logs }) {
  if (!logs.length) return null;

  const pr = Math.max(...logs.map((l) => l.best_distance));
  const avg = logs.reduce((s, l) => s + l.best_distance, 0) / logs.length;
  const totalAttempts = logs.reduce((s, l) => s + (l.attempts?.length || 1), 0);

  // Consistency: % of sessions within 5% of PR
  const threshold = pr * 0.95;
  const consistentSessions = logs.filter((l) => l.best_distance >= threshold).length;
  const consistency = logs.length > 0 ? Math.round((consistentSessions / logs.length) * 100) : 0;

  const stats = [
    { icon: Award, label: "Personal Best", value: `${pr.toFixed(1)}'`, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { icon: TrendingUp, label: "Session Average", value: `${avg.toFixed(1)}'`, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { icon: Target, label: "Total Throws", value: totalAttempts, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
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