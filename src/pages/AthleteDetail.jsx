import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";
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

        <Tabs value={activeEvent} onValueChange={setActiveEvent}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shot">🏋️ Shot</TabsTrigger>
            <TabsTrigger value="discus">🥏 Discus</TabsTrigger>
            <TabsTrigger value="javelin">🎯 Javelin</TabsTrigger>
          </TabsList>

          <TabsContent value="shot" className="space-y-6 mt-6">
            <EventProgressCard event="shot" logs={getLogsForEvent("shot")} />
            <WeeklyVolumeCard logs={logs} event="shot" />
          </TabsContent>

          <TabsContent value="discus" className="space-y-6 mt-6">
            <EventProgressCard event="discus" logs={getLogsForEvent("discus")} />
            <WeeklyVolumeCard logs={logs} event="discus" />
          </TabsContent>

          <TabsContent value="javelin" className="space-y-6 mt-6">
            <EventProgressCard event="javelin" logs={getLogsForEvent("javelin")} />
            <WeeklyVolumeCard logs={logs} event="javelin" />
          </TabsContent>
        </Tabs>

        <MeetResultsList logs={logs} />
      </div>
    </div>
  );
}