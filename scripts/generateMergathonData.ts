#!/usr/bin/env ts-node
// ============================================================
// CircuitVerse Mergathon – Leaderboard Data Generator
// ============================================================
//
// This script is run by the GitHub Actions workflow
// (npm run generate:leaderboard) or manually during development.
//
// It fetches live contribution data from the GitHub API,
// computes scores, and writes the result to:
//   public/data/mergathon-data.json
//
// If no GITHUB_TOKEN is present, it gracefully falls back to
// generating realistic mock data based onconfig.yaml.
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

// --------------- Configuration Loader & Parser ---------------

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

/**
 * Highly robust self-contained YAML parser tailored for config.yaml.
 * Avoids any external dependency compile errors in clean workspaces.
 */
function parseConfigYaml(content: string): YamlConfig {
  const lines = content.split(/\r?\n/);
  
  let eventName = "CircuitVerse Mergathon 2025";
  let organization = "CircuitVerse";
  let eventStartDate = "2025-05-22";
  let eventEndDate = "2025-05-25";
  const repos: string[] = [];
  const scoringWeights = {
    prMerged: 10,
    prOpened: 5,
    prReviewed: 3,
    issueClosed: 4,
    issueOpened: 2,
  };
  const thresholds = {
    highActivity: 100,
    mediumActivity: 50,
  };
  const teams: { name: string; color: string; members: string[] }[] = [];

  let currentTeam: any = null;
  let mode: "none" | "repos" | "members" = "none";

  for (let line of lines) {
    let cleanLine = line;
    const commentIdx = line.indexOf(" #");
    if (commentIdx !== -1) {
      cleanLine = line.substring(0, commentIdx);
    } else if (line.trim().startsWith("#")) {
      cleanLine = "";
    }
    const trimmed = cleanLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("name:") && !trimmed.includes("- name:")) {
      eventName = trimmed.split(":")[1].trim().replace(/['"]/g, "");
      continue;
    }
    if (trimmed.startsWith("organization:")) {
      organization = trimmed.split(":")[1].trim().replace(/['"]/g, "");
      continue;
    }
    if (trimmed.startsWith("startDate:")) {
      eventStartDate = trimmed.split(":")[1].trim().replace(/['"]/g, "");
      continue;
    }
    if (trimmed.startsWith("endDate:")) {
      eventEndDate = trimmed.split(":")[1].trim().replace(/['"]/g, "");
      continue;
    }
    if (trimmed.startsWith("repositories:")) {
      mode = "repos";
      continue;
    }
    if (trimmed.startsWith("teams:")) {
      mode = "none";
      continue;
    }
    if (trimmed.startsWith("members:")) {
      mode = "members";
      continue;
    }

    if (trimmed.startsWith("-") && mode === "repos") {
      const repo = trimmed.substring(1).trim().replace(/['"]/g, "");
      repos.push(repo);
      continue;
    }

    if (trimmed.startsWith("- name:")) {
      mode = "none";
      const name = trimmed.substring("- name:".length).trim().replace(/['"]/g, "");
      currentTeam = { name, color: "#3b82f6", members: [] };
      teams.push(currentTeam);
      console.log(`  Parsed team: "${name}"`);
      continue;
    }

    if (trimmed.startsWith("-") && mode === "members" && currentTeam) {
      const member = trimmed.substring(1).trim().replace(/['"]/g, "");
      currentTeam.members.push(member);
      continue;
    }

    if (trimmed.startsWith("color:") && currentTeam) {
      const color = trimmed.substring("color:".length).trim().replace(/['"]/g, "");
      currentTeam.color = color;
      console.log(`  Parsed color for "${currentTeam.name}": "${color}"`);
      continue;
    }

    // Weights & thresholds
    if (trimmed.startsWith("prMerged:")) {
      scoringWeights.prMerged = parseInt(trimmed.split(":")[1].trim(), 10);
    } else if (trimmed.startsWith("prOpened:")) {
      scoringWeights.prOpened = parseInt(trimmed.split(":")[1].trim(), 10);
    } else if (trimmed.startsWith("prReviewed:")) {
      scoringWeights.prReviewed = parseInt(trimmed.split(":")[1].trim(), 10);
    } else if (trimmed.startsWith("issueClosed:")) {
      scoringWeights.issueClosed = parseInt(trimmed.split(":")[1].trim(), 10);
    } else if (trimmed.startsWith("issueOpened:")) {
      scoringWeights.issueOpened = parseInt(trimmed.split(":")[1].trim(), 10);
    } else if (trimmed.startsWith("highActivity:")) {
      thresholds.highActivity = parseInt(trimmed.split(":")[1].trim(), 10);
    } else if (trimmed.startsWith("mediumActivity:")) {
      thresholds.mediumActivity = parseInt(trimmed.split(":")[1].trim(), 10);
    }
  }

  if (repos.length === 0) {
    repos.push(
      "CircuitVerse/CircuitVerse",
      "CircuitVerse/mobile-app",
      "CircuitVerse/Interactive-Book",
      "CircuitVerse/cv-frontend-vue"
    );
  }

  return {
    eventName,
    organization,
    eventStartDate,
    eventEndDate,
    repos,
    scoringWeights,
    thresholds,
    teams,
  };
}

function loadConfig(): YamlConfig {
  try {
    const configPath = path.resolve(__dirname, "..", "config.yaml");
    if (!fs.existsSync(configPath)) {
      console.warn("⚠️  config.yaml not found, using default fallback settings.");
      return getDefaultConfig();
    }
    const content = fs.readFileSync(configPath, "utf-8");
    return parseConfigYaml(content);
  } catch (error) {
    console.error("❌ Failed to parse config.yaml, using default config:", error);
    return getDefaultConfig();
  }
}

function getDefaultConfig(): YamlConfig {
  return {
    eventName: "CircuitVerse Mergathon 2025",
    organization: "CircuitVerse",
    eventStartDate: "2025-05-22",
    eventEndDate: "2025-05-25",
    repos: [
      "CircuitVerse/CircuitVerse",
      "CircuitVerse/mobile-app",
      "CircuitVerse/Interactive-Book",
      "CircuitVerse/cv-frontend-vue",
    ],
    scoringWeights: {
      prMerged: 10,
      prOpened: 5,
      prReviewed: 3,
      issueClosed: 4,
      issueOpened: 2,
    },
    thresholds: {
      highActivity: 100,
      mediumActivity: 50,
    },
    teams: [
      {
        name: "Team Alpha",
        color: "#3b82f6",
        members: ["dev-sarah", "coder-alex"],
      },
      {
        name: "Team Beta",
        color: "#8b5cf6",
        members: ["backend-mia", "docs-guru-chen"],
      },
    ],
  };
}

// --------------- Helpers ---------------

function generateEmptyDailyActivity(startStr: string, endStr: string): DailyActivity[] {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const result: DailyActivity[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      prsOpened: 0,
      prsMerged: 0,
      prsReviewed: 0,
      issuesOpened: 0,
      issuesClosed: 0,
      score: 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function isWithinEventWindow(dateStr: string, startStr: string, endStr: string): boolean {
  const d = dateStr.split("T")[0];
  return d >= startStr && d <= endStr;
}

function getRepoFromUrl(url: string): string {
  const clean = url.replace("https://github.com/", "");
  const parts = clean.split("/");
  return `${parts[0]}/${parts[1]}`;
}

// --------------- GitHub Client Helper ---------------

async function fetchGithub<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "CircuitVerse-Mergathon-Dashboard",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API Error (${response.status}) at ${url}: ${text}`);
  }

  // Handle rate limits
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  if (remaining && parseInt(remaining, 10) < 30) {
    const sleepTime = reset ? Math.max(0, parseInt(reset, 10) * 1000 - Date.now()) : 5000;
    console.warn(`⚠️ GitHub rate limit low (${remaining} left). Throttling for ${sleepTime}ms...`);
    await new Promise((r) => setTimeout(r, sleepTime));
  } else {
    // Standard light throttle
    await new Promise((r) => setTimeout(r, 150));
  }

  return response.json() as Promise<T>;
}

// --------------- Live GitHub Aggregator ---------------

async function fetchLiveContributors(config: YamlConfig, token: string): Promise<Contributor[]> {
  console.log(`🌐 Connecting to GitHub API to track ${config.organization}...`);

  const registeredUsers = new Set(config.teams.flatMap((t) => t.members.map((m) => m.toLowerCase())));
  const reposSet = new Set(config.repos.map((r) => r.toLowerCase()));

  // Map to hold our contributors structure
  const userMap = new Map<string, Contributor>();

  // Helper to get or create contributor structure
  const getOrCreateContributor = (username: string, avatarUrl: string = ""): Contributor => {
    const key = username.toLowerCase();
    if (!userMap.has(key)) {
      // Find team
      const teamObj = config.teams.find((t) => t.members.map((m) => m.toLowerCase()).includes(key));
      const teamName = teamObj ? teamObj.name : "Independent";

      userMap.set(key, {
        username,
        avatarUrl: avatarUrl || `https://avatars.githubusercontent.com/u/0?v=4`,
        profileUrl: `https://github.com/${username}`,
        team: teamName,
        prsOpened: 0,
        prsMerged: 0,
        prsReviewed: 0,
        issuesOpened: 0,
        issuesClosed: 0,
        score: 0,
        activityLevel: "Low",
        dailyActivity: generateEmptyDailyActivity(config.eventStartDate, config.eventEndDate),
        contributions: [],
      });
    }

    const item = userMap.get(key)!;
    if (avatarUrl && item.avatarUrl.includes("/u/0?v=4")) {
      item.avatarUrl = avatarUrl;
    }
    return item;
  };

  // Initialize registered users in map to guarantee their inclusion (even with 0 points)
  for (const team of config.teams) {
    for (const member of team.members) {
      getOrCreateContributor(member);
    }
  }

  const startDate = config.eventStartDate;
  const endDate = config.eventEndDate;

  // Let's hold processed event identifiers to avoid double counting
  const processedPrsOpened = new Set<string>();
  const processedPrsMerged = new Set<string>();
  const processedIssuesOpened = new Set<string>();
  const processedIssuesClosed = new Set<string>();
  const processedReviews = new Set<string>();

  // 1. Fetch Pull Requests Created
  console.log("🔍 Fetching PRs opened...");
  let page = 1;
  while (true) {
    const q = `org:${config.organization}+is:pr+created:${startDate}..${endDate}`;
    const url = `https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`;
    const data: any = await fetchGithub(url, token);
    const items = data.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue; // Skip non-tracked repo

      const author = item.user.login;
      if (!registeredUsers.has(author.toLowerCase())) continue; // Skip unregistered users

      const prId = item.html_url;
      if (processedPrsOpened.has(prId)) continue;
      processedPrsOpened.add(prId);

      const contributor = getOrCreateContributor(author, item.user.avatar_url);
      const dateStr = item.created_at.split("T")[0];

      // Add points
      contributor.prsOpened++;
      contributor.contributions.push({
        type: "pr_opened",
        title: item.title,
        url: item.html_url,
        repo,
        date: dateStr,
      });

      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) {
        daySlot.prsOpened++;
      }
    }

    if (items.length < 100) break;
    page++;
  }

  // 2. Fetch Pull Requests Merged
  console.log("🔍 Fetching PRs merged...");
  page = 1;
  while (true) {
    const q = `org:${config.organization}+is:pr+is:merged+merged:${startDate}..${endDate}`;
    const url = `https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`;
    const data: any = await fetchGithub(url, token);
    const items = data.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;

      const author = item.user.login;
      if (!registeredUsers.has(author.toLowerCase())) continue;

      const prId = item.html_url;
      if (processedPrsMerged.has(prId)) continue;
      processedPrsMerged.add(prId);

      const contributor = getOrCreateContributor(author, item.user.avatar_url);
      const dateStr = (item.closed_at || item.updated_at).split("T")[0];

      contributor.prsMerged++;
      contributor.contributions.push({
        type: "pr_merged",
        title: item.title,
        url: item.html_url,
        repo,
        date: dateStr,
      });

      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) {
        daySlot.prsMerged++;
      }
    }

    if (items.length < 100) break;
    page++;
  }

  // 3. Fetch Issues Created
  console.log("🔍 Fetching Issues opened...");
  page = 1;
  while (true) {
    const q = `org:${config.organization}+is:issue+created:${startDate}..${endDate}`;
    const url = `https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`;
    const data: any = await fetchGithub(url, token);
    const items = data.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;

      const author = item.user.login;
      if (!registeredUsers.has(author.toLowerCase())) continue;

      const issueId = item.html_url;
      if (processedIssuesOpened.has(issueId)) continue;
      processedIssuesOpened.add(issueId);

      const contributor = getOrCreateContributor(author, item.user.avatar_url);
      const dateStr = item.created_at.split("T")[0];

      contributor.issuesOpened++;
      contributor.contributions.push({
        type: "issue_opened",
        title: item.title,
        url: item.html_url,
        repo,
        date: dateStr,
      });

      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) {
        daySlot.issuesOpened++;
      }
    }

    if (items.length < 100) break;
    page++;
  }

  // 4. Fetch Issues Closed
  console.log("🔍 Fetching Issues closed...");
  page = 1;
  while (true) {
    const q = `org:${config.organization}+is:issue+is:closed+closed:${startDate}..${endDate}`;
    const url = `https://api.github.com/search/issues?q=${q}&per_page=100&page=${page}`;
    const data: any = await fetchGithub(url, token);
    const items = data.items || [];
    if (items.length === 0) break;

    for (const item of items) {
      const repo = getRepoFromUrl(item.html_url);
      if (!reposSet.has(repo.toLowerCase())) continue;

      // Closed issues credit goes to assignee
      const assigneeObj = item.assignee;
      if (!assigneeObj) continue; // No assignee, skip

      const author = assigneeObj.login;
      if (!registeredUsers.has(author.toLowerCase())) continue;

      const issueId = item.html_url;
      if (processedIssuesClosed.has(issueId)) continue;
      processedIssuesClosed.add(issueId);

      const contributor = getOrCreateContributor(author, assigneeObj.avatar_url);
      const dateStr = (item.closed_at || item.updated_at).split("T")[0];

      contributor.issuesClosed++;
      contributor.contributions.push({
        type: "issue_closed",
        title: item.title,
        url: item.html_url,
        repo,
        date: dateStr,
      });

      const daySlot = contributor.dailyActivity.find((d) => d.date === dateStr);
      if (daySlot) {
        daySlot.issuesClosed++;
      }
    }

    if (items.length < 100) break;
    page++;
  }

  // 5. Fetch PR Reviews for all processed PRs
  console.log("🔍 Fetching PR reviews...");
  const activePRs = Array.from(new Set([...processedPrsOpened, ...processedPrsMerged]));
  
  for (const prUrl of activePRs) {
    try {
      const repo = getRepoFromUrl(prUrl);
      const parts = prUrl.replace("https://github.com/", "").split("/");
      const prNumber = parts[3];

      const reviewsUrl = `https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`;
      const reviews: any[] = await fetchGithub(reviewsUrl, token);

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
        contributor.contributions.push({
          type: "pr_reviewed",
          title: `Reviewed Pull Request #${prNumber}`,
          url: prUrl,
          repo,
          date: submittedDateStr,
        });

        const daySlot = contributor.dailyActivity.find((d) => d.date === submittedDateStr);
        if (daySlot) {
          daySlot.prsReviewed++;
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Couldn't fetch reviews for PR ${prUrl}:`, err.message || err);
    }
  }

  // 6. Compute Scores & Activity Levels
  console.log("📊 Finalizing contributor calculations...");
  const contributors = Array.from(userMap.values());
  for (const c of contributors) {
    // Calc final score
    c.score =
      c.prsMerged * config.scoringWeights.prMerged +
      c.prsOpened * config.scoringWeights.prOpened +
      c.prsReviewed * config.scoringWeights.prReviewed +
      c.issuesClosed * config.scoringWeights.issueClosed +
      c.issuesOpened * config.scoringWeights.issueOpened;

    // Calc daily activity scores
    for (const d of c.dailyActivity) {
      d.score =
        d.prsMerged * config.scoringWeights.prMerged +
        d.prsOpened * config.scoringWeights.prOpened +
        d.prsReviewed * config.scoringWeights.prReviewed +
        d.issuesClosed * config.scoringWeights.issueClosed +
        d.issuesOpened * config.scoringWeights.issueOpened;
    }

    // Set activity level badge
    if (c.score >= config.thresholds.highActivity) {
      c.activityLevel = "High";
    } else if (c.score >= config.thresholds.mediumActivity) {
      c.activityLevel = "Medium";
    } else {
      c.activityLevel = "Low";
    }

    // Sort contributions chronological
    c.contributions.sort((a, b) => b.date.localeCompare(a.date));
  }

  return contributors;
}

// --------------- Dynamic Mock Fallback Generator ---------------

function generateMockData(config: YamlConfig): Contributor[] {
  console.warn("⚠️  GITHUB_TOKEN is missing or fetch failed. Generating mock simulation dynamic parameters.");
  const contributors: Contributor[] = [];
  const start = new Date(config.eventStartDate);
  const end = new Date(config.eventEndDate);
  const repos = config.repos;

  const prTitles = [
    "Fix simulator canvas rendering in high-DPI screens",
    "Add dark mode support to interactive book docs",
    "Optimize truth table generation gate recursion",
    "Add PDF/PNG export support in simulator layout",
    "Implement search filtration in contributor table",
    "Refactor sequential logic flip-flop simulation",
    "Add internationalization support for Hindi/Spanish",
    "Fix memory threshold limits in gate drag listeners",
    "Upgrade Next.js framework build dependencies",
    "Improve test coverage metrics in canvas component",
    "Add custom clock timing constraints in settings",
    "Fix touch viewport alignment bugs on iOS Chrome",
  ];

  const issueTitles = [
    "Simulator UI freeze on large recursive circuit runs",
    "Dark mode style sheets have low contrast margins",
    "Subcircuit inputs fail to trigger state updates",
    "Interactive book sandbox returns 404 console error",
    "Touch gate drag and drop snaps misaligned in view",
    "Full-screen simulator mode overlaps notification panels",
    "API endpoints timeout when reading deep historical feeds",
    "Add keyboard map guides in drawer toggle panel",
  ];

  const memberCount = config.teams.reduce((s, t) => s + t.members.length, 0);
  let userIdx = 0;

  for (const team of config.teams) {
    for (const username of team.members) {
      // Pick realistic target scores so they range nicely from top performer down
      let targetScore = 30 + Math.floor(Math.random() * 40); // Low default
      if (userIdx === 0) targetScore = 215; // Hero rank 1
      else if (userIdx === 1) targetScore = 175; // Rank 2
      else if (userIdx === 2) targetScore = 135; // Rank 3
      else if (userIdx === 3) targetScore = 95;  // Medium-High
      else if (userIdx === 4) targetScore = 65;  // Medium

      userIdx++;

      const dailyActivity = generateEmptyDailyActivity(config.eventStartDate, config.eventEndDate);
      const contributions: ContributionItem[] = [];

      let prsOpened = 0;
      let prsMerged = 0;
      let prsReviewed = 0;
      let issuesOpened = 0;
      let issuesClosed = 0;
      let currentScore = 0;

      while (currentScore < targetScore) {
        const rand = Math.random();
        let type: ContributionItem["type"];
        let pts = 0;

        if (rand < 0.25) {
          type = "pr_merged";
          pts = config.scoringWeights.prMerged;
          prsMerged++;
        } else if (rand < 0.48) {
          type = "pr_opened";
          pts = config.scoringWeights.prOpened;
          prsOpened++;
        } else if (rand < 0.7) {
          type = "pr_reviewed";
          pts = config.scoringWeights.prReviewed;
          prsReviewed++;
        } else if (rand < 0.85) {
          type = "issue_closed";
          pts = config.scoringWeights.issueClosed;
          issuesClosed++;
        } else {
          type = "issue_opened";
          pts = config.scoringWeights.issueOpened;
          issuesOpened++;
        }

        // Pick random day
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
        const randDays = Math.floor(Math.random() * (daysDiff + 1));
        const eventDate = new Date(start);
        eventDate.setDate(eventDate.getDate() + randDays);
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
        const baseTitle = isPr
          ? prTitles[Math.floor(Math.random() * prTitles.length)]
          : issueTitles[Math.floor(Math.random() * issueTitles.length)];
        
        const title = isPr ? `[PR] ${baseTitle}` : `[Issue] ${baseTitle}`;
        const itemNum = Math.floor(Math.random() * 280) + 1;
        const url = isPr
          ? `https://github.com/${repo}/pull/${itemNum}`
          : `https://github.com/${repo}/issues/${itemNum}`;

        contributions.push({
          type,
          title,
          url,
          repo,
          date: eventDateStr,
        });

        currentScore += pts;
      }

      // Recompute exact score to maintain consistency
      const score =
        prsMerged * config.scoringWeights.prMerged +
        prsOpened * config.scoringWeights.prOpened +
        prsReviewed * config.scoringWeights.prReviewed +
        issuesClosed * config.scoringWeights.issueClosed +
        issuesOpened * config.scoringWeights.issueOpened;

      for (const d of dailyActivity) {
        d.score =
          d.prsMerged * config.scoringWeights.prMerged +
          d.prsOpened * config.scoringWeights.prOpened +
          d.prsReviewed * config.scoringWeights.prReviewed +
          d.issuesClosed * config.scoringWeights.issueClosed +
          d.issuesOpened * config.scoringWeights.issueOpened;
      }

      let activityLevel: "High" | "Medium" | "Low" = "Low";
      if (score >= config.thresholds.highActivity) activityLevel = "High";
      else if (score >= config.thresholds.mediumActivity) activityLevel = "Medium";

      contributions.sort((a, b) => b.date.localeCompare(a.date));

      const avatarId = Math.floor(Math.random() * 1200000) + 4000000;

      contributors.push({
        username,
        avatarUrl: `https://avatars.githubusercontent.com/u/${avatarId}?v=4`,
        profileUrl: `https://github.com/${username}`,
        team: team.name,
        prsOpened,
        prsMerged,
        prsReviewed,
        issuesOpened,
        issuesClosed,
        score,
        activityLevel,
        dailyActivity,
        contributions,
      });
    }
  }

  return contributors;
}

async function fetchGithubTeams(config: YamlConfig, token: string): Promise<{ name: string; color: string; members: string[] }[]> {
  console.log(`👥 Fetching teams directly from GitHub organization: "${config.organization}"...`);
  const orgTeamsUrl = `https://api.github.com/orgs/${config.organization}/teams?per_page=100`;
  const teamsResponse = await fetchGithub<any[]>(orgTeamsUrl, token);
  
  const githubTeams: { name: string; color: string; members: string[] }[] = [];
  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4", "#f43f5e"];

  if (Array.isArray(teamsResponse)) {
    for (let i = 0; i < teamsResponse.length; i++) {
      const teamItem = teamsResponse[i];
      const teamSlug = teamItem.slug;
      const teamName = teamItem.name;
      console.log(`   Found GitHub Team: "${teamName}" (slug: ${teamSlug})`);

      try {
        const membersUrl = `https://api.github.com/orgs/${config.organization}/teams/${teamSlug}/members?per_page=100`;
        const membersResponse = await fetchGithub<any[]>(membersUrl, token);

        if (Array.isArray(membersResponse)) {
          const members = membersResponse.map((m: any) => m.login);
          console.log(`   Fetched ${members.length} members for "${teamName}" directly from GitHub Org.`);
          githubTeams.push({
            name: teamName,
            color: colors[i % colors.length],
            members: members,
          });
        }
      } catch (err: any) {
        console.warn(`   ⚠️ Failed to fetch members for team "${teamSlug}": ${err.message || err}`);
      }
    }
  }

  return githubTeams;
}

// --------------- Main Script Runtime ---------------

async function main(): Promise<void> {
  console.log("🚀 Initializing Mergathon dashboard builder...");

  const config = loadConfig();
  const token = process.env.GITHUB_TOKEN;

  let contributors: Contributor[] = [];

  // Try to load teams directly from GitHub Org if token is present
  if (token && token.trim() !== "") {
    try {
      const fetchedTeams = await fetchGithubTeams(config, token);
      if (fetchedTeams && fetchedTeams.length > 0) {
        console.log(`✅ Loaded ${fetchedTeams.length} teams directly from GitHub Org! Overriding config.yaml.`);
        config.teams = fetchedTeams;
      } else {
        console.log("💡 No teams returned from GitHub Org API. Keeping config.yaml roster.");
      }
    } catch (err: any) {
      console.warn(`⚠️ GitHub Org Teams API fetch failed: ${err.message || err}. Falling back to config.yaml team listings.`);
    }

    try {
      contributors = await fetchLiveContributors(config, token);
      console.log(`✅ Live data aggregated successfully (${contributors.length} contributors updated).`);
    } catch (err: any) {
      console.error("❌ Live API gathering failed:", err.message || err);
      console.log("🔄 Graceful switch to mock data simulation.");
      contributors = generateMockData(config);
    }
  } else {
    console.log("💡 GITHUB_TOKEN not specified in environments. Running mock generator...");
    contributors = generateMockData(config);
  }

  // 1. Build team objects with aggregated totals
  const teams: Team[] = config.teams.map((t) => {
    const teamMembers = contributors.filter((c) =>
      t.members.map((m) => m.toLowerCase()).includes(c.username.toLowerCase())
    );
    return {
      name: t.name,
      color: t.color,
      members: t.members,
      totalScore: teamMembers.reduce((s, m) => s + m.score, 0),
      totalPrsMerged: teamMembers.reduce((s, m) => s + m.prsMerged, 0),
      totalPrsOpened: teamMembers.reduce((s, m) => s + m.prsOpened, 0),
      totalPrsReviewed: teamMembers.reduce((s, m) => s + m.prsReviewed, 0),
      totalIssuesClosed: teamMembers.reduce((s, m) => s + m.issuesClosed, 0),
      totalIssuesOpened: teamMembers.reduce((s, m) => s + m.issuesOpened, 0),
    };
  });

  // 2. Aggregate daily totals across all contributors
  const dateMap = new Map<string, DailyActivity>();
  for (const c of contributors) {
    for (const d of c.dailyActivity) {
      const existing = dateMap.get(d.date) ?? {
        date: d.date,
        prsOpened: 0,
        prsMerged: 0,
        prsReviewed: 0,
        issuesOpened: 0,
        issuesClosed: 0,
        score: 0,
      };
      existing.prsOpened += d.prsOpened;
      existing.prsMerged += d.prsMerged;
      existing.prsReviewed += d.prsReviewed;
      existing.issuesOpened += d.issuesOpened;
      existing.issuesClosed += d.issuesClosed;
      existing.score += d.score;
      dateMap.set(d.date, existing);
    }
  }
  
  const dailyTotals = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // 3. Compute elapsed / remaining days
  const now = new Date();
  const start = new Date(config.eventStartDate);
  const end = new Date(config.eventEndDate);
  const msPerDay = 86_400_000;
  
  const daysElapsed = Math.max(
    0,
    Math.min(
      Math.ceil((now.getTime() - start.getTime()) / msPerDay),
      Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1
    )
  );
  
  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / msPerDay)
  );

  const stats: EventStats = {
    totalContributors: contributors.filter((c) => c.score > 0).length || contributors.length,
    totalPrsMerged: contributors.reduce((s, c) => s + c.prsMerged, 0),
    totalPrsOpened: contributors.reduce((s, c) => s + c.prsOpened, 0),
    totalIssuesClosed: contributors.reduce((s, c) => s + c.issuesClosed, 0),
    totalIssuesOpened: contributors.reduce((s, c) => s + c.issuesOpened, 0),
    totalPrsReviewed: contributors.reduce((s, c) => s + c.prsReviewed, 0),
    daysElapsed,
    daysRemaining,
  };

  const data: MergathonData = {
    lastUpdated: new Date().toISOString(),
    eventStartDate: config.eventStartDate,
    eventEndDate: config.eventEndDate,
    stats,
    teams,
    contributors: contributors.sort((a, b) => b.score - a.score),
    dailyTotals,
  };

  // 4. Write output to JSON
  const outDir = path.resolve(__dirname, "..", "public", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "mergathon-data.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Success! Leaderboard data saved to ${outPath}`);
}

main().catch((err) => {
  console.error("❌ Fatal dashboard generation crash:", err);
  process.exit(1);
});
