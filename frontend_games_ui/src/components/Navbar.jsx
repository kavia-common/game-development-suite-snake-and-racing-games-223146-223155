import React from "react";

/**
 * Navbar with brand, tabs, and theme toggle.
 * Props:
 * - brand: string
 * - theme: 'light'|'dark'
 * - onToggleTheme: () => void
 * - tabs: string[]
 * - activeTab: string
 * - onTabChange: (tab: string) => void
 */
// PUBLIC_INTERFACE
export default function Navbar({
  brand = "Ocean Games",
  theme = "light",
  onToggleTheme,
  tabs = [],
  activeTab,
  onTabChange,
}) {
  return (
    <nav className="navbar" aria-label="Top Navigation">
      <div className="navbar-inner">
        <div className="brand" aria-label="Brand">
          <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <path
              fill="url(#oceanGrad)"
              d="M2 12c3 0 3-3 6-3s3 3 6 3 3-3 6-3v8H2z"
            />
          </svg>
          <span className="title">{brand}</span>
        </div>

        <div className="spacer" />

        <div className="tabs" role="tablist" aria-label="Game tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              id={`tab-${tab}`}
              className="tab-btn"
              onClick={() => onTabChange && onTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="spacer" />

        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title="Toggle theme"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </nav>
  );
}
