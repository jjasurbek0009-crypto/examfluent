"use client";

/**
 * Dashboard grafiklari (Recharts kutubxonasi orqali).
 *
 * "use client" shart — grafiklar brauzerdagi o'lchamlarni bilishi kerak.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { fontSize: 11, fill: "#94a3b8" };

/** Haftalik XP ustunli diagrammasi */
export function WeeklyActivityChart({
  data,
}: {
  data: Array<{ label: string; xp: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            boxShadow: "0 4px 16px -4px rgb(15 23 42 / 0.12)",
          }}
        />
        <Bar dataKey="xp" fill="#2044ed" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** IELTS band score tarixi (chiziqli/maydonli diagramma) */
export function BandHistoryChart({
  data,
}: {
  data: Array<{ label: string; band: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis
          domain={[0, 9]}
          ticks={[0, 3, 5, 7, 9]}
          tickLine={false}
          axisLine={false}
          tick={AXIS}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            boxShadow: "0 4px 16px -4px rgb(15 23 42 / 0.12)",
          }}
        />
        <Area
          type="monotone"
          dataKey="band"
          stroke="#059669"
          strokeWidth={2.5}
          fill="url(#bandFill)"
          dot={{ r: 3, fill: "#059669", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
