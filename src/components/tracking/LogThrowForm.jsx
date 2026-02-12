import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LogThrowForm({ event, eventLabel, user }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    session_type: "practice",
    best_distance: "",
    implement_weight: "",
    attempts: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: (data) => base44.entities.ThrowLog.create(data),
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ["throwLogs"] });
      const previousLogs = queryClient.getQueryData(["throwLogs"]);
      queryClient.setQueryData(["throwLogs"], (old) => [...(old || []), { ...newLog, id: 'temp-' + Date.now() }]);
      return { previousLogs };
    },
    onError: (err, newLog, context) => {
      queryClient.setQueryData(["throwLogs"], context.previousLogs);
      toast.error("Failed to log throw");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["throwLogs"] });
      toast.success("Throw logged successfully!");
      setOpen(false);
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        session_type: "practice",
        best_distance: "",
        implement_weight: "",
        attempts: "",
        notes: "",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const attemptsArray = formData.attempts
      ? formData.attempts.split(",").map((a) => parseFloat(a.trim())).filter(n => !isNaN(n))
      : [];

    logMutation.mutate({
      athlete_email: user.email,
      event,
      date: formData.date,
      session_type: formData.session_type,
      best_distance: parseFloat(formData.best_distance),
      implement_weight: formData.implement_weight || null,
      attempts: attemptsArray.length > 0 ? attemptsArray : null,
      notes: formData.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 select-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700">
          <Plus className="w-4 h-4" />
          Log {eventLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Log {eventLabel} Throw</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                value={formData.session_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, session_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="meet">Meet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Best Distance (feet)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.best_distance}
              onChange={(e) =>
                setFormData({ ...formData, best_distance: e.target.value })
              }
              placeholder="e.g. 38.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Implement Weight (optional)</Label>
            <Input
              value={formData.implement_weight}
              onChange={(e) =>
                setFormData({ ...formData, implement_weight: e.target.value })
              }
              placeholder="e.g. 12 lb, 1.6 kg"
            />
          </div>

          <div className="space-y-2">
            <Label>All Attempts (optional, comma-separated)</Label>
            <Input
              value={formData.attempts}
              onChange={(e) =>
                setFormData({ ...formData, attempts: e.target.value })
              }
              placeholder="e.g. 35.5, 36.2, 38.5"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="How did it feel? What to work on?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="select-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logMutation.isPending}
              className="bg-[#551e1b] hover:bg-[#6b2622] select-none dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {logMutation.isPending ? "Saving..." : "Save Throw"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}