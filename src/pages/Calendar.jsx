import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useViewGuard } from "../components/shared/useViewGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDayTypeColors } from "../components/shared/DayTypeBadge";
import DayDetailDialog from "../components/calendar/DayDetailDialog";
import EditPlanDialog from "../components/calendar/EditPlanDialog";
import AbbreviationsKey from "../components/shared/AbbreviationsKey.jsx";
import EventToggle from "../components/shared/EventToggle";
import { ChevronLeft, ChevronRight, Trophy, Circle, Disc3, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MobileSelect } from "@/components/ui/mobile-select";
import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";



const planTypeOptions = [
  { id: "technical", label: "Technical", color: "bg-blue-100 text-blue-800" },
  { id: "primary", label: "Primary", color: "bg-green-100 text-green-800" },
  { id: "indoor", label: "Indoor", color: "bg-orange-100 text-orange-800" },
  { id: "tuneup", label: "Tune-up", color: "bg-purple-100 text-purple-800" },
  { id: "meet", label: "Meet", color: "bg-red-100 text-red-800" },
  { id: "recovery", label: "Recovery", color: "bg-gray-100 text-gray-800" }
];

export default function Calendar() {
  const { activeView, user, allowed } = useViewGuard("Calendar");
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(["shot", "discus", "javelin"]);
  const [eventOptions, setEventOptions] = useState([]);

  React.useEffect(() => {
    if (!user) return;
    if (user?.event_types && user.event_types.length > 0) {
      setEventOptions(user.event_types.map(e => ({ id: e.id, label: e.label })));
    } else {
      setEventOptions([
        { id: "shot", label: "Shot Put" },
        { id: "discus", label: "Discus" },
        { id: "javelin", label: "Javelin" }
      ]);
    }
    if (user?.default_events && user.default_events.length > 0) {
      setSelectedEvents(user.default_events);
    }
  }, [user]);



  useEffect(() => {
    if (user?.default_events && user.default_events.length > 0) {
      setSelectedEvents(user.default_events);
    }
  }, [user]);

  const { data: allSeasons = [] } = useQuery({
    queryKey: ["allSeasons"],
    queryFn: async () => {
      return await base44.entities.Season.list();
    },
  });

  const { data: activeSeason } = useQuery({
    queryKey: ["activeSeason"],
    queryFn: async () => {
      const seasons = await base44.entities.Season.filter({ is_active: true });
      return seasons[0] || null;
    },
  });

  const handleSeasonChange = async (seasonId) => {
    const newActiveSeason = allSeasons.find(s => s.id === seasonId);
    if (newActiveSeason) {
      // Deactivate all seasons
      await Promise.all(
        allSeasons
          .filter(s => s.is_active)
          .map(s => base44.entities.Season.update(s.id, { is_active: false }))
      );
      // Activate the selected season
      await base44.entities.Season.update(seasonId, { is_active: true });
      queryClient.invalidateQueries({ queryKey: ["activeSeason"] });
    }
  };

  const { data: plans = [] } = useQuery({
    queryKey: ["allPlans", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason) return [];
      return base44.entities.DailyPlan.filter({ season_id: activeSeason.id });
    },
    enabled: !!activeSeason,
  });

  const { data: meets = [] } = useQuery({
    queryKey: ["allMeets", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason) return [];
      return base44.entities.Meet.filter({ season_id: activeSeason.id });
    },
    enabled: !!activeSeason,
  });

  const getDaysToShow = () => {
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const calStart = startOfWeek(start, { weekStartsOn: 0 });
      const calEnd = endOfWeek(end, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    }
  };

  const getPlanForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return plans.find((p) => p.date === dateStr);
  };

  const getMeetForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return meets.find((m) => m.date === dateStr);
  };

  const handlePrevious = () => {
    setCurrentDate(view === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(view === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    setDialogOpen(false);
    setEditDialogOpen(true);
  };

  const updateSelectedEventsMutation = useMutation({
    mutationFn: async (newEvents) => {
      await base44.auth.updateMe({ default_events: newEvents });
    },
  });

  const toggleEvent = (eventId) => {
    const newEvents = selectedEvents.includes(eventId)
      ? selectedEvents.filter(e => e !== eventId)
      : [...selectedEvents, eventId];
    setSelectedEvents(newEvents);
    updateSelectedEventsMutation.mutate(newEvents);
  };

  const EVENT_ICON_MAP = {
    shot: <Circle className="w-3.5 h-3.5 inline text-amber-600" />,
    discus: <Disc3 className="w-3.5 h-3.5 inline text-cyan-600" />,
    javelin: <Zap className="w-3.5 h-3.5 inline text-rose-600" />,
  };

  const getPlanContent = (plan) => {
    const icons = [];
    if (selectedEvents.includes("shot") && plan.shot_text) icons.push("shot");
    if (selectedEvents.includes("discus") && plan.discus_text) icons.push("discus");
    if (selectedEvents.includes("javelin") && plan.javelin_text) icons.push("javelin");
    return icons;
  };

  const selectedPlan = selectedDay ? getPlanForDate(selectedDay) : null;
  const selectedMeet = selectedDay ? getMeetForDate(selectedDay) : null;
  const selectedDayStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;

  const athleteEmail = user?.isImpersonating
    ? (JSON.parse(localStorage.getItem("impersonating") || "{}").email || null)
    : user?.email;

  const { data: athleteOverride } = useQuery({
    queryKey: ["athlete-plan-overrides", selectedDayStr, athleteEmail],
    queryFn: async () => {
      const overrides = await base44.entities.AthletePlanOverride.filter({
        athlete_email: athleteEmail,
        date: selectedDayStr,
      });
      return overrides[0] || null;
    },
    enabled: !!athleteEmail && !!user && !!selectedDayStr,
  });

  const days = getDaysToShow();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Calendar</h1>
          <div className="flex items-center gap-3">
            {allSeasons.length > 0 && (
              <MobileSelect
                value={activeSeason?.id || ""}
                onValueChange={handleSeasonChange}
                options={allSeasons.map(s => ({ value: s.id, label: s.name }))}
                label="Season"
              />
            )}
            <AbbreviationsKey isCoach={!user?.isImpersonating && (user?.role === "admin" || user?.role === "coach")} />
          </div>
        </div>

        <Tabs value={view} onValueChange={setView} className="mb-4">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Event Filter */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          {eventOptions.map(event => (
            <EventToggle
              key={event.id}
              event={event}
              isSelected={selectedEvents.includes(event.id)}
              onClick={() => toggleEvent(event.id)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-gray-200">
           {view === "week"
             ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`
             : format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div
          className={
            view === "week"
              ? "grid grid-cols-1 sm:grid-cols-7 gap-3"
              : "grid grid-cols-7 gap-2"
          }
        >
          {view === "month" && (
            <>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-600 dark:text-gray-100 py-2"
                >
                  {day}
                </div>
              ))}
            </>
          )}

          {days.map((day) => {
            const plan = getPlanForDate(day);
            const meet = getMeetForDate(day);
            const colors = plan ? getDayTypeColors(plan.day_type) : null;
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`${
                  colors ? colors.bg : "bg-white dark:bg-gray-800"
                } border-2 ${isToday ? "border-[var(--brand-primary)]" : "border-slate-200 dark:border-gray-700"} ${
                  view === "month" ? "min-h-24" : "min-h-32"
                } hover:shadow-lg transition-shadow cursor-pointer`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-bold ${
                        isToday
                          ? "text-[var(--brand-primary)] dark:text-[var(--brand-primary)]"
                          : (plan && colors?.text)
                          ? colors.text
                          : meet
                          ? "text-red-700 dark:text-red-400"
                          : "text-slate-600 dark:text-gray-500"
                      }`}
                    >
                      {format(day, view === "week" ? "EEE, MMM d" : "d")}
                    </span>
                    {meet && <Trophy className="w-3 h-3 text-red-600 dark:text-red-400" />}
                  </div>

                  {plan && (
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          colors?.text || "text-slate-600 dark:text-gray-400"
                        }`}
                      >
                        {colors?.label}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {getPlanContent(plan).map(evt => (
                          <span key={evt}>{EVENT_ICON_MAP[evt]}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {meet && (
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mt-1 line-clamp-2">
                      {meet.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DayDetailDialog
          date={selectedDay}
          plan={selectedPlan}
          meet={selectedMeet}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onEdit={handleEdit}
          isCoach={!user?.isImpersonating && (user?.role === "admin" || user?.role === "coach")}
          selectedEvents={selectedEvents}
          athleteOverride={athleteOverride}
        />

        {!user?.isImpersonating && (user?.role === "admin" || user?.role === "coach") && (
          <EditPlanDialog
            date={selectedDay}
            plan={selectedPlan}
            meet={selectedMeet}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        )}
      </div>
    </div>
  );
}