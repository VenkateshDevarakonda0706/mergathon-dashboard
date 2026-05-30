"use client";

import { useData } from "../../context/DataContext";
import { Trophy, Users } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const { data } = useData();

  if (!data) return null;

  const { teams } = data;
  const sorted = [...teams].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <Trophy size={28} style={{ color: "var(--accent-amber)" }} />
          <h2 className="page-title">Team Leaderboard</h2>
        </div>
        <p className="page-subtitle">Live team standings based on labelled contributions</p>
      </div>

      {/* Scoring Rules Card */}
      <div className="card" style={{ marginBottom: "32px", background: "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)", borderColor: "var(--border-primary)" }}>
        <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>How is the score calculated?</h4>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Points are awarded when a PR is merged, or an issue / unmerged PR is closed during the event window:
        </p>
        <div style={{ display: "flex", gap: "24px", marginTop: "10px", flexWrap: "wrap" }}>
          <span style={{ color: "var(--accent-emerald)", fontWeight: 600, fontSize: "13px" }}>✅ PR Merged: +3 pts</span>
          <span style={{ color: "var(--accent-blue)", fontWeight: 600, fontSize: "13px" }}>🔒 Issue or Unmerged PR Closed: +1 pt</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px" }}>
          Both the PR author and the maintainer who merges the PR earn +3 points. Closing an issue or an unmerged PR awards +1 point. Opening PRs or issues does not award points.
        </p>
      </div>

      {/* Team Rankings */}
      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sorted.map((team, idx) => (
            <div key={team.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Rank badge */}
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: idx === 0 ? "rgba(245,158,11,0.15)" : idx === 1 ? "rgba(156,163,175,0.15)" : idx === 2 ? "rgba(180,83,9,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${idx === 0 ? "#f59e0b" : idx === 1 ? "#9ca3af" : idx === 2 ? "#b45309" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: idx === 0 ? "#f59e0b" : idx === 1 ? "#9ca3af" : idx === 2 ? "#b45309" : "var(--text-tertiary)", flexShrink: 0 }}>
                  {idx + 1}
                </div>
                {/* Team icon */}
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
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{team.members.length} members</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "8px 20px", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "90px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: team.color }}>{team.totalScore}</div>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Score</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "8px 14px", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "60px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff" }}>{team.totalPrsMerged}</div>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>PRs</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "8px 14px", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "60px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff" }}>{team.totalIssuesClosed}</div>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Issues / Unmerged PRs</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
