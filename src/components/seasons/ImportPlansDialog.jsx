import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";

export default function ImportPlansDialog({ seasonId }) {
  const [file, setFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (csvFile) => {
      setIsLoading(true);
      try {
        // Upload file
        const uploadRes = await base44.integrations.Core.UploadFile({ file: csvFile });
        
        // Extract data from CSV
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: uploadRes.file_url,
          json_schema: {
            type: "object",
            properties: {
              date: { type: "string" },
              day_type: { type: "string" },
              shot_text: { type: "string" },
              discus_text: { type: "string" },
              javelin_text: { type: "string" },
              coach_notes: { type: "string" },
            },
            required: ["date", "day_type"],
          },
        });

        if (extractRes.status !== "success") {
          throw new Error(extractRes.details || "Failed to parse CSV");
        }

        const plans = Array.isArray(extractRes.output) ? extractRes.output : [extractRes.output];
        
        // Bulk create plans
        const validPlans = plans.map(p => ({
          date: p.date,
          day_type: p.day_type,
          shot_text: p.shot_text || "",
          discus_text: p.discus_text || "",
          javelin_text: p.javelin_text || "",
          coach_notes: p.coach_notes || "",
          season_id: seasonId,
        }));

        await base44.entities.DailyPlan.bulkCreate(validPlans);
        return validPlans.length;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      toast.success(`Imported ${count} plans successfully`);
      setOpen(false);
      setFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import plans");
    },
  });

  const downloadTemplate = () => {
    const csv = `date,day_type,shot_text,discus_text,javelin_text,coach_notes
2026-02-13,technical,Focus on setup and footwork,Balance drills,Approach step drills,Review technique
2026-02-14,primary,Power development,Spin technique,Release work,Focus on consistency
2026-02-15,recovery,Light work,Easy throws,Easy work,Rest day`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "practice-plans-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    importMutation.mutate(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
          <Upload className="w-4 h-4" />
          Import Plans
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Import Practice Plans</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Import plans from a CSV file. Download the template to get started.
          </p>
          
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full gap-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </Button>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Select CSV File</Label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !file}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}