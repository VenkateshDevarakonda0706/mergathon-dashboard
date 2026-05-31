"use client";

import { useState } from "react";
import { useData } from "../../context/DataContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatToIST } from "../../lib/formatDate";

export default function TeamsPage() {
  const { data } = useData();
  const [isMounted] = useState(true);

  if (!data) return null;

  const { teams, dailyTotals } = data;

  // Prepare Score Comparison Bar Chart data
  const scoreData = teams.map((team) => ({
    name: team.name,
    Score: team.totalScore,
    color: team.color,
  }));

  // Prepare Contribution Trend Area Chart data (Aggregate daily scores)
  const trendData = dailyTotals.map((day) => ({
    date: day.date,
    Score: day.score,
    PRs: day.prsMerged,
    Issues: day.issuesClosed,
  }));

  return (
    <div>
      {/* Page Header matching Screenshot 3 */}
      <section className="hero-header" style={{ alignItems: "flex-start", textAlign: "left", marginBottom: "40px" }}>
        <div className="event-badge-outline" style={{ marginBottom: "20px" }}>
          <span>CircuitVerse Mergathon</span>
        </div>
        
        <h1 className="big-brand-title" style={{ color: "#ffffff", fontSize: "64px", marginBottom: "12px" }}>
          Analytics
        </h1>
        
        <p className="hero-subtitle-text" style={{ maxWidth: "700px", fontSize: "16px", marginBottom: "24px" }}>
          Review contribution trends and score distribution across the active mergathon teams.
        </p>

        <div className="badge-row" style={{ justifyContent: "flex-start", marginBottom: 0 }}>
          <span className="outlined-badge">CircuitVerse/CircuitVerse</span>
          <span className="outlined-badge">Leaderboard Active</span>
        </div>
      </section>

      {/* Side-by-Side Charts Section */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "24px"
        }}
        className="analytics-grid"
      >
        {/* Left Card: Contribution Trend Area Chart */}
        <div className="grid-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "1px", textTransform: "uppercase" }}>
              Analytics
            </span>
            <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", marginTop: "4px" }}>
              Contribution Trend
            </h3>
          </div>

          <div style={{ width: "100%", height: 320, marginTop: "8px" }}>
            {isMounted && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trend-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-tertiary)" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(str) => {
                      try {
                        const hasTime = (str || "").includes("T") || /\d{2}:\d{2}/.test(str || "");
                        const normalized = hasTime ? (str as string) : `${str}T00:00:00Z`;
                        const d = new Date(normalized as string);
                        // produce MM/DD in IST
                        return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", month: "2-digit", day: "2-digit" }).format(d);
                      } catch {
                        return str;
                      }
                    }}
                  />
                  <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-primary)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                    }}
                    labelFormatter={(label) => formatToIST(label as string)}
                  />
                  <Area
                    type="monotone"
                    dataKey="Score"
                    stroke="var(--accent-emerald)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#trend-glow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-tertiary)", fontSize: "14px" }}>
                No trend activity recorded.
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Score Comparison Bar Chart */}
        <div className="grid-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "1px", textTransform: "uppercase" }}>
              Teams
            </span>
            <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", marginTop: "4px" }}>
              Score Comparison
            </h3>
          </div>

          <div style={{ width: "100%", height: 320, marginTop: "8px" }}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-primary)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                    }}
                    cursor={{ fill: "rgba(255, 255, 255, 0.01)" }}
                  />
                  <Bar dataKey="Score" radius={[6, 6, 0, 0]} barSize={44}>
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-tertiary)" }}>
                Loading comparison graph...
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .analytics-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

