"use strict";

/**
 * Pure snake engine: maintains grid, snake positions, food placement,
 * movement, growth, collision detection, and score.
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

  // PUBLIC_INTERFACE
  function changeDirection(key) {
    const k = String(key);
    const v = DIRS[k] || DIRS[k.toLowerCase()];
    if (!v) return;
    // Prevent reversing into itself
    const next = v;
    if (state.dir.x + next.x === 0 && state.dir.y + next.y === 0) {
      return;
    }
    state.pendingDir = next;
  }

  // PUBLIC_INTERFACE
  function placeFood() {
    // place at random empty cell
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
      tries += 1;
      if (tries > 1000) break;
    } while (state.snake.some(s => s.x === x && s.y === y));
    state.food = { x, y };
  }

  // PUBLIC_INTERFACE
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

  // PUBLIC_INTERFACE
  function step() {
    if (state.gameOver) return state;

    if (state.pendingDir) {
      state.dir = state.pendingDir;
      state.pendingDir = null;
    }

    const head = state.snake[0];
    const nx = head.x + state.dir.x;
    const ny = head.y + state.dir.y;

    // bounds collision
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
      state.gameOver = true;
      return state;
    }

    // self collision
    if (state.snake.some((s, i) => i !== 0 && s.x === nx && s.y === ny)) {
      state.gameOver = true;
      return state;
    }

    const newHead = { x: nx, y: ny };
    state.snake.unshift(newHead);

    // food
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
