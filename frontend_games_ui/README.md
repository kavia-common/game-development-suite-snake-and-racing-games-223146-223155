# Ocean Games UI (Snake + Racing)

A lightweight React front-end that showcases two canvas-based games (Snake and a Car Escape Racing game) with an Ocean Professional theme, tab navigation, and an environment-aware banner — implemented without adding new dependencies.

## Features

- Ocean Professional theme using CSS variables and smooth transitions
- Navbar with brand, theme toggle (light/dark), and tabs for Snake and Racing
- EnvBanner reading environment variables (safe parsing and non-prod display)
- Snake game:
  - Pure logic engine (grid, movement, growth, food, collisions, score)
  - Canvas rendering with keyboard controls (Arrow/WASD, Space to pause)
  - Start / Pause / Reset and adjustable speed
  - Status bar with score and ticks
- Racing (Car Escape) game:
  - Canvas-based avoidance gameplay
  - Left/Right arrow keys to steer; R to restart
  - Start / Pause / Restart controls
  - Score increases over time
- Feature flags to enable/disable Snake and the status bar
- Accessibility: ARIA labels, focus management, focus-visible outlines
- No additional NPM dependencies beyond React scripts

## Getting Started

1. Install dependencies
   npm install

2. Run development server
   npm start
The app runs at http://localhost:3000.

3. Build for production
   npm run build

## Environment Variables

Use a `.env` file at the project root (see .env.example for a template). For Create React App, env vars must be prefixed with REACT_APP_.

Available variables:
- REACT_APP_NODE_ENV: logical environment (development, staging, production)
- REACT_APP_LOG_LEVEL: info, debug, warn, error (free-form; used for banner only)
- REACT_APP_FEATURE_FLAGS: JSON string with feature flags
- REACT_APP_EXPERIMENTS_ENABLED: "true" to enable experiments (banner only)

Other container-level variables available but unused in code:
REACT_APP_API_BASE, REACT_APP_BACKEND_URL, REACT_APP_FRONTEND_URL, REACT_APP_WS_URL, REACT_APP_NEXT_TELEMETRY_DISABLED, REACT_APP_ENABLE_SOURCE_MAPS, REACT_APP_PORT, REACT_APP_TRUST_PROXY, REACT_APP_HEALTHCHECK_PATH

Example:
REACT_APP_NODE_ENV=development
REACT_APP_LOG_LEVEL=debug
REACT_APP_EXPERIMENTS_ENABLED=true
REACT_APP_FEATURE_FLAGS='{"enableSnake":true,"showStatusBar":true}'

Feature Flags:
- enableSnake: boolean (default true)
- showStatusBar: boolean (default true)

Flags are parsed safely; malformed JSON will be handled gracefully and not crash the app.

## Controls

Global:
- Theme toggle button (light/dark)

Snake:
- Arrow Keys or WASD to move
- Space to pause/resume
- Start, Pause, Reset buttons
- Speed selector (Slow/Normal/Fast/Extreme)

Racing (Car Escape):
- Left/Right Arrow keys to steer
- R to restart after crash
- Start, Pause, Restart buttons

## Accessibility

- ARIA roles and labels for nav, game, and status
- Focus management (canvas elements focusable)
- :focus-visible outline with high-contrast color

## Project Structure

src/
- App.js, App.css, index.css
- components/
  - EnvBanner.jsx
  - Navbar.jsx
  - StatusBar.jsx
- utils/
  - env.js
- games/
  - snake/
    - snakeEngine.js
    - SnakeGame.jsx
    - index.js
  - racing/
    - CarEscapeGame.jsx

## Security & Configuration Notes

- Do not hardcode secrets. Use environment variables.
- The EnvBanner hides itself in production (REACT_APP_NODE_ENV=production).

## License

MIT (for demo purposes)
