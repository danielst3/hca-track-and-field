import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import LogPerformanceForm from "./LogPerformanceForm";

export default function LogActivityButton({ user }) {
  const [open, setOpen] = useState(false);
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
        onClose={() => {
          setSelectedEvent(null);
          setOpen(false);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 select-none bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600">
          <Plus className="w-4 h-4" />
          Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Log Activity</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {events.map(event => (
            <Button
              key={event.id}
              onClick={() => setSelectedEvent(event.id)}
              variant="outline"
              className="h-auto flex-col py-4 select-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <span className="text-2xl mb-2">{event.icon}</span>
              <span className="text-sm font-medium">{event.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}