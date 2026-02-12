import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Target } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const eventConfig = {
  shot: { label: "Shot Put", color: "#f59e0b", icon: "🏋️" },
  discus: { label: "Discus", color: "#06b6d4", icon: "🥏" },
  javelin: { label: "Javelin", color: "#f43f5e", icon: "🎯" },
};

export default function EventProgressCard({ event, logs }) {
  const config = eventConfig[event];
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  const pr = logs.length > 0 ? Math.max(...logs.map((l) => l.best_distance)) : 0;
  const seasonBest = pr;

  const chartData = sortedLogs.map((log) => ({
    date: format(new Date(log.date), "M/d"),
    distance: log.best_distance,
  }));

  const totalAttempts = logs.reduce((sum, log) => {
    return sum + (log.attempts?.length || 1);
  }, 0);

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <CardTitle className="text-lg">{config.label}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {logs.length} sessions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {logs.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <Award className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-green-700 font-medium">PR</p>
                <p className="text-lg font-bold text-green-900">{pr.toFixed(1)}'</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-blue-700 font-medium">Season Best</p>
                <p className="text-lg font-bold text-blue-900">{seasonBest.toFixed(1)}'</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <Target className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-purple-700 font-medium">Attempts</p>
                <p className="text-lg font-bold text-purple-900">{totalAttempts}</p>
              </div>
            </div>

            {chartData.length > 1 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                      domain={["dataMin - 2", "dataMax + 2"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="distance"
                      stroke={config.color}
                      strokeWidth={2}
                      dot={{ fill: config.color, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-6 text-sm">
            No throws logged yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}