import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDayTypeColors } from "../components/shared/DayTypeBadge";
import DayDetailDialog from "../components/calendar/DayDetailDialog";
import AbbreviationsKey from "../components/shared/AbbreviationsKey";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
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

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["allPlans"],
    queryFn: () => base44.entities.DailyPlan.list(),
  });

  const { data: meets = [] } = useQuery({
    queryKey: ["allMeets"],
    queryFn: () => base44.entities.Meet.list(),
  });

  const getDaysToShow = () => {
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const calStart = startOfWeek(start, { weekStartsOn: 1 });
      const calEnd = endOfWeek(end, { weekStartsOn: 1 });
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

  const selectedPlan = selectedDay ? getPlanForDate(selectedDay) : null;
  const selectedMeet = selectedDay ? getMeetForDate(selectedDay) : null;

  const days = getDaysToShow();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
          <AbbreviationsKey />
        </div>

        <Tabs value={view} onValueChange={setView} className="mb-4">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-800">
            {view === "week"
              ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`
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
                  className="text-center text-xs font-semibold text-slate-600 py-2"
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
                  colors ? colors.bg : "bg-white"
                } border-2 ${isToday ? "border-blue-500" : "border-slate-200"} ${
                  view === "month" ? "min-h-24" : "min-h-32"
                } hover:shadow-lg transition-shadow cursor-pointer`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-bold ${
                        isToday ? "text-blue-600" : "text-slate-700"
                      }`}
                    >
                      {format(day, view === "week" ? "EEE, MMM d" : "d")}
                    </span>
                    {meet && <Trophy className="w-3 h-3 text-red-600" />}
                  </div>

                  {plan && (
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          colors?.text || "text-slate-600"
                        }`}
                      >
                        {colors?.label}
                      </p>
                    </div>
                  )}

                  {meet && (
                    <p className="text-xs font-semibold text-red-700 mt-1 line-clamp-2">
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
        />
      </div>
    </div>
  );
}