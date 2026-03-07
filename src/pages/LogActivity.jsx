import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Plus, Check, Trophy, Video, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getActiveViewRole, getAvailableViews } from "../components/shared/getActiveViewRole";
import { useViewGuard } from "../components/shared/useViewGuard";
import { EVENT_CATEGORIES, EVENTS_BY_CATEGORY, isTimeBasedEvent, getCategoryForEvent } from "../components/shared/eventConfig";

export default function LogActivity() {
  const { ready } = useViewGuard(["admin", "coach", "user"]);
  const [user, setUser] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    session_type: "practice",
    value: "",
    notes: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      const availableViews = getAvailableViews(currentUser.user_role_preference, currentUser.role);
      const effectiveRole = getActiveViewRole(currentUser.id, availableViews, currentUser.role);
      const effectiveUser = { ...currentUser, role: effectiveRole };
      setUser(effectiveUser);
      if (effectiveRole !== "admin" && effectiveRole !== "coach") {
        setSelectedAthlete(effectiveUser);
      }
    };
    fetchUser();
  }, []);

  const isCoach = user?.role === "admin" || user?.role === "coach";
  const isTimeBased = selectedEvent ? isTimeBasedEvent(selectedEvent) : false;

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes", isCoach],
    queryFn: async () => {
      if (!isCoach) return [];
      const res = await base44.functions.invoke("getAthletes");
      const allUsers = res.data.users || [];
      return allUsers
        .filter(u => {
          const roles = u.user_role_preference ? u.user_role_preference.split(",") : [u.role];
          return roles.includes("user") || roles.includes("athlete");
        })
        .sort((a, b) => {
          const nameA = (a.first_name && a.last_name) ? `${a.first_name} ${a.last_name}` : a.full_name;
          const nameB = (b.first_name && b.last_name) ? `${b.first_name} ${b.last_name}` : b.full_name;
          return nameA.localeCompare(nameB);
        });
    },
    enabled: !!user && isCoach,
  });

  const logMutation = useMutation({
    mutationFn: async (data) => {
      if (isTimeBased) {
        return base44.entities.TrainingLog.create(data);
      } else {
        return base44.entities.ThrowLog.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: isTimeBased ? ["trainingLogs"] : ["throwLogs"] });
      setSubmitted(true);
      toast.success("Performance logged successfully!");
      setTimeout(() => {
        setFormData({ date: format(new Date(), "yyyy-MM-dd"), session_type: "practice", value: "", notes: "" });
        setSelectedEvent(null);
        setVideoFile(null);
        setSubmitted(false);
      }, 1500);
    },
    onError: () => {
      toast.error("Failed to log performance");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAthlete || !selectedEvent) {
      toast.error("Please select athlete and event");
      return;
    }

    let video_url = null;
    if (videoFile) {
      setUploadingVideo(true);
      try {
        const result = await base44.integrations.Core.UploadFile({ file: videoFile });
        video_url = result.file_url;
      } catch {
        toast.error("Failed to upload video");
        setUploadingVideo(false);
        return;
      }
      setUploadingVideo(false);
    }

    const category = getCategoryForEvent(selectedEvent);
    if (isTimeBased) {
      logMutation.mutate({
        athlete_email: selectedAthlete.email,
        event_category: category,
        event: selectedEvent,
        date: formData.date,
        session_type: formData.session_type,
        time: formData.value,
        notes: formData.notes || null,
        ...(video_url && { video_url }),
      });
    } else {
      logMutation.mutate({
        athlete_email: selectedAthlete.email,
        event_category: category,
        event: selectedEvent,
        date: formData.date,
        session_type: formData.session_type,
        best_distance: parseFloat(formData.value),
        notes: formData.notes || null,
        ...(video_url && { video_url }),
      });
    }
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedEvent(null);
  };

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#111] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]" />
      </div>
    );
  }

  const categoryEvents = selectedCategory ? EVENTS_BY_CATEGORY[selectedCategory] : [];
  const currentEvent = selectedEvent ? categoryEvents.find(e => e.id === selectedEvent) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-gray-100">Log Activity</h1>
          {isCoach && (
            <Link to={createPageUrl("BulkMeetEntry")}>
              <Button variant="outline" className="gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Trophy className="w-4 h-4" />
                Bulk Meet Entry
              </Button>
            </Link>
          )}
        </div>
        <p className="text-slate-600 dark:text-gray-400 mb-8">Record your performance data</p>

        <div className="space-y-6">
          {/* Athlete Selection (Coach Only) */}
          {isCoach && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Select Athlete</CardTitle></CardHeader>
              <CardContent>
                <MobileSelect
                  value={selectedAthlete?.id || ""}
                  onValueChange={(athleteId) => setSelectedAthlete(athletes.find(a => a.id === athleteId))}
                  options={athletes.map(a => ({ value: a.id, label: (a.first_name && a.last_name) ? `${a.first_name} ${a.last_name}` : a.full_name }))}
                  label="Athlete"
                />
              </CardContent>
            </Card>
          )}

          {/* Step 1: Category Selection */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                Select Category {isCoach && !selectedAthlete && <span className="text-xs text-red-500 font-normal">(select athlete first)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {EVENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    disabled={isCoach && !selectedAthlete}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={cn(
                      "h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-sm font-semibold",
                      isCoach && !selectedAthlete ? "opacity-50 cursor-not-allowed" : "",
                      selectedCategory === cat.id
                        ? "border-[var(--brand-primary)] bg-[var(--brand-secondary-light)] dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                        : "border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:border-slate-300 dark:hover:border-gray-500"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Event Selection */}
          {selectedCategory && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Select Event</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categoryEvents.map(event => {
                    const Icon = event.Icon;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event.id)}
                        className={cn(
                          "h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 px-2",
                          selectedEvent === event.id
                            ? "border-[var(--brand-primary)] bg-[var(--brand-secondary-light)] dark:bg-gray-700"
                            : "border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", event.color)} />
                        <span className="text-xs font-medium text-slate-700 dark:text-gray-200 text-center leading-tight">{event.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Performance Form */}
          {selectedEvent && currentEvent && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Log {currentEvent.label} Performance</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-200">Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        max={format(new Date(), "yyyy-MM-dd")}
                        required
                        className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-gray-200">Session Type</Label>
                      <MobileSelect
                        value={formData.session_type}
                        onValueChange={(value) => setFormData({ ...formData, session_type: value })}
                        options={[
                          { value: "practice", label: "Practice" },
                          { value: "meet", label: "Meet" }
                        ]}
                        label="Session Type"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-gray-200">
                      {isTimeBased ? "Time (MM:SS.ms or seconds)" : "Distance (feet)"}
                    </Label>
                    <Input
                      type={isTimeBased ? "text" : "number"}
                      step={isTimeBased ? undefined : "0.01"}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={isTimeBased ? "e.g. 0:11.2 or 11.2" : "e.g. 38.5"}
                      required
                      className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-gray-200">Notes (optional)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="How did it feel? What to work on?"
                      rows={3}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-2">
                    <Label className="dark:text-gray-200 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Upload Video (optional)
                    </Label>
                    {videoFile ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700">
                        <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-gray-200 truncate flex-1">{videoFile.name}</span>
                        <button type="button" onClick={() => setVideoFile(null)} className="text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-slate-200 dark:border-gray-600 cursor-pointer hover:border-slate-400 dark:hover:border-gray-500 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-gray-400">Tap to select a video</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])}
                        />
                      </label>
                    )}
                    <p className="text-xs text-slate-400 dark:text-gray-500">Videos with a performance are sent to coaches for AI analysis</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={logMutation.isPending || submitted}
                    className={cn(
                      "w-full h-12 text-base font-semibold transition-all text-white dark:text-gray-900",
                      submitted
                        ? "bg-green-600 hover:bg-green-600"
                        : "bg-slate-800 hover:bg-slate-900 dark:bg-slate-300 dark:hover:bg-slate-400"
                    )}
                  >
                    {submitted ? (
                      <><Check className="w-5 h-5 mr-2" />Logged!</>
                    ) : logMutation.isPending ? "Saving..." : (
                      <><Plus className="w-5 h-5 mr-2" />Log Performance</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}