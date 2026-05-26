"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useData } from "../../../context/DataContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ArrowLeft,
  Users,
  GitPullRequest,
  CheckCircle2,

  Award,
  ExternalLink,
  GitCommit,
  GitMerge,
  HelpCircle,
} from "lucide-react";

export default function TeamDetail({ teamName }: { teamName: string }) {
  const { data } = useData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!data) return null;

  const { teams, contributors } = data;

  // Find team details
  const team = teams.find(
    (t) => t.name.toLowerCase() === teamName.toLowerCase()
  );

  // If team not found, show error
  if (!team) {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "60vh",
          gap: "16px"
        }}
      >
        <HelpCircle size={64} style={{ color: "var(--text-tertiary)" }} />
        <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Team Not Found</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          The team <strong style={{ color: "var(--text-primary)" }}>{teamName}</strong> is not registered.
        </p>
        <Link 
          href="/leaderboard"
          style={{
            padding: "10px 20px",
            background: "var(--gradient-primary)",
            color: "white",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "14px"
          }}
        >
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  // Calculate team ranking based on totalScore
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);
  const rank = sortedTeams.findIndex((t) => t.name === team.name) + 1;

  // Get members of this team and their contributions
  const teamContributors = contributors.filter(
    (c) => team.members.map((m) => m.toLowerCase()).includes(c.username.toLowerCase())
  );

  // Collect all contributions from team members
  const allTeamContributions = teamContributors
    .flatMap((c) =>
      c.contributions.map((item) => ({
        ...item,
        username: c.username,
        avatarUrl: c.avatarUrl,
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  // Pie chart data for Recharts
  const pieData = [
    { name: "PRs Merged Score", value: team.totalPrsMerged * 3, color: "var(--accent-emerald)" },
    { name: "Issues Closed Score", value: team.totalIssuesClosed * 3, color: "var(--accent-blue)" },
  ].filter((item) => item.value > 0);

  // Helper to color feed items based on type
  const getFeedItemStyle = (type: string) => {
    switch (type) {
      case "pr_merged":
        return { color: "var(--accent-emerald)", bg: "rgba(16, 185, 129, 0.1)", icon: GitMerge, label: "Merged PR" };
      case "pr_opened":
        return { color: "var(--accent-blue)", bg: "rgba(59, 130, 246, 0.1)", icon: GitPullRequest, label: "Opened PR" };

      case "issue_closed":
        return { color: "var(--accent-emerald)", bg: "rgba(16, 185, 129, 0.1)", icon: CheckCircle2, label: "Solved Issue" };
      case "issue_opened":
        return { color: "var(--accent-amber)", bg: "rgba(245, 158, 11, 0.1)", icon: GitCommit, label: "Reported Issue" };
      default:
        return { color: "var(--text-secondary)", bg: "var(--bg-tertiary)", icon: HelpCircle, label: "Activity" };
    }
  };

  return (
    <div>
      {/* Back navigation */}
      <div style={{ marginBottom: "20px" }}>
        <Link 
          href="/leaderboard" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            color: "var(--text-secondary)", 
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <ArrowLeft size={16} />
          <span>Back to Leaderboard</span>
        </Link>
      </div>

      {/* Team Profile Banner */}
      <section 
        className="card" 
        style={{ 
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
          background: `linear-gradient(135deg, var(--bg-card) 0%, rgba(255, 255, 255, 0.01) 100%)`,
          borderLeft: `4px solid ${team.color}`,
          position: "relative"
        }}
      >
        {/* Team Logo / Icon */}
        <div 
          style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "var(--radius-md)", 
            background: `linear-gradient(135deg, ${team.color}15, ${team.color}35)`, 
            border: `1px solid ${team.color}30`, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Users size={36} style={{ color: team.color }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "6px" }}>{team.name}</h2>
          <span 
            style={{ 
              padding: "4px 12px", 
              borderRadius: "var(--radius-full)", 
              backgroundColor: `${team.color}15`,
              color: team.color,
              fontWeight: 700,
              fontSize: "12px",
              border: `1px solid ${team.color}30`
            }}
          >
            {team.members.length} Members
          </span>
        </div>

        {/* Dynamic Standings Score Highlight */}
        <div style={{ display: "flex", gap: "24px" }} className="profile-highlights">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Rank
            </div>
            <div 
              style={{ 
                fontSize: "36px", 
                fontWeight: 900, 
                color: rank === 1 ? "var(--accent-amber)" : "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              {rank <= 3 && <Award size={28} style={{ color: rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#b45309" }} />}
              <span>#{rank}</span>
            </div>
          </div>
          <div style={{ height: "48px", width: "1px", backgroundColor: "var(--border-primary)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Points
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: team.color }}>
              {team.totalScore}
            </div>
          </div>
        </div>
      </section>

      {/* Breakdown and Feed Grid */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1.2fr 2fr", 
          gap: "24px" 
        }}
        className="profile-columns"
      >
        {/* Left Column: Stat Breakdown & Members List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Detailed numbers */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Stats Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <GitMerge size={16} style={{ color: "var(--accent-emerald)" }} />
                  <span>PRs Merged</span>
                </span>
                <span style={{ fontWeight: 700 }}>{team.totalPrsMerged}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <GitPullRequest size={16} style={{ color: "var(--accent-blue)" }} />
                  <span>PRs Opened</span>
                </span>
                <span style={{ fontWeight: 700 }}>{team.totalPrsOpened}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <CheckCircle2 size={16} style={{ color: "var(--accent-emerald)" }} />
                  <span>Issues Closed</span>
                </span>
                <span style={{ fontWeight: 700 }}>{team.totalIssuesClosed}</span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Team Roster ({teamContributors.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {teamContributors.map((member) => (
                <Link 
                  key={member.username} 
                  href={`/contributors/${member.username}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = team.color;
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img 
                      src={member.avatarUrl} 
                      alt={member.username} 
                      style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border-secondary)" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://avatars.githubusercontent.com/${member.username}`;
                      }}
                    />
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{member.username}</span>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {member.prsMerged} PRs · {member.issuesClosed} Issues
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: team.color }}>{member.score} pts</span>
                </Link>
              ))}

              {teamContributors.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
                  No active contributors registered on this team.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Contributions Feed */}
        <section className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px" }}>Aggregated Team Contributions</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            {allTeamContributions.length > 0 ? (
              allTeamContributions.map((item, idx) => {
                const style = getFeedItemStyle(item.type);
                const Icon = style.icon;

                return (
                  <div 
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "16px",
                      position: "relative",
                      paddingBottom: idx === allTeamContributions.length - 1 ? 0 : "16px"
                    }}
                  >
                    {/* Connecting Timeline Line */}
                    {idx !== allTeamContributions.length - 1 && (
                      <div 
                        style={{
                          position: "absolute",
                          left: "18px",
                          top: "36px",
                          bottom: 0,
                          width: "2px",
                          backgroundColor: "var(--border-primary)"
                        }}
                      />
                    )}

                    {/* Left Icon with Colored Circle */}
                    <div 
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: style.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: style.color,
                        flexShrink: 0
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    {/* Feed Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Link href={`/contributors/${item.username}`} style={{ textDecoration: "none" }}>
                            <span 
                              style={{ 
                                fontSize: "12px", 
                                fontWeight: 800, 
                                color: "var(--text-primary)" 
                              }}
                              className="clickable-user"
                            >
                              {item.username}
                            </span>
                          </Link>
                          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>•</span>
                          <span 
                            style={{ 
                              fontSize: "11px", 
                              fontWeight: 700, 
                              color: style.color, 
                              textTransform: "uppercase", 
                              letterSpacing: "0.5px" 
                            }}
                          >
                            {style.label}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          {item.date}
                        </span>
                      </div>

                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0", lineHeight: 1.4 }}>
                        {item.title}
                      </h4>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "12px", color: team.color, fontWeight: 600 }}>
                            {item.repo}
                          </span>
                          <span 
                            style={{ 
                              fontSize: "11px", 
                              padding: "2px 8px", 
                              background: `rgba(255, 255, 255, 0.03)`, 
                              border: "1px solid var(--border-primary)",
                              borderRadius: "4px", 
                              fontWeight: 700,
                              color: "var(--text-secondary)"
                            }}
                          >
                            +{item.points} pts
                          </span>
                        </div>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            color: "var(--accent-blue)",
                            textDecoration: "none",
                            fontWeight: 600
                          }}
                        >
                          <span>GitHub</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  flex: 1, 
                  height: "200px",
                  color: "var(--text-tertiary)",
                  fontSize: "14px" 
                }}
              >
                No tracked team contributions recorded.
              </div>
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .clickable-user:hover {
          color: var(--accent-blue) !important;
          text-decoration: underline;
        }
        @media (max-width: 900px) {
          .profile-columns {
            grid-template-columns: 1fr !important;
          }
          .profile-highlights {
            width: 100%;
            justify-content: space-around;
            margin-top: 12px;
          }
        }
      `}</style>
    </div>
  );
}
