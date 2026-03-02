import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { drillsDatabase } from "../data/drillsDatabase";

export default function DrillPicker({ open, onOpenChange, onSelectDrill, eventType }) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: databaseDrills = [] } = useQuery({
    queryKey: ["drills"],
    queryFn: () => base44.entities.Drill.list(),
  });

  const eventMap = {
    shot_put: "Shot",
    discus: "Discus",
    javelin: "Javelin",
    strength: "Strength",
    warmup: "Warm-up",
    prehab: "Prehab"
  };

  // Combine database drills and drills from drillsDatabase
  const allDrills = [
    ...databaseDrills,
    ...drillsDatabase
      .filter(d => {
        const categoryMap = { "Shot": "shot_put", "Discus": "discus", "Javelin": "javelin", "Strength": "strength", "Warm-up": "warmup", "Prehab": "prehab" };
        return !eventType || categoryMap[d.category] === eventType;
      })
      .map(d => ({
        id: `db-${d.name}`,
        name: d.name,
        purpose: d.objective,
        event: { "Shot": "shot_put", "Discus": "discus", "Javelin": "javelin", "Strength": "strength", "Warm-up": "warmup", "Prehab": "prehab" }[d.category]
      }))
  ];

  const filteredDrills = allDrills.filter(drill => {
    const matchesSearch = !searchQuery || drill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = !eventType || drill.event === eventType;
    return matchesSearch && matchesEvent;
  });

  const handleSelectDrill = (drill) => {
    onSelectDrill(drill);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Select a Drill</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drills..."
              className="pl-9 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-lg dark:border-gray-700">
            {filteredDrills.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-gray-400">
                No drills found
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredDrills.map((drill) => (
                  <div
                    key={drill.id}
                    className="p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-gray-100">
                        {drill.name}
                      </h4>
                      {drill.purpose && (
                        <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                          {drill.purpose}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {drill.event.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleSelectDrill(drill)}
                      size="sm"
                      variant="ghost"
                      className="ml-2 h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}