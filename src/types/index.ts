export interface DailyActivity {
  date: string;
  prsOpened: number;
  prsMerged: number;
  prsReviewed: number;
  issuesOpened: number;
  issuesClosed: number;
  score: number;
}

export interface ContributionItem {
  type: 'pr_opened' | 'pr_merged' | 'pr_reviewed' | 'issue_opened' | 'issue_closed';
  title: string;
  url: string;
  repo: string;
  date: string;
}

export interface Contributor {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  team: string;
  prsOpened: number;
  prsMerged: number;
  prsReviewed: number;
  issuesOpened: number;
  issuesClosed: number;
  issuesPrClosedScore: number;
  prsMergedScore: number;
  prsReviewedScore: number;
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
  totalPrsReviewed: number;
  totalIssuesClosed: number;
  totalIssuesOpened: number;
}

export interface EventStats {
  totalContributors: number;
  totalPrsMerged: number;
  totalPrsOpened: number;
  totalIssuesClosed: number;
  totalIssuesOpened: number;
  totalPrsReviewed: number;
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
