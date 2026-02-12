import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import LogPerformanceForm from "./LogPerformanceForm";

export default function LogActivityButton({ user }) {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isCoach = user?.role === "admin";

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

  // For coaches: show athlete selection, then event selection
  if (isCoach && !selectedAthlete) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600">
            <Plus className="w-4 h-4" />
            Log Activity
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Select Athlete</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {athletes?.map((athlete) => (
              <Button
                key={athlete.id}
                onClick={() => setSelectedAthlete(athlete)}
                variant="outline"
                className="w-full justify-start dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {athlete.full_name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For coaches after selecting athlete: show event selection
  if (isCoach && selectedAthlete && !selectedEvent) {
    return (
      <Dialog open={!!selectedAthlete}>
        <DialogContent className="max-w-sm dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Select Event for {selectedAthlete.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {events.map((event) => (
              <Button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
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
    );
  }

  // For coaches after selecting event: show form
  if (isCoach && selectedAthlete && selectedEvent) {
    const event = events.find((e) => e.id === selectedEvent);
    return (
      <LogPerformanceForm
        event={selectedEvent}
        eventLabel={event.label}
        user={selectedAthlete}
        onClose={() => {
          setSelectedAthlete(null);
          setSelectedEvent(null);
        }}
      />
    );
  }

  // For athletes: show event buttons
  return (
    <div className="flex gap-2">
      {events.map((event) => (
        <Button
          key={event.id}
          size="sm"
          onClick={() => setSelectedEvent(event.id)}
          variant="outline"
          className="gap-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <span>{event.icon}</span>
          <span className="hidden sm:inline">Log</span>
        </Button>
      ))}
      {selectedEvent && (
        <LogPerformanceForm
          event={selectedEvent}
          eventLabel={events.find((e) => e.id === selectedEvent)?.label}
          user={user}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}