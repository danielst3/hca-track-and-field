import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Plus, Copy, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createPageUrl } from "../utils";
import ImportPlansDialog from "../components/seasons/ImportPlansDialog";

export default function Seasons() {
  const [user, setUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [targetSeasonId, setTargetSeasonId] = useState("");
  const [newSeason, setNewSeason] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== "admin") {
        window.location.href = createPageUrl("Today");
      }
    };
    fetchUser();
  }, []);

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => base44.entities.Season.list("-created_date"),
  });

  const createSeasonMutation = useMutation({
    mutationFn: async (seasonData) => {
      // If is_active is true, deactivate all other seasons first
      if (seasonData.is_active) {
        const activeSeasons = seasons.filter((s) => s.is_active);
        await Promise.all(
          activeSeasons.map((s) =>
            base44.entities.Season.update(s.id, { is_active: false })
          )
        );
      }
      return base44.entities.Season.create(seasonData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast.success("Season created successfully");
      setCreateOpen(false);
      setNewSeason({ name: "", start_date: "", end_date: "" });
    },
  });

  const setActiveSeasonMutation = useMutation({
    mutationFn: async (seasonId) => {
      // Deactivate all seasons
      await Promise.all(
        seasons.map((s) =>
          base44.entities.Season.update(s.id, { is_active: false })
        )
      );
      // Activate the selected season
      return base44.entities.Season.update(seasonId, { is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast.success("Active season updated");
    },
  });

  const copySeasonMutation = useMutation({
    mutationFn: async ({ fromSeasonId, toSeasonId }) => {
      // Get all plans from source season
      const plans = await base44.entities.DailyPlan.filter({
        season_id: fromSeasonId,
      });

      // Get all meets from source season
      const meets = await base44.entities.Meet.filter({
        season_id: fromSeasonId,
      });

      // Get the target season to calculate date offset
      const targetSeason = seasons.find((s) => s.id === toSeasonId);
      const sourceSeason = seasons.find((s) => s.id === fromSeasonId);

      if (!targetSeason || !sourceSeason) return;

      const sourceStart = new Date(sourceSeason.start_date);
      const targetStart = new Date(targetSeason.start_date);
      const dayOffset = Math.floor(
        (targetStart - sourceStart) / (1000 * 60 * 60 * 24)
      );

      // Copy plans with adjusted dates
      const planPromises = plans.map((plan) => {
        const originalDate = new Date(plan.date);
        const newDate = new Date(originalDate);
        newDate.setDate(newDate.getDate() + dayOffset);

        return base44.entities.DailyPlan.create({
          date: format(newDate, "yyyy-MM-dd"),
          day_type: plan.day_type,
          shot_text: plan.shot_text,
          discus_text: plan.discus_text,
          javelin_text: plan.javelin_text,
          coach_notes: plan.coach_notes,
          season_id: toSeasonId,
        });
      });

      // Copy meets with adjusted dates
      const meetPromises = meets.map((meet) => {
        const originalDate = new Date(meet.date);
        const newDate = new Date(originalDate);
        newDate.setDate(newDate.getDate() + dayOffset);

        return base44.entities.Meet.create({
          date: format(newDate, "yyyy-MM-dd"),
          name: meet.name,
          notes: meet.notes,
          season_id: toSeasonId,
        });
      });

      await Promise.all([...planPromises, ...meetPromises]);
      return { planCount: plans.length, meetCount: meets.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["meet"] });
      toast.success(
        `Copied ${data.planCount} plans and ${data.meetCount} meets successfully`
      );
      setCopyDialogOpen(false);
      setSelectedSeason(null);
      setTargetSeasonId("");
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (seasonId) => {
      // Delete all plans and meets for this season
      const plans = await base44.entities.DailyPlan.filter({
        season_id: seasonId,
      });
      const meets = await base44.entities.Meet.filter({ season_id: seasonId });

      await Promise.all([
        ...plans.map((p) => base44.entities.DailyPlan.delete(p.id)),
        ...meets.map((m) => base44.entities.Meet.delete(m.id)),
      ]);

      // Delete the season
      return base44.entities.Season.delete(seasonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast.success("Season deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedSeason(null);
    },
  });

  const handleCreateSeason = (e) => {
    e.preventDefault();
    createSeasonMutation.mutate({
      ...newSeason,
      is_active: seasons.length === 0, // First season is automatically active
    });
  };

  const handleCopySeason = () => {
    if (!selectedSeason || !targetSeasonId) return;
    copySeasonMutation.mutate({
      fromSeasonId: selectedSeason.id,
      toSeasonId: targetSeasonId,
    });
  };

  if (!user || user.role !== "admin") return null;

  const activeSeason = seasons.find((s) => s.is_active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
              Seasons
            </h1>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="w-4 h-4" />
                New Season
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-gray-100">Create New Season</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSeason} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Season Name</Label>
                  <Input
                    value={newSeason.name}
                    onChange={(e) =>
                      setNewSeason({ ...newSeason, name: e.target.value })
                    }
                    placeholder="Spring 2026"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Start Date</Label>
                  <Input
                    type="date"
                    value={newSeason.start_date}
                    onChange={(e) =>
                      setNewSeason({ ...newSeason, start_date: e.target.value })
                    }
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">End Date</Label>
                  <Input
                    type="date"
                    value={newSeason.end_date}
                    onChange={(e) =>
                      setNewSeason({ ...newSeason, end_date: e.target.value })
                    }
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Season
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {activeSeason && (
          <Card className="border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="font-semibold text-green-900 dark:text-green-300">
                  Active Season: {activeSeason.name}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {seasons.map((season) => (
            <Card
              key={season.id}
              className={`dark:bg-gray-800 dark:border-gray-700 ${
                season.is_active ? "border-green-400" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="dark:text-gray-100">{season.name}</CardTitle>
                    {season.is_active && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
                    {!season.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveSeasonMutation.mutate(season.id)}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      >
                        Set Active
                      </Button>
                    )}
                    <ImportPlansDialog seasonId={season.id} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSeason(season);
                        setCopyDialogOpen(true);
                      }}
                      className="gap-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Plans
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSeason(season);
                        setDeleteDialogOpen(true);
                      }}
                      className="gap-2 text-red-600 dark:text-red-400 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  {format(new Date(season.start_date), "MMM d, yyyy")} -{" "}
                  {format(new Date(season.end_date), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Copy Season Dialog */}
        <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">
                Copy Plans from {selectedSeason?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-slate-600 dark:text-gray-400">
                This will copy all practice plans and meets to another season,
                adjusting dates based on the season start dates.
              </p>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Copy to Season</Label>
                <select
                  value={targetSeasonId}
                  onChange={(e) => setTargetSeasonId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="">Select a season...</option>
                  {seasons
                    .filter((s) => s.id !== selectedSeason?.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCopyDialogOpen(false);
                  setTargetSeasonId("");
                }}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCopySeason}
                disabled={!targetSeasonId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Copy Plans
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Season Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-gray-100">Delete Season</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                This will permanently delete {selectedSeason?.name} and all its
                practice plans and meets. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSeasonMutation.mutate(selectedSeason?.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Season
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}