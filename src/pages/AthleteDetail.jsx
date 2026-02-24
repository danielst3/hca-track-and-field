import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { UserCircle, Dumbbell, Disc3, Zap, BarChart2 } from "lucide-react";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { subDays, isAfter, parseISO } from "date-fns";
import StatsOverview from "../components/analytics/StatsOverview";
import ProgressChart from "../components/analytics/ProgressChart";
import ConsistencyChart from "../components/analytics/ConsistencyChart";
import SessionHistory from "../components/analytics/SessionHistory";

const EVENT_OPTIONS = [
  { value: "shot", label: "🏋️ Shot Put", color: "text-amber-500 border-amber-400 bg-amber-50 dark:bg-amber-950/30" },
  { value: "discus", label: "🥏 Discus", color: "text-cyan-500 border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30" },
  { value: "javelin", label: "🎯 Javelin", color: "text-rose-500 border-rose-400 bg-rose-50 dark:bg-rose-950/30" },
];

const DATE_RANGES = [
  { label: "2W", days: 14 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "All", days: null },
];

export default function AthleteDetail() {
  const [user, setUser] = useState(null);
  const [athleteId, setAthleteId] = useState(null);
  const [activeEvent, setActiveEvent] = useState("shot");
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAthleteId(params.get("id"));

    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== "admin" && currentUser.role !== "parent") {
        window.location.href = createPageUrl("Today");
      }
    };
    fetchUser();
  }, []);

  const { data: athlete } = useQuery({
    queryKey: ["athlete", athleteId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: athleteId });
      const fetchedAthlete = users[0];
      // Check if parent has access to this athlete
      if (user?.role === "parent" && fetchedAthlete?.parent_email !== user.email) {
        window.location.href = createPageUrl("MyAthletes");
        return null;
      }
      
      // Log access for audit trail
      if (user?.role === "admin" || user?.role === "parent") {
        await base44.entities.AuditLog.create({
          user_email: user.email,
          action_type: "view_athlete",
          target_email: fetchedAthlete.email,
          details: `Viewed athlete profile: ${fetchedAthlete.first_name && fetchedAthlete.last_name ? `${fetchedAthlete.first_name} ${fetchedAthlete.last_name}` : fetchedAthlete.full_name}`
        });
      }
      
      return fetchedAthlete;
    },
    enabled: !!athleteId && !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["athleteLogs", athlete?.email],
    queryFn: () => base44.entities.ThrowLog.filter({ athlete_email: athlete.email }),
    enabled: !!athlete,
  });

  const filteredLogs = useMemo(() => {
    let result = logs.filter((l) => l.event === activeEvent);
    if (dateRange) {
      const cutoff = subDays(new Date(), dateRange);
      result = result.filter((l) => isAfter(parseISO(l.date), cutoff));
    }
    return result;
  }, [logs, activeEvent, dateRange]);

  const handleImpersonate = async () => {
    // Log impersonation
    await base44.entities.AuditLog.create({
      user_email: user.email,
      action_type: "view_athlete",
      target_email: athlete.email,
      details: `Started viewing as athlete: ${athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : athlete.full_name}`
    });
    
    const displayName = athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : athlete.full_name;
    localStorage.setItem("impersonating", JSON.stringify({
      id: athlete.id,
      email: athlete.email,
      full_name: displayName
    }));
    toast.success(`Now viewing as ${displayName}`);
    window.location.href = createPageUrl("Today");
  };

  if (!user || (user.role !== "admin" && user.role !== "parent") || !athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
              {athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : athlete.full_name}
            </h1>
            <p className="text-slate-600 dark:text-gray-400 break-all">{athlete.email}</p>
          </div>
          {user.role === "admin" && (
            <Button
              onClick={handleImpersonate}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 self-start"
            >
              <UserCircle className="w-4 h-4" />
              View as Athlete
            </Button>
          )}
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

        {filteredLogs.length > 0 && <StatsOverview logs={filteredLogs} />}
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