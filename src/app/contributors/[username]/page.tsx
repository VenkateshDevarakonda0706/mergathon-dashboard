import fs from "fs";
import path from "path";
import ContributorProfile from "./ContributorProfile";
import { MergathonData } from "../../../types";

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ username: string }>;
}

// Generate static params for all registered contributors for Netlify static export
export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "mergathon-data.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data: MergathonData = JSON.parse(fileContent);
    
    return data.contributors.map((c) => ({
      username: c.username,
    }));
  } catch (error) {
    console.error("⚠️ Error generating static params for contributors:", error);
    return [];
  }
}

export default async function ContributorPage({ params }: PageProps) {
  const { username } = await params;
  
  return <ContributorProfile username={username} />;
}
