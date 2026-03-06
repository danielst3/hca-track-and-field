import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export default function ReleaseNotesModal({ user }) {
  const [open, setOpen] = useState(false);
  const [latestNote, setLatestNote] = useState(null);

  const { data: releaseNotes = [] } = useQuery({
    queryKey: ["releaseNotes"],
    queryFn: () => base44.entities.ReleaseNote.list("-release_date"),
    enabled: !!user,
  });

  useEffect(() => {
    if (!releaseNotes.length || !user) return;

    // Find the latest release note by version
    const sorted = [...releaseNotes].sort((a, b) => compareVersions(b.version, a.version));
    const latest = sorted[0];

    const lastSeen = user.last_seen_release_version;
    const isNew = !lastSeen || compareVersions(latest.version, lastSeen) > 0;

    if (isNew) {
      setLatestNote(latest);
      setOpen(true);
    }
  }, [releaseNotes, user]);

  const handleDismiss = async () => {
    setOpen(false);
    await base44.auth.updateMe({ last_seen_release_version: latestNote.version });
  };

  if (!latestNote) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[var(--brand-primary)] dark:text-gray-300" />
            <DialogTitle className="dark:text-gray-100">What's New</DialogTitle>
            <Badge variant="outline" className="ml-auto text-xs dark:border-gray-600 dark:text-gray-300">
              v{latestNote.version}
            </Badge>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{latestNote.title}</p>
          {latestNote.release_date && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {format(new Date(latestNote.release_date), "MMMM d, yyyy")}
            </p>
          )}
        </DialogHeader>

        {latestNote.features?.length > 0 && (
          <ul className="mt-2 space-y-2">
            {latestNote.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}

        <Button
          onClick={handleDismiss}
          className="mt-4 w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  );
}