import React, { useEffect } from 'react';
import './App.css';
import './index.css';
import RootApp from './RootApp';

/**
 * Thin wrapper to initialize theme from localStorage and render RootApp
 * which manages login -> selection -> gameplay flow.
 */
// PUBLIC_INTERFACE
function App() {
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', stored);
  }, []);

  return <RootApp />;
}

export default App;
