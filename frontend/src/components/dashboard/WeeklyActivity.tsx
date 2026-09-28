import { CalendarDays } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const activity = [
  { day: "Mon", minutes: 25 },
  { day: "Tue", minutes: 40 },
  { day: "Wed", minutes: 55 },
  { day: "Thu", minutes: 30 },
  { day: "Fri", minutes: 15 },
  { day: "Sat", minutes: 50 },
  { day: "Sun", minutes: 0 },
];

export function WeeklyActivity() {
  return (
    <section className="metric-card h-full min-h-72 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-950">Study Habits</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Example activity until history is available
          </p>
        </div>
        <span className="glass-control flex h-10 w-10 items-center justify-center rounded-full text-blue-600">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5 h-44">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={activity}>
            <XAxis
              axisLine={false}
              dataKey="day"
              tick={{ fill: "#8993a5", fontSize: 11, fontWeight: 700 }}
              tickLine={false}
            />
            <YAxis hide domain={[0, 60]} />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "0",
                borderRadius: 16,
                color: "#fff",
                boxShadow: "0 16px 40px rgba(15,23,42,0.22)",
              }}
              cursor={{ fill: "rgba(64,88,255,0.06)" }}
              formatter={(value) => [`${String(value)} min`, "Learning"]}
            />
            <Bar
              dataKey="minutes"
              fill="#3f51ff"
              maxBarSize={30}
              radius={[10, 10, 10, 10]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
