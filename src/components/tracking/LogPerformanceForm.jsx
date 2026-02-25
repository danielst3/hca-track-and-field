import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LogPerformanceForm({ event, eventLabel, user, onClose, open: openProp, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const [logType, setLogType] = useState("distance");
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    session_type: "practice",
    value: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: async (data) => {
      if (logType === "distance") {
        return base44.entities.ThrowLog.create(data);
      } else {
        return base44.entities.TrainingLog.create(data);
      }
    },
    onMutate: async (newLog) => {
      const key = logType === "distance" ? ["throwLogs"] : ["trainingLogs"];
      await queryClient.cancelQueries({ queryKey: key });
      const previousData = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) => [...(old || []), { ...newLog, id: 'temp-' + Date.now() }]);
      return { previousData, key };
    },
    onError: (err, newLog, context) => {
      queryClient.setQueryData(context.key, context.previousData);
      toast.error("Failed to log performance");
    },
    onSuccess: () => {
      const key = logType === "distance" ? ["throwLogs"] : ["trainingLogs"];
      queryClient.invalidateQueries({ queryKey: key });
      toast.success("Performance logged successfully!");
      if (onOpenChange) {
        onOpenChange(false);
      }
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        session_type: "practice",
        value: "",
        notes: "",
      });
      if (onClose) {
        onClose();
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (logType === "distance") {
      logMutation.mutate({
        athlete_email: user.email,
        event,
        date: formData.date,
        session_type: formData.session_type,
        best_distance: parseFloat(formData.value),
        notes: formData.notes || null,
      });
    } else {
      logMutation.mutate({
        athlete_email: user.email,
        event,
        date: formData.date,
        session_type: formData.session_type,
        time: formData.value,
        notes: formData.notes || null,
      });
    }
  };

  const handleClose = (newOpen) => {
    if (!isControlled) setInternalOpen(newOpen);
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setInternalOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Log {eventLabel} Performance</DialogTitle>
          <DialogDescription>Record your performance data for {eventLabel}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dark:text-gray-200">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-gray-200">Type</Label>
              <MobileSelect
                value={logType}
                onValueChange={setLogType}
                options={[
                  { value: "distance", label: "Distance" },
                  { value: "time", label: "Time" }
                ]}
                label="Log Type"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Session Type</Label>
            <MobileSelect
              value={formData.session_type}
              onValueChange={(value) =>
                setFormData({ ...formData, session_type: value })
              }
              options={[
                { value: "practice", label: "Practice" },
                { value: "meet", label: "Meet" }
              ]}
              label="Session Type"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">
              {logType === "distance" ? "Distance (feet)" : "Time (MM:SS or seconds)"}
            </Label>
            <Input
              type={logType === "distance" ? "number" : "text"}
              step={logType === "distance" ? "0.01" : undefined}
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder={logType === "distance" ? "e.g. 38.5" : "e.g. 2:45 or 165"}
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Notes (optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="How did it feel? What to work on?"
              rows={3}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="select-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logMutation.isPending}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] select-none dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {logMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}