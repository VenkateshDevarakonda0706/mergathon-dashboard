"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".header-capsule") && !target.closest(".mobile-nav-menu")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/teams", label: "Analytics" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <>
      <header className="header-capsule">
        {/* Brand logo section */}
        <div className="logo-section">
          <span className="logo-dot" />
          <span className="logo-text">CircuitVerse</span>
        </div>

        {/* Desktop nav pill links */}
        <nav className="nav-tabs">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-tab ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
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

          {/* Hamburger — only visible on mobile */}
          <button
            className={`hamburger-btn ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile dropdown nav — sits below the capsule */}
      {menuOpen && (
        <nav className="mobile-nav-menu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-nav-link ${pathname === link.href ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
