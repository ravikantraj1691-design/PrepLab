"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CandidateRow } from "@/lib/types";
import { expertShort } from "@/lib/constants";
import { formatDate } from "@/lib/dates";

interface Props {
  rows: CandidateRow[];
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#94a3b8"];

export function DashboardTab({ rows }: Props) {
  const stats = useMemo(() => {
    const total = rows.length;
    const good = rows.filter((r) => (r.score || "").toLowerCase() === "good").length;
    const avg = rows.filter((r) => (r.score || "").toLowerCase() === "avg").length;
    const bad = rows.filter((r) => (r.score || "").toLowerCase() === "bad").length;
    const unset = total - good - avg - bad;
    const scoreBuckets = [
      { name: "Good", value: good, fill: "#10b981" },
      { name: "Avg", value: avg, fill: "#f59e0b" },
      { name: "Bad", value: bad, fill: "#ef4444" },
      { name: "Unset", value: unset, fill: "#94a3b8" },
    ];

    // Candidates per expert.
    const expertMap = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.expert) return;
      expertMap.set(r.expert, (expertMap.get(r.expert) || 0) + 1);
    });
    const perExpert = Array.from(expertMap.entries())
      .map(([expert, count]) => ({ expert: expertShort(expert), fullExpert: expert, count }))
      .sort((a, b) => b.count - a.count);

    // Mock completion funnel.
    const mockCompletion = [
      { round: "Mock 1", done: rows.filter((r) => (r.mock1Done || "").toLowerCase() === "yes").length },
      { round: "Mock 2", done: rows.filter((r) => (r.mock2Done || "").toLowerCase() === "yes").length },
      { round: "Mock 3", done: rows.filter((r) => (r.mock3Done || "").toLowerCase() === "yes").length },
    ];

    // Average ratings.
    const avgOf = (field: "communication" | "technicalKnowledge" | "coding") => {
      const nums = rows.map((r) => Number(r[field])).filter((n) => Number.isFinite(n) && n > 0);
      return nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : 0;
    };
    const ratings = [
      { name: "Communication", value: avgOf("communication") },
      { name: "Technical", value: avgOf("technicalKnowledge") },
      { name: "Coding", value: avgOf("coding") },
    ];

    // Trend: # candidates added per week (by createdAt).
    const trendMap = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.createdAt) return;
      const d = new Date(r.createdAt);
      if (Number.isNaN(d.getTime())) return;
      // ISO week key: YYYY-Www
      const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
      const key = `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
      trendMap.set(key, (trendMap.get(key) || 0) + 1);
    });
    const trend = Array.from(trendMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);

    // Status counts.
    const statusCounts = {
      done: rows.filter((r) => (r.resumeStatus || "").toLowerCase() === "done").length,
      pending: rows.filter((r) => (r.resumeStatus || "").toLowerCase() === "pending").length,
    };

    return { total, scoreBuckets, perExpert, mockCompletion, ratings, trend, statusCounts };
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Candidates" value={stats.total} accent="slate" />
        <KpiCard label="Resume Done" value={stats.statusCounts.done} accent="emerald" />
        <KpiCard label="Resume Pending" value={stats.statusCounts.pending} accent="amber" />
        <KpiCard label="Avg Communication" value={stats.ratings[0].value || "—"} accent="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>How candidates are rated overall.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.scoreBuckets} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.value > 0 ? `${e.name}: ${e.value}` : ""}>
                  {stats.scoreBuckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Candidates per expert */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates per Expert</CardTitle>
            <CardDescription>Workload distribution across experts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.perExpert} layout="vertical" margin={{ left: 30, right: 20, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="expert" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} candidate${v === 1 ? "" : "s"}`, "Count"]} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average ratings */}
        <Card>
          <CardHeader>
            <CardTitle>Average Ratings (1-5)</CardTitle>
            <CardDescription>Communication, Technical, and Coding averages across all rated candidates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.ratings} margin={{ left: 0, right: 20, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip formatter={(v: number) => [v, "Avg"]} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mock completion funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Mock Completion Funnel</CardTitle>
            <CardDescription>How many candidates completed each mock round.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.mockCompletion} margin={{ left: 0, right: 20, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="round" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} candidates`, "Completed"]} />
                <Bar dataKey="done" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Candidates Added per Week</CardTitle>
          <CardDescription>Volume trend over the last 12 weeks (based on the &quot;Created&quot; date).</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.trend} margin={{ left: 0, right: 20, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent: "slate" | "emerald" | "amber" | "indigo" }) {
  const accentClass = {
    slate: "text-slate-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    indigo: "text-indigo-700",
  }[accent];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${accentClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
