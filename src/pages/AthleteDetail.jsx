import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EventProgressCard from "../components/tracking/EventProgressCard";
import MeetResultsList from "../components/tracking/MeetResultsList";
import WeeklyVolumeCard from "../components/tracking/WeeklyVolumeCard";
import { toast } from "sonner";

export default function AthleteDetail() {
  const [user, setUser] = useState(null);
  const [athleteId, setAthleteId] = useState(null);
  const [activeEvent, setActiveEvent] = useState("shot");

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
      return fetchedAthlete;
    },
    enabled: !!athleteId && !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["athleteLogs", athlete?.email],
    queryFn: () => base44.entities.ThrowLog.filter({ athlete_email: athlete.email }),
    enabled: !!athlete,
  });

  const getLogsForEvent = (event) => logs.filter((l) => l.event === event);

  const handleImpersonate = () => {
    localStorage.setItem("impersonating", JSON.stringify({
      id: athlete.id,
      email: athlete.email,
      full_name: athlete.full_name
    }));
    toast.success(`Now viewing as ${athlete.full_name}`);
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
              {athlete.full_name}
            </h1>
            <p className="text-slate-600 dark:text-gray-400">{athlete.email}</p>
          </div>
          {user.role === "admin" && (
            <Button
              onClick={handleImpersonate}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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