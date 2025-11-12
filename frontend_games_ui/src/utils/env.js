"use strict";

/**
 * Safely read CRA environment variables (prefixed with REACT_APP_)
 * and parse feature flags JSON gracefully.
 *
 * Exposed utility returns:
 * {
 *   nodeEnv, logLevel, experimentsEnabled, featureFlags, raw
 * }
 */

// PUBLIC_INTERFACE
export function getEnv() {
  /** Read values from process.env with CRA prefix. */
  const raw = {
    REACT_APP_NODE_ENV: process.env.REACT_APP_NODE_ENV,
    REACT_APP_LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL,
    REACT_APP_FEATURE_FLAGS: process.env.REACT_APP_FEATURE_FLAGS,
    REACT_APP_EXPERIMENTS_ENABLED: process.env.REACT_APP_EXPERIMENTS_ENABLED,
  };

  const nodeEnv = raw.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development";
  const logLevel = (raw.REACT_APP_LOG_LEVEL || "info").toLowerCase();

  let featureFlags = {};
  try {
    if (raw.REACT_APP_FEATURE_FLAGS) {
      featureFlags = JSON.parse(raw.REACT_APP_FEATURE_FLAGS);
      if (typeof featureFlags !== "object" || Array.isArray(featureFlags)) {
        featureFlags = {};
      }
    }
  } catch (_err) {
    // Malformed JSON: leave flags empty but do not crash
    featureFlags = {};
  }

  const experimentsEnabled = String(raw.REACT_APP_EXPERIMENTS_ENABLED || "").toLowerCase() === "true";

  return {
    nodeEnv,
    logLevel,
    experimentsEnabled,
    featureFlags,
    raw,
  };
}
