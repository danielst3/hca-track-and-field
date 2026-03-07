import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DayTypeBadge from "../components/shared/DayTypeBadge";
import AbbreviationsKey from "../components/shared/AbbreviationsKey.jsx";

import QuickLogButton from "../components/tracking/QuickLogButton";
import PracticePlanText from "../components/shared/PracticePlanText";
import EventToggle from "../components/shared/EventToggle";
import LogPerformanceForm from "../components/tracking/LogPerformanceForm";
import { Calendar, Trophy, ChevronLeft, ChevronRight, X, FileText, User, ExternalLink, Link as LinkIcon, ChevronDown, ChevronUp, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { ALL_EVENTS, getEventById, EVENT_CATEGORIES, EVENTS_BY_CATEGORY } from "../components/shared/eventConfig";
import MultiSelectWithTags from "../components/shared/MultiSelectWithTags";
import { cn } from "@/lib/utils";
import AthleteCard from "../components/dashboard/AthleteCard";
import EventProgressChart from "../components/dashboard/EventProgressChart";
import CoachAthleteOverviewSection from "@/components/dashboard/CoachAthleteOverviewSection";
import RecentPostsSection from "@/components/dashboard/RecentPostsSection";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { getActiveViewRole, getAvailableViews } from "../components/shared/getActiveViewRole";

export default function Today() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategories, setSelectedCategories] = useState(["throwing"]);
  const [selectedEvents, setSelectedEvents] = useState(["shot_put", "discus", "javelin"]);
  const [eventOptions, setEventOptions] = useState([]);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      const impersonating = localStorage.getItem("impersonating");
      const availableViews = getAvailableViews(currentUser.user_role_preference, currentUser.role);
      // activeViewRole = UX view selection; currentUser.role = primaryRole (never overwritten)
      const activeViewRole = getActiveViewRole(currentUser.id, availableViews, currentUser.role);
      const effectiveUser = impersonating && (currentUser?.role === "admin" || activeViewRole === "admin") ?
      { ...currentUser, ...JSON.parse(impersonating), isImpersonating: true, realRole: currentUser.role, activeViewRole } :
      { ...currentUser, activeViewRole };
      setUser(effectiveUser);

      // Build event options from eventConfig
      setEventOptions(ALL_EVENTS.map(e => ({ id: e.id, label: e.label })));

      if (currentUser?.default_events && currentUser.default_events.length > 0) {
        setSelectedEvents(currentUser.default_events);
        // Derive categories from default events
        const cats = [...new Set(currentUser.default_events.map(evtId => {
          for (const [catId, evts] of Object.entries(EVENTS_BY_CATEGORY)) {
            if (evts.find(e => e.id === evtId)) return catId;
          }
          return null;
        }).filter(Boolean))];
        if (cats.length > 0) setSelectedCategories(cats);
      }
    };
    fetchUser();
  }, []);

  const { data: activeSeason } = useQuery({
    queryKey: ["activeSeason"],
    queryFn: async () => {
      const seasons = await base44.entities.Season.filter({ is_active: true });
      return seasons[0] || null;
    }
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
    enabled: !!activeSeason
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
    enabled: !!activeSeason
  });

  const { data: nextMeet } = useQuery({
    queryKey: ["nextMeet", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason) return null;
      const today = format(new Date(), "yyyy-MM-dd");
      const meets = await base44.entities.Meet.filter({ season_id: activeSeason.id });
      const future = meets.filter((m) => m.date >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
      return future[0] || null;
    },
    enabled: !!activeSeason
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ["recentPosts"],
    queryFn: async () => {
      const posts = await base44.entities.Post.list("-created_date", 3);
      return posts;
    }
  });

  const athleteEmail = user?.isImpersonating ?
  JSON.parse(localStorage.getItem("impersonating") || "{}").email || null :
  user?.email;

  const { data: athleteOverride } = useQuery({
    queryKey: ["athleteOverride", dateStr, athleteEmail],
    queryFn: async () => {
      const overrides = await base44.entities.AthletePlanOverride.filter({
        athlete_email: athleteEmail,
        date: dateStr
      });
      return overrides[0] || null;
    },
    enabled: !!athleteEmail && !!user
  });

  const { data: throwLogs } = useQuery({
    queryKey: ["throwLogs", user?.email],
    queryFn: async () => {
      if (!user || user.activeViewRole === "admin") return [];
      const logs = await base44.entities.ThrowLog.filter({ athlete_email: user.email });
      return logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    enabled: !!user && user.activeViewRole !== "admin"
  });

  const getEventData = (event) => {
    if (!throwLogs) return [];
    return throwLogs.
    filter((log) => log.event === event).
    slice(-30).
    map((log) => ({
      date: format(new Date(log.date), "MMM d"),
      distance: log.distance
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
    setSelectedEvents((prev) =>
    prev.includes(eventId) ?
    prev.filter((e) => e !== eventId) :
    [...prev, eventId]
    );
  };

  if (planLoading) {
    return (
      <div className="min-h-screen bg-[#111] dark:bg-[#111] p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4" />
          <p className="text-slate-700 dark:text-gray-300">Loading today's plan...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[var(--brand-secondary)] dark:bg-[#111] px-3 pt-4 pb-20 sm:px-4">
      {user && user.activeViewRole !== "admin" && <QuickLogButton user={user} />}
      <div className="w-full max-w-7xl mx-auto space-y-4">
        {/* Next Meet Countdown */}
        {nextMeet && isSameDay(selectedDate, new Date()) && (() => {
          const daysUntil = differenceInCalendarDays(parseISO(nextMeet.date), new Date());
          const label = daysUntil === 0 ?
          `It's meet day — ${nextMeet.name}!` :
          daysUntil === 1 ?
          `1 day until the ${nextMeet.name} meet!` :
          `${daysUntil} days until the ${nextMeet.name} meet!`;
          return (
            <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl px-4 py-3 shadow-md">
              <Trophy className="w-5 h-5 flex-shrink-0" />
              <p className="font-semibold text-sm sm:text-base">{label}</p>
            </div>);

        })()}

        {/* Header */}
         <div className="flex items-center justify-between">
           <div className="flex-1">
             <div className="flex items-center justify-between">
               <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 select-none">
                 {isSameDay(selectedDate, new Date()) ? "Today's Plan" : "Practice Plan"}
               </h1>

             </div>
             <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevDay}
                className="h-11 w-11 select-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">

                <ChevronLeft className="w-4 h-4" />
              </Button>
              <p className="text-slate-700 dark:text-gray-300 font-medium min-w-[200px] text-center select-none">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
                className="h-11 w-11 select-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">

                <ChevronRight className="w-4 h-4" />
              </Button>
              {!isSameDay(selectedDate, new Date()) &&
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="ml-2 select-none dark:text-gray-300 dark:hover:bg-gray-800">

                  Today
                </Button>
              }
            </div>
          </div>
          <AbbreviationsKey />
        </div>

        {/* Day Type Badge + Practice Mode Button */}
        {dailyPlan &&
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DayTypeBadge type={dailyPlan.day_type} />
              {meet &&
              <div className="flex items-center gap-2 text-red-600 font-semibold">
                <Trophy className="w-4 h-4" />
                <span>{meet.name}</span>
              </div>
              }
            </div>
            {user && (
              <a
                href={createPageUrl(
                  (user.activeViewRole === "admin" || user.activeViewRole === "coach") && !user?.isImpersonating
                    ? "CoachPracticeMode"
                    : "PracticeMode"
                )}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 dark:from-white dark:to-gray-200 dark:bg-white hover:dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg shadow-md transition-colors select-none"
              >
                <Play className="w-4 h-4" />
                {(user.activeViewRole === "admin" || user.activeViewRole === "coach") && !user?.isImpersonating
                  ? "Coach Mode"
                  : "Practice Mode"
                }
              </a>
            )}
          </div>
        }

        {/* Meet Day Banner */}
        {meet &&
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">Competition Day</h2>
            </div>
            <p className="text-xl font-semibold text-red-700">{meet.name}</p>
            {meet.notes &&
          <p className="text-red-600 mt-2">{meet.notes}</p>
          }
          </div>
        }

        {/* Coach Notes */}
        {(athleteOverride?.coach_notes || dailyPlan?.coach_notes) &&
        <Card className="border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Coach Notes</p>
              <p className="text-gray-800 dark:text-gray-300">{athleteOverride?.coach_notes || dailyPlan?.coach_notes}</p>
            </CardContent>
          </Card>
        }

        {/* Event Filter */}
        <div className="flex items-center gap-3 flex-wrap gap-y-2">
          {eventOptions.map((event) =>
          <EventToggle
            key={event.id}
            event={event}
            isSelected={selectedEvents.includes(event.id)}
            onClick={() => toggleEvent(event.id)} />

          )}
        </div>

        {/* Three Event Columns */}
        {athleteOverride &&
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium">
            <User className="w-4 h-4" />
            You have a personalized practice plan for today
          </div>
        }
        {dailyPlan ? (() => {
          const isCoachOrAdmin = user?.activeViewRole === "admin" || user?.activeViewRole === "coach";
          // Merge overrides for non-coaches
          const dp = isCoachOrAdmin ? dailyPlan : (() => {
            const merged = { ...dailyPlan, coach_notes: athleteOverride?.coach_notes || dailyPlan.coach_notes };
            ALL_EVENTS.forEach(evt => {
              if (athleteOverride?.[evt.planField]) merged[evt.planField] = athleteOverride[evt.planField];
            });
            return merged;
          })();
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedEvents.map(eventId => {
                const eventCfg = getEventById(eventId);
                if (!eventCfg) return null;
                const Icon = eventCfg.Icon;
                const planText = dp[eventCfg.planField];
                const isOverridden = !isCoachOrAdmin && !!athleteOverride?.[eventCfg.planField];
                return (
                  <Card key={eventId} className={cn("bg-white dark:bg-gray-800 shadow-lg", isOverridden ? "border-2 border-orange-400 dark:border-orange-500" : "border-slate-200 dark:border-gray-700")}>
                    <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 border-b border-slate-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <CardTitle className={cn("flex items-center gap-2 select-none", eventCfg.color)}>
                          <Icon className="w-5 h-5" /> {eventCfg.label}
                          {isOverridden && <span className="text-xs font-normal text-orange-500 bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded">Personalized</span>}
                        </CardTitle>
                        {user && !isCoachOrAdmin &&
                          <LogPerformanceForm event={eventId} eventLabel={eventCfg.label} user={user} open={undefined} />
                        }
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-6">
                      <div className="prose prose-sm max-w-none">
                        {planText ? <PracticePlanText text={planText} /> : <p className="text-slate-500 dark:text-slate-400 italic">No plan for today</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>);

        })() :
        <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No plan scheduled for today</p>
            </CardContent>
          </Card>
        }

        {/* Coach: Athlete Overrides Preview */}
        {(user?.activeViewRole === "admin" || user?.activeViewRole === "coach") && dailyPlan &&
        <CoachAthleteOverviewSection date={selectedDate} dailyPlan={dailyPlan} selectedEvents={selectedEvents} />
        }

        {/* Athlete Dashboard */}
        {user && user.activeViewRole !== "admin" && isSameDay(selectedDate, new Date()) &&
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            




            <div>
              <AthleteCard user={user} nextMeet={nextMeet} recentPosts={recentPosts} />
            </div>
          </div>
        }

        {/* Recent Posts */}
        {recentPosts.length > 0 &&
        <RecentPostsSection recentPosts={recentPosts} eventOptions={eventOptions} />
        }

      </div>
    </div>);

}