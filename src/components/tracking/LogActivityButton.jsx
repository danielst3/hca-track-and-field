import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import LogPerformanceForm from "./LogPerformanceForm";

export default function LogActivityButton({ user }) {
  const [athleteDialogOpen, setAthleteDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const isCoach = user?.role === "admin" || user?.role === "coach";

  const { data: athletes } = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      if (!isCoach) return [];
      const allUsers = await base44.entities.User.filter({ role: "user" });
      return allUsers.sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: isCoach,
  });

  const events = [
    { id: "shot", label: "Shot Put", icon: "🏋️" },
    { id: "discus", label: "Discus", icon: "🥏" },
    { id: "javelin", label: "Javelin", icon: "🎯" },
  ];

  const handleStartLogging = () => {
    if (isCoach) {
      setAthleteDialogOpen(true);
    } else {
      setEventDialogOpen(true);
    }
  };

  const handleAthleteSelected = (athlete) => {
    setSelectedAthlete(athlete);
    setAthleteDialogOpen(false);
    setEventDialogOpen(true);
  };

  const handleEventSelected = (eventId) => {
    setSelectedEvent(eventId);
    setEventDialogOpen(false);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedEvent(null);
    setSelectedAthlete(null);
  };

  const currentUser = selectedAthlete || user;
  const currentEvent = events.find((e) => e.id === selectedEvent);

  return (
    <>
      <Button 
        size="sm" 
        onClick={handleStartLogging}
        className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
      >
        <Plus className="w-4 h-4" />
        Log Activity
      </Button>

      {/* Athlete Selection Dialog (Coach Only) */}
      <Dialog open={athleteDialogOpen} onOpenChange={setAthleteDialogOpen}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] max-h-[85dvh] flex flex-col dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="dark:text-gray-100">Select Athlete</DialogTitle>
            <DialogDescription>Choose an athlete to log activity for</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto flex-1">
            {athletes?.map((athlete) => (
              <Button
                key={athlete.id}
                onClick={() => handleAthleteSelected(athlete)}
                variant="outline"
                className="w-full justify-start dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {athlete.full_name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Selection Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-sm dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              {isCoach && selectedAthlete ? `Select Event for ${selectedAthlete.full_name}` : "Select Event"}
            </DialogTitle>
            <DialogDescription>Choose an event to log</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {events.map((event) => (
              <Button
                key={event.id}
                onClick={() => handleEventSelected(event.id)}
                variant="outline"
                className="h-auto flex-col py-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <span className="text-2xl mb-2">{event.icon}</span>
                <span className="text-xs font-medium">{event.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Performance Logging Form */}
      {currentEvent && (
        <LogPerformanceForm
          event={selectedEvent}
          eventLabel={currentEvent.label}
          user={currentUser}
          open={formOpen}
          onOpenChange={setFormOpen}
          onClose={handleFormClose}
        />
      )}
    </>
  );
}