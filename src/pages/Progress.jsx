import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { subDays, isAfter, parseISO } from "date-fns";
import { Dumbbell, Disc3, Zap, BarChart2 } from "lucide-react";
import StatsOverview from "../components/analytics/StatsOverview";
import ProgressChart from "../components/analytics/ProgressChart";
import ConsistencyChart from "../components/analytics/ConsistencyChart";
import SessionHistory from "../components/analytics/SessionHistory";

const EVENT_OPTIONS = [
  { value: "shot", label: "Shot Put", icon: Dumbbell, color: "text-amber-500 border-amber-400 bg-amber-50 dark:bg-amber-950/30" },
  { value: "discus", label: "Discus", icon: Disc3, color: "text-cyan-500 border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30" },
  { value: "javelin", label: "Javelin", icon: Zap, color: "text-rose-500 border-rose-400 bg-rose-50 dark:bg-rose-950/30" },
];

const DATE_RANGES = [
  { label: "2W", days: 14 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "All", days: null },
];

export default function Progress() {
  const [user, setUser] = useState(null);
  const [activeEvent, setActiveEvent] = useState("shot");
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: logs = [] } = useQuery({
    queryKey: ["throwLogs", user?.email],
    queryFn: () => base44.entities.ThrowLog.filter({ athlete_email: user.email }),
    enabled: !!user,
  });

  const filteredLogs = useMemo(() => {
    let result = logs.filter((l) => l.event === activeEvent);
    if (dateRange) {
      const cutoff = subDays(new Date(), dateRange);
      result = result.filter((l) => isAfter(parseISO(l.date), cutoff));
    }
    return result;
  }, [logs, activeEvent, dateRange]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your performance over time</p>
        </div>

        {/* Event Filter */}
        <div className="flex gap-2 flex-wrap">
          {EVENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveEvent(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                activeEvent === opt.value
                  ? opt.color
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Range:</span>
          <div className="flex gap-1">
            {DATE_RANGES.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => setDateRange(days)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  dateRange === days
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Badge variant="outline" className="ml-auto text-xs dark:border-gray-600 dark:text-gray-400">
            {filteredLogs.length} sessions
          </Badge>
        </div>

        {/* Stats Overview */}
        {filteredLogs.length > 0 && <StatsOverview logs={filteredLogs} />}

        {/* Charts */}
        <ProgressChart logs={filteredLogs} event={activeEvent} />
        <ConsistencyChart logs={filteredLogs} event={activeEvent} />
        <SessionHistory logs={filteredLogs} />

        {filteredLogs.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-medium">No data for this filter</p>
            <p className="text-sm mt-1">Try a different date range or log some throws!</p>
          </div>
        )}
      </div>
    </div>
  );
}