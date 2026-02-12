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

export default function EditPlanDialog({ date, plan, meet, open, onOpenChange }) {
  const [planData, setPlanData] = useState({
    day_type: "technical",
    shot_text: "",
    discus_text: "",
    javelin_text: "",
    coach_notes: "",
  });

  const [meetData, setMeetData] = useState({
    name: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (plan) {
      setPlanData({
        day_type: plan.day_type || "technical",
        shot_text: plan.shot_text || "",
        discus_text: plan.discus_text || "",
        javelin_text: plan.javelin_text || "",
        coach_notes: plan.coach_notes || "",
      });
    } else {
      setPlanData({
        day_type: "technical",
        shot_text: "",
        discus_text: "",
        javelin_text: "",
        coach_notes: "",
      });
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
    const dateStr = format(date, "yyyy-MM-dd");
    planMutation.mutate({
      id: plan?.id,
      data: { ...planData, date: dateStr },
    });
  };

  const handleSaveMeet = () => {
    if (!meetData.name.trim()) {
      toast.error("Meet name is required");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    meetMutation.mutate({
      id: meet?.id,
      data: { ...meetData, date: dateStr },
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

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            Edit Plan - {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Practice Plan Section */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-lg text-slate-900">Practice Plan</h3>
            
            <div className="space-y-2">
              <Label className="text-slate-900">Day Type</Label>
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
              <Label className="text-slate-900">Shot Put Plan</Label>
              <Textarea
                value={planData.shot_text}
                onChange={(e) =>
                  setPlanData({ ...planData, shot_text: e.target.value })
                }
                placeholder="Theme, drills, cues..."
                rows={3}
                className="text-slate-900 dark:bg-gray-700 dark:border-gray-600 break-words"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900">Discus Plan</Label>
              <Textarea
                value={planData.discus_text}
                onChange={(e) =>
                  setPlanData({ ...planData, discus_text: e.target.value })
                }
                placeholder="Theme, drills, cues..."
                rows={3}
                className="text-slate-900 dark:bg-gray-700 dark:border-gray-600 break-words"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900">Javelin Plan</Label>
              <Textarea
                value={planData.javelin_text}
                onChange={(e) =>
                  setPlanData({ ...planData, javelin_text: e.target.value })
                }
                placeholder="Theme, drills, cues..."
                rows={3}
                className="text-slate-900 dark:bg-gray-700 dark:border-gray-600 break-words"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900">Coach Notes</Label>
              <Textarea
                value={planData.coach_notes}
                onChange={(e) =>
                  setPlanData({ ...planData, coach_notes: e.target.value })
                }
                placeholder="Additional notes for the team..."
                rows={2}
                className="text-slate-900 dark:bg-gray-700 dark:border-gray-600 break-words"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSavePlan}
                disabled={planMutation.isPending}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {planMutation.isPending ? "Saving..." : "Save Plan"}
              </Button>
              {plan && (
                <Button
                  onClick={handleDeletePlan}
                  disabled={deletePlanMutation.isPending}
                  variant="destructive"
                >
                  Delete Plan
                </Button>
              )}
            </div>
          </div>

          {/* Meet Section */}
          <div className="space-y-4 p-4 bg-red-50 dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-900">
            <h3 className="font-semibold text-lg text-red-900">Meet Information</h3>
            
            <div className="space-y-2">
              <Label className="text-slate-900">Meet Name</Label>
              <Input
                value={meetData.name}
                onChange={(e) =>
                  setMeetData({ ...meetData, name: e.target.value })
                }
                placeholder="e.g. League Championships"
                className="text-slate-900 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900">Meet Notes</Label>
              <Textarea
                value={meetData.notes}
                onChange={(e) =>
                  setMeetData({ ...meetData, notes: e.target.value })
                }
                placeholder="Location, start time, special instructions..."
                rows={2}
                className="text-slate-900 dark:bg-gray-700 dark:border-gray-600 break-words"
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
    </Dialog>
  );
}