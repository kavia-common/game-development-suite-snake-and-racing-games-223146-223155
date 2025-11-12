import React, { useEffect, useState } from "react";
import "../App.css";
import "../index.css";

/**
 * Login page that captures a username with validation.
 * - Validates: 2-20 chars, letters/numbers/underscore/hyphen only
 * - On success calls onLogin(username)
 */
// PUBLIC_INTERFACE
export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [name]);

  const validate = (value) => {
    const v = value.trim();
    if (v.length < 2) return "Please enter at least 2 characters.";
    if (v.length > 20) return "Please keep it under 20 characters.";
    if (!/^[a-zA-Z0-9_-]+$/.test(v)) {
      return "Use letters, numbers, underscore or hyphen only.";
    }
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = validate(name);
    if (msg) {
      setError(msg);
      return;
    }
    onLogin(name.trim());
  };

  return (
    <div className="App app-root" style={{ minHeight: "100vh" }}>
      <main className="app-content" role="main">
        <div className="game-section" style={{ maxWidth: 520, margin: "48px auto" }}>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>Welcome to Ocean Games</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 0 }}>
            Please enter a username to continue.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <label htmlFor="username"><strong>Username</strong></label>
              <input
                id="username"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., player_one"
                aria-describedby={error ? "username-error" : undefined}
                aria-invalid={!!error}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-primary)",
                }}
              />
              {error && (
                <div
                  id="username-error"
                  role="alert"
                  style={{ color: "var(--ocean-error)", fontSize: 13 }}
                >
                  {error}
                </div>
              )}
              <button type="submit" className="btn" style={{ marginTop: 8 }}>
                Continue
              </button>
            </div>
          </form>
        </div>
      </main>
      <footer className="app-footer">
        <small>© {new Date().getFullYear()} Ocean Games Suite</small>
      </footer>
    </div>
  );
}
