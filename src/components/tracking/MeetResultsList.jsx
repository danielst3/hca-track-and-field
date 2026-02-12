import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function MeetResultsList({ logs }) {
  const meetLogs = logs
    .filter((l) => l.session_type === "meet")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-red-600" />
          Meet Results
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {meetLogs.length > 0 ? (
          <div className="space-y-3">
            {meetLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {format(new Date(log.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {log.event}
                  </Badge>
                  {log.notes && (
                    <p className="text-xs text-slate-500 mt-1">{log.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">
                    {log.best_distance.toFixed(1)}'
                  </p>
                  {log.attempts && log.attempts.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {log.attempts.length} attempts
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-6 text-sm">
            No meet results yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}