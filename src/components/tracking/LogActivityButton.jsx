import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import LogPerformanceForm from "./LogPerformanceForm";

export default function LogActivityButton({ user }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const events = [
    { id: "shot", label: "Shot Put", icon: "🏋️" },
    { id: "discus", label: "Discus", icon: "🥏" },
    { id: "javelin", label: "Javelin", icon: "🎯" },
  ];

  if (selectedEvent) {
    const event = events.find(e => e.id === selectedEvent);
    return (
      <LogPerformanceForm 
        event={selectedEvent} 
        eventLabel={event.label} 
        user={user}
        onClose={() => setSelectedEvent(null)}
      />
    );
  }

  return (
    <div className="flex gap-2">
      {events.map(event => (
        <Button
          key={event.id}
          size="sm"
          onClick={() => setSelectedEvent(event.id)}
          variant="outline"
          className="gap-2 select-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <span>{event.icon}</span>
          <span className="hidden sm:inline">Log {event.label.split(' ')[0]}</span>
        </Button>
      ))}
    </div>
  );
}