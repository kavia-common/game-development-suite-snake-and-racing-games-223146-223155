import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import EnvBanner from './components/EnvBanner';
import Navbar from './components/Navbar';
import SnakeGame from './games/snake';
import RacingGame from './games/racing/RacingGame';
import { getEnv } from './utils/env';

/**
 * Root application with Ocean Professional theme, navbar, tabs, and games.
 * - Tabs: Snake (default) and Racing
 * - Theme toggle: light/dark; persisted to localStorage
 * - Env banner shows non-production details
 * - Feature flags control visibility of games
 */
// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored || 'light';
  });

  const env = useMemo(() => getEnv(), []);
  const featureFlags = env.featureFlags || {};
  const enabledTabs = [
    featureFlags.enableSnake !== false ? 'Snake' : null,
    featureFlags.enableRacing !== false ? 'Racing' : null,
  ].filter(Boolean);

  const [activeTab, setActiveTab] = useState(() => {
    // default Snake, else first enabled
    if (featureFlags.enableSnake !== false) return 'Snake';
    return enabledTabs[0] || 'Snake';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Ensure active tab is valid when flags change (on first render)
  useEffect(() => {
    if (!enabledTabs.includes(activeTab) && enabledTabs.length > 0) {
      setActiveTab(enabledTabs[0]);
    }
  }, [activeTab, enabledTabs]);

  return (
    <div className="App app-root">
      <EnvBanner env={env} />
      <Navbar
        brand="Ocean Games"
        theme={theme}
        onToggleTheme={toggleTheme}
        tabs={enabledTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="app-content" role="main">
        {activeTab === 'Snake' && featureFlags.enableSnake !== false && (
          <section aria-label="Snake game section" className="game-section">
            <SnakeGame showStatusBar={featureFlags.showStatusBar !== false} />
          </section>
        )}
        {activeTab === 'Racing' && featureFlags.enableRacing !== false && (
          <section aria-label="Racing game section" className="game-section">
            <RacingGame showStatusBar={featureFlags.showStatusBar !== false} />
          </section>
        )}
        {enabledTabs.length === 0 && (
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
