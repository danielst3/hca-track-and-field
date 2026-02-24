import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "../utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trophy, Save, ArrowLeft, Circle, Disc3, Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENTS = [
  { id: "shot", label: "Shot Put", Icon: Circle, color: "text-amber-600" },
  { id: "discus", label: "Discus", Icon: Disc3, color: "text-cyan-600" },
  { id: "javelin", label: "Javelin", Icon: Zap, color: "text-rose-600" },
];

export default function BulkMeetEntry() {
  const [user, setUser] = useState(null);
  const [meetName, setMeetName] = useState("");
  const [meetDate, setMeetDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeEvents, setActiveEvents] = useState(["shot", "discus", "javelin"]);
  // grid[athleteId][eventId] = distance string
  const [grid, setGrid] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();
  const inputRefs = useRef({});

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== "admin" && currentUser.role !== "coach") {
        window.location.href = createPageUrl("Today");
      }
    };
    fetchUser();
  }, []);

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes-roster"],
    queryFn: async () => {
      const all = await base44.entities.User.list();
      return all
        .filter(a => !a.graduated && (a.role === "user" || a.user_role_preference?.includes("user")))
        .sort((a, b) => {
          const nameA = (a.first_name && a.last_name) ? `${a.first_name} ${a.last_name}` : a.full_name;
          const nameB = (b.first_name && b.last_name) ? `${b.first_name} ${b.last_name}` : b.full_name;
          return nameA.localeCompare(nameB);
        });
    },
    enabled: !!user,
  });

  const toggleEvent = (eventId) => {
    setActiveEvents(prev =>
      prev.includes(eventId)
        ? prev.length > 1 ? prev.filter(e => e !== eventId) : prev
        : [...prev, eventId]
    );
  };

  const handleCellChange = (athleteId, eventId, value) => {
    setGrid(prev => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] || {}), [eventId]: value }
    }));
  };

  // Tab/Enter key to move to next cell
  const handleKeyDown = (e, athleteIndex, eventIndex) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const visibleEvents = EVENTS.filter(ev => activeEvents.includes(ev.id));
      let nextAthleteIndex = athleteIndex;
      let nextEventIndex = eventIndex + 1;
      if (nextEventIndex >= visibleEvents.length) {
        nextEventIndex = 0;
        nextAthleteIndex = athleteIndex + 1;
      }
      if (nextAthleteIndex < athletes.length) {
        const key = `${athletes[nextAthleteIndex].id}-${visibleEvents[nextEventIndex].id}`;
        inputRefs.current[key]?.focus();
      }
    }
  };

  const handleSave = async () => {
    if (!meetName.trim()) {
      toast.error("Please enter a meet name");
      return;
    }
    if (!meetDate) {
      toast.error("Please enter a meet date");
      return;
    }

    const entries = [];
    for (const [athleteId, events] of Object.entries(grid)) {
      const athlete = athletes.find(a => a.id === athleteId);
      if (!athlete) continue;
      for (const [eventId, value] of Object.entries(events)) {
        const distance = parseFloat(value);
        if (!isNaN(distance) && distance > 0) {
          entries.push({
            athlete_email: athlete.email,
            event: eventId,
            date: meetDate,
            session_type: "meet",
            best_distance: distance,
            notes: meetName.trim(),
          });
        }
      }
    }

    if (entries.length === 0) {
      toast.error("No results entered yet");
      return;
    }

    setSaving(true);
    await base44.entities.ThrowLog.bulkCreate(entries);
    queryClient.invalidateQueries({ queryKey: ["throwLogs"] });
    setSaving(false);
    setSaved(true);
    toast.success(`Saved ${entries.length} results for ${meetName}`);
    setTimeout(() => setSaved(false), 3000);
  };

  const filledCount = Object.values(grid).reduce((sum, evts) =>
    sum + Object.values(evts).filter(v => v !== "" && !isNaN(parseFloat(v))).length, 0);

  if (!user) return null;

  const visibleEvents = EVENTS.filter(ev => activeEvents.includes(ev.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-[var(--brand-primary)] dark:text-gray-300" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Bulk Meet Entry</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">Enter results for all athletes at once</p>
          </div>
        </div>

        {/* Meet Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Meet Name</label>
            <Input
              value={meetName}
              onChange={e => setMeetName(e.target.value)}
              placeholder="e.g. Regionals 2026"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div className="w-full sm:w-48 space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Date</label>
            <Input
              type="date"
              value={meetDate}
              onChange={e => setMeetDate(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Event Toggles */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mr-1">Events:</span>
          {EVENTS.map(ev => {
            const active = activeEvents.includes(ev.id);
            return (
              <button
                key={ev.id}
                onClick={() => toggleEvent(ev.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  active
                    ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                    : "bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-slate-300 dark:border-gray-600"
                )}
              >
                <ev.Icon className="w-3.5 h-3.5" />
                {ev.label}
              </button>
            );
          })}
        </div>

        {/* Spreadsheet Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 sticky left-0 bg-slate-100 dark:bg-gray-900 min-w-[160px]">
                    Athlete
                  </th>
                  {visibleEvents.map(ev => (
                    <th key={ev.id} className="px-3 py-3 font-semibold text-slate-700 dark:text-gray-300 min-w-[130px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <ev.Icon className={cn("w-4 h-4", ev.color)} />
                        <span>{ev.label}</span>
                      </div>
                      <div className="text-xs font-normal text-slate-400 dark:text-gray-500 mt-0.5">feet</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {athletes.map((athlete, athleteIdx) => {
                  const name = (athlete.first_name && athlete.last_name)
                    ? `${athlete.first_name} ${athlete.last_name}`
                    : athlete.full_name;
                  const rowHasData = visibleEvents.some(ev => {
                    const v = grid[athlete.id]?.[ev.id];
                    return v && !isNaN(parseFloat(v));
                  });
                  return (
                    <tr
                      key={athlete.id}
                      className={cn(
                        "border-b border-slate-100 dark:border-gray-700 last:border-0 transition-colors",
                        rowHasData ? "bg-green-50 dark:bg-green-950/20" : "hover:bg-slate-50 dark:hover:bg-gray-750"
                      )}
                    >
                      <td className="px-4 py-2 sticky left-0 bg-inherit dark:bg-gray-800">
                        <div className="font-medium text-slate-900 dark:text-gray-100 truncate max-w-[150px]">{name}</div>
                        {athlete.events?.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {athlete.events.map(e => (
                              <span key={e} className="text-xs text-slate-400 dark:text-gray-500 capitalize">{e}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      {visibleEvents.map((ev, evIdx) => {
                        const cellKey = `${athlete.id}-${ev.id}`;
                        const val = grid[athlete.id]?.[ev.id] ?? "";
                        const parsed = parseFloat(val);
                        const isValid = val !== "" && !isNaN(parsed) && parsed > 0;
                        return (
                          <td key={ev.id} className="px-3 py-2">
                            <Input
                              ref={el => { inputRefs.current[cellKey] = el; }}
                              type="number"
                              step="0.01"
                              min="0"
                              value={val}
                              onChange={e => handleCellChange(athlete.id, ev.id, e.target.value)}
                              onKeyDown={e => handleKeyDown(e, athleteIdx, evIdx)}
                              placeholder="—"
                              className={cn(
                                "text-center h-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 tabular-nums",
                                isValid && "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30"
                              )}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {athletes.length === 0 && (
                  <tr>
                    <td colSpan={visibleEvents.length + 1} className="text-center py-12 text-slate-400 dark:text-gray-500">
                      No athletes on roster
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-3">
          <div className="text-sm text-slate-600 dark:text-gray-400">
            {filledCount > 0
              ? <span className="font-semibold text-green-600 dark:text-green-400">{filledCount} result{filledCount !== 1 ? "s" : ""} entered</span>
              : "No results entered yet"}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || filledCount === 0}
            className={cn(
              "gap-2 font-semibold",
              saved
                ? "bg-green-600 hover:bg-green-600"
                : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]"
            )}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : `Save ${filledCount > 0 ? filledCount + " " : ""}Results`}
          </Button>
        </div>
      </div>
    </div>
  );
}