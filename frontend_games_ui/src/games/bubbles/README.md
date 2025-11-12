# Bubble Shooter (React Canvas)

This is a self-contained HTML5 canvas Bubble Shooter implemented as a React component.

How it works
- The component renders a 480x640 canvas wrapped by a themed container.
- A game loop runs via requestAnimationFrame, with setup and teardown inside useEffect.
- Mouse move aims the cannon; click shoots the current bubble.
- Bubbles attach to a grid and pop in clusters of 3+ of the same color.
- Floating bubbles (not connected to the top) drop after pops.
- Rows shift down periodically; when bubbles reach the bottom row, the game ends.
- Overlay shows “Game Over”; use Restart to play again.

Structure
- src/games/bubbles/BubbleShooter.jsx: main component
  - State is maintained with refs and internal hooks
  - Lifecycle: adds mouse listeners on mount, removes on unmount
  - Loop: update(dt) -> draw(ctx)
  - Helpers: createGrid, seedTopRows, popClusters, dropFloatingBubbles, shiftRowsDown, drawBubble, drawShooter

Controls
- Move mouse to aim
- Click to shoot
- Buttons:
  - Start: resume the game loop
  - Pause: pause updates
  - Restart: re-initialize the grid and score

Styling
- Canvas is 480x640.
- The wrapper uses a subtle gradient background aligned with the Ocean theme.
- Canvas has a local border and radius (no global body style changes).
- The component uses the shared “controls” and “canvas-wrap” classes for consistent UI styling.

Integration
- The game is available under the “Bubble Shooter” tab in the main app (RootApp).
- It is also accessible from the Game Selection screen.
- No external dependencies, no globals leaked to window.

Type Notes
- This project uses plain JavaScript + React; all typing is implicit.
- If migrating to TypeScript, type canvas ref as HTMLCanvasElement | null and store the RAF id as number.
