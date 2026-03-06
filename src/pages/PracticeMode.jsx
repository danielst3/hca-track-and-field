import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseDrillText, useAbbreviations } from "../components/shared/DrillLink";
import { drillsDatabase } from "../components/data/drillsDatabase";
import DrillDetailPanel from "../components/practice/DrillDetailPanel";
import PracticeTimer from "../components/practice/PracticeTimer";
import SessionSummary from "../components/practice/SessionSummary";
import VideoAnalysis from "../components/practice/VideoAnalysis";
import { createPageUrl } from "../utils";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Play,
  Flag, SkipForward, MessageSquare, Plus, X, Dumbbell,
  Trophy, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { getActiveViewRole, getAvailableViews } from "../components/shared/getActiveViewRole";

function extractDrillsFromText(text, databaseDrills = [], resources = [], abbreviations = []) {
  if (!text) return [];
  const lines = text.split("\n").filter(l => l.trim());
  const drillItems = [];
  lines.forEach(line => {
    const parts = parseDrillText(line, resources, abbreviations, databaseDrills);
    const drillPart = parts.find(p => p.type === "drill" && p.linkItem?.type === "drill");
    if (drillPart) {
      drillItems.push({ line: line.trim(), drillData: drillPart.linkItem?.drill || null, displayText: drillPart.displayText });
    } else {
      drillItems.push({ line: line.trim(), drillData: null, displayText: null });
    }
  });
  return drillItems;
}

export default function PracticeMode() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [completedDrills, setCompletedDrills] = useState(new Set());
  const [drillLogs, setDrillLogs] = useState({});
  const [note, setNote] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const queryClient = useQueryClient();
  const dateStr = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      const impersonating = localStorage.getItem("impersonating");
      const availableViews = getAvailableViews(currentUser.user_role_preference, currentUser.role);
      const activeViewRole = getActiveViewRole(currentUser.id, availableViews, currentUser.role);
      const effectiveUser = impersonating && (currentUser?.role === "admin" || activeViewRole === "admin")
        ? { ...currentUser, ...JSON.parse(impersonating), isImpersonating: true, realRole: currentUser.role, activeViewRole }
        : { ...currentUser, activeViewRole };
      setUser(effectiveUser);
    };
    fetchUser();
  }, []);

  // Check for coach feedback via real-time subscription
  useEffect(() => {
    if (!user?.email) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const unsubscribe = base44.entities.AthletePlanOverride.subscribe((event) => {
      if (event.type === "update" && event.data?.athlete_email === user.email && event.data?.date === today) {
        if (event.data?.coach_notes && event.data.coach_notes !== (coachFeedback[coachFeedback.length - 1]?.message || "")) {
          setCoachFeedback(prev => [...prev, { message: event.data.coach_notes, time: new Date() }]);
          toast("📣 Coach sent feedback!", { description: event.data.coach_notes });
        }
      }
    });
    return () => unsubscribe();
  }, [user?.email]);

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

  const athleteEmail = user?.isImpersonating
    ? JSON.parse(localStorage.getItem("impersonating") || "{}").email || null
    : user?.email;

  const { data: athleteOverride } = useQuery({
    queryKey: ["athleteOverride", dateStr, athleteEmail],
    queryFn: async () => {
      const overrides = await base44.entities.AthletePlanOverride.filter({ athlete_email: athleteEmail, date: dateStr });
      return overrides[0] || null;
    },
    enabled: !!athleteEmail && !!user
  });

  const { data: databaseDrills = [] } = useQuery({
    queryKey: ["drills"],
    queryFn: () => base44.entities.Drill.list(),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources-for-drill-links"],
    queryFn: () => base44.entities.Resource.list(),
  });

  const abbreviations = useAbbreviations();

  const { data: throwLogs = [] } = useQuery({
    queryKey: ["throwLogs-practice", athleteEmail],
    queryFn: async () => {
      if (!athleteEmail) return [];
      return base44.entities.ThrowLog.filter({ athlete_email: athleteEmail });
    },
    enabled: !!athleteEmail
  });

  const logThrowMutation = useMutation({
    mutationFn: (data) => base44.entities.ThrowLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["throwLogs-practice"] });
      toast.success("Logged!");
    }
  });

  // Build combined drills list from all events
  const effectivePlan = dailyPlan ? {
    ...dailyPlan,
    shot_text: athleteOverride?.shot_text || dailyPlan.shot_text,
    discus_text: athleteOverride?.discus_text || dailyPlan.discus_text,
    javelin_text: athleteOverride?.javelin_text || dailyPlan.javelin_text,
  } : null;

  const eventSections = effectivePlan ? [
    { event: "shot", label: "Shot Put", text: effectivePlan.shot_text, color: "amber" },
    { event: "discus", label: "Discus", text: effectivePlan.discus_text, color: "cyan" },
    { event: "javelin", label: "Javelin", text: effectivePlan.javelin_text, color: "rose" },
  ].filter(s => s.text) : [];

  const allDrills = eventSections.flatMap(section => {
    const drills = extractDrillsFromText(section.text, databaseDrills, resources, abbreviations);
    return drills.map((d, i) => ({ ...d, event: section.event, eventLabel: section.label, color: section.color, key: `${section.event}-${i}` }));
  });

  const currentDrill = allDrills[currentDrillIndex];
  const progress = allDrills.length > 0 ? (completedDrills.size / allDrills.length) * 100 : 0;

  const handleMarkDone = () => {
    setCompletedDrills(prev => new Set([...prev, currentDrillIndex]));
    if (currentDrillIndex < allDrills.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
      setNote("");
      setShowDetail(false);
    } else {
      setSessionComplete(true);
    }
  };

  const handleSkip = () => {
    if (currentDrillIndex < allDrills.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
      setNote("");
      setShowDetail(false);
    }
  };

  const handleLogThrow = (drillIndex, logData) => {
    setDrillLogs(prev => ({
      ...prev,
      [drillIndex]: [...(prev[drillIndex] || []), logData]
    }));
    logThrowMutation.mutate({
      athlete_email: athleteEmail,
      event: currentDrill?.event === "shot" ? "shot" : currentDrill?.event === "discus" ? "discus" : "javelin",
      date: dateStr,
      session_type: "practice",
      best_distance: parseFloat(logData.distance),
      notes: logData.notes || null,
    });
  };

  const handleSaveNote = (drillIndex) => {
    if (!note.trim()) return;
    setDrillLogs(prev => ({
      ...prev,
      [`note-${drillIndex}`]: note
    }));
    toast.success("Note saved");
    setNote("");
  };

  const isCoachOrAdmin = user?.activeViewRole === "admin" || user?.activeViewRole === "coach";

  // Redirect coaches to their own mode
  if (user && isCoachOrAdmin && !user?.isImpersonating) {
    navigate(createPageUrl("CoachPracticeMode"));
    return null;
  }

  if (!effectivePlan && dailyPlan === null) {
    return (
      <div className="min-h-screen bg-[var(--brand-secondary)] dark:bg-[#111] p-4 pb-20 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Plan Today</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">There's no practice plan scheduled for today.</p>
          <Button asChild variant="outline">
            <a href={createPageUrl("Today")}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Today</a>
          </Button>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <SessionSummary
        allDrills={allDrills}
        completedDrills={completedDrills}
        drillLogs={drillLogs}
        date={dateStr}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--brand-secondary)] dark:bg-[#111] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] dark:from-black dark:to-gray-950 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <a href={createPageUrl("Today")}><ArrowLeft className="w-5 h-5" /></a>
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">Practice Mode</h1>
            <p className="text-xs text-gray-300">{format(new Date(), "EEEE, MMM d")}</p>
          </div>
          <PracticeTimer />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>{completedDrills.size} of {allDrills.length} drills completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Coach Feedback Banner */}
        {coachFeedback.length > 0 && (
          <Card className="border-2 border-[var(--brand-primary)] bg-[var(--brand-secondary)] dark:bg-gray-800">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs font-semibold text-[var(--brand-primary)] dark:text-gray-300 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Coach Feedback
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{coachFeedback[coachFeedback.length - 1].message}</p>
            </CardContent>
          </Card>
        )}

        {/* Drill Navigation Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allDrills.map((drill, idx) => (
            <button
              key={drill.key}
              onClick={() => { setCurrentDrillIndex(idx); setShowDetail(false); setNote(""); }}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                idx === currentDrillIndex
                  ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] dark:bg-gray-200 dark:text-gray-900"
                  : completedDrills.has(idx)
                  ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                  : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              )}
            >
              {completedDrills.has(idx) ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Current Drill Card */}
        {currentDrill && (
          <Card className="dark:bg-gray-800 dark:border-gray-700 shadow-lg">
            <CardHeader className={cn(
              "bg-gradient-to-br rounded-t-lg border-b",
              currentDrill.color === "amber" ? "from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 border-amber-200 dark:border-gray-700" :
              currentDrill.color === "cyan" ? "from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-cyan-200 dark:border-gray-700" :
              "from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 border-rose-200 dark:border-gray-700"
            )}>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={cn(
                  "text-xs",
                  currentDrill.color === "amber" ? "text-amber-700 border-amber-300 dark:text-amber-400" :
                  currentDrill.color === "cyan" ? "text-cyan-700 border-cyan-300 dark:text-cyan-400" :
                  "text-rose-700 border-rose-300 dark:text-rose-400"
                )}>
                  {currentDrill.eventLabel}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentDrillIndex + 1} / {allDrills.length}
                </span>
              </div>
              <CardTitle className="text-gray-900 dark:text-gray-100 text-lg mt-2 leading-snug">
                {currentDrill.line}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Drill Details Toggle */}
              {currentDrill.drillData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetail(v => !v)}
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  {showDetail ? "Hide Details" : "View Drill Details"}
                </Button>
              )}
              {showDetail && currentDrill.drillData && (
                <DrillDetailPanel drill={currentDrill.drillData} />
              )}

              {/* Quick Log */}
              {(currentDrill.event === "shot" || currentDrill.event === "discus" || currentDrill.event === "javelin") && (
                <QuickThrowLogger
                  drillIndex={currentDrillIndex}
                  event={currentDrill.event}
                  logs={drillLogs[currentDrillIndex] || []}
                  onLog={handleLogThrow}
                />
              )}

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</p>
                <Textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add notes or observations..."
                  rows={2}
                  className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {note.trim() && (
                  <Button size="sm" variant="outline" onClick={() => handleSaveNote(currentDrillIndex)} className="dark:bg-gray-700 dark:text-gray-200">
                    Save Note
                  </Button>
                )}
                {drillLogs[`note-${currentDrillIndex}`] && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Saved: {drillLogs[`note-${currentDrillIndex}`]}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  disabled={currentDrillIndex === allDrills.length - 1}
                  className="flex-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                >
                  <SkipForward className="w-4 h-4 mr-1" /> Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleMarkDone}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {currentDrillIndex === allDrills.length - 1 ? "Complete Session" : "Done"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { if (currentDrillIndex > 0) setCurrentDrillIndex(p => p - 1); }}
            disabled={currentDrillIndex === 0}
            className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => { if (currentDrillIndex < allDrills.length - 1) setCurrentDrillIndex(p => p + 1); }}
            disabled={currentDrillIndex === allDrills.length - 1}
            className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Finish early */}
        <div className="text-center pb-4">
          <Button variant="ghost" size="sm" onClick={() => setSessionComplete(true)} className="text-gray-500 dark:text-gray-400">
            <Flag className="w-4 h-4 mr-1" /> End Session Early
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickThrowLogger({ drillIndex, event, logs, onLog }) {
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (!distance) return;
    onLog({ distance, notes, time: format(new Date(), "HH:mm") });
    setDistance("");
    setNotes("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Throws Logged ({logs.length})
        </p>
        <Button size="sm" variant="ghost" onClick={() => setOpen(v => !v)} className="text-xs h-7 dark:text-gray-300">
          <Plus className="w-3 h-3 mr-1" /> Log Throw
        </Button>
      </div>
      {open && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <Input
            type="number"
            step="0.01"
            placeholder="Distance (feet)"
            value={distance}
            onChange={e => setDistance(e.target.value)}
            className="text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)} className="flex-1 dark:bg-gray-600 dark:text-gray-200">Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!distance} className="flex-1 bg-[var(--brand-primary)] text-white">Add</Button>
          </div>
        </div>
      )}
      {logs.length > 0 && (
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
              <span className="font-medium">{log.distance} ft</span>
              {log.notes && <span className="text-gray-400 truncate ml-2">{log.notes}</span>}
              <span className="text-gray-400 ml-auto">{log.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}