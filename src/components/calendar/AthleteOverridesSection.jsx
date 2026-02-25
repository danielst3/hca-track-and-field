import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, User, Check, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const EVENT_FIELDS = [
  { key: "shot_text", label: "Shot Put Override" },
  { key: "discus_text", label: "Discus Override" },
  { key: "javelin_text", label: "Javelin Override" },
  { key: "coach_notes", label: "Personal Coach Notes" },
];

export default function AthleteOverridesSection({ date, activeSeason }) {
  const [open, setOpen] = useState(false);
  const [expandedAthlete, setExpandedAthlete] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const dateStr = date ? format(date, "yyyy-MM-dd") : null;

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes-overrides-list"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      // Include users whose primary role is "user" (athlete)
      return users.filter(u => u.role === "user");
    },
    enabled: open,
  });

  const { data: overrides = [], refetch: refetchOverrides } = useQuery({
    queryKey: ["athlete-overrides-section", dateStr],
    queryFn: () => base44.entities.AthletePlanOverride.filter({ date: dateStr }),
    enabled: open && !!dateStr,
  });

  // Sync editData when a new athlete is expanded
  useEffect(() => {
    if (expandedAthlete) {
      const existing = overrides.find((o) => o.athlete_email === expandedAthlete);
      setEditData((prev) => ({
        ...prev,
        [expandedAthlete]: {
          shot_text: existing?.shot_text || "",
          discus_text: existing?.discus_text || "",
          javelin_text: existing?.javelin_text || "",
          coach_notes: existing?.coach_notes || "",
        },
      }));
    }
  }, [expandedAthlete, overrides]);

  const saveMutation = useMutation({
    mutationFn: async ({ athleteEmail, data }) => {
      const existing = overrides.find((o) => o.athlete_email === athleteEmail);
      if (existing) {
        return base44.entities.AthletePlanOverride.update(existing.id, data);
      } else {
        return base44.entities.AthletePlanOverride.create({
          ...data,
          athlete_email: athleteEmail,
          date: dateStr,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-overrides-section", dateStr] });
      queryClient.invalidateQueries({ queryKey: ["athlete-plan-overrides"] });
      toast.success("Override saved!");
    },
    onError: (err) => {
      toast.error("Failed to save override: " + (err?.message || "Unknown error"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (overrideId) => base44.entities.AthletePlanOverride.delete(overrideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-overrides-section", dateStr] });
      toast.success("Override removed");
    },
  });

  const handleExpand = (email) => {
    setExpandedAthlete((prev) => (prev === email ? null : email));
  };

  const handleSave = (email) => {
    saveMutation.mutate({ athleteEmail: email, data: editData[email] || {} });
  };

  const handleDelete = (email) => {
    const existing = overrides.find((o) => o.athlete_email === email);
    if (existing && confirm("Remove this athlete's override? They will see the team plan.")) {
      deleteMutation.mutate(existing.id);
    }
  };

  const handleRevert = (email) => {
    const existing = overrides.find((o) => o.athlete_email === email);
    setEditData((prev) => ({
      ...prev,
      [email]: {
        shot_text: existing?.shot_text || "",
        discus_text: existing?.discus_text || "",
        javelin_text: existing?.javelin_text || "",
        coach_notes: existing?.coach_notes || "",
      },
    }));
    toast.success("Reverted to saved override");
  };

  const updateField = (email, key, value) => {
    setEditData((prev) => ({
      ...prev,
      [email]: { ...(prev[email] || {}), [key]: value },
    }));
  };

  return (
    <div className="border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 hover:from-orange-100 hover:to-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold text-sm">
          <User className="w-4 h-4" />
          Athlete-Specific Overrides
          {overrides.length > 0 && (
            <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs px-2 py-0.5 rounded-full">
              {overrides.length}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-orange-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-orange-500" />
        )}
      </button>

      {open && (
        <div className="bg-white dark:bg-gray-900 border-t border-orange-100 dark:border-orange-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 px-4 pt-3 pb-1">
            Set custom plans for individual athletes — they'll see their override instead of the team plan.
          </p>
          {athletes.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">No athletes found.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {athletes.map((athlete) => {
                const hasOverride = overrides.some((o) => o.athlete_email === athlete.email);
                const isExpanded = expandedAthlete === athlete.email;
                const data = editData[athlete.email] || {};

                return (
                  <div key={athlete.email}>
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleExpand(athlete.email)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            hasOverride ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {athlete.full_name || athlete.email}
                        </span>
                        {hasOverride && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded hidden sm:inline">
                            Custom plan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(athlete.email);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                          Leave blank to fall back to the team plan for that event.
                        </p>
                        {EVENT_FIELDS.map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs text-gray-600 dark:text-gray-400">{label}</Label>
                            <Textarea
                              value={data[key] || ""}
                              onChange={(e) => updateField(athlete.email, key, e.target.value)}
                              placeholder={`${label} (overrides team plan if filled)`}
                              rows={2}
                              className="text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSave(athlete.email)}
                            disabled={saveMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700 text-white gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save Override
                          </Button>
                          {hasOverride && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevert(athlete.email)}
                              className="gap-1 dark:bg-gray-700 dark:text-gray-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Revert
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}