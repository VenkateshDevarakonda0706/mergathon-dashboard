import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "../context/DataContext";
import DashboardLayout from "../components/DashboardLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CircuitVerse Mergathon Dashboard",
  description: "Analytics and participation leaderboard tracking for the CircuitVerse Mergathon event.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <DataProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </DataProvider>
      </body>
    </html>
  );
}

