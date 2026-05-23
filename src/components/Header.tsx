"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header-capsule">
      {/* Brand logo section */}
      <div className="logo-section">
        <span className="logo-dot" />
        <span className="logo-text">CircuitVerse</span>
      </div>

      {/* Nav pill links */}
      <nav className="nav-tabs">
        <Link 
          href="/" 
          className={`nav-tab ${pathname === "/" ? "active" : ""}`}
        >
          Home
        </Link>
        <Link 
          href="/leaderboard" 
          className={`nav-tab ${pathname === "/leaderboard" ? "active" : ""}`}
        >
          Leaderboard
        </Link>
        <Link 
          href="/teams" 
          className={`nav-tab ${pathname === "/teams" ? "active" : ""}`}
        >
          Analytics
        </Link>
        <Link 
          href="/admin" 
          className={`nav-tab ${pathname === "/admin" ? "active" : ""}`}
        >
          Admin
        </Link>
      </nav>

      {/* Right side controls */}
      <div className="header-status">
        <span className="time-badge">this minute</span>
        <button 
          className="header-btn" 
          onClick={() => window.location.reload()}
          title="Refresh Data"
        >
          R
        </button>
        <a 
          href="https://github.com/CircuitVerse/CircuitVerse" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="header-btn"
          title="GitHub Repository"
        >
          GH
        </a>
      </div>
    </header>
  );
}

