import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import EnvBanner from './components/EnvBanner';
import Navbar from './components/Navbar';
import SnakeGame from './games/snake/SnakeGame';
import CarEscapeGame from './games/racing/CarEscapeGame';
import { getEnv } from './utils/env';

/**
 * Root application with Ocean Professional theme, navbar, and tabs for Snake and Racing.
 * - Tabs: Snake, Racing
 * - Theme toggle: light/dark; persisted to localStorage
 * - Env banner shows non-production details
 * - Feature flags: enableSnake/showStatusBar respected (Racing always available; no extra deps)
 */
// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored || 'light';
  });

  const env = useMemo(() => getEnv(), []);
  const featureFlags = env.featureFlags || {};

  // Determine tabs: Always include Racing; include Snake if not explicitly disabled
  const tabs = [];
  if (featureFlags.enableSnake !== false) tabs.push('Snake');
  tabs.push('Racing');

  const [activeTab, setActiveTab] = useState(() => {
    // default to Snake if enabled, else Racing
    if (featureFlags.enableSnake !== false) return 'Snake';
    return 'Racing';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Ensure active tab is valid if flags change (initial mount)
  useEffect(() => {
    if (!tabs.includes(activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0]);
    }
  }, [activeTab, tabs]);

  return (
    <div className="App app-root">
      <EnvBanner env={env} />
      <Navbar
        brand="Ocean Games"
        theme={theme}
        onToggleTheme={toggleTheme}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="app-content" role="main">
        {activeTab === 'Snake' && featureFlags.enableSnake !== false && (
          <section aria-label="Snake game section" className="game-section" id="panel-Snake" role="tabpanel" aria-labelledby="tab-Snake">
            <SnakeGame showStatusBar={featureFlags.showStatusBar !== false} />
          </section>
        )}
        {activeTab === 'Racing' && (
          <section aria-label="Racing game section" className="game-section" id="panel-Racing" role="tabpanel" aria-labelledby="tab-Racing">
            <CarEscapeGame width={400} height={600} />
          </section>
        )}
        {tabs.length === 0 && (
          <div className="empty-state" role="note" aria-live="polite">
            No games are enabled. Update REACT_APP_FEATURE_FLAGS to enable features.
          </div>
        )}
      </main>
      <footer className="app-footer" aria-label="Footer">
        <small>© {new Date().getFullYear()} Ocean Games Suite</small>
      </footer>
    </div>
  );
}

export default App;
