"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import allData from "../data.json";
import { useAuth } from "../lib/auth";

export default function Navbar({ savedCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState("light");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("revatlas_theme") || "light";
      setTheme(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
    } catch (e) {
      console.error(e);
    }

    // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("revatlas_theme", nextTheme);
  }

  const searchResults = query.trim()
    ? allData
        .filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.category.toLowerCase().includes(query.toLowerCase()) ||
            (c.founder && c.founder.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 7)
    : allData.slice(0, 5);

  return (
    <>
      <header className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <Link href="/" className="nav-logo">
              <span className="logo-icon">🌍</span>
              <span className="logo-text">RevAtlas</span>
              <span className="logo-badge">PRO</span>
            </Link>

            <nav className="nav-links">
              <Link
                href="/"
                className={`nav-link ${pathname === "/" ? "active" : ""}`}
              >
                Directory
              </Link>
              <Link
                href="/compare"
                className={`nav-link ${pathname === "/compare" ? "active" : ""}`}
              >
                Compare
              </Link>
              <Link
                href="/calculator"
                className={`nav-link ${pathname === "/calculator" ? "active" : ""}`}
              >
                Valuation Engine
              </Link>
              <Link
                href="/pricing"
                className={`nav-link ${pathname === "/pricing" ? "active" : ""}`}
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className={`nav-link ${pathname.startsWith("/dashboard") ? "active" : ""}`}
              >
                Dashboard
                {savedCount > 0 && <span className="nav-counter">{savedCount}</span>}
              </Link>
            </nav>
          </div>

          <div className="nav-right">
            {/* Command Palette Trigger */}
            <button
              className="cmd-palette-btn"
              onClick={() => setPaletteOpen(true)}
              title="Quick Search (Ctrl+K)"
            >
              <span>🔍 Quick Search...</span>
              <kbd className="cmd-kbd">⌘K</kbd>
            </button>

            {/* Dark / Light Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {/* Claim Profile CTA */}
            <Link href="/dashboard?tab=claim" className="btn-secondary btn-sm">
              + Claim Profile
            </Link>

            {/* User Pill or Auth Buttons */}
            {user ? (
              <div className="user-menu-wrap" style={{ position: "relative" }}>
                <button
                  type="button"
                  className="user-pill"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{ cursor: "pointer", background: "none", border: "1px solid var(--border)", textAlign: "left" }}
                >
                  <span className="user-avatar">
                    {user.user_metadata?.full_name
                      ? user.user_metadata.full_name.charAt(0).toUpperCase()
                      : user.email
                      ? user.email.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                  <div className="user-info">
                    <span className="user-name">
                      {user.user_metadata?.full_name || user.email?.split("@")[0] || "Member"}
                    </span>
                    <span className="user-tier">
                      {user.user_metadata?.role || "Pro Member"} · 88 Credits
                    </span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown-menu">
                    <Link
                      href="/dashboard"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      📊 Account Dashboard
                    </Link>
                    <Link
                      href="/dashboard?tab=claim"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      🏢 Claim SaaS Profile
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item text-danger"
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <Link href="/login" className="nav-btn-login">
                  Log In
                </Link>
                <Link href="/signup" className="btn-primary btn-sm">
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      {paletteOpen && (
        <div className="palette-backdrop" onClick={() => setPaletteOpen(false)}>
          <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
            <div className="palette-header">
              <span className="palette-icon">🔍</span>
              <input
                autoFocus
                className="palette-input"
                placeholder="Search SaaS by company, category or founder... (Esc to close)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="palette-close"
                onClick={() => setPaletteOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="palette-results">
              <div className="palette-category-label">
                {query.trim() ? "Search Results" : "Featured SaaS Companies"}
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.slug}
                  className="palette-item"
                  onClick={() => {
                    setPaletteOpen(false);
                    router.push(`/company/${item.slug}`);
                  }}
                >
                  <div className="palette-item-main">
                    <span className="palette-item-name">{item.name}</span>
                    <span className="palette-item-category">{item.category}</span>
                  </div>
                  <div className="palette-item-meta">
                    <span className="palette-item-rev">
                      ${(item.revenue / 1e6).toFixed(1)}M ARR
                    </span>
                    <span className="palette-item-arrow">→</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="palette-footer">
              <span>Pro Tip: Press <b>ESC</b> to close, <b>↑↓</b> to navigate</span>
              <Link
                href="/calculator"
                onClick={() => setPaletteOpen(false)}
                className="palette-footer-link"
              >
                Open Valuation Calculator ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
