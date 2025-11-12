import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * UserContext provides global user state for the app (currently just username).
 * - Persists username to localStorage
 * - Exposes login/logout functions
 */
// PUBLIC_INTERFACE
export const UserContext = createContext(null);

// PUBLIC_INTERFACE
export function UserProvider({ children }) {
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem("username") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (username) localStorage.setItem("username", username);
      else localStorage.removeItem("username");
    } catch {
      // ignore storage errors
    }
  }, [username]);

  // PUBLIC_INTERFACE
  const login = (name) => {
    setUsername(name);
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    setUsername("");
  };

  const value = useMemo(() => ({ username, login, logout }), [username]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// PUBLIC_INTERFACE
export function useUser() {
  /** Access the current user context. */
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
