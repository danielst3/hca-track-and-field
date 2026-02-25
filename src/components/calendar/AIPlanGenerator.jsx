import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Sparkles, ChevronDown, ChevronUp, Loader2, Users, User } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

const EVENT_LABELS = { shot: "Shot Put", discus: "Discus", javelin: "Javelin" };

const DAY_TYPE_DESCRIPTIONS = {
  technical: "technical day focused on form, mechanics, and skill development",
  primary: "primary high-volume training day",
  indoor: "indoor training session",
  tuneup: "tune-up day before competition — moderate intensity, sharpen technique",
  meet: "meet/competition preparation day",
  recovery: "recovery and light movement day — low intensity",
};

export default function AIPlanGenerator({ planData, date, onApplyGeneric }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("generic");
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [focusNotes, setFocusNotes] = useState("");
  const [generating, setGenerating] = useState(null);

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes-ai-generator"],
    queryFn: () => base44.entities.User.filter({ role: "user" }),
    enabled: open,
  });

  const { data: upcomingMeets = [] } = useQuery({
    queryKey: ["meets-ai-generator"],
    queryFn: () => base44.entities.Meet.list(),
    enabled: open,
  });

  const getNextMeetInfo = () => {
    if (!date || !upcomingMeets.length) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    const future = upcomingMeets
      .filter((m) => m.date >= dateStr)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!future.length) return null;
    const days = differenceInDays(new Date(future[0].date), date);
    return { name: future[0].name, daysAway: days };
  };

  const handleGenerate = async (eventsArg) => {
    const eventList = eventsArg === "all" ? ["shot", "discus", "javelin"] : [eventsArg];
    setGenerating(eventsArg);
    try {

    let athleteContext = "";
    if (mode === "athlete" && selectedAthlete) {
      const athlete = athletes.find((a) => a.email === selectedAthlete);
      const logs = await base44.entities.ThrowLog.filter({ athlete_email: selectedAthlete });
      const sorted = logs.sort((a, b) => new Date(b.date) - new Date(a.date));

      athleteContext = `\n\nATHLETE DATA — ${athlete?.full_name || selectedAthlete}:\n`;
      for (const ev of eventList) {
        const evLogs = sorted.filter((l) => l.event === ev);
        if (evLogs.length > 0) {
          const pr = Math.max(...evLogs.map((l) => l.best_distance));
          const recent = evLogs.slice(0, 5).map((l) => l.best_distance);
          const trend =
            recent.length > 1
              ? recent[0] > recent[recent.length - 1]
                ? "improving"
                : recent[0] < recent[recent.length - 1]
                ? "declining"
                : "plateaued"
              : "insufficient data";
          athleteContext += `- ${EVENT_LABELS[ev]}: PR ${pr}ft | Last ${recent.length} sessions: [${recent.join(", ")}]ft | Trend: ${trend} | Total sessions: ${evLogs.length}\n`;
        } else {
          athleteContext += `- ${EVENT_LABELS[ev]}: No data yet (beginner or new to event)\n`;
        }
      }
    }

    const nextMeet = getNextMeetInfo();
    const meetContext = nextMeet
      ? `\nUpcoming competition: "${nextMeet.name}" in ${nextMeet.daysAway} day${nextMeet.daysAway !== 1 ? "s" : ""}.`
      : "\nNo upcoming meets scheduled.";

    const dayDesc = DAY_TYPE_DESCRIPTIONS[planData?.day_type] || planData?.day_type || "training";

    const prompt = `You are an expert high school track and field throws coach. Generate a specific and practical ${dayDesc} practice plan.
${meetContext}${athleteContext}
${focusNotes ? `\nCoach's additional focus: ${focusNotes}` : ""}

Generate a practice plan for: ${eventList.map((e) => EVENT_LABELS[e]).join(", ")}.

For each event, provide:
- A 1-line theme for the session
- 3–5 specific drills or exercises with sets/reps where relevant
- 2–3 key coaching cues or technical focuses

Use plain text with line breaks. No markdown headers or asterisks. Keep each event under 120 words.
${
  mode === "athlete" && selectedAthlete
    ? "IMPORTANT: Tailor this specifically to the athlete's trends shown above. If any event shows a declining trend, prescribe corrective work."
    : "Create a plan appropriate for the full team at a high school throws program."
}`;

    const schema = {
      type: "object",
      properties: Object.fromEntries(eventList.map((ev) => [`${ev}_text`, { type: "string" }])),
    };

    const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });

    if (mode === "athlete" && selectedAthlete) {
      const dateStr = format(date, "yyyy-MM-dd");
      const existing = await base44.entities.AthletePlanOverride.filter({
        athlete_email: selectedAthlete,
        date: dateStr,
      });

      const overrideData = {
        athlete_email: selectedAthlete,
        date: dateStr,
        ...Object.fromEntries(eventList.map((ev) => [`${ev}_text`, result[`${ev}_text`] || ""])),
      };

      if (existing.length > 0) {
        await base44.entities.AthletePlanOverride.update(existing[0].id, overrideData);
      } else {
        await base44.entities.AthletePlanOverride.create(overrideData);
      }

      const athleteName = athletes.find((a) => a.email === selectedAthlete)?.full_name || selectedAthlete;
      toast.success(`Athlete-specific plan saved for ${athleteName}!`);
    } else {
      const update = {};
      for (const ev of eventList) {
        if (result[`${ev}_text`]) update[`${ev}_text`] = result[`${ev}_text`];
      }
      onApplyGeneric(update);
      toast.success("AI plan applied to form — review and save.");
    }

    } catch (err) {
      console.error("AI generation error:", err);
      toast.error("AI generation failed: " + (err?.message || "Unknown error"));
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 hover:from-purple-100 hover:to-violet-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          AI Practice Plan Generator
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-purple-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-500" />
        )}
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900 border-t border-purple-100 dark:border-purple-900">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("generic")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                mode === "generic"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
              }`}
            >
              <Users className="w-4 h-4" />
              Team Plan
            </button>
            <button
              type="button"
              onClick={() => setMode("athlete")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                mode === "athlete"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
              }`}
            >
              <User className="w-4 h-4" />
              Athlete Override
            </button>
          </div>

          {/* Athlete Selector */}
          {mode === "athlete" && (
            <div className="space-y-1">
              <Label className="text-sm dark:text-gray-300">Select Athlete</Label>
              <MobileSelect
                value={selectedAthlete}
                onValueChange={setSelectedAthlete}
                options={athletes.map((a) => ({ value: a.email, label: a.full_name || a.email }))}
                label="Choose Athlete"
              />
            </div>
          )}

          {/* Focus Notes */}
          <div className="space-y-1">
            <Label className="text-sm dark:text-gray-300">Focus / Context (optional)</Label>
            <Textarea
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
              placeholder="e.g. Work on release angle, athlete coming off rest week, focus on footwork..."
              rows={2}
              className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Generate Buttons */}
          <div className="flex flex-wrap gap-2">
            {["shot", "discus", "javelin"].map((ev) => (
              <Button
                key={ev}
                type="button"
                size="sm"
                variant="outline"
                disabled={!!generating || (mode === "athlete" && !selectedAthlete)}
                onClick={() => handleGenerate(ev)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30 text-xs"
              >
                {generating === ev && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                {EVENT_LABELS[ev]}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              disabled={!!generating || (mode === "athlete" && !selectedAthlete)}
              onClick={() => handleGenerate("all")}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              {generating === "all" ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              Generate All
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mode === "generic"
              ? "Generated plan fills the team plan fields above for your review before saving."
              : selectedAthlete
              ? "Generated plan is saved directly as an override — athlete will see it instead of the team plan."
              : "Select an athlete to generate a personalized plan based on their performance data."}
          </p>
        </div>
      )}
    </div>
  );
}