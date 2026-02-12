import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function QuickLogButton({ user }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    event: "shot",
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
        event: "shot",
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
      event: formData.event,
      date: formData.date,
      session_type: formData.session_type,
      best_distance: parseFloat(formData.best_distance),
      implement_weight: formData.implement_weight || null,
      attempts: attemptsArray.length > 0 ? attemptsArray : null,
      notes: formData.notes || null,
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] z-40 select-none dark:bg-gray-700 dark:hover:bg-gray-600"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) / 2)' }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="dark:bg-gray-900 dark:border-gray-700">
        <DrawerHeader>
          <DrawerTitle className="dark:text-gray-100">Log Throw</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="dark:text-gray-200">Event</Label>
            <MobileSelect
              value={formData.event}
              onValueChange={(value) =>
                setFormData({ ...formData, event: value })
              }
              options={[
                { value: "shot", label: "🏋️ Shot Put" },
                { value: "discus", label: "🥏 Discus" },
                { value: "javelin", label: "🎯 Javelin" }
              ]}
              label="Event"
            />
          </div>

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
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
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
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Best Distance (feet)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.best_distance}
              onChange={(e) =>
                setFormData({ ...formData, best_distance: e.target.value })
              }
              placeholder="e.g. 38.5"
              required
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Implement Weight (optional)</Label>
            <Input
              value={formData.implement_weight}
              onChange={(e) =>
                setFormData({ ...formData, implement_weight: e.target.value })
              }
              placeholder="e.g. 12 lb, 1.6 kg"
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">All Attempts (optional, comma-separated)</Label>
            <Input
              value={formData.attempts}
              onChange={(e) =>
                setFormData({ ...formData, attempts: e.target.value })
              }
              placeholder="e.g. 35.5, 36.2, 38.5"
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
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
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 select-none dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={logMutation.isPending}
              className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] select-none dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {logMutation.isPending ? "Saving..." : "Save Throw"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}