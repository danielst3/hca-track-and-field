import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import EventProgressCard from "../components/tracking/EventProgressCard";

export default function MyAthletes() {
  const [user, setUser] = useState(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      // Set initial selected athlete from user preference or first assigned
      if (currentUser.selected_athlete_id) {
        setSelectedAthleteId(currentUser.selected_athlete_id);
      } else if (currentUser.assigned_athletes?.length > 0) {
        setSelectedAthleteId(currentUser.assigned_athletes[0]);
      }
    };
    fetchUser();
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const assignedAthletes = allUsers.filter(u => user?.assigned_athletes?.includes(u.id));
  const selectedAthlete = assignedAthletes.find(a => a.id === selectedAthleteId);

  const { data: throwLogs = [] } = useQuery({
    queryKey: ["throwLogs", selectedAthleteId],
    queryFn: async () => {
      if (!selectedAthlete) return [];
      return base44.entities.ThrowLog.filter({ athlete_email: selectedAthlete.email });
    },
    enabled: !!selectedAthlete,
  });

  const selectAthleteMutation = useMutation({
    mutationFn: async (athleteId) => {
      await base44.auth.updateMe({ selected_athlete_id: athleteId });
      return athleteId;
    },
    onSuccess: (athleteId) => {
      setSelectedAthleteId(athleteId);
      queryClient.invalidateQueries({ queryKey: ["throwLogs"] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (assignedAthletes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-5xl mx-auto">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-gray-300">No athletes assigned</p>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                Contact a coach to assign athletes to your account
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">My Athletes</h1>
        </div>

        {/* Athlete Selector */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Select Athlete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {assignedAthletes.map((athlete) => (
                <Button
                  key={athlete.id}
                  variant={selectedAthleteId === athlete.id ? "default" : "outline"}
                  onClick={() => selectAthleteMutation.mutate(athlete.id)}
                  className="h-auto py-3 flex flex-col items-start gap-1"
                >
                  <span className="font-semibold">{athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : athlete.full_name}</span>
                  <span className="text-xs opacity-80">{athlete.grade}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedAthlete && (
          <>
            {/* Athlete Info */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">{selectedAthlete.first_name && selectedAthlete.last_name ? `${selectedAthlete.first_name} ${selectedAthlete.last_name}` : selectedAthlete.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Badge className="dark:border-gray-600 dark:text-gray-300">{selectedAthlete.grade}</Badge>
                  {selectedAthlete.events?.map((event) => (
                    <Badge key={event} className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {event}
                    </Badge>
                  ))}
                </div>
                <Link to={`${createPageUrl("AthleteDetail")}?id=${selectedAthlete.id}`}>
                  <Button className="w-full gap-2">
                    <TrendingUp className="w-4 h-4" />
                    View Full Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Progress Charts */}
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100">Recent Progress</h2>
              {selectedAthlete.events?.map((event) => (
                <EventProgressCard
                  key={event}
                  event={event}
                  athleteEmail={selectedAthlete.email}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}