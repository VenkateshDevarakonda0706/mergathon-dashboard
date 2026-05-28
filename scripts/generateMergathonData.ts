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
  closedLabels: Record<string, number>;
  mergedLabels: Record<string, number>;
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
  const closedLabels: Record<string, number> = {
    "mergathon:closed-outdated": 1,
    "mergathon:closed-taken-over": 1,
    "mergathon:closed-invalid": 1,
  };
  const mergedLabels: Record<string, number> = {
    "mergathon:merged": 3,
  };
  const thresholds = { highActivity: 10, mediumActivity: 3 };
  const teams: { name: string; color: string; members: string[] }[] = [];
  let currentTeam: any = null;
  // labelSubSection tracks which sub-map is active under "labels:"
  let mode: "none" | "repos" | "members" | "labels-closed" | "labels-merged" = "none";

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
    // Nested label sub-sections
    if (trimmed === "closed:") { mode = "labels-closed"; continue; }
    if (trimmed === "merged:") { mode = "labels-merged"; continue; }
    // "labels:" line itself just signals we are inside the labels block; sub-section lines follow
    if (trimmed.startsWith("labels:")) { continue; }
    if (trimmed.startsWith("teams:")) { mode = "none"; continue; }
    if (trimmed.startsWith("members:")) { mode = "members"; continue; }
    if (trimmed.startsWith("scoring:") || trimmed.startsWith("weights:") || trimmed.startsWith("thresholds:")) { mode = "none"; continue; }
    if (trimmed.startsWith("-") && mode === "repos") { repos.push(trimmed.substring(1).trim().replace(/['"]/g, "")); continue; }
    if ((mode === "labels-closed" || mode === "labels-merged") && trimmed.includes(":")) {
      const colonIdx = trimmed.lastIndexOf(":");
      const labelName = trimmed.substring(0, colonIdx).trim().replace(/['"]/g, "");
      const pts = parseInt(trimmed.substring(colonIdx + 1).trim(), 10);
      if (labelName && !isNaN(pts)) {
        if (mode === "labels-closed") closedLabels[labelName] = pts;
        else mergedLabels[labelName] = pts;
      }
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
  return { eventName, organization, eventStartDate, eventEndDate, repos, closedLabels, mergedLabels, thresholds, teams };
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
    closedLabels: { "mergathon:closed-outdated": 1, "mergathon:closed-taken-over": 1, "mergathon:closed-invalid": 1 },
    mergedLabels: { "mergathon:merged": 3 },
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

function hasMatchingLabel(labels: { name: string }[], configLabels: Record<string, number>): boolean {
  return labels.some(label => label.name in configLabels);
}

function generateEmptyDailyActivity(startStr: string, endStr: string): DailyActivity[] {
  const result: DailyActivity[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);
  while (current <= end) {
    result.push({ date: current.toISOString().split("T")[0], prsOpened: 0, prsMerged: 0, issuesOpened: 0, issuesClosed: 0, score: 0 });
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

// --------------- REST fetchGithub (kept for fetchGithubTeams) ---------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_000;
const PERMISSIONS_ERRORS = [
  "Resource not accessible by personal access tokens",
  "Resource not accessible by personal access token",
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
    if (remaining !== null && parseInt(remaining, 10) < 3) {
      const sleepTime = reset ? Math.max(0, parseInt(reset, 10) * 1_000 - Date.now()) : 5_000;
      console.warn(`⚠️  Rate limit low (${remaining} left). Pausing ${Math.round(sleepTime / 1000)}s…`);
      await new Promise((r) => setTimeout(r, sleepTime));
    } else {
      await new Promise((r) => setTimeout(r, 150));
    }
    return response.json() as Promise<T>;
  }
}

// --------------- GraphQL Fetcher ---------------

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

async function fetchGraphQL<T>(query: string, variables: Record<string, unknown>, pool: TokenPool): Promise<T> {
  let attempt = 0;
  while (true) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pool.current()}`,
        "Content-Type": "application/json",
        "User-Agent": "CircuitVerse-Mergathon-Dashboard",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (response.status === 403 || response.status === 429) {
      attempt++;
      if (attempt > MAX_RETRIES) {
        const body = await response.text();
        throw new Error(`GraphQL rate-limit exhausted after ${MAX_RETRIES} retries: ${body}`);
      }
      const retryAfter = response.headers.get("retry-after");
      const rateLimitReset = response.headers.get("x-ratelimit-reset");
      let waitMs: number;
      if (retryAfter) waitMs = parseInt(retryAfter, 10) * 1_000;
      else if (rateLimitReset) waitMs = Math.min(Math.max(0, parseInt(rateLimitReset, 10) * 1_000 - Date.now()), 60_000);
      else { const base = BASE_DELAY_MS * Math.pow(2, attempt - 1); waitMs = base + Math.random() * base * 0.4 - base * 0.2; }
      console.warn(`⚠️  GraphQL ${response.status} on attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.round(waitMs / 1000)}s…`);
      if (pool.count > 1) pool.rotate();
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub GraphQL HTTP Error (${response.status}): ${text}`);
    }

    const json = await response.json() as any;

    // GraphQL can return errors even with HTTP 200
    if (json.errors) {
      const rateLimited = json.errors.some((e: any) => e.type === "RATE_LIMITED");
      if (rateLimited) {
        attempt++;
        if (attempt > MAX_RETRIES) throw new Error(`GraphQL rate limit exhausted after ${MAX_RETRIES} retries.`);
        const waitMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`⚠️  GraphQL rate limited on attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.round(waitMs / 1000)}s…`);
        if (pool.count > 1) pool.rotate();
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      // Non-rate-limit errors: log but continue if we have partial data
      const msg = json.errors.map((e: any) => e.message).join("; ");
      if (!json.data) throw new Error(`GitHub GraphQL Error: ${msg}`);
      console.warn(`   ⚠️  GraphQL partial errors: ${msg}`);
    }

    // Throttle between requests
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");
    if (remaining !== null && parseInt(remaining, 10) < 100) {
      const sleepTime = reset ? Math.max(0, parseInt(reset, 10) * 1_000 - Date.now()) : 5_000;
      console.warn(`⚠️  GraphQL rate limit low (${remaining} points left). Pausing ${Math.round(sleepTime / 1000)}s…`);
      await new Promise((r) => setTimeout(r, sleepTime));
    } else {
      await new Promise((r) => setTimeout(r, 100));
    }

    return json.data as T;
  }
}

// --------------- GraphQL Queries ---------------

const SEARCH_MERGED_PRS = `
query SearchMergedPRs($query: String!, $cursor: String) {
  search(query: $query, type: ISSUE, first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    issueCount
    nodes {
      ... on PullRequest {
        title
        url
        closedAt
        mergedAt
        mergedBy { login avatarUrl }
        author { login avatarUrl }
        repository { nameWithOwner }
        labels(first: 10) { nodes { name } }
      }
    }
  }
}`;

const SEARCH_CLOSED_ISSUES = `
query SearchClosedIssues($query: String!, $cursor: String) {
  search(query: $query, type: ISSUE, first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    issueCount
    nodes {
      ... on Issue {
        title
        url
        closedAt
        author { login avatarUrl }
        repository { nameWithOwner }
        labels(first: 10) { nodes { name } }
        timelineItems(last: 1, itemTypes: [CLOSED_EVENT]) {
          nodes {
            ... on ClosedEvent {
              actor { login avatarUrl }
            }
          }
        }
      }
    }
  }
}`;

const SEARCH_CLOSED_PRS_UNMERGED = `
query SearchClosedPRs($query: String!, $cursor: String) {
  search(query: $query, type: ISSUE, first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    issueCount
    nodes {
      ... on PullRequest {
        title
        url
        closedAt
        author { login avatarUrl }
        repository { nameWithOwner }
        labels(first: 10) { nodes { name } }
        timelineItems(last: 1, itemTypes: [CLOSED_EVENT]) {
          nodes {
            ... on ClosedEvent {
              actor { login avatarUrl }
            }
          }
        }
      }
    }
  }
}`;

// --------------- GraphQL Response Types ---------------

interface GQLPageInfo { hasNextPage: boolean; endCursor: string | null; }
interface GQLActor { login: string; avatarUrl: string; }
interface GQLLabel { name: string; }
interface GQLRepository { nameWithOwner: string; }

interface GQLMergedPR {
  title: string;
  url: string;
  closedAt: string;
  mergedAt: string;
  mergedBy: GQLActor | null;
  author: GQLActor | null;
  repository: GQLRepository;
  labels: { nodes: GQLLabel[] };
}

interface GQLClosedItem {
  title: string;
  url: string;
  closedAt: string;
  author: GQLActor | null;
  repository: GQLRepository;
  labels: { nodes: GQLLabel[] };
  timelineItems: { nodes: Array<{ actor: GQLActor | null }> };
}

interface GQLSearchResult<T> {
  search: {
    pageInfo: GQLPageInfo;
    issueCount: number;
    nodes: T[];
  };
}

// --------------- Live GitHub Aggregator (GraphQL) ---------------

async function fetchLiveContributors(config: YamlConfig, pool: TokenPool): Promise<Contributor[]> {
  console.log(`🌐 Connecting to GitHub GraphQL API to track ${config.organization}...`);

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
        prsOpened: 0, prsMerged: 0, issuesOpened: 0, issuesClosed: 0,
        issuesPrClosedScore: 0, prsMergedScore: 0,
        score: 0, activityLevel: "Low",
        dailyActivity: generateEmptyDailyActivity(config.eventStartDate, config.eventEndDate),
        contributions: [],
      });
    }
    const item = userMap.get(key)!;
    if (avatarUrl && item.avatarUrl === `https://avatars.githubusercontent.com/${username}`) item.avatarUrl = avatarUrl;
    return item;
  };

  const { eventStartDate: startDate, eventEndDate: endDate } = config;
  const processedPrsMerged = new Set<string>();
  const processedIssuesClosed = new Set<string>();
  const processedClosedPRs = new Set<string>();

  const MERGE_PTS = 3;
  const CLOSE_PTS = 1;
  let queryCount = 0;

  // 1. PRs Merged — flat +3 pts per merged PR (author + maintainer both earn points)
  console.log("🔍 Fetching merged PRs via GraphQL...");
  let cursor: string | null = null;
  let totalMergedPRs = 0;
  const mergedPRQuery = `org:${config.organization} is:pr is:merged merged:${startDate}..${endDate}`;
  while (true) {
    const data: GQLSearchResult<GQLMergedPR> = await fetchGraphQL(
      SEARCH_MERGED_PRS, { query: mergedPRQuery, cursor }, pool
    );
    queryCount++;
    const nodes = data.search.nodes;
    if (nodes.length === 0) break;

    for (const pr of nodes) {
      if (!pr.url || !pr.author) continue;
      const repo = pr.repository.nameWithOwner;
      if (!reposSet.has(repo.toLowerCase())) continue;
      if (processedPrsMerged.has(pr.url)) continue;
      if (pr.author.login.endsWith("[bot]")) continue;
      processedPrsMerged.add(pr.url);
      // Only count merged PRs that have at least one matching merged label
      if (!hasMatchingLabel(pr.labels.nodes, config.mergedLabels)) continue;
      totalMergedPRs++;

      // Award points to PR author
      const contributor = getOrCreateContributor(pr.author.login, pr.author.avatarUrl);
      const dateStr = (pr.mergedAt || pr.closedAt).split("T")[0];
      contributor.prsMerged++;
      contributor.prsMergedScore += MERGE_PTS;
      contributor.score += MERGE_PTS;
      contributor.contributions.push({ type: "pr_merged", title: pr.title, url: pr.url, repo, date: dateStr, points: MERGE_PTS });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) { daySlot.prsMerged++; daySlot.score += MERGE_PTS; }

      // Award points to the maintainer who merged the PR (if different from author)
      if (pr.mergedBy && pr.mergedBy.login.toLowerCase() !== pr.author.login.toLowerCase() && !pr.mergedBy.login.endsWith("[bot]")) {
        const maintainer = getOrCreateContributor(pr.mergedBy.login, pr.mergedBy.avatarUrl);
        maintainer.prsMerged++;
        maintainer.prsMergedScore += MERGE_PTS;
        maintainer.score += MERGE_PTS;
        maintainer.contributions.push({ type: "pr_merged", title: `Merged: ${pr.title}`, url: pr.url, repo, date: dateStr, points: MERGE_PTS });
        const maintainerDaySlot = maintainer.dailyActivity.find((d) => d.date === dateStr);
        if (maintainerDaySlot) { maintainerDaySlot.prsMerged++; maintainerDaySlot.score += MERGE_PTS; }
      }
    }

    if (!data.search.pageInfo.hasNextPage) break;
    cursor = data.search.pageInfo.endCursor;
  }
  console.log(`   ✅ ${totalMergedPRs} merged PRs processed.`);

  // 2a. Issues Closed (not PRs) — +1 pt per closed issue
  console.log("🔍 Fetching closed issues via GraphQL...");
  cursor = null;
  let totalClosedIssues = 0;
  const closedIssueQuery = `org:${config.organization} is:issue is:closed closed:${startDate}..${endDate}`;
  while (true) {
    const data: GQLSearchResult<GQLClosedItem> = await fetchGraphQL(
      SEARCH_CLOSED_ISSUES, { query: closedIssueQuery, cursor }, pool
    );
    queryCount++;
    const nodes = data.search.nodes;
    if (nodes.length === 0) break;

    for (const issue of nodes) {
      if (!issue.url) continue;
      const repo = issue.repository.nameWithOwner;
      if (!reposSet.has(repo.toLowerCase())) continue;
      if (processedIssuesClosed.has(issue.url)) continue;
      processedIssuesClosed.add(issue.url);
      // Only count issues with at least one matching closed label
      if (!hasMatchingLabel(issue.labels.nodes, config.closedLabels)) continue;

      // Determine who closed the issue via timeline CLOSED_EVENT
      let closer: GQLActor | null = null;
      if (issue.timelineItems.nodes.length > 0 && issue.timelineItems.nodes[0]?.actor) {
        closer = issue.timelineItems.nodes[0].actor;
      } else if (issue.author) {
        closer = issue.author;
      }

      if (!closer) continue;
      if (closer.login.endsWith("[bot]")) continue;

      const contributor = getOrCreateContributor(closer.login, closer.avatarUrl);
      const dateStr = issue.closedAt.split("T")[0];
      contributor.issuesClosed++;
      contributor.issuesPrClosedScore += CLOSE_PTS;
      contributor.score += CLOSE_PTS;
      contributor.contributions.push({ type: "issue_closed", title: issue.title, url: issue.url, repo, date: dateStr, points: CLOSE_PTS });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) { daySlot.issuesClosed++; daySlot.score += CLOSE_PTS; }
      totalClosedIssues++;
    }

    if (!data.search.pageInfo.hasNextPage) break;
    cursor = data.search.pageInfo.endCursor;
  }
  console.log(`   ✅ ${totalClosedIssues} closed issues processed.`);

  // 2b. PRs Closed (not merged) — +1 pt per closed PR
  console.log("🔍 Fetching closed PRs (not merged) via GraphQL...");
  cursor = null;
  let totalClosedPRs = 0;
  const closedPRQuery = `org:${config.organization} is:pr is:closed is:unmerged closed:${startDate}..${endDate}`;
  while (true) {
    const data: GQLSearchResult<GQLClosedItem> = await fetchGraphQL(
      SEARCH_CLOSED_PRS_UNMERGED, { query: closedPRQuery, cursor }, pool
    );
    queryCount++;
    const nodes = data.search.nodes;
    if (nodes.length === 0) break;

    for (const pr of nodes) {
      if (!pr.url) continue;
      const repo = pr.repository.nameWithOwner;
      if (!reposSet.has(repo.toLowerCase())) continue;
      if (processedClosedPRs.has(pr.url)) continue;
      processedClosedPRs.add(pr.url);
      // Only count closed PRs with at least one matching closed label
      if (!hasMatchingLabel(pr.labels.nodes, config.closedLabels)) continue;

      // Determine who closed the PR via timeline CLOSED_EVENT
      let closer: GQLActor | null = null;
      if (pr.timelineItems.nodes.length > 0 && pr.timelineItems.nodes[0]?.actor) {
        closer = pr.timelineItems.nodes[0].actor;
      } else if (pr.author) {
        closer = pr.author;
      }

      if (!closer) continue;
      if (closer.login.endsWith("[bot]")) continue;

      const contributor = getOrCreateContributor(closer.login, closer.avatarUrl);
      const dateStr = pr.closedAt.split("T")[0];
      contributor.issuesClosed++;
      contributor.issuesPrClosedScore += CLOSE_PTS;
      contributor.score += CLOSE_PTS;
      contributor.contributions.push({ type: "issue_closed", title: pr.title, url: pr.url, repo, date: dateStr, points: CLOSE_PTS });
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) { daySlot.issuesClosed++; daySlot.score += CLOSE_PTS; }
      totalClosedPRs++;
    }

    if (!data.search.pageInfo.hasNextPage) break;
    cursor = data.search.pageInfo.endCursor;
  }
  console.log(`   ✅ ${totalClosedPRs} closed (unmerged) PRs processed.`);

  // 3. Finalize — avatars are already populated from GraphQL search results
  console.log(`📊 Finalizing contributor calculations... (${queryCount} GraphQL queries used)`);
  const contributors = Array.from(userMap.values());
  for (const c of contributors) {
    c.activityLevel = c.score >= config.thresholds.highActivity ? "High" : c.score >= config.thresholds.mediumActivity ? "Medium" : "Low";
    c.contributions.sort((a, b) => b.date.localeCompare(a.date));
  }
  return contributors;
}

// --------------- Mock Fallback ---------------

function generateMockData(config: YamlConfig): Contributor[] {
  console.warn("[MOCK MODE] Generating simulated (fake) contributor data.");
  const start = new Date(config.eventStartDate);
  const end = new Date(config.eventEndDate);
  const repos = config.repos;
  const prTitles = ["Fix simulator canvas rendering","Add dark mode support","Optimize truth table generation","Add PDF/PNG export support","Implement search filtration","Refactor sequential logic","Add internationalization support","Fix memory threshold limits","Upgrade Next.js dependencies","Improve test coverage","Add custom clock timing","Fix touch viewport bugs"];
  const issueTitles = ["Simulator UI freeze on large circuits","Dark mode low contrast margins","Subcircuit inputs fail state updates","Interactive book sandbox 404 error","Touch gate drag snaps misaligned","Full-screen mode overlaps panels","API endpoints timeout on deep feeds","Add keyboard map guides"];

  // 1. Initialize all contributor structures
  const userMap = new Map<string, Contributor>();
  const usernames: string[] = [];
  
  for (const team of config.teams) {
    for (const username of team.members) {
      userMap.set(username.toLowerCase(), {
        username,
        avatarUrl: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 1200000) + 4000000}?v=4`,
        profileUrl: `https://github.com/${username}`,
        team: team.name,
        prsOpened: 0,
        prsMerged: 0,
        issuesOpened: 0,
        issuesClosed: 0,
        issuesPrClosedScore: 0,
        prsMergedScore: 0,
        score: 0,
        activityLevel: "Low",
        dailyActivity: generateEmptyDailyActivity(config.eventStartDate, config.eventEndDate),
        contributions: [],
      });
      usernames.push(username.toLowerCase());
    }
  }

  const MERGE_PTS = 3;
  const CLOSE_PTS = 1;

  // 2. Generate direct contributions for each contributor to reach a target score
  let userIdx = 0;
  for (const usernameKey of usernames) {
    const contributor = userMap.get(usernameKey)!;
    
    // Determine target score based on rank simulation
    let targetScore = 2 + Math.floor(Math.random() * 4);
    if (userIdx === 0) targetScore = 24;
    else if (userIdx === 1) targetScore = 18;
    else if (userIdx === 2) targetScore = 12;
    else if (userIdx === 3) targetScore = 9;
    else if (userIdx === 4) targetScore = 6;
    userIdx++;

    while (contributor.score < targetScore) {
      const rand = Math.random();
      let type: ContributionItem["type"];
      let pts = CLOSE_PTS;
      
      if (rand < 0.5) {
        type = "pr_merged";
        pts = MERGE_PTS;
        contributor.prsMerged++;
        contributor.prsMergedScore += pts;
      } else {
        type = "issue_closed";
        pts = CLOSE_PTS;
        contributor.issuesClosed++;
        contributor.issuesPrClosedScore += pts;
      }

      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      const eventDate = new Date(start);
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * (daysDiff + 1)));
      const dateStr = eventDate.toISOString().split("T")[0];
      
      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) {
        if (type === "pr_merged") daySlot.prsMerged++;
        else if (type === "issue_closed") daySlot.issuesClosed++;
        daySlot.score += pts;
      }

      const repo = repos[Math.floor(Math.random() * repos.length)];
      const isPr = type.startsWith("pr_");
      const baseTitle = isPr ? prTitles[Math.floor(Math.random() * prTitles.length)] : issueTitles[Math.floor(Math.random() * issueTitles.length)];
      const title = baseTitle;
      const itemNum = Math.floor(Math.random() * 280) + 1;
      
      contributor.contributions.push({
        type,
        title,
        url: `https://github.com/${repo}/${isPr ? "pull" : "issues"}/${itemNum}`,
        repo,
        date: dateStr,
        points: pts
      });
      contributor.score += pts;

      // Simulate maintainer merging this PR (if it's a pr_merged)
      if (type === "pr_merged" && Math.random() < 0.4 && usernames.length > 1) {
        // Pick a different random user as the maintainer
        let maintainerKey = usernames[Math.floor(Math.random() * usernames.length)];
        while (maintainerKey === usernameKey) {
          maintainerKey = usernames[Math.floor(Math.random() * usernames.length)];
        }
        
        const maintainer = userMap.get(maintainerKey)!;
        maintainer.prsMerged++;
        maintainer.prsMergedScore += MERGE_PTS;
        maintainer.score += MERGE_PTS;
        
        maintainer.contributions.push({
          type: "pr_merged",
          title: `Merged: ${title}`,
          url: `https://github.com/${repo}/pull/${itemNum}`,
          repo,
          date: dateStr,
          points: MERGE_PTS
        });
        
        const maintainerDaySlot = maintainer.dailyActivity.find((d) => d.date === dateStr);
        if (maintainerDaySlot) {
          maintainerDaySlot.prsMerged++;
          maintainerDaySlot.score += MERGE_PTS;
        }
      }
    }
  }

  // 3. Finalize sorting and activity levels
  const contributors = Array.from(userMap.values());
  for (const c of contributors) {
    c.contributions.sort((a, b) => b.date.localeCompare(a.date));
    c.activityLevel = c.score >= config.thresholds.highActivity ? "High" : c.score >= config.thresholds.mediumActivity ? "Medium" : "Low";
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

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const firstEquals = trimmed.indexOf("=");
      if (firstEquals !== -1) {
        const key = trimmed.substring(0, firstEquals).trim();
        const value = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    }
  }
}

// --------------- Main ---------------

async function main(): Promise<void> {
  loadEnv();
  console.log("🚀 Initializing Mergathon dashboard builder...");
  const config = loadConfig();
  console.log(`🏷️  Scoring labels — closed: ${JSON.stringify(config.closedLabels)}, merged: ${JSON.stringify(config.mergedLabels)}`);
  let contributors: Contributor[] = [];
  let pool: TokenPool | null = null;

  try { pool = new TokenPool(); }
  catch {
    console.warn("\n[MOCK MODE] ============================================================");
    console.warn("[MOCK MODE] No GITHUB_TOKEN or GITHUB_TOKENS env var found.");
    console.warn("[MOCK MODE] Data written to mergathon-data.json is SIMULATED, not real.");
    console.warn("[MOCK MODE] Set GITHUB_TOKEN in .env.local and re-run to get live data.");
    console.warn("[MOCK MODE] ============================================================\n");
    contributors = generateMockData(config);
  }

  if (pool) {
    console.log("💡 Using config.yaml roster as requested (skipping GitHub Org Teams fetch).");

    try {
      contributors = await fetchLiveContributors(config, pool);
      console.log("\n[LIVE MODE] ============================================================");
      console.log(`[LIVE MODE] Real GitHub data fetched. ${contributors.length} contributor(s) scored.`);
      console.log("[LIVE MODE] ============================================================\n");
    } catch (err: any) {
      console.error("❌ Live fetch failed:", err.message);
      console.warn("\n[MOCK MODE] ============================================================");
      console.warn("[MOCK MODE] Live GitHub fetch threw an error (see above).");
      console.warn("[MOCK MODE] Data written to mergathon-data.json is SIMULATED, not real.");
      console.warn("[MOCK MODE] ============================================================\n");
      contributors = generateMockData(config);
    }
  }

  const teams: Team[] = config.teams.map((t) => {
    const members = contributors.filter((c) => t.members.map((m) => m.toLowerCase()).includes(c.username.toLowerCase()));
    return { name: t.name, color: t.color, members: t.members,
      totalScore: members.reduce((s, m) => s + m.score, 0),
      totalPrsMerged: members.reduce((s, m) => s + m.prsMerged, 0),
      totalPrsOpened: members.reduce((s, m) => s + m.prsOpened, 0),
      totalIssuesClosed: members.reduce((s, m) => s + m.issuesClosed, 0),
      totalIssuesOpened: members.reduce((s, m) => s + m.issuesOpened, 0),
    };
  });

  const dateMap = new Map<string, DailyActivity>();
  for (const c of contributors) {
    for (const d of c.dailyActivity) {
      const e = dateMap.get(d.date) ?? { date: d.date, prsOpened: 0, prsMerged: 0, issuesOpened: 0, issuesClosed: 0, score: 0 };
      e.prsOpened += d.prsOpened; e.prsMerged += d.prsMerged;
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
    daysElapsed, daysRemaining,
  };

  const teamContributors = contributors.filter((c) => c.team !== "Independent");

  const data: MergathonData = {
    lastUpdated: new Date().toISOString(),
    eventStartDate: config.eventStartDate, eventEndDate: config.eventEndDate,
    stats, teams, contributors: teamContributors.sort((a, b) => b.score - a.score), dailyTotals,
  };

  const outDir = path.resolve(__dirname, "..", "public", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "mergathon-data.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Leaderboard data saved → ${outPath}`);
}

main().catch((err) => { console.error("❌ Fatal crash:", err); process.exit(1); });
