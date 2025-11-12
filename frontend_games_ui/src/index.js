import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Entrypoint remains App, which now orchestrates login/selection/game flow.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
