import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, Edit, User } from "lucide-react";
import { ALL_EVENTS, getEventById } from "../shared/eventConfig";
import { format } from "date-fns";
import DayTypeBadge from "../shared/DayTypeBadge";
import AbbreviationsKey from "../shared/AbbreviationsKey";
import PracticePlanText from "../shared/PracticePlanText";
import CoachAthleteOverviewSection from "../dashboard/CoachAthleteOverviewSection";

// Merge override on top of team plan — override fields take priority when non-empty
function mergeWithOverride(plan, override) {
  if (!plan && !override) return null;
  if (!override) return plan;
  return {
    ...plan,
    shot_text: override.shot_text || plan?.shot_text || "",
    discus_text: override.discus_text || plan?.discus_text || "",
    javelin_text: override.javelin_text || plan?.javelin_text || "",
    coach_notes: override.coach_notes || plan?.coach_notes || "",
    _hasOverride: true,
  };
}

export default function DayDetailDialog({ date, plan, meet, open, onOpenChange, onEdit, isCoach, selectedEvents = ["shot_put", "discus", "javelin"], athleteOverride }) {
  if (!date) return null;
  const displayPlan = mergeWithOverride(plan, athleteOverride);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl text-gray-900 dark:text-gray-100">
                {format(date, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {isCoach && (
                  <Button
                    onClick={onEdit}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                <AbbreviationsKey isCoach={isCoach} />
              </div>
            </div>
            {displayPlan && <DayTypeBadge type={displayPlan.day_type} />}
            {displayPlan?._hasOverride && (
              <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-medium">
                <User className="w-3 h-3" />
                Personalized plan active
              </div>
            )}
            {meet && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                <Trophy className="w-4 h-4" />
                <span>{meet.name}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {displayPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {selectedEvents.map(eventId => {
              const eventCfg = getEventById(eventId);
              if (!eventCfg) return null;
              const Icon = eventCfg.Icon;
              const planText = displayPlan[eventCfg.planField];
              return (
                <Card key={eventId} className="border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-slate-200 dark:border-gray-700 pb-3">
                    <CardTitle className={`flex items-center gap-2 text-base ${eventCfg.color}`}>
                      <Icon className="w-4 h-4" /> {eventCfg.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-sm">
                      {planText ? (
                        <PracticePlanText text={planText} />
                      ) : (
                        <p className="text-slate-400 dark:text-gray-500 italic">No plan</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-gray-300">No plan for this day</p>
          </div>
        )}

        {displayPlan?.coach_notes && (
          <Card className="border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 mt-4">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Coach Notes
              </p>
              <p className="text-blue-800 dark:text-blue-200">{displayPlan.coach_notes}</p>
            </CardContent>
          </Card>
        )}

        {isCoach && (
          <div className="mt-4">
            <CoachAthleteOverviewSection
              date={date}
              dailyPlan={plan}
              selectedEvents={selectedEvents}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}