import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { toast } from "sonner";
import { format } from "date-fns";
import CopyPlanDialog from "./CopyPlanDialog";
import AIPlanGenerator from "./AIPlanGenerator";
import AthleteOverridesSection from "./AthleteOverridesSection";
import DrillPicker from "./DrillPicker";
import { Plus, Trash2 } from "lucide-react";
import { ALL_EVENTS, EVENTS_BY_CATEGORY, EVENT_CATEGORIES } from "../shared/eventConfig";

// Events that have a corresponding text field in DailyPlan
const EVENT_PLAN_FIELDS = {
  shot_put:      "shot_text",
  discus:        "discus_text",
  javelin:       "javelin_text",
  long_jump:     "long_jump_text",
  triple_jump:   "triple_jump_text",
  high_jump:     "high_jump_text",
  pole_vault:    "pole_vault_text",
  "100m":        "100m_text",
  "200m":        "200m_text",
  "400m":        "400m_text",
  "800m":        "800m_text",
  "1600m":       "1600m_text",
  "3200m":       "3200m_text",
  "100m_hurdles":"hurdles_text",
  "110m_hurdles":"hurdles_text",
  "300m_hurdles":"hurdles_text",
  "4x100_relay": "relays_text",
  "4x400_relay": "relays_text",
  "4x800_relay": "relays_text",
};

// Get the unique plan fields (some events share a field)
const FIELD_TO_LABEL = {
  shot_text:      "Shot Put",
  discus_text:    "Discus",
  javelin_text:   "Javelin",
  long_jump_text: "Long Jump",
  triple_jump_text:"Triple Jump",
  high_jump_text: "High Jump",
  pole_vault_text:"Pole Vault",
  "100m_text":    "100m",
  "200m_text":    "200m",
  "400m_text":    "400m",
  "800m_text":    "800m",
  "1600m_text":   "1600m",
  "3200m_text":   "3200m",
  hurdles_text:   "Hurdles",
  relays_text:    "Relays",
};

// Derive all event ids that map to a given field
function getEventIdsForField(field) {
  return Object.entries(EVENT_PLAN_FIELDS)
    .filter(([, f]) => f === field)
    .map(([id]) => id);
}

const ALL_PLAN_FIELDS = Object.keys(FIELD_TO_LABEL);

export default function EditPlanDialog({ date, plan, meet, open, onOpenChange }) {
  const [planData, setPlanData] = useState({
    day_type: "technical",
    shot_text: "",
    discus_text: "",
    javelin_text: "",
    coach_notes: "",
  });

  // Track which fields are "active" (visible) in the editor
  const [activeFields, setActiveFields] = useState(["shot_text", "discus_text", "javelin_text"]);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);

  const [meetData, setMeetData] = useState({
    name: "",
    notes: "",
  });

  const [activeSeason, setActiveSeason] = useState(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [activeSeasonObj, setActiveSeasonObj] = useState(null);
  const [drillPickerOpen, setDrillPickerOpen] = useState(false);
  const [selectedEventForDrill, setSelectedEventForDrill] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchActiveSeason = async () => {
      const seasons = await base44.entities.Season.filter({ is_active: true });
      setActiveSeason(seasons[0] || null);
      setActiveSeasonObj(seasons[0] || null);
    };
    fetchActiveSeason();
  }, []);

  useEffect(() => {
    if (plan) {
      const loaded = {
        day_type: plan.day_type || "technical",
        coach_notes: plan.coach_notes || "",
      };
      ALL_PLAN_FIELDS.forEach(f => { loaded[f] = plan[f] || ""; });
      setPlanData(loaded);
      // Determine which fields are active based on which have content
      const fieldsWithContent = ALL_PLAN_FIELDS.filter(f => plan[f]);
      setActiveFields(
        fieldsWithContent.length > 0
          ? fieldsWithContent
          : ["shot_text", "discus_text", "javelin_text"]
      );
    } else {
      const empty = { day_type: "technical", coach_notes: "" };
      ALL_PLAN_FIELDS.forEach(f => { empty[f] = ""; });
      setPlanData(empty);
      setActiveFields(["shot_text", "discus_text", "javelin_text"]);
    }

    if (meet) {
      setMeetData({
        name: meet.name || "",
        notes: meet.notes || "",
      });
    } else {
      setMeetData({
        name: "",
        notes: "",
      });
    }
  }, [plan, meet]);

  const planMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (id) {
        return base44.entities.DailyPlan.update(id, data);
      } else {
        return base44.entities.DailyPlan.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPlans"] });
      toast.success("Practice plan saved!");
    },
    onError: () => {
      toast.error("Failed to save practice plan");
    },
  });

  const meetMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (id) {
        return base44.entities.Meet.update(id, data);
      } else {
        return base44.entities.Meet.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allMeets"] });
      toast.success("Meet saved!");
    },
    onError: () => {
      toast.error("Failed to save meet");
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPlans"] });
      toast.success("Practice plan deleted");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to delete practice plan");
    },
  });

  const deleteMeetMutation = useMutation({
    mutationFn: (id) => base44.entities.Meet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allMeets"] });
      toast.success("Meet deleted");
    },
    onError: () => {
      toast.error("Failed to delete meet");
    },
  });

  const handleSavePlan = () => {
    if (!activeSeason) {
      toast.error("No active season. Please create and activate a season first.");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    // Clear fields that are no longer active
    const saveData = { ...planData };
    ALL_PLAN_FIELDS.forEach(f => {
      if (!activeFields.includes(f)) saveData[f] = "";
    });
    planMutation.mutate({
      id: plan?.id,
      data: { ...saveData, date: dateStr, season_id: activeSeason.id },
    });
  };

  const handleAddEvent = (eventId) => {
    const field = EVENT_PLAN_FIELDS[eventId];
    if (!field || activeFields.includes(field)) return;
    setActiveFields(prev => [...prev, field]);
    setEventPickerOpen(false);
  };

  const handleRemoveField = (field) => {
    setActiveFields(prev => prev.filter(f => f !== field));
    setPlanData(prev => ({ ...prev, [field]: "" }));
  };

  const handleSaveMeet = () => {
    if (!activeSeason) {
      toast.error("No active season. Please create and activate a season first.");
      return;
    }
    if (!meetData.name.trim()) {
      toast.error("Meet name is required");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    meetMutation.mutate({
      id: meet?.id,
      data: { ...meetData, date: dateStr, season_id: activeSeason.id },
    });
  };

  const handleDeletePlan = () => {
    if (plan?.id && confirm("Delete this practice plan?")) {
      deletePlanMutation.mutate(plan.id);
    }
  };

  const handleDeleteMeet = () => {
    if (meet?.id && confirm("Delete this meet?")) {
      deleteMeetMutation.mutate(meet.id);
    }
  };

  const handleSelectDrill = (drill) => {
    const field = selectedEventForDrill; // now stores the field name directly
    if (!field) return;
    setPlanData(prev => ({
      ...prev,
      [field]: prev[field] + (prev[field] ? "\n" : "") + drill.name,
    }));
    setDrillPickerOpen(false);
    setSelectedEventForDrill(null);
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Edit Plan - {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Practice Plan Section */}
          <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Practice Plan</h3>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-200">Day Type</Label>
              <MobileSelect
                value={planData.day_type}
                onValueChange={(value) =>
                  setPlanData({ ...planData, day_type: value })
                }
                options={[
                  { value: "technical", label: "Technical (Blue)" },
                  { value: "primary", label: "Primary (Green)" },
                  { value: "indoor", label: "Indoor (Orange)" },
                  { value: "tuneup", label: "Tune-up (Purple)" },
                  { value: "meet", label: "Meet (Red)" },
                  { value: "recovery", label: "Recovery (Grey)" },
                ]}
                label="Day Type"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-900 dark:text-gray-200">Shot Put Plan</Label>
                <Button
                  onClick={() => {
                    setSelectedEventForDrill("shot");
                    setDrillPickerOpen(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="gap-2 dark:border-gray-600 dark:text-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Drill
                </Button>
              </div>
              <Textarea
                value={planData.shot_text}
                onChange={(e) =>
                  setPlanData({ ...planData, shot_text: e.target.value })
                }
                placeholder="Theme, drills, cues..."
                rows={3}
                className="text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 break-words"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-900 dark:text-gray-200">Discus Plan</Label>
                <Button
                  onClick={() => {
                    setSelectedEventForDrill("discus");
                    setDrillPickerOpen(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="gap-2 dark:border-gray-600 dark:text-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Drill
                </Button>
              </div>
              <Textarea
                value={planData.discus_text}
                onChange={(e) =>
                  setPlanData({ ...planData, discus_text: e.target.value })
                }
                placeholder="Theme, drills, cues..."
                rows={3}
                className="text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 break-words"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-900 dark:text-gray-200">Javelin Plan</Label>
                <Button
                  onClick={() => {
                    setSelectedEventForDrill("javelin");
                    setDrillPickerOpen(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="gap-2 dark:border-gray-600 dark:text-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Drill
                </Button>
              </div>
              <Textarea
                value={planData.javelin_text}
                onChange={(e) =>
                  setPlanData({ ...planData, javelin_text: e.target.value })
                }
                placeholder="Theme, drills, cues..."
                rows={3}
                className="text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 break-words"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-200">Coach Notes</Label>
              <Textarea
                value={planData.coach_notes}
                onChange={(e) =>
                  setPlanData({ ...planData, coach_notes: e.target.value })
                }
                placeholder="Additional notes for the team..."
                rows={2}
                className="text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 break-words"
              />
            </div>

            <AIPlanGenerator
              planData={planData}
              date={date}
              onApplyGeneric={(updates) => setPlanData((prev) => ({ ...prev, ...updates }))}
            />

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSavePlan}
                disabled={planMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {planMutation.isPending ? "Saving..." : "Save Plan"}
              </Button>
              {plan && (
                <>
                  <Button
                    onClick={() => setCopyDialogOpen(true)}
                    variant="outline"
                    className="dark:border-gray-600 dark:text-gray-200"
                  >
                    Copy Plan
                  </Button>
                  <Button
                    onClick={handleDeletePlan}
                    disabled={deletePlanMutation.isPending}
                    variant="destructive"
                  >
                    Delete Plan
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Athlete-Specific Overrides */}
          <AthleteOverridesSection date={date} activeSeason={activeSeasonObj} />

          {/* Meet Section */}
          <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-red-300 dark:border-red-900">
            <h3 className="font-semibold text-lg text-red-700 dark:text-red-400">Meet Information</h3>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-200">Meet Name</Label>
              <Input
                value={meetData.name}
                onChange={(e) =>
                  setMeetData({ ...meetData, name: e.target.value })
                }
                placeholder="e.g. League Championships"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-200">Meet Notes</Label>
              <Textarea
                value={meetData.notes}
                onChange={(e) =>
                  setMeetData({ ...meetData, notes: e.target.value })
                }
                placeholder="Location, start time, special instructions..."
                rows={2}
                className="text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 break-words"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveMeet}
                disabled={meetMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {meetMutation.isPending ? "Saving..." : "Save Meet"}
              </Button>
              {meet && (
                <Button
                  onClick={handleDeleteMeet}
                  disabled={deleteMeetMutation.isPending}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Delete Meet
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <CopyPlanDialog 
        plan={plan}
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
      />

      <DrillPicker
        open={drillPickerOpen}
        onOpenChange={setDrillPickerOpen}
        onSelectDrill={handleSelectDrill}
        eventType={selectedEventForDrill ? { shot: "shot_put", discus: "discus", javelin: "javelin" }[selectedEventForDrill] : null}
      />
    </Dialog>
  );
}