export interface DailyActivity {
  date: string;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  score: number;
}

export interface ContributionItem {
  type: 'pr_opened' | 'pr_merged' | 'issue_opened' | 'issue_closed';
  title: string;
  url: string;
  repo: string;
  date: string;
  /** The point value this individual contribution earned (e.g., 1, 3, or 5) */
  points: number;
}

export interface Contributor {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  team: string;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  issuesPrClosedScore: number;
  prsMergedScore: number;
  score: number;
  activityLevel: 'High' | 'Medium' | 'Low';
  dailyActivity: DailyActivity[];
  contributions: ContributionItem[];
}

export interface Team {
  name: string;
  color: string;
  members: string[];
  totalScore: number;
  totalPrsMerged: number;
  totalPrsOpened: number;
  totalIssuesClosed: number;
  totalIssuesOpened: number;
}

export interface EventStats {
  totalContributors: number;
  totalPrsMerged: number;
  totalPrsOpened: number;
  totalIssuesClosed: number;
  totalIssuesOpened: number;
  daysElapsed: number;
  daysRemaining: number;
}

export interface MergathonData {
  lastUpdated: string;
  eventStartDate: string;
  eventEndDate: string;
  stats: EventStats;
  teams: Team[];
  contributors: Contributor[];
  dailyTotals: DailyActivity[];
}
