import React, { useMemo, useState } from "react";
import "./App.css";
import "./index.css";
import { getEnv } from "./utils/env";
import { UserProvider, useUser } from "./context/UserContext";
import EnvBanner from "./components/EnvBanner";
import Navbar from "./components/Navbar";
import SnakeGame from "./games/snake/SnakeGame";
import CarEscapeGame from "./games/racing/CarEscapeGame";
import BubbleShooter from "./games/bubbles/BubbleShooter";
import Login from "./pages/Login";
import GameSelection from "./pages/GameSelection";

/**
 * RootApp composes the login -> selection -> game flow using simple internal state.
 * No external router is used; we manage "routes" via local state.
 *
 * Views:
 * - "login": capture username
 * - "select": game selection hub
 * - "game": show the main app with Navbar + tabs for Snake/Racing
 */
// PUBLIC_INTERFACE
export default function RootApp() {
  return (
    <UserProvider>
      <RootFlow />
    </UserProvider>
  );
}

function RootFlow() {
  const env = useMemo(() => getEnv(), []);
  const featureFlags = env.featureFlags || {};
  const { username, login, logout } = useUser();

  // tabs for the gameplay app
  const tabs = [];
  if (featureFlags.enableSnake !== false) tabs.push("Snake");
  tabs.push("Racing");
  tabs.push("Bubble Shooter");

  const initialTab = tabs[0] || "Racing";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [view, setView] = useState(() => {
    // If no username -> login, else selection
    return username ? "select" : "login";
  });

  const onLogin = (name) => {
    login(name);
    setView("select");
  };

  const onSelectGame = (gameKey) => {
    setActiveTab(tabs.includes(gameKey) ? gameKey : initialTab);
    setView("game");
  };

  const onLogout = () => {
    logout();
    setView("login");
  };

  if (view === "login") {
    return <Login onLogin={onLogin} />;
  }

  if (view === "select") {
    return (
      <div className="App app-root">
        <EnvBanner env={env} />
        <Navbar
          brand="Ocean Games"
          theme={document.documentElement.getAttribute("data-theme") || "light"}
          onToggleTheme={() => {
            const cur = document.documentElement.getAttribute("data-theme") || "light";
            const next = cur === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("theme", next);
          }}
          tabs={[]}
          activeTab=""
          onTabChange={() => {}}
        />
        <GameSelection username={username} onSelectGame={onSelectGame} onLogout={onLogout} />
      </div>
    );
  }

  // view === "game"
  return (
    <div className="App app-root">
      <EnvBanner env={env} />
      <Navbar
        brand="Ocean Games"
        theme={document.documentElement.getAttribute("data-theme") || "light"}
        onToggleTheme={() => {
          const cur = document.documentElement.getAttribute("data-theme") || "light";
          const next = cur === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", next);
          localStorage.setItem("theme", next);
        }}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="app-content" role="main">
        {activeTab === "Snake" && featureFlags.enableSnake !== false && (
          <section
            aria-label="Snake game section"
            className="game-section"
            id="panel-Snake"
            role="tabpanel"
            aria-labelledby="tab-Snake"
          >
            <SnakeGame showStatusBar={featureFlags.showStatusBar !== false} />
          </section>
        )}
        {activeTab === "Racing" && (
          <section
            aria-label="Racing game section"
            className="game-section"
            id="panel-Racing"
            role="tabpanel"
            aria-labelledby="tab-Racing"
          >
            <CarEscapeGame width={400} height={600} />
          </section>
        )}
        {activeTab === "Bubble Shooter" && (
          <section
            aria-label="Bubble Shooter game section"
            className="game-section"
            id="panel-Bubble Shooter"
            role="tabpanel"
            aria-labelledby="tab-Bubble Shooter"
          >
            <BubbleShooter width={480} height={640} />
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
