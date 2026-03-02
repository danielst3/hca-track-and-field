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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditDrillDialog({ drill, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    name: "",
    purpose: "",
    setup: "",
    execution: "",
    cues: [],
    common_faults: [],
    event: "",
  });
  const [cueInput, setCueInput] = useState("");
  const [faultInput, setFaultInput] = useState("");
  const [drillId, setDrillId] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (drill) {
      // Handle both database drills (with executionSteps, commonFaultsFixes) and custom drills
      const execution = drill.execution || (drill.executionSteps ? drill.executionSteps.join("\n") : "");
      const cues = drill.cues || [];
      const commonFaults = drill.common_faults || (drill.commonFaultsFixes || []);
      
      setFormData({
        name: drill.name || "",
        purpose: drill.purpose || drill.objective || "",
        setup: drill.setup || "",
        execution,
        cues,
        common_faults: commonFaults,
        event: drill.event || "",
      });
      setDrillId(drill.id || null);
      setCueInput("");
      setFaultInput("");
    }
  }, [drill, open]);

  const drillMutation = useMutation({
    mutationFn: async ({ id, data, isLocalDrill }) => {
      if (isLocalDrill) {
        // Local database drills are not in the Drill entity, so always create
        return base44.entities.Drill.create(data);
      } else if (id) {
        return base44.entities.Drill.update(id, data);
      } else {
        return base44.entities.Drill.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drills"] });
      toast.success("Drill saved!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save drill");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Drill.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drills"] });
      toast.success("Drill deleted");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to delete drill");
    },
  });

  const handleAddCue = () => {
    if (cueInput.trim()) {
      setFormData({
        ...formData,
        cues: [...formData.cues, cueInput.trim()],
      });
      setCueInput("");
    }
  };

  const handleRemoveCue = (idx) => {
    setFormData({
      ...formData,
      cues: formData.cues.filter((_, i) => i !== idx),
    });
  };

  const handleAddFault = () => {
    if (faultInput.trim()) {
      setFormData({
        ...formData,
        common_faults: [...formData.common_faults, faultInput.trim()],
      });
      setFaultInput("");
    }
  };

  const handleRemoveFault = (idx) => {
    setFormData({
      ...formData,
      common_faults: formData.common_faults.filter((_, i) => i !== idx),
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Drill name is required");
      return;
    }

    drillMutation.mutate({
      id: drillId,
      data: formData,
    });
  };

  const handleDelete = () => {
    if (drill?.id && confirm("Delete this drill?")) {
      deleteMutation.mutate(drill.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            {drill ? "Edit Drill" : "Add Drill"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-200">Drill Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Drill name"
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Event *</Label>
            <Select value={formData.event} onValueChange={(value) => setFormData({ ...formData, event: value })}>
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="warmup">Warm-up</SelectItem>
                <SelectItem value="shot_put">Shot Put</SelectItem>
                <SelectItem value="discus">Discus</SelectItem>
                <SelectItem value="javelin">Javelin</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="prehab">Prehab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Purpose</Label>
            <Input
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="What is this drill for?"
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Setup</Label>
            <Textarea
              value={formData.setup}
              onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
              placeholder="How to set up the drill..."
              rows={3}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Execution</Label>
            <Textarea
              value={formData.execution}
              onChange={(e) => setFormData({ ...formData, execution: e.target.value })}
              placeholder="How to execute the drill..."
              rows={3}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Coaching Cues</Label>
            <div className="flex gap-2">
              <Input
                value={cueInput}
                onChange={(e) => setCueInput(e.target.value)}
                placeholder="Add a coaching cue..."
                onKeyPress={(e) => e.key === "Enter" && handleAddCue()}
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              />
              <Button
                onClick={handleAddCue}
                variant="outline"
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              >
                Add
              </Button>
            </div>
            {formData.cues.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.cues.map((cue, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2"
                  >
                    {cue}
                    <button
                      onClick={() => handleRemoveCue(idx)}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Common Faults</Label>
            <div className="flex gap-2">
              <Input
                value={faultInput}
                onChange={(e) => setFaultInput(e.target.value)}
                placeholder="Add a common fault..."
                onKeyPress={(e) => e.key === "Enter" && handleAddFault()}
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              />
              <Button
                onClick={handleAddFault}
                variant="outline"
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              >
                Add
              </Button>
            </div>
            {formData.common_faults.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.common_faults.map((fault, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 text-sm flex items-center justify-between"
                  >
                    <span className="text-slate-700 dark:text-gray-300">{fault}</span>
                    <button
                      onClick={() => handleRemoveFault(idx)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={drillMutation.isPending}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              {drillMutation.isPending ? "Saving..." : "Save Drill"}
            </Button>
            {drill && (
              <Button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                variant="destructive"
              >
                Delete
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="ml-auto dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}