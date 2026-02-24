import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { format, eachWeekOfInterval, startOfWeek, endOfWeek, subWeeks } from "date-fns";

export default function ConsistencyChart({ logs, event }) {
  const now = new Date();
  const weeks = eachWeekOfInterval(
    { start: subWeeks(now, 7), end: now },
    { weekStartsOn: 1 }
  );

  const data = weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekLogs = logs.filter((log) => {
      const d = new Date(log.date);
      return d >= weekStart && d <= weekEnd;
    });
    const throws = weekLogs.reduce((s, l) => s + (l.attempts?.length || 1), 0);
    return {
      week: format(weekStart, "M/d"),
      throws,
      sessions: weekLogs.length,
    };
  });

  const maxThrows = Math.max(...data.map((d) => d.throws), 1);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2 border-b dark:border-gray-700">
        <CardTitle className="text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          Weekly Throw Volume (Last 8 Weeks)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} stroke="#4b5563" />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} stroke="#4b5563" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                formatter={(v) => [`${v} throws`]}
              />
              <Bar dataKey="throws" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.throws === maxThrows && entry.throws > 0 ? "#8b5cf6" : entry.throws > 0 ? "#a78bfa" : "#374151"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}