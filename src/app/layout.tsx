import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { DataProvider } from "../context/DataContext";
import DashboardLayout from "../components/DashboardLayout";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CircuitVerse Mergathon Dashboard",
  description:
    "Analytics and participation leaderboard tracking for the CircuitVerse Mergathon event.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <DataProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </DataProvider>
      </body>
    </html>
  );
}
