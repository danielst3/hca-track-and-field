import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Plus, Check, Circle, Disc3, Zap, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LogActivity() {
  const [user, setUser] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [logType, setLogType] = useState("distance");
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    session_type: "practice",
    value: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const isCoach = user?.role === "admin";

  const events = [
    { id: "shot", label: "Shot Put", Icon: Circle },
    { id: "discus", label: "Discus", Icon: Disc3 },
    { id: "javelin", label: "Javelin", Icon: Zap },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (!currentUser?.role || currentUser.role !== "admin") {
        setSelectedAthlete(currentUser);
      }
    };
    fetchUser();
  }, []);

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      if (!isCoach) return [];
      const allUsers = await base44.entities.User.filter({ role: "user" });
      return allUsers.sort((a, b) => {
        const nameA = (a.first_name && a.last_name) ? `${a.first_name} ${a.last_name}` : a.full_name;
        const nameB = (b.first_name && b.last_name) ? `${b.first_name} ${b.last_name}` : b.full_name;
        return nameA.localeCompare(nameB);
      });
    },
    enabled: isCoach,
  });

  const logMutation = useMutation({
    mutationFn: async (data) => {
      if (logType === "distance") {
        return base44.entities.ThrowLog.create(data);
      } else {
        return base44.entities.TrainingLog.create(data);
      }
    },
    onSuccess: () => {
      const key = logType === "distance" ? ["throwLogs"] : ["trainingLogs"];
      queryClient.invalidateQueries({ queryKey: key });
      toast.success("Performance logged successfully!");
      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          date: format(new Date(), "yyyy-MM-dd"),
          session_type: "practice",
          value: "",
          notes: "",
        });
        setSelectedEvent(null);
        setSubmitted(false);
      }, 2000);
    },
    onError: () => {
      toast.error("Failed to log performance");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedAthlete || !selectedEvent) {
      toast.error("Please select athlete and event");
      return;
    }

    if (logType === "distance") {
      logMutation.mutate({
        athlete_email: selectedAthlete.email,
        event: selectedEvent,
        date: formData.date,
        session_type: formData.session_type,
        best_distance: parseFloat(formData.value),
        notes: formData.notes || null,
      });
    } else {
      logMutation.mutate({
        athlete_email: selectedAthlete.email,
        event: selectedEvent,
        date: formData.date,
        session_type: formData.session_type,
        time: formData.value,
        notes: formData.notes || null,
      });
    }
  };

  const currentEvent = events.find(e => e.id === selectedEvent);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#111] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4" />
          <p className="text-slate-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-gray-100">Log Activity</h1>
          {(user?.role === "admin" || user?.role === "coach") && (
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
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Select Athlete</CardTitle>
              </CardHeader>
              <CardContent>
                <MobileSelect
                  value={selectedAthlete?.id || ""}
                  onValueChange={(athleteId) => {
                    const athlete = athletes.find(a => a.id === athleteId);
                    setSelectedAthlete(athlete);
                  }}
                  options={athletes.map(a => ({ value: a.id, label: (a.first_name && a.last_name) ? `${a.first_name} ${a.last_name}` : a.full_name }))}
                  label="Athlete"
                />
              </CardContent>
            </Card>
          )}

          {/* Event Selection */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Select Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {events.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className={cn(
                      "h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all",
                      selectedEvent === event.id
                        ? "border-[var(--brand-primary)] bg-[var(--brand-secondary-light)] dark:bg-gray-700"
                        : "border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"
                    )}
                  >
                    <event.Icon className="w-6 h-6 text-slate-700 dark:text-gray-200" />
                    <span className="text-xs font-medium text-slate-700 dark:text-gray-200">{event.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Form */}
          {selectedEvent && currentEvent && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Log {currentEvent.label} Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-gray-200">Log Type</Label>
                      <MobileSelect
                        value={logType}
                        onValueChange={setLogType}
                        options={[
                          { value: "distance", label: "Distance" },
                          { value: "time", label: "Time" }
                        ]}
                        label="Log Type"
                      />
                    </div>
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

                  <div className="space-y-2">
                    <Label className="dark:text-gray-200">
                      {logType === "distance" ? "Distance (feet)" : "Time (MM:SS or seconds)"}
                    </Label>
                    <Input
                      type={logType === "distance" ? "number" : "text"}
                      step={logType === "distance" ? "0.01" : undefined}
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      placeholder={logType === "distance" ? "e.g. 38.5" : "e.g. 2:45 or 165"}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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
                      rows={4}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={logMutation.isPending || submitted}
                    className={cn(
                      "w-full h-12 text-base font-semibold transition-all",
                      submitted
                        ? "bg-green-600 hover:bg-green-600"
                        : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]"
                    )}
                  >
                    {submitted ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Logged!
                      </>
                    ) : logMutation.isPending ? (
                      "Saving..."
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Log Performance
                      </>
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