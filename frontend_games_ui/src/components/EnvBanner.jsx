import React from "react";

/**
 * Displays environment info when not in production; hides in production.
 * Reads props.env as provided by utils/getEnv.
 *
 * Accessibility: role="status" and aria-live for non-intrusive updates.
 */
// PUBLIC_INTERFACE
export default function EnvBanner({ env }) {
  const isProd = (env.nodeEnv || "").toLowerCase() === "production";
  if (isProd) return null;

  const flagsText = (() => {
    try {
      return JSON.stringify(env.featureFlags || {});
    } catch {
      return "{}";
    }
  })();

  return (
    <div
      className="env-banner"
      role="status"
      aria-live="polite"
      style={{
        background:
          "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(245,158,11,0.15))",
        color: "inherit",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "6px 16px",
          fontSize: 12,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <strong>Environment:</strong> {env.nodeEnv} · <strong>Log:</strong>{" "}
        {env.logLevel} · <strong>Experiments:</strong>{" "}
        {env.experimentsEnabled ? "enabled" : "disabled"} · <strong>Flags:</strong>{" "}
        <span style={{ fontFamily: "monospace" }}>{flagsText}</span>
      </div>
    </div>
  );
}
