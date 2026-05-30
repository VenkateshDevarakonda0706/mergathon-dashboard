"use client";

import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { formatToIST } from "../lib/formatDate";
import TeamCard from "../components/TeamCard";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Users, GitPullRequest, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data } = useData();
  const [view, setView] = useState<"overview" | "teams">("overview");
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number; ended: boolean } | null>(null);

  useEffect(() => {
    const target = new Date("2026-05-31T23:59:59Z");

    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setCountdown({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        ended: false,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  const { stats, contributors } = data;
  const teams = [...data.teams].sort((a, b) => b.totalScore - a.totalScore);

  const totalScoreCombined = teams.reduce((acc, t) => acc + t.totalScore, 0);
  const totalActivities = stats.totalPrsMerged + stats.totalIssuesClosed;

  const pieData = [
    { name: "PR Merged", value: stats.totalPrsMerged || 0, color: "#10b981" },
    { name: "Issue Closed", value: stats.totalIssuesClosed || 0, color: "#3b82f6" },
  ];

  const allContributions = contributors
    .flatMap(c =>
      c.contributions.map(item => ({
        ...item,
        username: c.username,
        avatarUrl: c.avatarUrl
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="hero-header">
        <div className="event-badge-outline">
          <span className="logo-dot" />
          <span>CircuitVerse Mergathon</span>
        </div>

        <h1 className="big-brand-title">CircuitVerse</h1>

        <p className="hero-subtitle-text">
          Track merged pull requests, closed issues, and team rankings for the CircuitVerse mergathon.
        </p>

        {countdown !== null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
            {countdown.ended ? (
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Event Ended
              </span>
            ) : (
              <>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
                  Event ends in
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { value: countdown.days, label: "Days" },
                    { value: countdown.hours, label: "Hours" },
                    { value: countdown.minutes, label: "Mins" },
                    { value: countdown.seconds, label: "Secs" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        minWidth: "56px",
                        padding: "8px 12px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                        {String(value).padStart(2, "0")}
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="capsule-toggle">
          <button className={`toggle-option ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}>Overview</button>
          <button className={`toggle-option ${view === "teams" ? "active" : ""}`} onClick={() => setView("teams")}>Teams</button>
        </div>

        <div className="badge-row">
          <span className="outlined-badge">CircuitVerse/CircuitVerse</span>
          <span className="outlined-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-emerald)", boxShadow: "0 0 8px var(--accent-emerald)" }} />
            Leaderboard Active
          </span>
        </div>
      </section>

      {view === "overview" ? (
        <div>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "40px" }}>

            {/* Card 1: TOTAL ACTIVITIES */}
            <div className="grid-card">
              <div className="card-title-row">
                <span className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-emerald)" }} />
                  TOTAL ACTIVITIES
                </span>
                <span className="card-meta">...</span>
              </div>
              <div className="card-value">{stats.totalPrsMerged + stats.totalIssuesClosed}</div>
              <div className="card-description">New activity tracking started</div>
              <svg viewBox="0 0 300 60" style={{ width: "100%", height: "60px", marginTop: "16px", overflow: "visible" }}>
                <defs>
                  <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M 0 45 C 50 45, 75 15, 100 15 C 125 15, 150 55, 175 55 C 200 55, 250 25, 300 25" fill="none" stroke="var(--accent-emerald)" strokeWidth="3" strokeLinecap="round" />
                <path d="M 0 45 C 50 45, 75 15, 100 15 C 125 15, 150 55, 175 55 C 200 55, 250 25, 300 25 L 300 60 L 0 60 Z" fill="url(#sparkline-grad)" />
                <circle cx="100" cy="15" r="4" fill="var(--bg-primary)" stroke="var(--accent-emerald)" strokeWidth="3" />
                <g style={{ transform: "translate(80px, -8px)" }}>
                  <rect x="0" y="0" width="40" height="18" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="var(--accent-emerald)" strokeWidth="1" />
                  <text x="20" y="12" fill="var(--accent-emerald)" fontSize="9" fontWeight="800" textAnchor="middle">High</text>
                </g>
              </svg>
            </div>

            {/* Card 2: TEAMS (replaced individual contributors) */}
            <div className="grid-card">
              <div className="card-title-row">
                <span className="card-title">TEAMS</span>
                <span className="card-meta">STANDINGS</span>
              </div>
              <div className="card-value">{teams.length}</div>
              <div className="card-description">Competing in this mergathon</div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                {teams.slice(0, 4).map((team, idx) => (
                  <div key={team.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", width: "16px" }}>#{idx + 1}</span>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: team.color, flexShrink: 0 }} />
                      <Link href={`/teams/${encodeURIComponent(team.name)}`} style={{ textDecoration: "none" }}>
                        <span 
                          style={{ 
                            fontSize: "13px", 
                            fontWeight: 700, 
                            color: "var(--text-primary)",
                            transition: "color 0.2s"
                          }}
                          className="clickable-team-title"
                        >
                          {team.name}
                        </span>
                      </Link>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: team.color }}>{team.totalScore} pts</span>
                  </div>
                ))}
                {teams.length > 4 && (
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>+{teams.length - 4} more teams</span>
                )}
              </div>
            </div>

            {/* Card 3: DISTRIBUTION */}
            <div className="grid-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div className="card-title-row" style={{ marginBottom: "0px" }}>
                  <span className="card-title">DISTRIBUTION</span>
                  <span className="card-meta">MIX</span>
                </div>
                <div style={{ position: "relative", width: "100%", height: "130px", marginTop: "8px" }}>
                  {countdown !== null ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={52} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: "11px", color: "#ffffff", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>Activities</div>
                  </div>
                </div>
              </div>
              <div className="dist-grid" style={{ marginTop: "12px" }}>
                <div className="dist-item">
                  <div className="dist-label"><span className="dist-dot" style={{ background: "#10b981" }} /><span>PR merged</span></div>
                  <span className="dist-val">{totalActivities > 0 ? Math.round((stats.totalPrsMerged / totalActivities) * 100) : 0}%</span>
                </div>
                <div className="dist-item">
                  <div className="dist-label"><span className="dist-dot" style={{ background: "#3b82f6" }} /><span>Issue/Unmerged PR closed</span></div>
                  <span className="dist-val">{totalActivities > 0 ? Math.round((stats.totalIssuesClosed / totalActivities) * 100) : 0}%</span>
                </div>
                <div className="dist-item">
                  <div className="dist-label"><span className="dist-dot" style={{ background: "#f59e0b" }} /><span>Teams</span></div>
                  <span className="dist-val">{teams.length}</span>
                </div>
                <div className="dist-item">
                  <div className="dist-label"><span className="dist-dot" style={{ background: "#8b5cf6" }} /><span>Score</span></div>
                  <span className="dist-val">{totalScoreCombined}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom two columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "32px" }} className="dashboard-columns">

            {/* Team Rankings */}
            <section>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "1px", textTransform: "uppercase" }}>Leaderboard</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", marginTop: "4px" }}>
                <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>Team Rankings</h3>
                <span className="event-badge-outline" style={{ margin: 0, padding: "4px 12px", fontSize: "10px" }}>
                  PR Merged +3pts · Issue/Unmerged PR Closed +1pt
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {teams.map((team) => (
                  <div key={team.name} style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", background: `linear-gradient(135deg, ${team.color}15, ${team.color}35)`, border: `1px solid ${team.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users size={20} style={{ color: team.color }} />
                      </div>
                      <div>
                        <Link href={`/teams/${encodeURIComponent(team.name)}`} style={{ textDecoration: "none" }}>
                          <h4 
                            style={{ 
                              fontSize: "16px", 
                              fontWeight: 800, 
                              color: "#ffffff",
                              transition: "color 0.2s"
                            }}
                            className="clickable-team-title"
                          >
                            {team.name}
                          </h4>
                        </Link>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{team.members.length} contributors</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)", padding: "8px 16px", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "80px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: team.color }}>{team.totalScore}</div>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Score</div>
                      </div>
                      <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)", padding: "8px 12px", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "60px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff" }}>{team.totalPrsMerged}</div>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>PRs</div>
                      </div>
                      <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)", padding: "8px 12px", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "60px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff" }}>{team.totalIssuesClosed}</div>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Issues / Unmerged PRs</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activities */}
            <section>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-tertiary)", letterSpacing: "1px", textTransform: "uppercase" }}>Releases</span>
              <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "16px", marginTop: "4px" }}>Recent Activities</h3>
              <div className="grid-card timeline-card" style={{ padding: "20px 24px" }}>
                {allContributions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {allContributions.map((c, idx) => {
                      const isMerged = c.type === "pr_merged";
                      const isClosed = c.type === "issue_closed";
                      let badgeColor = "var(--accent-blue)";
                      let badgeIcon = <GitPullRequest size={14} />;
                      if (isMerged) { badgeColor = "var(--accent-emerald)"; }
                      else if (isClosed) { badgeColor = "var(--accent-emerald)"; badgeIcon = <CheckCircle2 size={14} />; }

                      return (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-icon-box" style={{ background: `${badgeColor}15`, border: `1px solid ${badgeColor}30`, color: badgeColor }}>{badgeIcon}</div>
                          <div className="timeline-content">
                            <div className="timeline-title">
                              <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{c.username}</span>
                              {" "}{c.type.replace("_", " ")}{" "}
                              <span style={{ color: "var(--text-secondary)" }}>&ldquo;{c.title}&rdquo;</span>
                            </div>
                            <div className="timeline-meta">
                              <span>{c.repo}</span><span>•</span><span>{formatToIST(c.date)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <AlertCircle size={32} style={{ color: "var(--text-tertiary)", opacity: 0.5 }} />
                    No tracked contributions in the event window yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 800 }}>Team Standings</h3>
            <Link href="/teams" style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-emerald)", textDecoration: "none" }}>
              Detailed Team Analytics →
            </Link>
          </div>
          <div className="teams-grid">
            {teams.map((team) => (
              <TeamCard key={team.name} team={team} allContributors={contributors} totalScoreCombined={totalScoreCombined} />
            ))}
          </div>
        </section>
      )}

      <style jsx global>{`
        @media (max-width: 1100px) {
          .dashboard-columns { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </div>
  );
}
