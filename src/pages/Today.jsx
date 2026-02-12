import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DayTypeBadge from "../components/shared/DayTypeBadge";
import AbbreviationsKey from "../components/shared/AbbreviationsKey";
import { Calendar, Trophy } from "lucide-react";
import { format } from "date-fns";

export default function Today() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: dailyPlan, isLoading: planLoading } = useQuery({
    queryKey: ["dailyPlan", today],
    queryFn: async () => {
      const plans = await base44.entities.DailyPlan.filter({ date: today });
      return plans[0] || null;
    },
  });

  const { data: meet } = useQuery({
    queryKey: ["meet", today],
    queryFn: async () => {
      const meets = await base44.entities.Meet.filter({ date: today });
      return meets[0] || null;
    },
  });

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading today's plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Today's Plan</h1>
            <p className="text-slate-600 mt-1">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
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

        {/* Three Event Columns */}
        {dailyPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shot Put */}
            <Card className="border-amber-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-br from-amber-50 to-yellow-50 border-b border-amber-200">
                <CardTitle className="text-amber-900 flex items-center gap-2">
                  🏋️ Shot Put
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none">
                  {dailyPlan.shot_text ? (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {dailyPlan.shot_text}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">No plan for today</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Discus */}
            <Card className="border-cyan-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-br from-cyan-50 to-blue-50 border-b border-cyan-200">
                <CardTitle className="text-cyan-900 flex items-center gap-2">
                  🥏 Discus
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none">
                  {dailyPlan.discus_text ? (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {dailyPlan.discus_text}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">No plan for today</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Javelin */}
            <Card className="border-rose-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-200">
                <CardTitle className="text-rose-900 flex items-center gap-2">
                  🎯 Javelin
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none">
                  {dailyPlan.javelin_text ? (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {dailyPlan.javelin_text}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">No plan for today</p>
                  )}
                </div>
              </CardContent>
            </Card>
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