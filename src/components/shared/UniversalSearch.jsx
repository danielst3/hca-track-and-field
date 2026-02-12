import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Trophy, BookOpen, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function UniversalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: plans = [] } = useQuery({
    queryKey: ["allPlans"],
    queryFn: () => base44.entities.DailyPlan.list(),
  });

  const { data: meets = [] } = useQuery({
    queryKey: ["allMeets"],
    queryFn: () => base44.entities.Meet.list(),
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const drillTerms = [
    { code: "PP", name: "Power Position" },
    { code: "FT", name: "Full Throw" },
    { code: "SA", name: "South African" },
    { code: "IS", name: "Impulse Step" },
    { code: "MB", name: "Medicine Ball" },
    { code: "ER", name: "External Rotation" },
    { code: "TQ", name: "Technical Quality" },
  ];

  const searchResults = query.length > 1 ? {
    plans: plans.filter((p) =>
      p.shot_text?.toLowerCase().includes(query.toLowerCase()) ||
      p.discus_text?.toLowerCase().includes(query.toLowerCase()) ||
      p.javelin_text?.toLowerCase().includes(query.toLowerCase()) ||
      p.coach_notes?.toLowerCase().includes(query.toLowerCase()) ||
      format(new Date(p.date), "MMMM d, yyyy").toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5),
    meets: meets.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      format(new Date(m.date), "MMMM d, yyyy").toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5),
    drills: drillTerms.filter((d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.code.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5),
  } : { plans: [], meets: [], drills: [] };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 bg-white/90 hover:bg-white"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-slate-100 rounded">
          ⌘K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plans, meets, drills..."
                className="border-0 focus-visible:ring-0 text-lg"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuery("")}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] p-4">
            {query.length < 2 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">Type to search...</p>
                <p className="text-sm text-slate-400 mt-1">
                  Search for practice plans, meets, or drills
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Practice Plans */}
                {searchResults.plans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Practice Plans
                    </h3>
                    <div className="space-y-2">
                      {searchResults.plans.map((plan) => (
                        <Link
                          key={plan.id}
                          to={createPageUrl("Today")}
                          onClick={handleClear}
                          className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                          <p className="font-medium text-slate-900">
                            {format(new Date(plan.date), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-xs text-slate-600 capitalize mt-1">
                            {plan.day_type.replace("_", " ")}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meets */}
                {searchResults.meets.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Meets
                    </h3>
                    <div className="space-y-2">
                      {searchResults.meets.map((meet) => (
                        <Link
                          key={meet.id}
                          to={createPageUrl("Calendar")}
                          onClick={handleClear}
                          className="block p-3 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                        >
                          <p className="font-medium text-red-900">{meet.name}</p>
                          <p className="text-xs text-red-700 mt-1">
                            {format(new Date(meet.date), "MMMM d, yyyy")}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drills */}
                {searchResults.drills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Drills & Abbreviations
                    </h3>
                    <div className="space-y-2">
                      {searchResults.drills.map((drill) => (
                        <Link
                          key={drill.code}
                          to={createPageUrl("Appendix")}
                          onClick={handleClear}
                          className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-blue-600">
                              {drill.code}
                            </span>
                            <span className="text-slate-700">{drill.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.plans.length === 0 &&
                  searchResults.meets.length === 0 &&
                  searchResults.drills.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-600">No results found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Try a different search term
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}