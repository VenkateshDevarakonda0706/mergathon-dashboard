"use client";

import Link from "next/link";
import { Team, Contributor } from "../types";
import { GitPullRequest, CheckCircle2 } from "lucide-react";

interface TeamCardProps {
  team: Team;
  allContributors: Contributor[];
  totalScoreCombined: number;
}

export default function TeamCard({ team, allContributors, totalScoreCombined }: TeamCardProps) {
  const isAlpha = team.name.toLowerCase().includes("alpha");
  const teamClass = isAlpha ? "team-alpha" : "team-beta";
  const progressColor = isAlpha ? "blue" : "violet";
  
  // Calculate percentage of total score
  const scorePercentage = totalScoreCombined > 0 
    ? Math.round((team.totalScore / totalScoreCombined) * 100) 
    : 0;

  // Build a lookup map so zero-contribution members still get an avatar
  const contributorMap = new Map(allContributors.map(c => [c.username, c]));

  return (
    <div className={`card team-card ${teamClass}`}>
      <div className="team-header">
        <Link href={`/teams/${encodeURIComponent(team.name)}`} style={{ textDecoration: "none" }}>
          <h3 className="team-name clickable-team-title" style={{ transition: "color 0.2s" }}>{team.name}</h3>
        </Link>
        <span className="team-score-badge">{team.totalScore} pts</span>
      </div>

      <div className="team-stats-row">
        <div className="team-stat">
          <div className="team-stat-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <GitPullRequest size={16} className={isAlpha ? "text-blue" : "text-violet"} style={{ color: team.color }} />
            <span>{team.totalPrsMerged}</span>
          </div>
          <div className="team-stat-label">Merged PRs</div>
        </div>
        <div className="team-stat">
          <div className="team-stat-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <CheckCircle2 size={16} style={{ color: "var(--accent-emerald)" }} />
            <span>{team.totalIssuesClosed}</span>
          </div>
          <div className="team-stat-label">Issues Closed</div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-label">
          <span>Event Contribution Share</span>
          <span>{scorePercentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${progressColor}`} 
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
          Members ({team.members.length})
        </span>
        <div className="avatar-stack">
          {team.members.map((username) => {
            const contributor = contributorMap.get(username);
            const avatarUrl = contributor?.avatarUrl ?? `https://avatars.githubusercontent.com/${username}`;
            return (
              <Link key={username} href={`/contributors/${username}`} title={username}>
                <img
                  src={avatarUrl}
                  alt={username}
                  className="avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://avatars.githubusercontent.com/${username}`;
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-primary)", display: "flex", justifyContent: "flex-end" }}>
        <Link 
          href={`/teams/${encodeURIComponent(team.name)}`} 
          style={{ 
            fontSize: "12px", 
            fontWeight: 700, 
            color: team.color, 
            textDecoration: "none", 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "4px" 
          }}
        >
          <span>View Details</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
