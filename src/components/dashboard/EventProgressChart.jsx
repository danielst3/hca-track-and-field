import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const eventConfigs = {
  shot: { name: "Shot Put", color: "#f59e0b", icon: "🏋️" },
  discus: { name: "Discus", color: "#06b6d4", icon: "🥏" },
  javelin: { name: "Javelin", color: "#f43f5e", icon: "🎯" }
};

export default function EventProgressChart({ event, data }) {
  const config = eventConfigs[event];
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-gray-100">
          {config.icon} {config.name} Progression
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }}
              labelStyle={{ color: "#e5e7eb" }}
              formatter={(value) => `${value}m`}
            />
            <Line
              type="monotone"
              dataKey="distance"
              stroke={config.color}
              strokeWidth={2}
              dot={{ fill: config.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}