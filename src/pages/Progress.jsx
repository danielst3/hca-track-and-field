import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { subDays, isAfter, parseISO } from "date-fns";
import { BarChart2 } from "lucide-react";
import StatsOverview from "../components/analytics/StatsOverview";
import ProgressChart from "../components/analytics/ProgressChart";
import ConsistencyChart from "../components/analytics/ConsistencyChart";
import SessionHistory from "../components/analytics/SessionHistory";
import { EVENT_CATEGORIES, EVENTS_BY_CATEGORY, normalizeEventId, isTimeBasedEvent } from "../components/shared/eventConfig";
import { cn } from "@/lib/utils";

const DATE_RANGES = [
  { label: "2W", days: 14 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "All", days: null },
];

export default function Progress() {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("throwing");
  const [activeEvent, setActiveEvent] = useState("shot_put");
  const [dateRange, setDateRange] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setLoadError("Failed to load user data"));
  }, []);

  const { data: throwLogs = [], isError: throwError } = useQuery({
    queryKey: ["throwLogs", user?.email],
    queryFn: () => base44.entities.ThrowLog.filter({ athlete_email: user.email }),
    enabled: !!user,
  });

  const { data: trainingLogs = [], isError: trainingError } = useQuery({
    queryKey: ["trainingLogs", user?.email],
    queryFn: () => base44.entities.TrainingLog.filter({ athlete_email: user.email }),
    enabled: !!user,
  });

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    const firstEvent = EVENTS_BY_CATEGORY[catId]?.[0];
    if (firstEvent) setActiveEvent(firstEvent.id);
  };

  const isTimeBased = isTimeBasedEvent(activeEvent);

  // Normalize legacy event ids (shot -> shot_put) and merge logs
  const allLogs = useMemo(() => {
    const normalized = throwLogs.map(l => ({ ...l, event: normalizeEventId(l.event), _source: "throw" }));
    const training = trainingLogs.map(l => ({ ...l, event: normalizeEventId(l.event), _source: "training" }));
    return [...normalized, ...training];
  }, [throwLogs, trainingLogs]);

  const filteredLogs = useMemo(() => {
    let result = allLogs.filter(l => l.event === activeEvent);
    if (dateRange) {
      const cutoff = subDays(new Date(), dateRange);
      result = result.filter(l => isAfter(parseISO(l.date), cutoff));
    }
    return result;
  }, [allLogs, activeEvent, dateRange]);

  if (loadError || throwError || trainingError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400 font-semibold">{loadError || "Failed to load analytics"}</p>
      </div>
    );
  }

  if (!user) return null;

  const categoryEvents = EVENTS_BY_CATEGORY[activeCategory] || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your performance over time</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          {EVENT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              style={{ minHeight: "44px" }}
              className={cn(
                "px-4 rounded-full text-sm font-semibold border-2 transition-all active:scale-95",
                activeCategory === cat.id
                  ? cat.color + " shadow-sm"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Event Filter */}
        <div className="flex gap-2 flex-wrap">
          {categoryEvents.map(opt => {
            const Icon = opt.Icon;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveEvent(opt.id)}
                style={{ minHeight: "40px" }}
                className={cn(
                  "px-4 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 active:scale-95",
                  activeEvent === opt.id
                    ? "border-gray-800 bg-gray-900 dark:border-gray-100 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", opt.color)} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Range:</span>
          <div className="flex gap-1.5 flex-wrap">
            {DATE_RANGES.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => setDateRange(days)}
                style={{ minHeight: "44px", minWidth: "44px" }}
                className={cn(
                  "px-3 rounded-md text-sm font-semibold transition-all active:scale-95",
                  (dateRange === null && days === null) || (dateRange === days && days !== null)
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Badge variant="outline" className="ml-auto text-xs dark:border-gray-600 dark:text-gray-400">
            {filteredLogs.length} sessions
          </Badge>
        </div>

        {filteredLogs.length > 0 && <StatsOverview logs={filteredLogs} isTimeBased={isTimeBased} />}
        <ProgressChart logs={filteredLogs} event={activeEvent} isTimeBased={isTimeBased} />
        <ConsistencyChart logs={filteredLogs} event={activeEvent} isTimeBased={isTimeBased} />
        <SessionHistory logs={filteredLogs} isTimeBased={isTimeBased} />

        {filteredLogs.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No data for this filter</p>
            <p className="text-sm mt-1">Try a different date range or log some activity!</p>
          </div>
        )}
      </div>
    </div>
  );
}