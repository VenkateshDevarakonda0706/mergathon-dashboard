"use client";

import { useData } from "../context/DataContext";
import Header from "./Header";
import { Loader2, AlertCircle } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useData();

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          backgroundColor: "#000000",
          color: "#f1f5f9",
        }}
      >
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--accent-emerald)" }} />
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            color: "var(--text-secondary)",
          }}
        >
          Loading CircuitVerse Mergathon...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          backgroundColor: "#000000",
          color: "#f1f5f9",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <AlertCircle size={64} style={{ color: "var(--accent-rose)" }} />
        <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Failed to Load Dashboard</h2>
        <p style={{ maxWidth: "480px", color: "var(--text-secondary)" }}>
          {error || "An unexpected error occurred while loading the event data."}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "16px",
            padding: "10px 24px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-emerald)",
            color: "#000000",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Centered Premium Floating Header Capsule */}
      <Header />

      {/* Centered Main content container */}
      <main className="app-container">{children}</main>
    </div>
  );
}
