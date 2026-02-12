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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MobileSelect } from "@/components/ui/mobile-select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CopyPlanDialog({ plan, open, onOpenChange }) {
  const [seasons, setSeasons] = useState([]);
  const [targetSeason, setTargetSeason] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchSeasons = async () => {
      const allSeasons = await base44.entities.Season.list();
      setSeasons(allSeasons);
      if (allSeasons.length > 0) {
        setTargetSeason(allSeasons[0].id);
      }
    };
    if (open) {
      fetchSeasons();
    }
  }, [open]);

  const copyMutation = useMutation({
    mutationFn: async ({ targetDateStr, targetSeasonId }) => {
      const newPlan = {
        date: targetDateStr,
        season_id: targetSeasonId,
        day_type: plan.day_type,
        shot_text: plan.shot_text,
        discus_text: plan.discus_text,
        javelin_text: plan.javelin_text,
        coach_notes: plan.coach_notes,
      };
      return base44.entities.DailyPlan.create(newPlan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPlans"] });
      toast.success("Practice plan copied successfully!");
      onOpenChange(false);
      setTargetDate("");
    },
    onError: () => {
      toast.error("Failed to copy practice plan");
    },
  });

  const handleCopy = () => {
    if (!targetDate.trim()) {
      toast.error("Please select a target date");
      return;
    }
    if (!targetSeason) {
      toast.error("Please select a target season");
      return;
    }
    copyMutation.mutate({ targetDateStr: targetDate, targetSeasonId: targetSeason });
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Copy Practice Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-gray-200">To Season</Label>
            <MobileSelect
              value={targetSeason}
              onValueChange={setTargetSeason}
              options={seasons.map(s => ({ value: s.id, label: s.name }))}
              label="Select Season"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-gray-200">To Date</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={copyMutation.isPending || !targetDate}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white"
            >
              {copyMutation.isPending ? "Copying..." : "Copy Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}