import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { startOfWeek, endOfWeek, eachWeekOfInterval, format } from "date-fns";

export default function WeeklyVolumeCard({ logs, event }) {
  const weeks = eachWeekOfInterval(
    {
      start: new Date("2026-03-02"),
      end: new Date("2026-05-30"),
    },
    { weekStartsOn: 1 }
  ).slice(-4);

  const getWeekVolume = (weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate <= weekEnd && log.event === event;
    });

    const totalAttempts = weekLogs.reduce(
      (sum, log) => sum + (log.attempts?.length || 1),
      0
    );

    return totalAttempts;
  };

  const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentVolume = getWeekVolume(currentWeek);

  return (
    <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="border-b dark:border-gray-700 pb-3">
        <CardTitle className="text-lg dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Weekly Throw Volume
          {event === "javelin" && (
            <span className="text-xs text-red-600 dark:text-red-400 font-normal ml-auto">
              (Arm Management)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 font-medium mb-1">
            This Week
          </p>
          <p className="text-3xl font-bold text-purple-900">
            {currentVolume} throws
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wide">
            Last 4 Weeks
          </p>
          {weeks.map((weekStart) => {
            const volume = getWeekVolume(weekStart);
            return (
              <div
                key={weekStart.toISOString()}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-gray-700"
              >
                <span className="text-sm text-slate-600 dark:text-gray-400">
                  {format(weekStart, "MMM d")}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                  {volume} throws
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}