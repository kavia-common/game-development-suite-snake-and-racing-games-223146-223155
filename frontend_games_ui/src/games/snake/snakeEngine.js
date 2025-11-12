"use strict";

/**
 * Pure snake engine: maintains grid, snake positions, food placement,
 * movement, growth, collision detection, and score.
 *
 * Self-collision rule:
 * - Compute the next head position (nx, ny)
 * - Compare it against the previous snake segments BEFORE moving the tail
 *   (this ensures the check is done against the "old" body)
 */

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

// PUBLIC_INTERFACE
export function createSnakeEngine({ cols = 20, rows = 20 } = {}) {
  const state = {
    cols,
    rows,
    snake: [], // array of {x,y}, head at index 0
    dir: { x: 1, y: 0 },
    pendingDir: null,
    food: null,
    score: 0,
    ticks: 0,
    gameOver: false,
  };

  // Initialize snake in the middle
  const midX = Math.floor(cols / 2);
  const midY = Math.floor(rows / 2);
  state.snake = [{ x: midX, y: midY }];

  /**
   * PUBLIC_INTERFACE
   * Change snake direction based on key input.
   * Prevents reversing into itself by disallowing 180-degree turns.
   */
  function changeDirection(key) {
    const k = String(key);
    const v = DIRS[k] || DIRS[k.toLowerCase()];
    if (!v) return;
    const next = v;
    if (state.dir.x + next.x === 0 && state.dir.y + next.y === 0) {
      return;
    }
    state.pendingDir = next;
  }

  /**
   * PUBLIC_INTERFACE
   * Place food at a random empty cell (not overlapping any snake segment).
   */
  function placeFood() {
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
      tries += 1;
      if (tries > 1000) break;
    } while (state.snake.some((seg) => seg.x === x && seg.y === y));
    state.food = { x, y };
  }

  /**
   * PUBLIC_INTERFACE
   * Reset the game to the initial state and place new food.
   */
  function reset() {
    state.snake = [{ x: midX, y: midY }];
    state.dir = { x: 1, y: 0 };
    state.pendingDir = null;
    state.food = null;
    state.score = 0;
    state.ticks = 0;
    state.gameOver = false;
    placeFood();
  }

  /**
   * PUBLIC_INTERFACE
   * Advance one tick:
   * - Apply pending direction
   * - Compute next head coordinates
   * - Check wall and self-collisions using previous body state
   * - Grow on food, otherwise move tail
   */
  function step() {
    if (state.gameOver) return state;

    // Apply pending direction if available (disallow instant reversal handled in changeDirection)
    if (state.pendingDir) {
      state.dir = state.pendingDir;
      state.pendingDir = null;
    }

    const head = state.snake[0];

    // Compute next position and wrap around edges (toroidal grid)
    // Using ((value % size) + size) % size to safely handle potential negatives
    let nx = head.x + state.dir.x;
    let ny = head.y + state.dir.y;
    nx = ((nx % cols) + cols) % cols;
    ny = ((ny % rows) + rows) % rows;

    // self collision:
    // Compare against the previous snake body (all segments except current head).
    // This uses the "old" body since we haven't moved tail yet.
    for (let i = 1; i < state.snake.length; i += 1) {
      const seg = state.snake[i];
      if (seg.x === nx && seg.y === ny) {
        state.gameOver = true;
        return state;
      }
    }

    const newHead = { x: nx, y: ny };
    state.snake.unshift(newHead);

    // food handling (growth)
    if (state.food && state.food.x === nx && state.food.y === ny) {
      state.score += 1;
      placeFood();
    } else {
      // move tail
      state.snake.pop();
    }

    state.ticks += 1;
    return state;
  }

  placeFood();

  return {
    state,
    changeDirection,
    placeFood,
    step,
    reset,
  };
}
