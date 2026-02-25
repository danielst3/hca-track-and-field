import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Trash2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AbbreviationsKey({ isCoach = false }) {
  const queryClient = useQueryClient();
  const [newAbbr, setNewAbbr] = useState("");
  const [newFull, setNewFull] = useState("");

  const { data: abbreviations = [] } = useQuery({
    queryKey: ["abbreviations"],
    queryFn: () => base44.entities.Abbreviation.list(),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Abbreviation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abbreviations"] });
      setNewAbbr("");
      setNewFull("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Abbreviation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["abbreviations"] }),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (newAbbr.trim() && newFull.trim()) {
      addMutation.mutate({ abbr: newAbbr.trim(), full: newFull.trim() });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
          <BookOpen className="w-4 h-4" />
          Key
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-sm mb-3 dark:text-gray-100">Abbreviations Key</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {abbreviations.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono font-bold text-[var(--brand-primary)] dark:text-gray-300 min-w-[36px]">{item.abbr}</span>
                <span className="text-slate-600 dark:text-gray-400">{item.full}</span>
              </div>
              {isCoach && (
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {abbreviations.length === 0 && (
            <p className="text-sm text-slate-400 italic">No abbreviations yet.</p>
          )}
        </div>
        {isCoach && (
          <form onSubmit={handleAdd} className="mt-3 flex gap-2 border-t pt-3 dark:border-gray-700">
            <Input
              value={newAbbr}
              onChange={(e) => setNewAbbr(e.target.value)}
              placeholder="Abbr"
              className="w-20 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <Input
              value={newFull}
              onChange={(e) => setNewFull(e.target.value)}
              placeholder="Full name"
              className="flex-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={addMutation.isPending}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}