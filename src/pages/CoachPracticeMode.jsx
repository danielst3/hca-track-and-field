import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createPageUrl } from "../utils";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, User, Send, Circle, Disc3, Zap,
  CheckCircle2, TrendingUp, MessageSquare, ChevronDown, ChevronUp, Trophy, Video, Sparkles
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { getActiveViewRole, getAvailableViews } from "../components/shared/getActiveViewRole";

const EVENT_CONFIG = {
  shot: { label: "Shot Put", icon: Circle, color: "amber" },
  discus: { label: "Discus", icon: Disc3, color: "cyan" },
  javelin: { label: "Javelin", icon: Zap, color: "rose" },
};

function AthleteMonitorCard({ athlete, override, dailyPlan, throwLogs, onSendFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [sending, setSending] = useState(false);

  const athleteLogs = throwLogs.filter(l => l.athlete_email === athlete.email);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLogs = athleteLogs.filter(l => l.date === today);
  const allLogs = athleteLogs;

  const bestByEvent = {};
  allLogs.forEach(log => {
    if (!bestByEvent[log.event] || log.best_distance > bestByEvent[log.event]) {
      bestByEvent[log.event] = log.best_distance;
    }
  });

  const todayBestByEvent = {};
  todayLogs.forEach(log => {
    if (!todayBestByEvent[log.event] || log.best_distance > todayBestByEvent[log.event]) {
      todayBestByEvent[log.event] = log.best_distance;
    }
  });

  const handleSendFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    setSending(true);
    await onSendFeedback(athlete.email, feedbackMsg);
    setFeedbackMsg("");
    setSending(false);
  };

  const hasCustomPlan = override?.shot_text || override?.discus_text || override?.javelin_text;

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] dark:bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
            {(athlete.full_name || athlete.email)[0].toUpperCase()}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {athlete.full_name || athlete.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {todayLogs.length} throw{todayLogs.length !== 1 ? "s" : ""} logged today
            </p>
          </div>
          {hasCustomPlan && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700">
              Custom plan
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(todayBestByEvent).map(([event, best]) => (
            <span key={event} className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {event}: {best}'
            </span>
          ))}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
          {/* Today's Performance */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-4 mb-2">Today's Performance</p>
            {todayLogs.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No throws logged yet</p>
            ) : (
              <div className="space-y-2">
                {["shot", "discus", "javelin"].map(event => {
                  const eventLogs = todayLogs.filter(l => l.event === event);
                  if (eventLogs.length === 0) return null;
                  const best = Math.max(...eventLogs.map(l => l.best_distance));
                  const pr = bestByEvent[event];
                  const isPR = best >= pr;
                  return (
                    <div key={event} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">{event}</span>
                        {isPR && <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">PR</Badge>}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{best}'</span>
                        <span className="text-xs text-gray-400 ml-2">PR: {pr}'</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plan */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Today's Plan</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {["shot", "discus", "javelin"].map(event => {
                const text = override?.[`${event}_text`] || dailyPlan?.[`${event}_text`];
                if (!text) return null;
                return (
                  <div key={event} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                    <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1 capitalize">{event}</p>
                    <p className="text-gray-500 dark:text-gray-400 line-clamp-3">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Send Feedback */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Send Feedback
            </p>
            <div className="flex gap-2">
              <Textarea
                value={feedbackMsg}
                onChange={e => setFeedbackMsg(e.target.value)}
                placeholder="Send a note to the athlete's practice screen..."
                rows={2}
                className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 flex-1"
              />
              <Button
                size="sm"
                onClick={handleSendFeedback}
                disabled={!feedbackMsg.trim() || sending}
                className="self-end bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function CoachPracticeMode() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const dateStr = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      const availableViews = getAvailableViews(currentUser.user_role_preference, currentUser.role);
      const activeViewRole = getActiveViewRole(currentUser.id, availableViews, currentUser.role);
      setUser({ ...currentUser, activeViewRole });
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

  const { data: dailyPlan } = useQuery({
    queryKey: ["dailyPlan", dateStr, activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason) return null;
      const plans = await base44.entities.DailyPlan.filter({ date: dateStr, season_id: activeSeason.id });
      return plans[0] || null;
    },
    enabled: !!activeSeason
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes-practice-mode"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.is_athlete === true);
    }
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ["overrides-practice-mode", dateStr],
    queryFn: () => base44.entities.AthletePlanOverride.filter({ date: dateStr }),
  });

  const { data: throwLogs = [] } = useQuery({
    queryKey: ["all-throw-logs-practice"],
    queryFn: () => base44.entities.ThrowLog.list("-date", 500),
    refetchInterval: 15000, // refresh every 15s
  });

  const sendFeedbackMutation = useMutation({
    mutationFn: async ({ athleteEmail, message }) => {
      // Update the athlete's plan override with coach notes (real-time)
      const existing = overrides.find(o => o.athlete_email === athleteEmail);
      if (existing) {
        return base44.entities.AthletePlanOverride.update(existing.id, { coach_notes: message });
      } else {
        return base44.entities.AthletePlanOverride.create({
          athlete_email: athleteEmail,
          date: dateStr,
          coach_notes: message,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overrides-practice-mode"] });
      toast.success("Feedback sent to athlete!");
    },
    onError: () => toast.error("Failed to send feedback"),
  });

  const handleSendFeedback = (athleteEmail, message) => {
    return sendFeedbackMutation.mutateAsync({ athleteEmail, message });
  };

  // Team stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLogs = throwLogs.filter(l => l.date === today);
  const activeAthletes = new Set(todayLogs.map(l => l.athlete_email)).size;
  const totalThrows = todayLogs.length;

  const [monitorOpen, setMonitorOpen] = useState(true);
  const isCoachOrAdmin = user?.activeViewRole === "admin" || user?.activeViewRole === "coach";

  if (user && !isCoachOrAdmin) {
    navigate(createPageUrl("PracticeMode"));
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--brand-secondary)] dark:bg-[#111] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] dark:from-black dark:to-gray-950 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <a href={createPageUrl("Today")}><ArrowLeft className="w-5 h-5" /></a>
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">Coach Practice Mode</h1>
            <p className="text-xs text-gray-300">{format(new Date(), "EEEE, MMM d")}</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Team Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{athletes.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Athletes</p>
            </CardContent>
          </Card>
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeAthletes}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Today</p>
            </CardContent>
          </Card>
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalThrows}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Throws Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Plan Summary */}
        {dailyPlan && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm dark:text-gray-100">Today's Team Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { key: "shot_text", label: "Shot Put", color: "amber" },
                  { key: "discus_text", label: "Discus", color: "cyan" },
                  { key: "javelin_text", label: "Javelin", color: "rose" },
                ].map(({ key, label, color }) => dailyPlan[key] ? (
                  <div key={key} className={cn(
                    "rounded-lg p-3 border",
                    color === "amber" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
                    color === "cyan" ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800" :
                    "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                  )}>
                    <p className={cn("font-semibold mb-1",
                      color === "amber" ? "text-amber-800 dark:text-amber-300" :
                      color === "cyan" ? "text-cyan-800 dark:text-cyan-300" :
                      "text-rose-800 dark:text-rose-300"
                    )}>{label}</p>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-4">{dailyPlan[key]}</p>
                  </div>
                ) : null)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Athlete Cards */}
        <div>
          <button
            type="button"
            onClick={() => setMonitorOpen(p => !p)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Athlete Monitor ({athletes.length})</span>
            {monitorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {monitorOpen && (
            <div className="space-y-3">
              {athletes.length === 0 ? (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No athletes found.</p>
                  </CardContent>
                </Card>
              ) : (
                athletes.map(athlete => (
                  <AthleteMonitorCard
                    key={athlete.id}
                    athlete={athlete}
                    override={overrides.find(o => o.athlete_email === athlete.email) || null}
                    dailyPlan={dailyPlan}
                    throwLogs={throwLogs}
                    onSendFeedback={handleSendFeedback}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}