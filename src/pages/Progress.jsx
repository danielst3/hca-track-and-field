import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EventProgressCard from "../components/tracking/EventProgressCard";
import MeetResultsList from "../components/tracking/MeetResultsList";
import WeeklyVolumeCard from "../components/tracking/WeeklyVolumeCard";

export default function Progress() {
  const [user, setUser] = useState(null);
  const [activeEvent, setActiveEvent] = useState("shot");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["throwLogs", user?.email],
    queryFn: () => base44.entities.ThrowLog.filter({ athlete_email: user.email }),
    enabled: !!user,
  });

  const getLogsForEvent = (event) => logs.filter((l) => l.event === event);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Progress</h1>

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
            <EventProgressCard
              event="javelin"
              logs={getLogsForEvent("javelin")}
            />
            <WeeklyVolumeCard logs={logs} event="javelin" />
          </TabsContent>
        </Tabs>

        <MeetResultsList logs={logs} />
      </div>
    </div>
  );
}