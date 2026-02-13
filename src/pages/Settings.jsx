import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  Calendar, 
  Users, 
  BookOpen, 
  Trophy,
  ChevronRight,
  FileText,
  Download,
  X,
  CheckCircle2,
  Download as DownloadApp,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import RoleManagement from "../components/settings/RoleManagement";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState({
    athlete: "all",
    event: "all",
    season: "all"
  });
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [defaultEvents, setDefaultEvents] = useState([]);
  const [isSavingEvents, setIsSavingEvents] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [eventTypes, setEventTypes] = useState([
    { id: "shot", label: "Shot Put" },
    { id: "discus", label: "Discus" },
    { id: "javelin", label: "Javelin" }
  ]);
  const [practiceTypes, setPracticeTypes] = useState([
    { id: "technical", label: "Technical" },
    { id: "primary", label: "Primary" },
    { id: "indoor", label: "Indoor" },
    { id: "tuneup", label: "Tune-up" },
    { id: "meet", label: "Meet" },
    { id: "recovery", label: "Recovery" }
  ]);
  const [newEventLabel, setNewEventLabel] = useState("");
  const [newPracticeLabel, setNewPracticeLabel] = useState("");
  const [isSavingTypes, setIsSavingTypes] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser?.events) {
        setSelectedEvents(currentUser.events);
      }
      if (currentUser?.default_events) {
        setDefaultEvents(currentUser.default_events);
      }
      if (currentUser?.event_types) {
        setEventTypes(currentUser.event_types);
      }
      if (currentUser?.practice_types) {
        setPracticeTypes(currentUser.practice_types);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes"],
    queryFn: () => base44.entities.User.filter({ role: "user" }),
    enabled: !!user && user.role === "admin",
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => base44.entities.Season.list(),
    enabled: !!user && user.role === "admin",
  });

  const handleToggleEvent = (event) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleToggleDefaultEvent = (event) => {
    setDefaultEvents(prev => 
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleSaveEvents = async () => {
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }
    try {
      setIsSavingEvents(true);
      await base44.auth.updateMe({ events: selectedEvents, default_events: defaultEvents });
      setUser(prev => ({ ...prev, events: selectedEvents, default_events: defaultEvents }));
      toast.success("Events updated successfully!");
    } catch (error) {
      toast.error("Failed to update events");
    } finally {
      setIsSavingEvents(false);
    }
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("App installed!");
      }
      setInstallPrompt(null);
    }
  };

  const handleAddEventType = () => {
    if (!newEventLabel.trim()) return;
    const newId = newEventLabel.toLowerCase().replace(/\s+/g, "_");
    if (eventTypes.some(e => e.id === newId)) {
      toast.error("Event type already exists");
      return;
    }
    setEventTypes([...eventTypes, { id: newId, label: newEventLabel }]);
    setNewEventLabel("");
  };

  const handleRemoveEventType = (id) => {
    if (eventTypes.length === 1) {
      toast.error("You must have at least one event type");
      return;
    }
    setEventTypes(eventTypes.filter(e => e.id !== id));
  };

  const handleAddPracticeType = () => {
    if (!newPracticeLabel.trim()) return;
    const newId = newPracticeLabel.toLowerCase().replace(/\s+/g, "_");
    if (practiceTypes.some(p => p.id === newId)) {
      toast.error("Practice type already exists");
      return;
    }
    setPracticeTypes([...practiceTypes, { id: newId, label: newPracticeLabel }]);
    setNewPracticeLabel("");
  };

  const handleRemovePracticeType = (id) => {
    const defaults = ["technical", "primary", "indoor", "tuneup", "meet", "recovery"];
    if (defaults.includes(id)) {
      toast.error("Cannot remove default practice types");
      return;
    }
    if (practiceTypes.length === 1) {
      toast.error("You must have at least one practice type");
      return;
    }
    setPracticeTypes(practiceTypes.filter(p => p.id !== id));
  };

  const handleSaveTypes = async () => {
    try {
      setIsSavingTypes(true);
      await base44.auth.updateMe({ 
        event_types: eventTypes,
        practice_types: practiceTypes
      });
      setUser(prev => ({ ...prev, event_types: eventTypes, practice_types: practiceTypes }));
      toast.success("Event and practice types updated!");
    } catch (error) {
      toast.error("Failed to update types");
    } finally {
      setIsSavingTypes(false);
    }
  };

  const downloadAthleteData = async () => {
    try {
      setDownloading(true);
      const logs = await base44.entities.ThrowLog.filter({ athlete_email: user.email });
      
      // Log data export
      await base44.entities.AuditLog.create({
        user_email: user.email,
        action_type: "export_data",
        target_email: user.email,
        details: "Athlete exported their own data"
      });
      
      if (logs.length === 0) {
        toast.error("No data to download");
        return;
      }

      const csvHeader = "Date,Event,Distance,Implement,Notes,Is PR,Is Meet\n";
      const csvRows = logs.map(log => 
        `${log.date},"${log.event}",${log.distance},"${log.implement || ''}","${(log.notes || '').replace(/"/g, '""')}",${log.is_pr ? 'Yes' : 'No'},${log.is_meet ? 'Yes' : 'No'}`
      ).join("\n");
      
      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.full_name.replace(/\s/g, '_')}_throwing_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download data");
    } finally {
      setDownloading(false);
    }
  };

  const downloadAllAthleteData = async () => {
    try {
      setDownloading(true);
      let logs = await base44.entities.ThrowLog.list();
      
      // Apply filters
      if (filters.athlete !== "all") {
        logs = logs.filter(log => log.athlete_email === filters.athlete);
      }
      if (filters.event !== "all") {
        logs = logs.filter(log => log.event === filters.event);
      }
      if (filters.season !== "all") {
        logs = logs.filter(log => log.season_id === filters.season);
      }
      
      // Log data export
      await base44.entities.AuditLog.create({
        user_email: user.email,
        action_type: "export_data",
        details: `Coach exported data - Filters: Athlete=${filters.athlete}, Event=${filters.event}, Season=${filters.season}`
      });
      
      if (logs.length === 0) {
        toast.error("No data matches the selected filters");
        return;
      }

      const csvHeader = "Athlete,Email,Date,Event,Distance,Implement,Notes,Is PR,Is Meet\n";
      const csvRows = logs.map(log => 
        `"${log.athlete_name}","${log.athlete_email}",${log.date},"${log.event}",${log.distance},"${log.implement || ''}","${(log.notes || '').replace(/"/g, '""')}",${log.is_pr ? 'Yes' : 'No'},${log.is_meet ? 'Yes' : 'No'}`
      ).join("\n");
      
      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filterSuffix = filters.athlete !== "all" || filters.event !== "all" || filters.season !== "all" ? "_filtered" : "";
      a.download = `all_athletes_throwing_history${filterSuffix}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download data");
    } finally {
      setDownloading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]" />
      </div>
    );
  }

  const isCoach = user.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 select-none">Settings</h1>
          <p className="text-slate-700 dark:text-gray-300 mt-1">
            {isCoach ? "Manage your team and practice plans" : "Manage your profile and preferences"}
          </p>
        </div>

        {/* Profile Section */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-gray-100">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-gray-300">
              View and update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">Name</p>
              <p className="font-medium text-slate-900 dark:text-gray-100">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">Email</p>
              <p className="font-medium text-slate-900 dark:text-gray-100">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">Role</p>
              <p className="font-medium text-slate-900 dark:text-gray-100">{isCoach ? "Coach" : "Athlete"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Events Selection (Athletes Only) */}
        {!isCoach && (
          <>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-gray-100">
                  <Trophy className="w-5 h-5" />
                  Your Events
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Select which events you compete in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {eventTypes.map(event => (
                    <div key={event.id} className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={selectedEvents.includes(event.id)}
                          onCheckedChange={() => handleToggleEvent(event.id)}
                          className="dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-200">
                          {event.label}
                        </span>
                      </label>
                      {selectedEvents.includes(event.id) && (
                        <label className="flex items-center gap-3 ml-8 cursor-pointer">
                          <Checkbox
                            checked={defaultEvents.includes(event.id)}
                            onCheckedChange={() => handleToggleDefaultEvent(event.id)}
                            className="dark:border-gray-600"
                          />
                          <span className="text-xs font-medium text-slate-600 dark:text-gray-300">
                            Set as default
                          </span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleSaveEvents}
                  disabled={isSavingEvents || selectedEvents.length === 0}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {isSavingEvents ? "Saving..." : "Save Events"}
                </Button>
              </CardContent>
            </Card>

            {installPrompt && (
              <Card className="dark:bg-gray-800 dark:border-gray-700 border-[var(--brand-primary)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-gray-100">
                    <DownloadApp className="w-5 h-5" />
                    Install App
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-gray-300">
                    Install HCA Track & Field app on your device
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleInstallApp}
                    className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <DownloadApp className="w-4 h-4 mr-2" />
                    Install App
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Coach-only Settings */}
        {isCoach && (
          <>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">Team Management</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Manage athletes and team settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Athletes")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-slate-700 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      Manage Athletes
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">Practice & Training</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Manage practice plans and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Seasons")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-slate-700 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Trophy className="w-5 h-5" />
                      Manage Seasons
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to={createPageUrl("Calendar")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-slate-700 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      Edit Practice Plans
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to={createPageUrl("Resources")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-slate-700 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5" />
                      Manage Resources
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">Event Types</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Add or remove throwing events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {eventTypes.map(event => (
                    <div key={event.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-700 p-3 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200">{event.label}</span>
                      {eventTypes.length > 1 && (
                        <button
                          onClick={() => handleRemoveEventType(event.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                   <input
                     type="text"
                     value={newEventLabel}
                     onChange={(e) => setNewEventLabel(e.target.value)}
                     placeholder="New event name"
                     onKeyPress={(e) => e.key === "Enter" && handleAddEventType()}
                     className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                   />
                  <Button
                    onClick={handleAddEventType}
                    disabled={!newEventLabel.trim()}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-600 dark:hover:bg-gray-500"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <Button
                  onClick={handleSaveTypes}
                  disabled={isSavingTypes}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {isSavingTypes ? "Saving..." : "Save Event Types"}
                </Button>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">Practice Types</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Add or remove practice plan types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {practiceTypes.map(practice => (
                    <div key={practice.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-700 p-3 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200">{practice.label}</span>
                      {!["technical", "primary", "indoor", "tuneup", "meet", "recovery"].includes(practice.id) && practiceTypes.length > 1 && (
                        <button
                          onClick={() => handleRemovePracticeType(practice.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                   <input
                     type="text"
                     value={newPracticeLabel}
                     onChange={(e) => setNewPracticeLabel(e.target.value)}
                     placeholder="New practice type name"
                     onKeyPress={(e) => e.key === "Enter" && handleAddPracticeType()}
                     className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                   />
                  <Button
                    onClick={handleAddPracticeType}
                    disabled={!newPracticeLabel.trim()}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-600 dark:hover:bg-gray-500"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <Button
                  onClick={handleSaveTypes}
                  disabled={isSavingTypes}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {isSavingTypes ? "Saving..." : "Save Practice Types"}
                </Button>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">Communication</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Manage team posts and announcements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Posts")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-slate-700 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      Manage Posts
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">FERPA & Data Management</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Privacy compliance, consent, and data export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("FERPACompliance")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-slate-700 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Shield className="w-5 h-5" />
                      FERPA Compliance
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <RoleManagement />

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">Export Data</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Download team throwing history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-gray-300">Athlete</Label>
                    <div className="relative">
                      <select
                        value={filters.athlete}
                        onChange={(e) => setFilters({ ...filters, athlete: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-gray-700 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:text-gray-200 dark:border-gray-600"
                      >
                        <option value="all">All Athletes</option>
                        {athletes.map(athlete => (
                          <option key={athlete.id} value={athlete.email}>{athlete.full_name}</option>
                        ))}
                      </select>
                      {filters.athlete !== "all" && (
                        <button
                          onClick={() => setFilters({ ...filters, athlete: "all" })}
                          className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-gray-300">Event</Label>
                    <div className="relative">
                        <select
                          value={filters.event}
                          onChange={(e) => setFilters({ ...filters, event: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-gray-700 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:text-gray-200 dark:border-gray-600"
                        >
                          <option value="all">All Events</option>
                          {eventTypes.map(event => (
                            <option key={event.id} value={event.id}>{event.label}</option>
                          ))}
                        </select>
                      {filters.event !== "all" && (
                        <button
                          onClick={() => setFilters({ ...filters, event: "all" })}
                          className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-gray-300">Season</Label>
                    <div className="relative">
                      <select
                        value={filters.season}
                        onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-gray-700 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:text-gray-200 dark:border-gray-600"
                      >
                        <option value="all">All Seasons</option>
                        {seasons.map(season => (
                          <option key={season.id} value={season.id}>{season.name}</option>
                        ))}
                      </select>
                      {filters.season !== "all" && (
                        <button
                          onClick={() => setFilters({ ...filters, season: "all" })}
                          className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {(filters.athlete !== "all" || filters.event !== "all" || filters.season !== "all") && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                    <span>Filters active</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({ athlete: "all", event: "all", season: "all" })}
                      className="h-7 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}

                <Button 
                  onClick={downloadAllAthleteData}
                  disabled={downloading}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Downloading..." : "Download Data (CSV)"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Athlete-only Settings */}
        {!isCoach && (
          <>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">My Progress</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  View your training and performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Progress")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-slate-700 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Trophy className="w-5 h-5" />
                      View My Stats
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100">Export Data</CardTitle>
                <CardDescription className="text-slate-600 dark:text-gray-300">
                  Download your throwing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={downloadAthleteData}
                  disabled={downloading}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Downloading..." : "Download My History (CSV)"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}