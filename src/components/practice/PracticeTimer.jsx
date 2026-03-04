import React, { useState, useEffect, useRef } from "react";
import { Timer, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function PracticeTimer() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const format = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-1.5">
          <Timer className="w-4 h-4" />
          <span className="text-sm font-mono">{format(elapsed)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 dark:bg-gray-800 dark:border-gray-700">
        <p className="text-center font-mono text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{format(elapsed)}</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setRunning(p => !p)}
            className={running ? "flex-1 bg-yellow-500 hover:bg-yellow-600 text-white" : "flex-1 bg-green-600 hover:bg-green-700 text-white"}
          >
            {running ? <><Pause className="w-3 h-3 mr-1" /> Pause</> : <><Play className="w-3 h-3 mr-1" /> Start</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setElapsed(0); setRunning(false); }} className="dark:bg-gray-700 dark:text-gray-200">
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}