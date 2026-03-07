import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Trophy } from "lucide-react";
import { format } from "date-fns";

export default function SessionHistory({ logs, isTimeBased = false }) {
  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const getValue = (l) => isTimeBased ? parseFloat(l.time) || 0 : (l.best_distance || 0);
  const pr = logs.length > 0
    ? (isTimeBased ? Math.min(...logs.map(getValue)) : Math.max(...logs.map(getValue)))
    : 0;

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2 border-b dark:border-gray-700">
        <CardTitle className="text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No sessions logged</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sorted.map((log) => {
              const isPR = getValue(log) === pr;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(log.date), "MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${log.session_type === "meet" ? "border-red-400 text-red-600 dark:text-red-400" : "dark:border-gray-600 dark:text-gray-400"}`}
                        >
                          {log.session_type}
                        </Badge>
                        {log.attempts?.length > 0 && (
                          <span className="text-xs text-gray-400">{log.attempts.length} {isTimeBased ? "splits" : "throws"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isPR && <Trophy className="w-4 h-4 text-amber-500" />}
                    <span className={`text-lg font-bold ${isPR ? "text-amber-500" : "text-gray-900 dark:text-gray-100"}`}>
                      {isTimeBased ? `${getValue(log).toFixed(2)}s` : `${getValue(log).toFixed(1)}'`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}