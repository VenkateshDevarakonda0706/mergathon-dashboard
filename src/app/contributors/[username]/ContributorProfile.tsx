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
  Flame,
  GitPullRequest,
  CheckCircle2,
  Award,
  ExternalLink,
  GitCommit,
  GitMerge,
  HelpCircle
} from "lucide-react";

export default function ContributorProfile({ username }: { username: string }) {
  const { data } = useData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!data) return null;

  const { contributors } = data;

  // Find contributor details
  const contributor = contributors.find(
    (c) => c.username.toLowerCase() === username.toLowerCase()
  );

  // If contributor not found, show a beautiful error
  if (!contributor) {
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
        <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Contributor Not Found</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          The GitHub user <strong style={{ color: "var(--text-primary)" }}>{username}</strong> is not registered in this Mergathon.
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

  // Calculate absolute ranking
  const sortedContributors = contributors.slice().sort((a, b) => b.score - a.score);
  const rank = sortedContributors.findIndex((c) => c.username === contributor.username) + 1;

  // Pie chart data for Recharts
  const pieData = [
  { name: "PRs Opened", value: contributor.prsOpened, color: "var(--accent-blue)" },
  { name: "PRs Merged", value: contributor.prsMerged, color: "var(--accent-emerald)" },
  { name: "Issues & Unmerged PRs Closed", value: contributor.issuesClosed, color: "var(--accent-amber)" },
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

      {/* Contributor Profile Banner */}
      <section 
        className="card" 
        style={{ 
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
          background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)",
          position: "relative"
        }}
      >
        {/* Avatar */}
        <img 
          src={contributor.avatarUrl} 
          alt={contributor.username}
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "var(--radius-full)",
            objectFit: "cover",
            border: `3px solid ${contributor.team.includes("Alpha") ? "var(--accent-blue)" : "var(--accent-violet)"}`
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`;
          }}
        />

        {/* Info */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h2 style={{ fontSize: "26px", fontWeight: 800 }}>{contributor.username}</h2>
            <a 
              href={contributor.profileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: "var(--text-tertiary)", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
              title="GitHub Profile"
            >
              <ExternalLink size={18} />
            </a>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span 
              style={{ 
                padding: "4px 12px", 
                borderRadius: "var(--radius-full)", 
                backgroundColor: contributor.team.includes("Alpha") ? "rgba(59, 130, 246, 0.1)" : "rgba(139, 92, 246, 0.1)",
                color: contributor.team.includes("Alpha") ? "var(--accent-blue)" : "var(--accent-violet)",
                fontWeight: 700,
                fontSize: "12px"
              }}
            >
              {contributor.team}
            </span>
            <span 
              className={`activity-badge ${contributor.activityLevel.toLowerCase()}`}
              style={{ padding: "4px 12px", fontSize: "11px" }}
            >
              {contributor.activityLevel} Activity
            </span>
          </div>
        </div>

        {/* Dynamic Standings Score Highlight */}
        <div style={{ display: "flex", gap: "24px" }} className="profile-highlights">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Event Rank
            </div>
            <div 
              style={{ 
                fontSize: "36px", 
                fontWeight: 900, 
                color: rank <= 3 ? "var(--accent-amber)" : "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              {rank <= 3 && <Award size={28} />}
              <span>#{rank}</span>
            </div>
          </div>
          <div style={{ height: "48px", width: "1px", backgroundColor: "var(--border-primary)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Points
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: "var(--accent-blue)" }}>
              {contributor.score}
            </div>
          </div>
        </div>
      </section>

      {/* Breakdown and Feed Grid */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 2fr", 
          gap: "24px" 
        }}
        className="profile-columns"
      >
        {/* Left Column: Stat Breakdown & Pie Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Detailed numbers */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Contribution Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <GitPullRequest size={16} style={{ color: "var(--accent-emerald)" }} />
                  <span>PRs Merged</span>
                </span>
                <span style={{ fontWeight: 700 }}>{contributor.prsMerged}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <GitPullRequest size={16} style={{ color: "var(--accent-blue)" }} />
                  <span>PRs Opened</span>
                </span>
                <span style={{ fontWeight: 700 }}>{contributor.prsOpened}</span>
              </div>



              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <CheckCircle2 size={16} style={{ color: "var(--accent-emerald)" }} />
                  <span>Issues & Unmerged PRs Closed</span>
                </span>
                <span style={{ fontWeight: 700 }}>{contributor.issuesClosed}</span>
              </div>
            </div>
          </div>

          {/* Activity share visualizer (Donut chart) */}
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, width: "100%", textAlign: "left", marginBottom: "16px" }}>
              Activity Breakdown
            </h3>
            {isMounted && pieData.length > 0 ? (
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "11px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: "12px" }}>
                {pieData.length === 0 ? "No active metrics" : "Loading visualizer..."}
              </div>
            )}
            
            {/* Custom Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", justifyContent: "center", marginTop: "12px" }}>
              {pieData.map((item) => (
                <span key={item.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                    {item.name}: {item.value}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contributions Feed */}
        <section className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px" }}>Contributions Feed</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            {contributor.contributions && contributor.contributions.length > 0 ? (
              contributor.contributions.map((item, idx) => {
                const style = getFeedItemStyle(item.type);
                const Icon = style.icon;

                return (
                  <div 
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "16px",
                      position: "relative",
                      paddingBottom: idx === contributor.contributions.length - 1 ? 0 : "16px"
                    }}
                  >
                    {/* Connecting Timeline Line */}
                    {idx !== contributor.contributions.length - 1 && (
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
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          {item.date}
                        </span>
                      </div>

                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0", lineHeight: 1.4 }}>
                        {item.title}
                      </h4>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                        <span style={{ fontSize: "12px", color: "var(--accent-violet)", fontWeight: 600 }}>
                          {item.repo}
                        </span>
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
                No logged github events within the event window.
              </div>
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
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
