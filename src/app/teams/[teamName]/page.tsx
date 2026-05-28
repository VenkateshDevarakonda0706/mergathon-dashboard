import fs from "fs";
import path from "path";
import TeamDetail from "./TeamDetail";
import { MergathonData } from "../../../types";

/**
 * PageProps — Next.js App Router passes route params as a Promise.
 * For this route, the [teamName] segment becomes params.teamName.
 */
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ teamName: string }>;
}

/**
 * generateStaticParams()
 * ---------------------
 * This function runs at BUILD TIME to tell Next.js which team pages to pre-generate.
 * It reads the JSON data file and returns one entry per team.
 *
 * Why? Because the dashboard is deployed as a static site (Netlify),
 * so all pages must be known ahead of time.
 */
export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "mergathon-data.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data: MergathonData = JSON.parse(fileContent);

    // Return each team name as a param — Next.js will URL-encode it automatically
    return data.teams.map((t) => ({
      teamName: t.name,
    }));
  } catch (error) {
    console.error("⚠️ Error generating static params for teams:", error);
    return [];
  }
}

/**
 * TeamPage — Server Component
 * ---------------------------
 * This is the entry point for /teams/[teamName].
 * It extracts the team name from the URL and passes it to the client component.
 *
 * `decodeURIComponent` is needed because team names with spaces
 * (e.g., "The Debug Divas") get URL-encoded as "The%20Debug%20Divas" in the URL.
 */
export default async function TeamPage({ params }: PageProps) {
  const { teamName } = await params;

  // Decode URL-encoded characters (e.g., %20 → space)
  const decodedTeamName = decodeURIComponent(teamName);

  return <TeamDetail teamName={decodedTeamName} />;
}
