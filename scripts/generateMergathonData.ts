#!/usr/bin/env ts-node
// ============================================================
// CircuitVerse Mergathon – Leaderboard Data Generator
// ============================================================
import * as fs from "fs";
import * as path from "path";
import type {
  MergathonData,
  Contributor,
  Team,
  DailyActivity,
  EventStats,
  ContributionItem,
} from "../src/types";

interface YamlConfig {
  eventName: string;
  organization: string;
  eventStartDate: string;
  eventEndDate: string;
  repos: string[];
  scoringLabels: Record<string, number>;
  thresholds: { highActivity: number; mediumActivity: number };
  teams: { name: string; color: string; members: string[] }[];
}

// --------------- Config Parser ---------------

function parseConfigYaml(content: string): YamlConfig {
  const lines = content.split(/\r?\n/);
  let eventName = "CircuitVerse Mergathon 2025";
  let organization = "CircuitVerse";
  let eventStartDate = "2026-05-22";
  let eventEndDate = "2026-05-31";
  const repos: string[] = [];
  const scoringLabels: Record<string, number> = {
    "mergathon:closed-invalid": 1,
    "mergathon:closed-outdated": 1,
    "mergathon:merged": 3,
    "mergathon:closed-taken-over": 5,
  };
  const thresholds = { highActivity: 10, mediumActivity: 3 };
  const teams: { name: string; color: string; members: string[] }[] = [];
  let currentTeam: any = null;
  let mode: "none" | "repos" | "members" | "labels" = "none";

  for (let line of lines) {
    let cleanLine = line;
    const commentIdx = line.indexOf(" #");
    if (commentIdx !== -1) cleanLine = line.substring(0, commentIdx);
    else if (line.trim().startsWith("#")) cleanLine = "";
    const trimmed = cleanLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("name:") && !trimmed.includes("- name:")) { eventName = trimmed.split(":")[1].trim().replace(/['"]/g, ""); continue; }
    if (trimmed.startsWith("organization:")) { organization = trimmed.split(":")[1].trim().replace(/['"]/g, ""); continue; }
    if (trimmed.startsWith("startDate:")) { eventStartDate = trimmed.split(":")[1].trim().replace(/['"]/g, ""); continue; }
    if (trimmed.startsWith("endDate:")) { eventEndDate = trimmed.split(":")[1].trim().replace(/['"]/g, ""); continue; }
    if (trimmed.startsWith("repositories:")) { mode = "repos"; continue; }
    if (trimmed.startsWith("labels:")) { mode = "labels"; continue; }
    if (trimmed.startsWith("teams:")) { mode = "none"; continue; }
    if (trimmed.startsWith("members:")) { mode = "members"; continue; }
    if (trimmed.startsWith("scoring:") || trimmed.startsWith("weights:") || trimmed.startsWith("thresholds:")) { mode = "none"; continue; }
    if (trimmed.startsWith("-") && mode === "repos") { repos.push(trimmed.substring(1).trim().replace(/['"]/g, "")); continue; }
    if (mode === "labels" && trimmed.includes(":")) {
      const colonIdx = trimmed.lastIndexOf(":");
      const labelName = trimmed.substring(0, colonIdx).trim().replace(/['"]/g, "");
      const pts = parseInt(trimmed.substring(colonIdx + 1).trim(), 10);
      if (labelName && !isNaN(pts)) scoringLabels[labelName] = pts;
      continue;
    }
    if (trimmed.startsWith("- name:")) {
      mode = "none";
      const name = trimmed.substring("- name:".length).trim().replace(/['"]/g, "");
      currentTeam = { name, color: "#3b82f6", members: [] };
      teams.push(currentTeam);
      continue;
    }
    if (trimmed.startsWith("-") && mode === "members" && currentTeam) { currentTeam.members.push(trimmed.substring(1).trim().replace(/['"]/g, "")); continue; }
    if (trimmed.startsWith("color:") && currentTeam) { currentTeam.color = trimmed.substring("color:".length).trim().replace(/['"]/g, ""); continue; }
    if (trimmed.startsWith("highActivity:")) thresholds.highActivity = parseInt(trimmed.split(":")[1].trim(), 10);
    else if (trimmed.startsWith("mediumActivity:")) thresholds.mediumActivity = parseInt(trimmed.split(":")[1].trim(), 10);
  }

  if (repos.length === 0) repos.push("CircuitVerse/CircuitVerse", "CircuitVerse/mobile-app", "CircuitVerse/Interactive-Book", "CircuitVerse/cv-frontend-vue");
  return { eventName, organization, eventStartDate, eventEndDate, repos, scoringLabels, thresholds, teams };
}

function loadConfig(): YamlConfig {
  try {
    const configPath = path.resolve(__dirname, "..", "config.yaml");
    if (!fs.existsSync(configPath)) { console.warn("⚠️  config.yaml not found, using defaults."); return getDefaultConfig(); }
    return parseConfigYaml(fs.readFileSync(configPath, "utf-8"));
  } catch (error) { console.error("❌ Failed to parse config.yaml:", error); return getDefaultConfig(); }
}

function getDefaultConfig(): YamlConfig {
  return {
    eventName: "CircuitVerse Mergathon 2025", organization: "CircuitVerse",
    eventStartDate: "2026-05-22", eventEndDate: "2026-05-31",
    repos: ["CircuitVerse/CircuitVerse", "CircuitVerse/mobile-app", "CircuitVerse/Interactive-Book", "CircuitVerse/cv-frontend-vue"],
    scoringLabels: { "mergathon:closed-invalid": 1, "mergathon:closed-outdated": 1, "mergathon:merged": 3, "mergathon:closed-taken-over": 5 },
    thresholds: { highActivity: 10, mediumActivity: 3 },
    teams: [
      { name: "Team Alpha", color: "#3b82f6", members: ["dev-sarah", "coder-alex"] },
      { name: "Team Beta", color: "#8b5cf6", members: ["backend-mia", "docs-guru-chen"] },
    ],
  };
}

function isBot(user: { login: string; type?: string }): boolean {
  return user.login.endsWith("[bot]") || user.type === "Bot";
}

function scoreFromLabels(labels: { name: string }[], scoringLabels: Record<string, number>): number {
  let best = 0;
  for (const label of labels) {
    const pts = scoringLabels[label.name];
    if (pts !== undefined && pts > best) best = pts;
  }
  return best;
}

function generateEmptyDailyActivity(startStr: string, endStr: string): DailyActivity[] {
  const result: DailyActivity[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);
  while (current <= end) {
    result.push({ date: current.toISOString().split("T")[0], prsOpened: 0, prsMerged: 0, prsReviewed: 0, issuesOpened: 0, issuesClosed: 0, score: 0 });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function isWithinEventWindow(dateStr: string, startStr: string, endStr: string): boolean {
  const d = dateStr.split("T")[0];
  return d >= startStr && d <= endStr;
}

function getRepoFromUrl(url: string): string {
  const parts = url.replace("https://github.com/", "").split("/");
  return `${parts[0]}/${parts[1]}`;
}

// --------------- Token Pool ---------------

class TokenPool {
  private tokens: string[];
  private index = 0;

  constructor() {
    const multi = process.env.GITHUB_TOKENS ?? "";
    const single = process.env.GITHUB_TOKEN ?? "";
    this.tokens = multi
      ? multi.split(",").map((t) => t.trim()).filter(Boolean)
      : single ? [single] : [];
    if (this.tokens.length === 0) throw new Error("No GitHub token(s) configured.");
    console.log(`🔑 TokenPool initialised with ${this.tokens.length} token(s).`);
  }

  current(): string { return this.tokens[this.index]; }
  rotate(): string {
    this.index = (this.index + 1) % this.tokens.length;
    console.warn(`🔄 Rotated to token[${this.index}].`);
    return this.tokens[this.index];
  }
  get count(): number { return this.tokens.length; }
}

// --------------- fetchGithub ---------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_000;
const PERMISSIONS_ERRORS = [
  "Resource not accessible by personal access tokens",
  "Must have push access", "Must be an org member",
  "Must have admin rights", "Not Found", "Forbidden",
];

async function fetchGithub<T>(url: string, pool: TokenPool): Promise<T> {
  let attempt = 0;
  while (true) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${pool.current()}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "CircuitVerse-Mergathon-Dashboard",
      },
    });

    if (response.status === 403 || response.status === 429) {
      const body = await response.text();
      if (response.status === 403 && PERMISSIONS_ERRORS.some((msg) => body.includes(msg))) {
        throw new Error(`GitHub API Error (403) at ${url}: ${body}`);
      }
      attempt++;
      if (attempt > MAX_RETRIES) throw new Error(`Rate-limit exhausted after ${MAX_RETRIES} retries at ${url}: ${body}`);
      const retryAfter = response.headers.get("retry-after");
      const rateLimitReset = response.headers.get("x-ratelimit-reset");
      let waitMs: number;
      if (retryAfter) waitMs = parseInt(retryAfter, 10) * 1_000;
      else if (rateLimitReset) waitMs = Math.min(Math.max(0, parseInt(rateLimitReset, 10) * 1_000 - Date.now()), 60_000);
      else { const base = BASE_DELAY_MS * Math.pow(2, attempt - 1); waitMs = base + Math.random() * base * 0.4 - base * 0.2; }
      console.warn(`⚠️  ${response.status} on attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.round(waitMs / 1000)}s…`);
      if (response.status === 403 && pool.count > 1) pool.rotate();
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!response.ok) { const text = await response.text(); throw new Error(`GitHub API Error (${response.status}) at ${url}: ${text}`); }

    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");
    if (remaining !== null && parseInt(remaining, 10) < 30) {
      const sleepTime = reset ? Math.max(0, parseInt(reset, 10) * 1_000 - Date.now()) : 5_000;
      console.warn(`⚠️  Rate limit low (${remaining} left). Pausing ${Math.round(sleepTime / 1000)}s…`);
      await new Promise((r) => setTimeout(r, sleepTime));
    } else {
      await new Promise((r) => setTimeout(r, 150));
    }
    return response.json() as Promise<T>;
  }
}

// --------------- fetchUserProfile ---------------

interface GitHubUserProfile { login: string; avatar_url: string; html_url: string; name: string | null; bio: string | null; type: string; }

async function fetchUserProfile(username: string, pool: TokenPool): Promise<GitHubUserProfile | null> {
  try { return await fetchGithub<GitHubUserProfile>(`https://api.github.com/users/${encodeURIComponent(username)}`, pool); }
  catch (err: any) { console.warn(`   ⚠️  Could not fetch profile for "${username}": ${err.message}`); return null; }
}

// --------------- Live GitHub Aggregator ---------------

async function fetchLiveContributors(config: YamlConfig, pool: TokenPool): Promise<Contributor[]> {
  console.log(`🌐 Connecting to GitHub API to track ${config.organization}...`);

  const memberTeamMap = new Map<string, string>();
  for (const team of config.teams) {
    for (const member of team.members) {
      memberTeamMap.set(member.toLowerCase(), team.name);
    }
  }

  const reposSet = new Set(config.repos.map((r) => r.toLowerCase()));
  const userMap = new Map<string, Contributor>();

  const getOrCreateContributor = (username: string, avatarUrl = ""): Contributor => {
    const key = username.toLowerCase();
    if (!userMap.has(key)) {
      const teamName = memberTeamMap.get(key) ?? "Independent";
      userMap.set(key, {
        username,
        avatarUrl: avatarUrl || `https://avatars.githubusercontent.com/${username}`,
        profileUrl: `https://github.com/${username}`,
        team: teamName,
        prsOpened: 0, prsMerged: 0, prsReviewed: 0, issuesOpened: 0, issuesClosed: 0,
        score: 0, activityLevel: "Low",
        dailyActivity: generateEmptyDailyActivity(config.eventStartDate, config.eventEndDate),
        contributions: [],
      });
    }
    const item = userMap.get(key)!;
    if (avatarUrl && item.avatarUrl === `https://avatars.githubusercontent.com/${username}`) item.avatarUrl = avatarUrl;
    return item;
  };

  const { eventStartDate: startDate, eventEndDate: endDate, scoringLabels } = config;
  const processedPrsMerged = new Set<string>();
  const processedIssuesClosed = new Set<string>();
  const processedReviews = new Set<string>();

  // 1. PRs Merged
  console.log("🔍 Fetching PRs merged...");
  let page = 1;
  while (true) {
    const q = `org:${config.organization}+is:pr+is:merged+merged:${startDate}..${endDate}`;
    const data: any = await fetchGithub(`https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`, pool);
    const items = data.items || [];
    if (items.length === 0) break;
    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;
      if (processedPrsMerged.has(item.html_url)) continue;
      if (isBot(item.user)) continue;
      const pts = scoreFromLabels(item.labels || [], scoringLabels);
      if (pts === 0) continue;
      processedPrsMerged.add(item.html_url);
      const contributor = getOrCreateContributor(item.user.login, item.user.avatar_url);
      const dateStr = (item.closed_at || item.updated_at).split("T")[0];
      contributor.prsMerged++;
      contributor.score += pts;
      contributor.contributions.push({ type: "pr_merged", title: item.title, url: item.html_url, repo, date: dateStr });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) { daySlot.prsMerged++; daySlot.score += pts; }
    }
    if (items.length < 100) break;
    page++;
  }

  // 2. Issues Closed — fetch individual issue to get closed_by
  console.log("🔍 Fetching Issues closed...");
  page = 1;
  while (true) {
    const q = `org:${config.organization}+is:issue+is:closed+closed:${startDate}..${endDate}`;
    const data: any = await fetchGithub(`https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`, pool);
    const items = data.items || [];
    if (items.length === 0) break;
    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;
      if (processedIssuesClosed.has(item.html_url)) continue;
      const pts = scoreFromLabels(item.labels || [], scoringLabels);
      if (pts === 0) continue;
      processedIssuesClosed.add(item.html_url);

      let closer = item.user?.login;
      let closerAvatar = item.user?.avatar_url ?? "";
      let closerType = item.user?.type ?? "User";
      try {
        const issueNumber = item.html_url.replace("https://github.com/", "").split("/")[3];
        const fullIssue: any = await fetchGithub(`https://api.github.com/repos/${repo}/issues/${issueNumber}`, pool);
        if (fullIssue.closed_by?.login) {
          closer = fullIssue.closed_by.login;
          closerAvatar = fullIssue.closed_by.avatar_url ?? closerAvatar;
          closerType = fullIssue.closed_by.type ?? "User";
        }
      } catch (err: any) {
        console.warn(`   ⚠️  Could not fetch full issue for ${item.html_url}: ${err.message}`);
      }

      if (!closer) continue;
      if (isBot({ login: closer, type: closerType })) continue;

      const contributor = getOrCreateContributor(closer, closerAvatar);
      const dateStr = (item.closed_at || item.updated_at).split("T")[0];
      contributor.issuesClosed++;
      contributor.score += pts;
      contributor.contributions.push({ type: "issue_closed", title: item.title, url: item.html_url, repo, date: dateStr });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) { daySlot.issuesClosed++; daySlot.score += pts; }
    }
    if (items.length < 100) break;
    page++;
  }

  // 3. PR Reviews — skip bots
  console.log("🔍 Fetching PR reviews...");
  const activePRs = Array.from(processedPrsMerged);
  for (const prUrl of activePRs) {
    try {
      const repo = getRepoFromUrl(prUrl);
      const prNumber = prUrl.replace("https://github.com/", "").split("/")[3];
      const reviews: any[] = await fetchGithub(`https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`, pool);
      for (const review of reviews) {
        if (!review.user) continue;
        if (isBot(review.user)) continue;
        const reviewer = review.user.login;
        const submittedDateStr = review.submitted_at ? review.submitted_at.split("T")[0] : null;
        if (!submittedDateStr || !isWithinEventWindow(submittedDateStr, startDate, endDate)) continue;
        const reviewKey = `${prUrl}-${reviewer}-${review.id}`;
        if (processedReviews.has(reviewKey)) continue;
        processedReviews.add(reviewKey);
        const pts = scoringLabels["mergathon:merged"] ?? 3;
        const contributor = getOrCreateContributor(reviewer, review.user.avatar_url);
        contributor.prsReviewed++;
        contributor.score += pts;
        contributor.contributions.push({ type: "pr_reviewed", title: `Reviewed PR #${prNumber}`, url: prUrl, repo, date: submittedDateStr });
        const daySlot = contributor.dailyActivity.find((d) => d.date === submittedDateStr);
        if (daySlot) { daySlot.prsReviewed++; daySlot.score += pts; }
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Couldn't fetch reviews for PR ${prUrl}:`, err.message || err);
    }
  }

  // 4. Fetch live profiles — skip bots
  console.log("👤 Fetching GitHub user profiles...");
  for (const [, contributor] of userMap.entries()) {
    const profile = await fetchUserProfile(contributor.username, pool);
    if (profile) {
      if (isBot(profile)) { userMap.delete(contributor.username.toLowerCase()); continue; }
      contributor.avatarUrl = profile.avatar_url;
      contributor.profileUrl = profile.html_url;
      (contributor as any).displayName = profile.name ?? contributor.username;
      (contributor as any).bio = profile.bio ?? "";
    }
  }

  // 5. Finalize
  console.log("📊 Finalizing contributor calculations...");
  const contributors = Array.from(userMap.values());
  for (const c of contributors) {
    c.activityLevel = c.score >= config.thresholds.highActivity ? "High" : c.score >= config.thresholds.mediumActivity ? "Medium" : "Low";
    c.contributions.sort((a, b) => b.date.localeCompare(a.date));
  }
  return contributors;
}

// --------------- Mock Fallback ---------------

function generateMockData(config: YamlConfig): Contributor[] {
  console.warn("⚠️  GITHUB_TOKEN missing. Generating mock simulation data.");
  const contributors: Contributor[] = [];
  const start = new Date(config.eventStartDate);
  const end = new Date(config.eventEndDate);
  const repos = config.repos;
  const labelKeys = Object.keys(config.scoringLabels);
  const prTitles = ["Fix simulator canvas rendering","Add dark mode support","Optimize truth table generation","Add PDF/PNG export support","Implement search filtration","Refactor sequential logic","Add internationalization support","Fix memory threshold limits","Upgrade Next.js dependencies","Improve test coverage","Add custom clock timing","Fix touch viewport bugs"];
  const issueTitles = ["Simulator UI freeze on large circuits","Dark mode low contrast margins","Subcircuit inputs fail state updates","Interactive book sandbox 404 error","Touch gate drag snaps misaligned","Full-screen mode overlaps panels","API endpoints timeout on deep feeds","Add keyboard map guides"];

  let userIdx = 0;
  for (const team of config.teams) {
    for (const username of team.members) {
      let targetScore = 3 + Math.floor(Math.random() * 5);
      if (userIdx === 0) targetScore = 25;
      else if (userIdx === 1) targetScore = 18;
      else if (userIdx === 2) targetScore = 13;
      else if (userIdx === 3) targetScore = 9;
      else if (userIdx === 4) targetScore = 6;
      userIdx++;

      const dailyActivity = generateEmptyDailyActivity(config.eventStartDate, config.eventEndDate);
      const contributions: ContributionItem[] = [];
      let prsOpened = 0, prsMerged = 0, prsReviewed = 0, issuesOpened = 0, issuesClosed = 0, score = 0;

      while (score < targetScore) {
        const labelName = labelKeys[Math.floor(Math.random() * labelKeys.length)];
        const pts = config.scoringLabels[labelName];
        const rand = Math.random();
        let type: ContributionItem["type"];
        if (rand < 0.4) { type = "pr_merged"; prsMerged++; }
        else if (rand < 0.6) { type = "pr_opened"; prsOpened++; }
        else if (rand < 0.75) { type = "pr_reviewed"; prsReviewed++; }
        else if (rand < 0.88) { type = "issue_closed"; issuesClosed++; }
        else { type = "issue_opened"; issuesOpened++; }

        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
        const eventDate = new Date(start);
        eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * (daysDiff + 1)));
        const dateStr = eventDate.toISOString().split("T")[0];
        const daySlot = dailyActivity.find((d) => d.date === dateStr);
        if (daySlot) {
          if (type === "pr_opened") daySlot.prsOpened++;
          else if (type === "pr_merged") daySlot.prsMerged++;
          else if (type === "pr_reviewed") daySlot.prsReviewed++;
          else if (type === "issue_opened") daySlot.issuesOpened++;
          else if (type === "issue_closed") daySlot.issuesClosed++;
          daySlot.score += pts;
        }
        const repo = repos[Math.floor(Math.random() * repos.length)];
        const isPr = type.startsWith("pr_");
        const title = `[${labelName}] ${isPr ? prTitles[Math.floor(Math.random() * prTitles.length)] : issueTitles[Math.floor(Math.random() * issueTitles.length)]}`;
        const itemNum = Math.floor(Math.random() * 280) + 1;
        contributions.push({ type, title, url: `https://github.com/${repo}/${isPr ? "pull" : "issues"}/${itemNum}`, repo, date: dateStr });
        score += pts;
      }

      contributions.sort((a, b) => b.date.localeCompare(a.date));
      contributors.push({
        username, avatarUrl: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 1200000) + 4000000}?v=4`,
        profileUrl: `https://github.com/${username}`, team: team.name,
        prsOpened, prsMerged, prsReviewed, issuesOpened, issuesClosed, score,
        activityLevel: score >= config.thresholds.highActivity ? "High" : score >= config.thresholds.mediumActivity ? "Medium" : "Low",
        dailyActivity, contributions,
      });
    }
  }
  return contributors;
}

async function fetchGithubTeams(config: YamlConfig, pool: TokenPool): Promise<{ name: string; color: string; members: string[] }[]> {
  console.log(`👥 Fetching teams from GitHub org: "${config.organization}"...`);
  const teamsResponse = await fetchGithub<any[]>(`https://api.github.com/orgs/${config.organization}/teams?per_page=100`, pool);
  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4", "#f43f5e"];
  const githubTeams: { name: string; color: string; members: string[] }[] = [];
  if (Array.isArray(teamsResponse)) {
    for (let i = 0; i < teamsResponse.length; i++) {
      const { slug, name } = teamsResponse[i];
      try {
        const membersResponse = await fetchGithub<any[]>(`https://api.github.com/orgs/${config.organization}/teams/${slug}/members?per_page=100`, pool);
        if (Array.isArray(membersResponse)) {
          githubTeams.push({ name, color: colors[i % colors.length], members: membersResponse.map((m: any) => m.login) });
          console.log(`   ✅ "${name}": ${membersResponse.length} members`);
        }
      } catch (err: any) { console.warn(`   ⚠️  Failed to fetch members for "${slug}": ${err.message}`); }
    }
  }
  return githubTeams;
}

// --------------- Main ---------------

async function main(): Promise<void> {
  console.log("🚀 Initializing Mergathon dashboard builder...");
  const config = loadConfig();
  console.log(`🏷️  Scoring labels: ${JSON.stringify(config.scoringLabels)}`);
  let contributors: Contributor[] = [];
  let pool: TokenPool | null = null;

  try { pool = new TokenPool(); }
  catch { console.log("💡 No GITHUB_TOKEN(s) configured. Running mock generator..."); contributors = generateMockData(config); }

  if (pool) {
    try {
      const fetchedTeams = await fetchGithubTeams(config, pool);
      if (fetchedTeams.length > 0) { console.log(`✅ Loaded ${fetchedTeams.length} teams from GitHub Org.`); config.teams = fetchedTeams; }
      else console.log("💡 No org teams returned — using config.yaml roster.");
    } catch (err: any) { console.warn(`⚠️  GitHub Org Teams fetch failed: ${err.message}. Falling back to config.yaml.`); }

    try {
      contributors = await fetchLiveContributors(config, pool);
      console.log(`✅ Live data aggregated (${contributors.length} contributors).`);
    } catch (err: any) {
      console.error("❌ Live fetch failed:", err.message);
      console.log("🔄 Falling back to mock data.");
      contributors = generateMockData(config);
    }
  }

  const teams: Team[] = config.teams.map((t) => {
    const members = contributors.filter((c) => t.members.map((m) => m.toLowerCase()).includes(c.username.toLowerCase()));
    return { name: t.name, color: t.color, members: t.members,
      totalScore: members.reduce((s, m) => s + m.score, 0),
      totalPrsMerged: members.reduce((s, m) => s + m.prsMerged, 0),
      totalPrsOpened: members.reduce((s, m) => s + m.prsOpened, 0),
      totalPrsReviewed: members.reduce((s, m) => s + m.prsReviewed, 0),
      totalIssuesClosed: members.reduce((s, m) => s + m.issuesClosed, 0),
      totalIssuesOpened: members.reduce((s, m) => s + m.issuesOpened, 0),
    };
  });

  const independents = contributors.filter((c) => c.team === "Independent" && c.score > 0);
  if (independents.length > 0) {
    teams.push({
      name: "Independent",
      color: "#6b7280",
      members: independents.map((c) => c.username),
      totalScore: independents.reduce((s, m) => s + m.score, 0),
      totalPrsMerged: independents.reduce((s, m) => s + m.prsMerged, 0),
      totalPrsOpened: independents.reduce((s, m) => s + m.prsOpened, 0),
      totalPrsReviewed: independents.reduce((s, m) => s + m.prsReviewed, 0),
      totalIssuesClosed: independents.reduce((s, m) => s + m.issuesClosed, 0),
      totalIssuesOpened: independents.reduce((s, m) => s + m.issuesOpened, 0),
    });
  }

  const dateMap = new Map<string, DailyActivity>();
  for (const c of contributors) {
    for (const d of c.dailyActivity) {
      const e = dateMap.get(d.date) ?? { date: d.date, prsOpened: 0, prsMerged: 0, prsReviewed: 0, issuesOpened: 0, issuesClosed: 0, score: 0 };
      e.prsOpened += d.prsOpened; e.prsMerged += d.prsMerged; e.prsReviewed += d.prsReviewed;
      e.issuesOpened += d.issuesOpened; e.issuesClosed += d.issuesClosed; e.score += d.score;
      dateMap.set(d.date, e);
    }
  }
  const dailyTotals = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const now = new Date(), start = new Date(config.eventStartDate), end = new Date(config.eventEndDate);
  const msPerDay = 86_400_000;
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1;
  const daysElapsed = Math.max(0, Math.min(Math.ceil((now.getTime() - start.getTime()) / msPerDay), totalDays));
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / msPerDay));

  const stats: EventStats = {
    totalContributors: contributors.filter((c) => c.score > 0).length || contributors.length,
    totalPrsMerged: contributors.reduce((s, c) => s + c.prsMerged, 0),
    totalPrsOpened: contributors.reduce((s, c) => s + c.prsOpened, 0),
    totalIssuesClosed: contributors.reduce((s, c) => s + c.issuesClosed, 0),
    totalIssuesOpened: contributors.reduce((s, c) => s + c.issuesOpened, 0),
    totalPrsReviewed: contributors.reduce((s, c) => s + c.prsReviewed, 0),
    daysElapsed, daysRemaining,
  };

  const data: MergathonData = {
    lastUpdated: new Date().toISOString(),
    eventStartDate: config.eventStartDate, eventEndDate: config.eventEndDate,
    stats, teams, contributors: contributors.sort((a, b) => b.score - a.score), dailyTotals,
  };

  const outDir = path.resolve(__dirname, "..", "public", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "mergathon-data.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Leaderboard data saved → ${outPath}`);
}

main().catch((err) => { console.error("❌ Fatal crash:", err); process.exit(1); });
