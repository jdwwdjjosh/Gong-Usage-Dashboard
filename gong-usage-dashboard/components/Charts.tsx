"use client";

import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import type { UserMetricRow } from "@/lib/types";

export function CallTrendChart({ data }: { data: { day: string; calls: number }[] }) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="calls" stroke="#111827" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CallsByUserChart({ users }: { users: UserMetricRow[] }) {
  const topUsers = users.slice(0, 10).map((user) => ({ name: user.name, calls: user.calls_recorded }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={topUsers} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={140} />
          <Tooltip />
          <Bar dataKey="calls" fill="#111827" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
