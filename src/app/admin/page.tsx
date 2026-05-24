"use client";

import { useState, useEffect, useCallback } from "react";
import { useData } from "../../context/DataContext";
import { Users, ShieldAlert, Check, RefreshCw, Copy, Sliders, AlertCircle, AlertTriangle, CheckCircle, X } from "lucide-react";

// Toast notification types
type ToastKind = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
}

interface DraftMember {
  username: string;
  avatarUrl: string;
  score: number;
  prsMerged: number;
  issuesClosed: number;
}

interface DraftTeam {
  name: string;
  color: string;
  members: string[]; // usernames
}

// Toast color & icon config
const TOAST_COLORS: Record<ToastKind, string> = {
  success: "#10b981",
  error:   "#ef4444",
  warning: "#f59e0b",
  info:    "#3b82f6",
};

const TOAST_ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error:   <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <AlertCircle size={16} />,
};

// Draft validation — checks for duplicate assignments and unassigned contributors
function validateDraft(teams: DraftTeam[], allContributors: DraftMember[]) {
  const errors: string[] = [];
  const warnings: string[] = [];

  teams.forEach((t) => {
    if (t.members.length === 0)
      warnings.push(`"${t.name}" has no members assigned yet.`);
  });

  const allAssigned = teams.flatMap((t) => t.members.map((m) => m.toLowerCase()));
  const seen = new Set<string>();
  allAssigned.forEach((m) => {
    if (seen.has(m)) errors.push(`"${m}" is assigned to multiple teams.`);
    seen.add(m);
  });

  const unassigned = allContributors.filter(
    (c) => !allAssigned.includes(c.username.toLowerCase())
  );
  if (unassigned.length > 0)
    warnings.push(
      `${unassigned.length} contributor${unassigned.length > 1 ? "s are" : " is"} still unassigned.`
    );

  return { valid: errors.length === 0, errors, warnings };
}

// Toast container — displays real-time feedback notifications
let _toastId = 0;

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "340px",
        width: "100%",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            background: "rgba(15, 15, 20, 0.95)",
            border: `1px solid ${TOAST_COLORS[t.kind]}40`,
            borderLeft: `4px solid ${TOAST_COLORS[t.kind]}`,
            borderRadius: "10px",
            padding: "14px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            animation: "slideInToast 0.25s ease",
          }}
        >
          <span style={{ color: TOAST_COLORS[t.kind], flexShrink: 0, marginTop: "1px" }}>
            {TOAST_ICONS[t.kind]}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>
              {t.title}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
              {t.message}
            </div>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Validation panel — shows live errors and warnings above the builder grid
function ValidationPanel({ validation }: { validation: ReturnType<typeof validateDraft> }) {
  const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0;
  if (!hasIssues) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#10b981",
          fontWeight: 600,
        }}
      >
        <CheckCircle size={14} />
        Draft looks valid — no issues detected.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {validation.errors.map((e, i) => (
        <div
          key={`err-${i}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#ef4444",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
          {e}
        </div>
      ))}
      {validation.warnings.map((w, i) => (
        <div
          key={`warn-${i}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "10px 14px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f59e0b",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
          {w}
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { data } = useData();
  const [draftTeams, setDraftTeams] = useState<DraftTeam[]>([]);
  const [contributorsList, setContributorsList] = useState<DraftMember[]>([]);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dropdownErrors, setDropdownErrors] = useState<Record<string, string>>({});

  // Toast helpers — must be before early return to follow React Rules of Hooks
  const addToast = useCallback(
    (kind: ToastKind, title: string, message: string, duration = 4000) => {
      const id = ++_toastId;
      setToasts((prev) => [...prev.slice(-4), { id, kind, title, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    },
    []
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize draft states from context data
  useEffect(() => {
    if (data) {
      // Map teams
      setDraftTeams(
        data.teams.map((t) => ({
          name: t.name,
          color: t.color,
          members: [...t.members],
        }))
      );
      // Map contributors
      setContributorsList(
        data.contributors.map((c) => ({
          username: c.username,
          avatarUrl: c.avatarUrl,
          score: c.score,
          prsMerged: c.prsMerged,
          issuesClosed: c.issuesClosed,
        }))
      );
    }
  }, [data]);

  if (!data) return null;

  // 1. Calculations & Statistics for Balancer
  const getTeamStats = (teamName: string) => {
    const team = draftTeams.find((t) => t.name === teamName);
    if (!team) return { score: 0, count: 0, avg: 0 };
    
    const membersData = contributorsList.filter((c) =>
      team.members.map((m) => m.toLowerCase()).includes(c.username.toLowerCase())
    );
    
    const totalScore = membersData.reduce((acc, m) => acc + m.score, 0);
    const count = membersData.length;
    const avg = count > 0 ? Math.round(totalScore / count) : 0;
    
    return { score: totalScore, count, avg };
  };

  const getUnassigned = () => {
    const assignedUsernames = draftTeams.flatMap((t) => t.members.map((m) => m.toLowerCase()));
    return contributorsList.filter((c) => !assignedUsernames.includes(c.username.toLowerCase()));
  };

  // Live Point Balance rating
  const getBalanceRating = () => {
    if (draftTeams.length < 2) return { rating: "Balanced", class: "perfect" };
    
    const averages = draftTeams.map((t) => getTeamStats(t.name).avg);
    const maxAvg = Math.max(...averages);
    const minAvg = Math.min(...averages);
    const diff = maxAvg - minAvg;
    
    if (diff < 15) {
      return { rating: "🟢 Balanced", class: "perfect", desc: `Average scores are within ${diff} pts.` };
    } else if (diff <= 50) {
      return { rating: "🟡 Moderate Balance", class: "moderate", desc: `Averages differ by ${diff} pts. Slight adjustment recommended.` };
    } else {
      return { rating: "🔴 Unbalanced", class: "bad", desc: `Averages differ by ${diff} pts! Teams are heavily lopsided.` };
    }
  };

  // Live validation runs on every render to reflect current draft state
  const validation = validateDraft(draftTeams, contributorsList);

  // 2. Draft action handlers
  const handleAssignMember = (username: string, targetTeamName: string | null) => {
    if (targetTeamName) {
      const target = draftTeams.find((t) => t.name === targetTeamName);
      if (target?.members.map((m) => m.toLowerCase()).includes(username.toLowerCase())) {
        setDropdownErrors((prev) => ({ ...prev, [username]: `${username} is already on ${targetTeamName}.` }));
        addToast("error", "Assignment Blocked", `${username} is already on ${targetTeamName}.`, 4000);
        setTimeout(
          () => setDropdownErrors((prev) => { const n = { ...prev }; delete n[username]; return n; }),
          3000
        );
        return;
      }
    }
    setDropdownErrors((prev) => { const n = { ...prev }; delete n[username]; return n; });

    const prevTeam = draftTeams.find((t) =>
      t.members.map((m) => m.toLowerCase()).includes(username.toLowerCase())
    );

    setDraftTeams((prevTeams) =>
      prevTeams.map((t) => {
        // Remove from current team
        const cleanedMembers = t.members.filter((m) => m.toLowerCase() !== username.toLowerCase());
        
        // Add if target matches
        if (t.name === targetTeamName) {
          return { ...t, members: [...cleanedMembers, username] };
        }
        return { ...t, members: cleanedMembers };
      })
    );

    if (targetTeamName) {
      addToast(
        "success",
        "Member Assigned",
        prevTeam
          ? `${username} moved from ${prevTeam.name} → ${targetTeamName}.`
          : `${username} added to ${targetTeamName}.`,
        3000
      );
    } else {
      addToast("info", "Moved to Bench", `${username} removed from ${prevTeam?.name ?? "team"} and benched.`, 3000);
    }
  };

  // 3. Snake Draft Auto-Balancer Algorithm
  const handleAutoBalance = () => {
    if (draftTeams.length === 0) return;

    // Sort active participants by score descending
    const sorted = [...contributorsList].sort((a, b) => b.score - a.score);
    
    // Initialize empty arrays for draft slots
    const newTeamSlots: string[][] = Array.from({ length: draftTeams.length }, () => []);
    
    // Distribute participants using standard Snake Draft pattern:
    // e.g. Left-to-right (1, 2), then Right-to-left (3, 4), then Left-to-right (5, 6)...
    for (let i = 0; i < sorted.length; i++) {
      const round = Math.floor(i / draftTeams.length);
      const isEvenRound = round % 2 === 0;
      
      let targetIndex;
      if (isEvenRound) {
        targetIndex = i % draftTeams.length;
      } else {
        targetIndex = draftTeams.length - 1 - (i % draftTeams.length);
      }
      
      newTeamSlots[targetIndex].push(sorted[i].username);
    }
    
    // Save draft results
    setDraftTeams((prev) =>
      prev.map((t, idx) => ({
        ...t,
        members: newTeamSlots[idx],
      }))
    );

    addToast("success", "Teams Auto-Balanced ⚡", `${sorted.length} contributors distributed across ${draftTeams.length} teams using snake draft.`, 4000);
  };

  // Reset Draft
  const handleResetDraft = () => {
    setDraftTeams(
      data.teams.map((t) => ({
        name: t.name,
        color: t.color,
        members: [...t.members],
      }))
    );
    setDropdownErrors({});
    addToast("info", "Draft Reset", "All team assignments reverted to saved config.", 3500);
  };

  // 4. YAML config code generation
  const generateYamlCode = () => {
    let yaml = `# Copy & paste this block into your config.yaml\nteams:\n`;
    draftTeams.forEach((t) => {
      yaml += `  - name: "${t.name}"\n    color: "${t.color}"\n    members:\n`;
      t.members.forEach((m) => {
        yaml += `      - "${m}"\n`;
      });
    });
    return yaml;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateYamlCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast("success", "YAML Copied!", "Config is ready to paste into config.yaml.", 3000);
  };

  const unassigned = getUnassigned();
  const ratingInfo = getBalanceRating();

  return (
    <div>
      <style>{`@keyframes slideInToast { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }`}</style>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Header */}
      <section className="hero-header" style={{ alignItems: "flex-start", textAlign: "left", marginBottom: "32px" }}>
        <div className="event-badge-outline" style={{ marginBottom: "20px" }}>
          <span>CircuitVerse Mergathon</span>
        </div>
        
        <h1 className="big-brand-title" style={{ color: "#ffffff", fontSize: "64px", marginBottom: "12px" }}>
          Admin Panel
        </h1>
        
        <p className="hero-subtitle-text" style={{ maxWidth: "700px", fontSize: "16px", marginBottom: "24px" }}>
          Draft registered contributors into balanced hackathon squads using live average calculators or automated snake drafting.
        </p>

        <div className="badge-row" style={{ justifyContent: "flex-start", marginBottom: 0 }}>
          <span className="outlined-badge">CircuitVerse/CircuitVerse</span>
          <span className="outlined-badge">Leaderboard Active</span>
        </div>
      </section>

      {/* Control Buttons & Balance Monitor bar */}
      <div 
        className="grid-card" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: "20px", 
          marginBottom: "32px" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div 
            style={{ 
              width: "44px", 
              height: "44px", 
              borderRadius: "50%", 
              background: "rgba(16, 185, 129, 0.1)", 
              border: "1px solid rgba(16, 185, 129, 0.2)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "var(--accent-emerald)"
            }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase" }}>Draft Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
              <span className={`balanced-badge ${ratingInfo.class}`} style={{ margin: 0 }}>
                {ratingInfo.rating}
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {ratingInfo.desc}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            className="balancer-btn secondary" 
            onClick={handleResetDraft}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <RefreshCw size={14} />
            Reset
          </button>
          <button 
            className="balancer-btn primary" 
            onClick={handleAutoBalance}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            ⚡ Auto-Balance Teams
          </button>
        </div>
      </div>

      {/* Live Validation */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <AlertCircle size={14} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>
            Live Validation
          </span>
          {!validation.valid && (
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.12)", padding: "2px 8px", borderRadius: "99px" }}>
              {validation.errors.length} error{validation.errors.length > 1 ? "s" : ""}
            </span>
          )}
          {validation.warnings.length > 0 && (
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: "99px" }}>
              {validation.warnings.length} warning{validation.warnings.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <ValidationPanel validation={validation} />
      </div>

      {/* Main Builder Grid */}
      <div className="balancer-grid" style={{ marginBottom: "32px" }}>
        {/* Left Side: Unassigned / Participant Roster shelf */}
        <div className="balancer-shelf" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>Roster</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Registered participants & team rosters. Reassign manually by clicking the drop-down.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1, maxHeight: "600px", paddingRight: "4px" }}>
            {/* List all contributors */}
            {contributorsList.map((contrib) => {
              // Find what team they are in
              const currentTeam = draftTeams.find((t) =>
                t.members.map((m) => m.toLowerCase()).includes(contrib.username.toLowerCase())
              );
              const inlineError = dropdownErrors[contrib.username];
              
              return (
                <div key={contrib.username} className="balancer-user-tag" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img 
                        src={contrib.avatarUrl} 
                        alt={contrib.username} 
                        style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`;
                        }}
                      />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{contrib.username}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: currentTeam ? currentTeam.color : "var(--text-tertiary)" }}>
                      {contrib.score} pts
                    </span>
                  </div>

                  {/* Manual team selector dropdown */}
                  <select
                    value={currentTeam ? currentTeam.name : "Unassigned"}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleAssignMember(contrib.username, val === "Unassigned" ? null : val);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: `1px solid ${inlineError ? "rgba(239,68,68,0.6)" : "var(--border-primary)"}`,
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Unassigned">Unassigned (bench)</option>
                    {draftTeams.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  {/* Inline validation message */}
                  {inlineError && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#ef4444", fontWeight: 600, padding: "5px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "5px", animation: "slideInToast 0.2s ease" }}>
                      <AlertCircle size={11} />
                      {inlineError}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Board Columns */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="balancer-boards">
            {draftTeams.map((team) => {
              const stats = getTeamStats(team.name);
              
              return (
                <div key={team.name} className="balancer-board" style={{ borderTop: `4px solid ${team.color}` }}>
                  {/* Team Column Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>{team.name}</h4>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {stats.count} members assigned
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "20px", fontWeight: 900, color: team.color }}>
                        {stats.score} <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>PTS</span>
                      </span>
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase" }}>
                        Avg: {stats.avg} pts
                      </div>
                    </div>
                  </div>

                  {/* Team Roster tags inside board */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "150px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                    {team.members.length > 0 ? (
                      team.members.map((username) => {
                        const memberInfo = contributorsList.find((c) => c.username.toLowerCase() === username.toLowerCase());
                        if (!memberInfo) return null;
                        
                        return (
                          <div 
                            key={username} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between", 
                              padding: "8px 12px", 
                              background: "rgba(255, 255, 255, 0.02)", 
                              border: "1px solid var(--border-primary)", 
                              borderRadius: "8px" 
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img 
                                src={memberInfo.avatarUrl} 
                                alt={username} 
                                style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`;
                                }}
                              />
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>{username}</span>
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                              {memberInfo.score} pts
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div 
                        style={{ 
                          flex: 1, 
                          border: "1px dashed var(--border-primary)", 
                          borderRadius: "var(--radius-lg)", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          color: "var(--text-tertiary)", 
                          fontSize: "12px",
                          minHeight: "100px" 
                        }}
                      >
                        Squad Empty. Reassign users to build roster.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* YAML Exporter Block below the columns */}
          <div className="grid-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>YAML Config Exporter</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Save your changes by copying this block directly into your event configuration <code style={{ color: "var(--accent-emerald)" }}>config.yaml</code>.
                </p>
              </div>
              <button 
                className="balancer-btn primary" 
                onClick={handleCopyCode}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px",
                  padding: "8px 16px",
                  fontSize: "12px"
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy YAML"}
              </button>
            </div>

            <pre 
              style={{ 
                background: "rgba(0, 0, 0, 0.4)", 
                border: "1px solid var(--border-primary)", 
                borderRadius: "8px", 
                padding: "16px", 
                fontSize: "12px", 
                fontFamily: "monospace", 
                color: "rgba(255, 255, 255, 0.8)",
                overflowX: "auto",
                maxHeight: "180px"
              }}
            >
              {generateYamlCode()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
