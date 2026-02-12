import React from "react";
import { Trophy, MapPin } from "lucide-react";

export default function MeetDayBanner({ meetName, notes }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600/30 via-red-500/20 to-rose-600/30 border border-red-500/30 p-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-red-400/80 font-medium">Competition Day</p>
          <h3 className="text-xl font-bold text-white mt-0.5">{meetName}</h3>
          {notes && <p className="text-sm text-slate-300 mt-1">{notes}</p>}
        </div>
      </div>
    </div>
  );
}