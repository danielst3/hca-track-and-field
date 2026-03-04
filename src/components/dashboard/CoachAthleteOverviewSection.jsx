import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Users, User, Circle, Disc3, Zap } from "lucide-react";
import { format } from "date-fns";
import PracticePlanText from "../shared/PracticePlanText";
import { cn } from "@/lib/utils";

const EVENTS = [
{ id: "shot", label: "Shot Put", icon: Circle, borderClass: "border-amber-200 dark:border-amber-800", headerClass: "from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800", titleClass: "text-amber-900 dark:text-amber-300", planKey: "shot_text" },
{ id: "discus", label: "Discus", icon: Disc3, borderClass: "border-cyan-200 dark:border-cyan-800", headerClass: "from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800", titleClass: "text-cyan-900 dark:text-cyan-300", planKey: "discus_text" },
{ id: "javelin", label: "Javelin", icon: Zap, borderClass: "border-rose-200 dark:border-rose-800", headerClass: "from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800", titleClass: "text-rose-900 dark:text-rose-300", planKey: "javelin_text" }];


function AthleteEventPlan({ athlete, dailyPlan, override, selectedEvents = ["shot", "discus", "javelin"] }) {
  const [expanded, setExpanded] = useState(false);

  const hasAnyOverride = override?.shot_text || override?.discus_text || override?.javelin_text;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">

        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {athlete.full_name || athlete.email}
          </span>
          {hasAnyOverride &&
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700">
              Custom plan
            </Badge>
          }
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded &&
      <div className="p-4 bg-white dark:bg-gray-900 grid grid-cols-1 md:grid-cols-3 gap-3">
          {EVENTS.filter((e) => selectedEvents.includes(e.id)).map(({ id, label, icon: Icon, borderClass, headerClass, titleClass, planKey }) => {
          const isOverridden = !!override?.[planKey];
          const text = override?.[planKey] || dailyPlan?.[planKey];
          return (
            <div
              key={id}
              className={cn("rounded-lg border overflow-hidden", isOverridden ? "border-2 border-orange-400 dark:border-orange-600" : borderClass)}>

                <div className={cn("px-3 py-2 bg-gradient-to-br border-b", headerClass, isOverridden ? "border-orange-200 dark:border-orange-800" : borderClass)}>
                  <div className={cn("flex items-center gap-1.5 font-semibold text-xs", titleClass)}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    {isOverridden &&
                  <span className="ml-1 text-orange-500 bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded font-normal">
                        Personalized
                      </span>
                  }
                  </div>
                </div>
                <div className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                  {text ? <PracticePlanText text={text} /> : <span className="italic text-gray-400">No plan</span>}
                </div>
              </div>);

        })}
          {override?.coach_notes &&
        <div className="md:col-span-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Coach Notes: </span>
              <span className="text-gray-600 dark:text-gray-400">{override.coach_notes}</span>
            </div>
        }
        </div>
      }
    </div>);

}

export default function CoachAthleteOverviewSection({ date, dailyPlan, selectedEvents = ["shot", "discus", "javelin"] }) {
  const [open, setOpen] = useState(false);
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: athletes = [] } = useQuery({
    queryKey: ["coach-athlete-overview-athletes"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter((u) => u.role === "user");
    },
    enabled: open
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ["coach-athlete-overview-overrides", dateStr],
    queryFn: () => base44.entities.AthletePlanOverride.filter({ date: dateStr }),
    enabled: open
  });

  const overrideCount = overrides.length;

  return (
    <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="mx-auto px-6 py-6 flex flex-col space-y-1.5">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="w-full flex items-center justify-between">

          <CardTitle className="text-slate-800 text-base font-semibold tracking-tight flex items-center gap-2 dark:text-gray-100">
            <Users className="w-5 h-5" />
            Athlete Practice Plans
            {overrideCount > 0 &&
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700">
                {overrideCount} custom
              </Badge>
            }
          </CardTitle>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </CardHeader>
      {open &&
      <CardContent className="mt-4 space-y-2">
          {athletes.length === 0 ?
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No athletes found.</p> :

        athletes.map((athlete) => {
          const override = overrides.find((o) => o.athlete_email === athlete.email) || null;
          return (
            <AthleteEventPlan
              key={athlete.email}
              athlete={athlete}
              dailyPlan={dailyPlan}
              override={override}
              selectedEvents={selectedEvents} />);


        })
        }
        </CardContent>
      }
    </Card>);

}