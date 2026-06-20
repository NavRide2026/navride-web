"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WeekData {
  week: string;
  km: number;
}

interface WeeklyChartProps {
  data: WeekData[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-white/30 text-sm">
        Sin datos de sesiones aún
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
        <XAxis
          dataKey="week"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          unit=" km"
        />
        <Tooltip
          contentStyle={{
            background: "#111",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value.toFixed(1)} km`, "Distancia"]}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="km" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === data.length - 1 ? "#f97316" : "rgba(249,115,22,0.45)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
