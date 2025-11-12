"use strict";

/**
 * Minimal tests for snake engine logic to verify:
 * - Wrap-around occurs on all borders (no game over on wall crossing)
 * - Self-collision triggers game over
 * - Food consumption increases score and grows snake
 */

import { createSnakeEngine, INITIAL_SNAKE_LENGTH } from "./snakeEngine";

// Helper to force deterministic food placement
function placeFoodAt(engine, x, y) {
  engine.state.food = { x, y };
}

test("wrap-around right edge: moving right from last column appears at column 0", () => {
  const eng = createSnakeEngine({ cols: 4, rows: 4, initialLength: INITIAL_SNAKE_LENGTH });
  eng.reset();

  eng.state.snake = [{ x: 3, y: 2 }];
  eng.state.dir = { x: 1, y: 0 };

  eng.step();

  expect(eng.state.gameOver).toBe(false);
  expect(eng.state.snake[0]).toEqual({ x: 0, y: 2 });
});

test("wrap-around left edge: moving left from column 0 appears at last column", () => {
  const eng = createSnakeEngine({ cols: 5, rows: 4, initialLength: INITIAL_SNAKE_LENGTH });
  eng.reset();

  eng.state.snake = [{ x: 0, y: 1 }];
  eng.state.dir = { x: -1, y: 0 };

  eng.step();

  expect(eng.state.gameOver).toBe(false);
  expect(eng.state.snake[0]).toEqual({ x: 4, y: 1 });
});

test("wrap-around bottom edge: moving down from last row appears at row 0", () => {
  const eng = createSnakeEngine({ cols: 6, rows: 3, initialLength: INITIAL_SNAKE_LENGTH });
  eng.reset();

  eng.state.snake = [{ x: 2, y: 2 }];
  eng.state.dir = { x: 0, y: 1 };

  eng.step();

  expect(eng.state.gameOver).toBe(false);
  expect(eng.state.snake[0]).toEqual({ x: 2, y: 0 });
});

test("wrap-around top edge: moving up from row 0 appears at last row", () => {
  const eng = createSnakeEngine({ cols: 6, rows: 4, initialLength: INITIAL_SNAKE_LENGTH });
  eng.reset();

  eng.state.snake = [{ x: 1, y: 0 }];
  eng.state.dir = { x: 0, y: -1 };

  eng.step();

  expect(eng.state.gameOver).toBe(false);
  expect(eng.state.snake[0]).toEqual({ x: 1, y: 3 });
});

test("food consumption grows snake and increments score", () => {
  const eng = createSnakeEngine({ cols: 6, rows: 6, initialLength: INITIAL_SNAKE_LENGTH });
  eng.reset();

  // Head at (2,3), direction right; place food at next cell (3,3)
  eng.state.snake = [{ x: 2, y: 3 }];
  eng.state.dir = { x: 1, y: 0 };
  placeFoodAt(eng, 3, 3);

  const lenBefore = eng.state.snake.length;
  eng.step();

  expect(eng.state.score).toBe(1);
  expect(eng.state.snake.length).toBe(lenBefore + 1);
  expect(eng.state.gameOver).toBe(false);
});

test("self-collision with old body causes game over", () => {
  const eng = createSnakeEngine({ cols: 10, rows: 10, initialLength: INITIAL_SNAKE_LENGTH });
  eng.reset();

  // Create a longer snake in a U shape:
  // Body coordinates (head first): (5,5) -> (5,6) -> (4,6) -> (4,5)
  // If we move left from (5,5), new head (4,5) overlaps old body[3]
  eng.state.snake = [
    { x: 5, y: 5 }, // head
    { x: 5, y: 6 },
    { x: 4, y: 6 },
    { x: 4, y: 5 },
  ];
  eng.state.dir = { x: -1, y: 0 }; // moving left into its own body

  eng.step();

  expect(eng.state.gameOver).toBe(true);
});
