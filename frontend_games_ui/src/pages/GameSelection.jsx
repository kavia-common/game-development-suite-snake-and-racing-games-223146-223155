import React from "react";
import "../App.css";
import "../index.css";

/**
 * GameSelection page greets the user and provides navigation buttons to games.
 * Props:
 * - username: string
 * - onSelectGame: (gameKey: 'Snake' | 'Racing') => void
 * - onLogout: () => void
 */
// PUBLIC_INTERFACE
export default function GameSelection({ username, onSelectGame, onLogout }) {
  return (
    <div className="App app-root" style={{ minHeight: "100vh" }}>
      <main className="app-content" role="main">
        <div className="game-section" style={{ maxWidth: 720, margin: "36px auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: "0 0 6px 0" }}>Hello, {username} 👋</h2>
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                Choose a game to play.
              </p>
            </div>
            <button className="btn ghost" onClick={onLogout} aria-label="Log out">
              Log out
            </button>
          </div>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 18 }}>
            <button
              className="btn"
              onClick={() => onSelectGame("Snake")}
              aria-label="Play Snake"
              style={{ padding: "18px 12px", justifySelf: "stretch" }}
            >
              🐍 Play Snake
            </button>
            <button
              className="btn secondary"
              onClick={() => onSelectGame("Racing")}
              aria-label="Play Racing"
              style={{ padding: "18px 12px", justifySelf: "stretch" }}
            >
              🚗 Play Racing
            </button>
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <small>© {new Date().getFullYear()} Ocean Games Suite</small>
      </footer>
    </div>
  );
}
