import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DayTypeBadge from "../components/shared/DayTypeBadge";
import AbbreviationsKey from "../components/shared/AbbreviationsKey";
import LogActivityButton from "../components/tracking/LogActivityButton";
import QuickLogButton from "../components/tracking/QuickLogButton";
import PracticePlanText from "../components/shared/PracticePlanText";
import EventToggle from "../components/shared/EventToggle";
import LogPerformanceForm from "../components/tracking/LogPerformanceForm";
import { Calendar, Trophy, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import AthleteCard from "../components/dashboard/AthleteCard";
import EventProgressChart from "../components/dashboard/EventProgressChart";

export default function Today() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState(["shot", "discus", "javelin"]);
  const [eventOptions, setEventOptions] = useState([]);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Build event options from user's event_types
      if (currentUser?.event_types && currentUser.event_types.length > 0) {
        const icons = { shot: "🏋️", discus: "🥏", javelin: "🎯" };
        const options = currentUser.event_types.map(event => ({
          id: event.id,
          label: event.label,
          icon: icons[event.id] || "🎯"
        }));
        setEventOptions(options);
      }
      
      if (currentUser?.default_events && currentUser.default_events.length > 0) {
        setSelectedEvents(currentUser.default_events);
      }
    };
    fetchUser();
  }, []);

  const { data: activeSeason } = useQuery({
    queryKey: ["activeSeason"],
    queryFn: async () => {
      const seasons = await base44.entities.Season.filter({ is_active: true });
      return seasons[0] || null;
    },
  });

  const { data: dailyPlan, isLoading: planLoading } = useQuery({
    queryKey: ["dailyPlan", dateStr, activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason) return null;
      const plans = await base44.entities.DailyPlan.filter({ 
        date: dateStr,
        season_id: activeSeason.id 
      });
      return plans[0] || null;
    },
    enabled: !!activeSeason,
  });

  const { data: meet } = useQuery({
    queryKey: ["meet", dateStr, activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason) return null;
      const meets = await base44.entities.Meet.filter({ 
        date: dateStr,
        season_id: activeSeason.id 
      });
      return meets[0] || null;
    },
    enabled: !!activeSeason,
  });

  const { data: nextMeet } = useQuery({
    queryKey: ["nextMeet", activeSeason?.id, user?.role],
    queryFn: async () => {
      if (!activeSeason || user?.role === "admin") return null;
      const today = format(new Date(), "yyyy-MM-dd");
      const meets = await base44.entities.Meet.filter({
        season_id: activeSeason.id
      });
      const future = meets.filter(m => m.date >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
      return future[0] || null;
    },
    enabled: !!activeSeason && !!user && user.role !== "admin",
  });

  const { data: recentPosts } = useQuery({
    queryKey: ["recentPosts"],
    queryFn: async () => {
      const posts = await base44.entities.Post.list();
      return posts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
  });

  const { data: throwLogs } = useQuery({
    queryKey: ["throwLogs", user?.email],
    queryFn: async () => {
      if (!user || user.role === "admin") return [];
      const logs = await base44.entities.ThrowLog.filter({ 
        athlete_email: user.email 
      });
      return logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    enabled: !!user && user.role !== "admin",
  });

  const getEventData = (event) => {
    if (!throwLogs) return [];
    return throwLogs
      .filter(log => log.event === event)
      .slice(-30)
      .map(log => ({
        date: format(new Date(log.date), "MMM d"),
        distance: log.distance,
      }));
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const toggleEvent = (eventId) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4" />
          <p className="text-slate-700 dark:text-gray-300">Loading today's plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] p-4 pb-20">
      {user && user.role !== "admin" && <QuickLogButton user={user} />}
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Athlete Dashboard (only for athletes) */}
        {user && user.role !== "admin" && isSameDay(selectedDate, new Date()) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {user.events && user.events.filter(e => selectedEvents.includes(e)).map(event => (
                <EventProgressChart 
                  key={event} 
                  event={event} 
                  data={getEventData(event)} 
                />
              ))}
            </div>
            <div>
              <AthleteCard 
                user={user} 
                nextMeet={nextMeet} 
                recentPosts={recentPosts} 
              />
            </div>
          </div>
        )}
        {/* Header */}
         <div className="flex items-center justify-between">
           <div className="flex-1">
             <div className="flex items-center justify-between">
               <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 select-none">
                 {isSameDay(selectedDate, new Date()) ? "Today's Plan" : "Practice Plan"}
               </h1>
               {user && isSameDay(selectedDate, new Date()) && (
                  <div className="flex justify-center py-6">
                    <LogActivityButton user={user} />
                  </div>
                )}
             </div>
             <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevDay}
                className="h-8 w-8 select-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <p className="text-slate-700 dark:text-gray-300 font-medium min-w-[200px] text-center select-none">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
                className="h-8 w-8 select-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              {!isSameDay(selectedDate, new Date()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToday}
                  className="ml-2 select-none dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Today
                </Button>
              )}
            </div>
          </div>
          <AbbreviationsKey />
        </div>

        {/* Day Type Badge */}
        {dailyPlan && (
          <div className="flex items-center gap-3">
            <DayTypeBadge type={dailyPlan.day_type} />
            {meet && (
              <div className="flex items-center gap-2 text-red-600 font-semibold">
                <Trophy className="w-4 h-4" />
                <span>{meet.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Meet Day Banner */}
        {meet && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">Competition Day</h2>
            </div>
            <p className="text-xl font-semibold text-red-700">{meet.name}</p>
            {meet.notes && (
              <p className="text-red-600 mt-2">{meet.notes}</p>
            )}
          </div>
        )}

        {/* Coach Notes */}
        {dailyPlan?.coach_notes && (
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">Coach Notes</p>
              <p className="text-blue-800">{dailyPlan.coach_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Event Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          {eventOptions.map(event => (
            <EventToggle
              key={event.id}
              event={event}
              isSelected={selectedEvents.includes(event.id)}
              onClick={() => toggleEvent(event.id)}
            />
          ))}
        </div>

        {/* Three Event Columns */}
        {dailyPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shot Put */}
            {selectedEvents.includes("shot") && (
              <Card className="border-amber-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 border-b border-amber-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2 select-none">
                      🏋️ Shot Put
                    </CardTitle>
                    {user && user.role !== "admin" && (
                      <LogPerformanceForm event="shot" eventLabel="Shot" user={user} />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="prose prose-sm max-w-none">
                    {dailyPlan.shot_text ? (
                      <PracticePlanText text={dailyPlan.shot_text} />
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">No plan for today</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discus */}
            {selectedEvents.includes("discus") && (
              <Card className="border-cyan-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-b border-cyan-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-cyan-900 dark:text-cyan-300 flex items-center gap-2 select-none">
                      🥏 Discus
                    </CardTitle>
                    {user && user.role !== "admin" && (
                      <LogPerformanceForm event="discus" eventLabel="Discus" user={user} />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="prose prose-sm max-w-none">
                    {dailyPlan.discus_text ? (
                      <PracticePlanText text={dailyPlan.discus_text} />
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">No plan for today</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Javelin */}
            {selectedEvents.includes("javelin") && (
              <Card className="border-rose-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 border-b border-rose-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-rose-900 dark:text-rose-300 flex items-center gap-2 select-none">
                      🎯 Javelin
                    </CardTitle>
                    {user && user.role !== "admin" && (
                      <LogPerformanceForm event="javelin" eventLabel="Javelin" user={user} />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="prose prose-sm max-w-none">
                    {dailyPlan.javelin_text ? (
                      <PracticePlanText text={dailyPlan.javelin_text} />
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">No plan for today</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No plan scheduled for today</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}