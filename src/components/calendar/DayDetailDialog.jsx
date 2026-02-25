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
import { format } from "date-fns";
import DayTypeBadge from "../shared/DayTypeBadge";
import AbbreviationsKey from "../shared/AbbreviationsKey";
import PracticePlanText from "../shared/PracticePlanText";

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

export default function DayDetailDialog({ date, plan, meet, open, onOpenChange, onEdit, isCoach, selectedEvents = ["shot", "discus", "javelin"], athleteOverride }) {
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
                <AbbreviationsKey />
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

        {plan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Shot Put */}
            {selectedEvents.includes("shot") && (
              <Card className="border-amber-200 dark:border-amber-900 bg-white dark:bg-gray-900">
                <CardHeader className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border-b border-amber-200 dark:border-amber-800 pb-3">
                  <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2 text-base">
                    🏋️ Shot Put
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-sm">
                    {plan.shot_text ? (
                      <PracticePlanText text={plan.shot_text} />
                    ) : (
                      <p className="text-slate-400 dark:text-gray-500 italic">No plan</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discus */}
            {selectedEvents.includes("discus") && (
              <Card className="border-cyan-200 dark:border-cyan-900 bg-white dark:bg-gray-900">
                <CardHeader className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 border-b border-cyan-200 dark:border-cyan-800 pb-3">
                  <CardTitle className="text-cyan-900 dark:text-cyan-300 flex items-center gap-2 text-base">
                    🥏 Discus
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-sm">
                    {plan.discus_text ? (
                      <PracticePlanText text={plan.discus_text} />
                    ) : (
                      <p className="text-slate-400 dark:text-gray-500 italic">No plan</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Javelin */}
            {selectedEvents.includes("javelin") && (
              <Card className="border-rose-200 dark:border-rose-900 bg-white dark:bg-gray-900">
                <CardHeader className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border-b border-rose-200 dark:border-rose-800 pb-3">
                  <CardTitle className="text-rose-900 dark:text-rose-300 flex items-center gap-2 text-base">
                    🎯 Javelin
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-sm">
                    {plan.javelin_text ? (
                      <PracticePlanText text={plan.javelin_text} />
                    ) : (
                      <p className="text-slate-400 dark:text-gray-500 italic">No plan</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-gray-300">No plan for this day</p>
          </div>
        )}

        {plan?.coach_notes && (
          <Card className="border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 mt-4">
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Coach Notes
              </p>
              <p className="text-blue-800 dark:text-blue-200">{plan.coach_notes}</p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}