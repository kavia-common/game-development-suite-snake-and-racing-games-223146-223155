import React from "react";

/**
 * Simple status bar that shows labeled values.
 * Props: items: Array<{label: string, value: React.ReactNode}>
 */
// PUBLIC_INTERFACE
export default function StatusBar({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="status-bar" aria-label="Game status">
      {items.map((it, idx) => (
        <span className="badge" key={`${it.label}-${idx}`}>
          <strong>{it.label}:</strong> {it.value}
        </span>
      ))}
    </div>
  );
}
