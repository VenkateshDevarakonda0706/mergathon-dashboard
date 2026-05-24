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
  scoringWeights: {
    prMerged: number;
    prOpened: number;
    prReviewed: number;
    issueClosed: number;
    issueOpened: number;
  };
  thresholds: {
    highActivity: number;
    mediumActivity: number;
  };
  teams: { name: string; color: string; members: string[] }[];
}

function parseConfigYaml(content: string): YamlConfig {
  const lines = content.split(/\r?\n/);
  let eventName = "CircuitVerse Mergathon 2025";
  let organization = "CircuitVerse";
  let eventStartDate = "2025-05-22";
  let eventEndDate = "2025-05-25";
  const repos: string[] = [];
  const scoringWeights = { prMerged: 10, prOpened: 5, prReviewed: 3, issueClosed: 4, issueOpened: 2 };
  const thresholds = { highActivity: 100, mediumActivity: 50 };
  const teams: { name: string; color: string; members: string[] }[] = [];
  let currentTeam: any = null;
  let mode: "none" | "repos" | "members" = "none";

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
    if (trimmed.startsWith("teams:")) { mode = "none"; continue; }
    if (trimmed.startsWith("members:")) { mode = "members"; continue; }
    if (trimmed.startsWith("-") && mode === "repos") { repos.push(trimmed.substring(1).trim().replace(/['"]/g, "")); continue; }
    if (trimmed.startsWith("- name:")) {
      mode = "none";
      const name = trimmed.substring("- name:".length).trim().replace(/['"]/g, "");
      currentTeam = { name, color: "#3b82f6", members: [] };
      teams.push(currentTeam);
      continue;
    }
    if (trimmed.startsWith("-") && mode === "members" && currentTeam) { currentTeam.members.push(trimmed.substring(1).trim().replace(/['"]/g, "")); continue; }
    if (trimmed.startsWith("color:") && currentTeam) { currentTeam.color = trimmed.substring("color:".length).trim().replace(/['"]/g, ""); continue; }
    if (trimmed.startsWith("prMerged:")) scoringWeights.prMerged = parseInt(trimmed.split(":")[1].trim(), 10);
    else if (trimmed.startsWith("prOpened:")) scoringWeights.prOpened = parseInt(trimmed.split(":")[1].trim(), 10);
    else if (trimmed.startsWith("prReviewed:")) scoringWeights.prReviewed = parseInt(trimmed.split(":")[1].trim(), 10);
    else if (trimmed.startsWith("issueClosed:")) scoringWeights.issueClosed = parseInt(trimmed.split(":")[1].trim(), 10);
    else if (trimmed.startsWith("issueOpened:")) scoringWeights.issueOpened = parseInt(trimmed.split(":")[1].trim(), 10);
    else if (trimmed.startsWith("highActivity:")) thresholds.highActivity = parseInt(trimmed.split(":")[1].trim(), 10);
    else if (trimmed.startsWith("mediumActivity:")) thresholds.mediumActivity = parseInt(trimmed.split(":")[1].trim(), 10);
  }

  if (repos.length === 0) repos.push("CircuitVerse/CircuitVerse", "CircuitVerse/mobile-app", "CircuitVerse/Interactive-Book", "CircuitVerse/cv-frontend-vue");
  return { eventName, organization, eventStartDate, eventEndDate, repos, scoringWeights, thresholds, teams };
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
    eventStartDate: "2025-05-22", eventEndDate: "2025-05-25",
    repos: ["CircuitVerse/CircuitVerse", "CircuitVerse/mobile-app", "CircuitVerse/Interactive-Book", "CircuitVerse/cv-frontend-vue"],
    scoringWeights: { prMerged: 10, prOpened: 5, prReviewed: 3, issueClosed: 4, issueOpened: 2 },
    thresholds: { highActivity: 100, mediumActivity: 50 },
    teams: [
      { name: "Team Alpha", color: "#3b82f6", members: ["dev-sarah", "coder-alex"] },
      { name: "Team Beta", color: "#8b5cf6", members: ["backend-mia", "docs-guru-chen"] },
    ],
  };
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

// --------------- fetchGithub (fixed 403 handling) ---------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_000;

const PERMISSIONS_ERRORS = [
  "Resource not accessible by personal access tokens",
  "Must have push access",
  "Must be an org member",
  "Must have admin rights",
  "Not Found",
  "Forbidden",
];

async function fetchGithub<T>(url: string, pool: TokenPool): Promise<T> {
  let attempt = 0;

  while (true) {
    const token = pool.current();
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "CircuitVerse-Mergathon-Dashboard",
      },
    });

    if (response.status === 403 || response.status === 429) {
      const body = await response.text();

      // Permissions 403 — don't retry, throw immediately so caller can skip
      if (
        response.status === 403 &&
        PERMISSIONS_ERRORS.some((msg) => body.includes(msg))
      ) {
        throw new Error(`GitHub API Error (403) at ${url}: ${body}`);
      }

      // Rate-limit 403/429 — backoff + rotate
      attempt++;
      if (attempt > MAX_RETRIES) {
        throw new Error(`GitHub API rate-limit exhausted after ${MAX_RETRIES} retries at ${url}: ${body}`);
      }

      const retryAfter = response.headers.get("retry-after");
      const rateLimitReset = response.headers.get("x-ratelimit-reset");

      let waitMs: number;
      if (retryAfter) {
        waitMs = parseInt(retryAfter, 10) * 1_000;
      } else if (rateLimitReset) {
        // Cap wait at 60s max — if it's a permissions error mis-classified,
        // we don't want to hang forever
        waitMs = Math.min(
          Math.max(0, parseInt(rateLimitReset, 10) * 1_000 - Date.now()),
          60_000
        );
      } else {
        const base = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        waitMs = base + Math.random() * base * 0.4 - base * 0.2;
      }

      console.warn(`⚠️  ${response.status} on attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.round(waitMs / 1000)}s…`);
      if (response.status === 403 && pool.count > 1) pool.rotate();
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API Error (${response.status}) at ${url}: ${text}`);
    }

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

interface GitHubUserProfile {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
}

async function fetchUserProfile(username: string, pool: TokenPool): Promise<GitHubUserProfile | null> {
  try {
    return await fetchGithub<GitHubUserProfile>(`https://api.github.com/users/${encodeURIComponent(username)}`, pool);
  } catch (err: any) {
    console.warn(`   ⚠️  Could not fetch profile for "${username}": ${err.message}`);
    return null;
  }
}

// --------------- Live GitHub Aggregator ---------------

async function fetchLiveContributors(config: YamlConfig, pool: TokenPool): Promise<Contributor[]> {
  console.log(`🌐 Connecting to GitHub API to track ${config.organization}...`);

  const registeredUsers = new Set(config.teams.flatMap((t) => t.members.map((m) => m.toLowerCase())));
  const reposSet = new Set(config.repos.map((r) => r.toLowerCase()));
  const userMap = new Map<string, Contributor>();

  const getOrCreateContributor = (username: string, avatarUrl = ""): Contributor => {
    const key = username.toLowerCase();
    if (!userMap.has(key)) {
      const teamObj = config.teams.find((t) => t.members.map((m) => m.toLowerCase()).includes(key));
      userMap.set(key, {
        username,
        avatarUrl: avatarUrl || `https://avatars.githubusercontent.com/${username}`,
        profileUrl: `https://github.com/${username}`,
        team: teamObj ? teamObj.name : "Independent",
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

  for (const team of config.teams)
    for (const member of team.members)
      getOrCreateContributor(member);

  console.log("👤 Fetching GitHub user profiles for registered members...");
  for (const [, contributor] of userMap.entries()) {
    const profile = await fetchUserProfile(contributor.username, pool);
    if (profile) {
      contributor.avatarUrl = profile.avatar_url;
      contributor.profileUrl = profile.html_url;
      (contributor as any).displayName = profile.name ?? contributor.username;
      (contributor as any).bio = profile.bio ?? "";
    }
  }

  const { eventStartDate: startDate, eventEndDate: endDate } = config;
  const processedPrsOpened = new Set<string>();
  const processedPrsMerged = new Set<string>();
  const processedIssuesOpened = new Set<string>();
  const processedIssuesClosed = new Set<string>();
  const processedReviews = new Set<string>();

  // 1. PRs Opened
  console.log("🔍 Fetching PRs opened...");
  let page = 1;
  while (true) {
    const q = `org:${config.organization}+is:pr+created:${startDate}..${endDate}`;
    const data: any = await fetchGithub(`https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`, pool);
    const items = data.items || [];
    if (items.length === 0) break;
    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;
      const author = item.user.login;
      if (!registeredUsers.has(author.toLowerCase())) continue;
      if (processedPrsOpened.has(item.html_url)) continue;
      processedPrsOpened.add(item.html_url);
      const contributor = getOrCreateContributor(author, item.user.avatar_url);
      const dateStr = item.created_at.split("T")[0];
      contributor.prsOpened++;
      contributor.contributions.push({ type: "pr_opened", title: item.title, url: item.html_url, repo, date: dateStr });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) daySlot.prsOpened++;
    }
    if (items.length < 100) break;
    page++;
  }

  // 2. PRs Merged
  console.log("🔍 Fetching PRs merged...");
  page = 1;
  while (true) {
    const q = `org:${config.organization}+is:pr+is:merged+merged:${startDate}..${endDate}`;
    const data: any = await fetchGithub(`https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`, pool);
    const items = data.items || [];
    if (items.length === 0) break;
    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;
      const author = item.user.login;
      if (!registeredUsers.has(author.toLowerCase())) continue;
      if (processedPrsMerged.has(item.html_url)) continue;
      processedPrsMerged.add(item.html_url);
      const contributor = getOrCreateContributor(author, item.user.avatar_url);
      const dateStr = (item.closed_at || item.updated_at).split("T")[0];
      contributor.prsMerged++;
      contributor.contributions.push({ type: "pr_merged", title: item.title, url: item.html_url, repo, date: dateStr });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) daySlot.prsMerged++;
    }
    if (items.length < 100) break;
    page++;
  }

  // 3. Issues Opened
  console.log("🔍 Fetching Issues opened...");
  page = 1;
  while (true) {
    const q = `org:${config.organization}+is:issue+created:${startDate}..${endDate}`;
    const data: any = await fetchGithub(`https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`, pool);
    const items = data.items || [];
    if (items.length === 0) break;
    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;
      const author = item.user.login;
      if (!registeredUsers.has(author.toLowerCase())) continue;
      if (processedIssuesOpened.has(item.html_url)) continue;
      processedIssuesOpened.add(item.html_url);
      const contributor = getOrCreateContributor(author, item.user.avatar_url);
      const dateStr = item.created_at.split("T")[0];
      contributor.issuesOpened++;
      contributor.contributions.push({ type: "issue_opened", title: item.title, url: item.html_url, repo, date: dateStr });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) daySlot.issuesOpened++;
    }
    if (items.length < 100) break;
    page++;
  }

  // 4. Issues Closed
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
      const assigneeObj = item.assignee;
      if (!assigneeObj) continue;
      const author = assigneeObj.login;
      if (!registeredUsers.has(author.toLowerCase())) continue;
      if (processedIssuesClosed.has(item.html_url)) continue;
      processedIssuesClosed.add(item.html_url);
      const contributor = getOrCreateContributor(author, assigneeObj.avatar_url);
      const dateStr = (item.closed_at || item.updated_at).split("T")[0];
      contributor.issuesClosed++;
      contributor.contributions.push({ type: "issue_closed", title: item.title, url: item.html_url, repo, date: dateStr });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) daySlot.issuesClosed++;
    }
    if (items.length < 100) break;
    page++;
  }

  // 5. PR Reviews
  console.log("🔍 Fetching PR reviews...");
  const activePRs = Array.from(new Set([...processedPrsOpened, ...processedPrsMerged]));
  for (const prUrl of activePRs) {
    try {
      const repo = getRepoFromUrl(prUrl);
      const prNumber = prUrl.replace("https://github.com/", "").split("/")[3];
      const reviews: any[] = await fetchGithub(`https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`, pool);
      for (const review of reviews) {
        if (!review.user || !registeredUsers.has(review.user.login.toLowerCase())) continue;
        const reviewer = review.user.login;
        const submittedDateStr = review.submitted_at ? review.submitted_at.split("T")[0] : null;
        if (!submittedDateStr || !isWithinEventWindow(submittedDateStr, startDate, endDate)) continue;
        const reviewKey = `${prUrl}-${reviewer}-${review.id}`;
        if (processedReviews.has(reviewKey)) continue;
        processedReviews.add(reviewKey);
        const contributor = getOrCreateContributor(reviewer, review.user.avatar_url);
        contributor.prsReviewed++;
        contributor.contributions.push({ type: "pr_reviewed", title: `Reviewed Pull Request #${prNumber}`, url: prUrl, repo, date: submittedDateStr });
        const daySlot = contributor.dailyActivity.find((d) => d.date === submittedDateStr);
        if (daySlot) daySlot.prsReviewed++;
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Couldn't fetch reviews for PR ${prUrl}:`, err.message || err);
    }
  }

  // 6. Compute scores
  console.log("📊 Finalizing contributor calculations...");
  const contributors = Array.from(userMap.values());
  for (const c of contributors) {
    c.score =
      c.prsMerged * config.scoringWeights.prMerged +
      c.prsOpened * config.scoringWeights.prOpened +
      c.prsReviewed * config.scoringWeights.prReviewed +
      c.issuesClosed * config.scoringWeights.issueClosed +
      c.issuesOpened * config.scoringWeights.issueOpened;
    for (const d of c.dailyActivity) {
      d.score =
        d.prsMerged * config.scoringWeights.prMerged +
        d.prsOpened * config.scoringWeights.prOpened +
        d.prsReviewed * config.scoringWeights.prReviewed +
        d.issuesClosed * config.scoringWeights.issueClosed +
        d.issuesOpened * config.scoringWeights.issueOpened;
    }
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
  const prTitles = ["Fix simulator canvas rendering in high-DPI screens","Add dark mode support to interactive book docs","Optimize truth table generation gate recursion","Add PDF/PNG export support in simulator layout","Implement search filtration in contributor table","Refactor sequential logic flip-flop simulation","Add internationalization support for Hindi/Spanish","Fix memory threshold limits in gate drag listeners","Upgrade Next.js framework build dependencies","Improve test coverage metrics in canvas component","Add custom clock timing constraints in settings","Fix touch viewport alignment bugs on iOS Chrome"];
  const issueTitles = ["Simulator UI freeze on large recursive circuit runs","Dark mode style sheets have low contrast margins","Subcircuit inputs fail to trigger state updates","Interactive book sandbox returns 404 console error","Touch gate drag and drop snaps misaligned in view","Full-screen simulator mode overlaps notification panels","API endpoints timeout when reading deep historical feeds","Add keyboard map guides in drawer toggle panel"];

  let userIdx = 0;
  for (const team of config.teams) {
    for (const username of team.members) {
      let targetScore = 30 + Math.floor(Math.random() * 40);
      if (userIdx === 0) targetScore = 215;
      else if (userIdx === 1) targetScore = 175;
      else if (userIdx === 2) targetScore = 135;
      else if (userIdx === 3) targetScore = 95;
      else if (userIdx === 4) targetScore = 65;
      userIdx++;

      const dailyActivity = generateEmptyDailyActivity(config.eventStartDate, config.eventEndDate);
      const contributions: ContributionItem[] = [];
      let prsOpened = 0, prsMerged = 0, prsReviewed = 0, issuesOpened = 0, issuesClosed = 0, currentScore = 0;

      while (currentScore < targetScore) {
        const rand = Math.random();
        let type: ContributionItem["type"]; let pts = 0;
        if (rand < 0.25) { type = "pr_merged"; pts = config.scoringWeights.prMerged; prsMerged++; }
        else if (rand < 0.48) { type = "pr_opened"; pts = config.scoringWeights.prOpened; prsOpened++; }
        else if (rand < 0.70) { type = "pr_reviewed"; pts = config.scoringWeights.prReviewed; prsReviewed++; }
        else if (rand < 0.85) { type = "issue_closed"; pts = config.scoringWeights.issueClosed; issuesClosed++; }
        else { type = "issue_opened"; pts = config.scoringWeights.issueOpened; issuesOpened++; }

        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
        const eventDate = new Date(start);
        eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * (daysDiff + 1)));
        const eventDateStr = eventDate.toISOString().split("T")[0];
        const daySlot = dailyActivity.find((d) => d.date === eventDateStr);
        if (daySlot) {
          if (type === "pr_opened") daySlot.prsOpened++;
          else if (type === "pr_merged") daySlot.prsMerged++;
          else if (type === "pr_reviewed") daySlot.prsReviewed++;
          else if (type === "issue_opened") daySlot.issuesOpened++;
          else if (type === "issue_closed") daySlot.issuesClosed++;
        }
        const repo = repos[Math.floor(Math.random() * repos.length)];
        const isPr = type.startsWith("pr_");
        const title = isPr ? `[PR] ${prTitles[Math.floor(Math.random() * prTitles.length)]}` : `[Issue] ${issueTitles[Math.floor(Math.random() * issueTitles.length)]}`;
        const itemNum = Math.floor(Math.random() * 280) + 1;
        contributions.push({ type, title, url: isPr ? `https://github.com/${repo}/pull/${itemNum}` : `https://github.com/${repo}/issues/${itemNum}`, repo, date: eventDateStr });
        currentScore += pts;
      }

      const score = prsMerged * config.scoringWeights.prMerged + prsOpened * config.scoringWeights.prOpened + prsReviewed * config.scoringWeights.prReviewed + issuesClosed * config.scoringWeights.issueClosed + issuesOpened * config.scoringWeights.issueOpened;
      for (const d of dailyActivity) { d.score = d.prsMerged * config.scoringWeights.prMerged + d.prsOpened * config.scoringWeights.prOpened + d.prsReviewed * config.scoringWeights.prReviewed + d.issuesClosed * config.scoringWeights.issueClosed + d.issuesOpened * config.scoringWeights.issueOpened; }
      contributions.sort((a, b) => b.date.localeCompare(a.date));
      contributors.push({ username, avatarUrl: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 1200000) + 4000000}?v=4`, profileUrl: `https://github.com/${username}`, team: team.name, prsOpened, prsMerged, prsReviewed, issuesOpened, issuesClosed, score, activityLevel: score >= config.thresholds.highActivity ? "High" : score >= config.thresholds.mediumActivity ? "Medium" : "Low", dailyActivity, contributions });
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
      } catch (err: any) {
        console.warn(`   ⚠️  Failed to fetch members for "${slug}": ${err.message}`);
      }
    }
  }
  return githubTeams;
}

// --------------- Main ---------------

async function main(): Promise<void> {
  console.log("🚀 Initializing Mergathon dashboard builder...");
  const config = loadConfig();
  let contributors: Contributor[] = [];
  let pool: TokenPool | null = null;

  try {
    pool = new TokenPool();
  } catch {
    console.log("💡 No GITHUB_TOKEN(s) configured. Running mock generator...");
    contributors = generateMockData(config);
  }

  if (pool) {
    try {
      const fetchedTeams = await fetchGithubTeams(config, pool);
      if (fetchedTeams.length > 0) { console.log(`✅ Loaded ${fetchedTeams.length} teams from GitHub Org.`); config.teams = fetchedTeams; }
      else console.log("💡 No org teams returned — using config.yaml roster.");
    } catch (err: any) {
      console.warn(`⚠️  GitHub Org Teams fetch failed: ${err.message}. Falling back to config.yaml.`);
    }

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
    return { name: t.name, color: t.color, members: t.members, totalScore: members.reduce((s, m) => s + m.score, 0), totalPrsMerged: members.reduce((s, m) => s + m.prsMerged, 0), totalPrsOpened: members.reduce((s, m) => s + m.prsOpened, 0), totalPrsReviewed: members.reduce((s, m) => s + m.prsReviewed, 0), totalIssuesClosed: members.reduce((s, m) => s + m.issuesClosed, 0), totalIssuesOpened: members.reduce((s, m) => s + m.issuesOpened, 0) };
  });

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
    stats, teams,
    contributors: contributors.sort((a, b) => b.score - a.score),
    dailyTotals,
  };

  const outDir = path.resolve(__dirname, "..", "public", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "mergathon-data.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Leaderboard data saved → ${outPath}`);
}

main().catch((err) => { console.error("❌ Fatal crash:", err); process.exit(1); });
