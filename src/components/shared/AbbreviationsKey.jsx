import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BookOpen, Plus, Trash2 } from "lucide-react";

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
    if (!newAbbr.trim() || !newFull.trim()) return;
    addMutation.mutate({ abbr: newAbbr.trim(), full: newFull.trim() });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Key
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Abbreviations</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr)).map((item) => (
            <div key={item.id} className="flex items-center gap-4 group">
              <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 w-20 shrink-0">
                {item.abbr}
              </span>
              <span className="text-sm text-slate-700 dark:text-gray-300 flex-1">{item.full}</span>
              {isCoach && (
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {isCoach && (
          <form onSubmit={handleAdd} className="mt-6 border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Add Abbreviation</p>
            <div className="flex gap-2">
              <Input
                placeholder="Abbr"
                value={newAbbr}
                onChange={(e) => setNewAbbr(e.target.value)}
                className="w-24 text-sm"
              />
              <Input
                placeholder="Full meaning"
                value={newFull}
                onChange={(e) => setNewFull(e.target.value)}
                className="flex-1 text-sm"
              />
            </div>
            <Button type="submit" size="sm" className="w-full gap-2" disabled={addMutation.isPending}>
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}