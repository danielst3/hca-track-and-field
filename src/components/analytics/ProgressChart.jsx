import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from "recharts";

const eventColors = {
  shot_put: "#f59e0b", shot: "#f59e0b",
  discus: "#06b6d4",
  javelin: "#f43f5e",
  long_jump: "#3b82f6", triple_jump: "#6366f1", high_jump: "#8b5cf6", pole_vault: "#a78bfa",
  "100m": "#10b981", "200m": "#059669", "400m": "#047857",
  "800m": "#0d9488", "1600m": "#0891b2", "3200m": "#0369a1",
  "100m_hurdles": "#16a34a", "110m_hurdles": "#15803d", "300m_hurdles": "#166534",
  "4x100_relay": "#84cc16", "4x400_relay": "#65a30d", "4x800_relay": "#4d7c0f",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(1)}'
        </p>
      ))}
    </div>
  );
};

export default function ProgressChart({ logs, event }) {
  const color = eventColors[event] || "#6366f1";
  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  const data = sorted.map((log, i) => {
    const runningPR = Math.max(...sorted.slice(0, i + 1).map((l) => l.best_distance));
    return {
      date: format(new Date(log.date), "M/d"),
      distance: log.best_distance,
      pr: runningPR,
      type: log.session_type,
    };
  });

  if (data.length === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="py-12 text-center text-gray-400 text-sm">No data to display</CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2 border-b dark:border-gray-700">
        <CardTitle className="text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color }} />
          Distance Over Time
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} stroke="#4b5563" />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} stroke="#4b5563" domain={["dataMin - 3", "dataMax + 3"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="pr"
                name="Running PR"
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                fill={color}
                fillOpacity={0.06}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="distance"
                name="Best Throw"
                stroke={color}
                strokeWidth={2.5}
                dot={(props) => {
                  const isMeet = data[props.index]?.type === "meet";
                  return (
                    <circle
                      key={props.key}
                      cx={props.cx}
                      cy={props.cy}
                      r={isMeet ? 6 : 4}
                      fill={isMeet ? "#ef4444" : color}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-2">Red dots = meet performances</p>
      </CardContent>
    </Card>
  );
}