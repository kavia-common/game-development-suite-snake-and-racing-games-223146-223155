import React, { useCallback, useEffect, useRef, useState } from "react";
import { createSnakeEngine, INITIAL_SNAKE_LENGTH } from "./snakeEngine";
import StatusBar from "../../components/StatusBar";

/**
 * Canvas-based Snake game. Uses refs for animation state to avoid excessive re-renders.
 * Controls: Arrow keys or WASD.
 * Buttons: Start, Pause, Reset; Speed selection.
 */
// PUBLIC_INTERFACE
export default function SnakeGame({ showStatusBar = true, initialLength = INITIAL_SNAKE_LENGTH }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const loopAccumRef = useRef(0);

  const engineRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(120); // tick every ms

  const cellSize = 20;
  const cols = 24;
  const rows = 20;
  const width = cols * cellSize;
  const height = rows * cellSize;

  // initialize engine
  useEffect(() => {
    engineRef.current = createSnakeEngine({ cols, rows, initialLength });
    // reset to ensure food present
    engineRef.current.reset();
  }, [cols, rows, initialLength]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      if (!engineRef.current) return;
      engineRef.current.changeDirection(e.key);
      if (e.key === " " || e.code === "Space") {
        // space toggles pause
        setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const draw = useCallback((ctx, eng) => {
    const { state } = eng;
    // background
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);

    // grid subtle
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // snake
    state.snake.forEach((seg, idx) => {
      const gx = seg.x * cellSize;
      const gy = seg.y * cellSize;
      ctx.fillStyle = idx === 0 ? "#F59E0B" : "#64B5F6";
      ctx.fillRect(gx + 2, gy + 2, cellSize - 4, cellSize - 4);
    });

    // food
    if (state.food) {
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.arc(
        state.food.x * cellSize + cellSize / 2,
        state.food.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // game over overlay
    if (state.gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", width / 2, height / 2);
      ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("Press Reset to try again", width / 2, height / 2 + 28);
    }
  }, []);

  const loop = useCallback(
    (ts) => {
      const eng = engineRef.current;
      if (!eng) return;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const dt = ts - (lastTimeRef.current || ts);
      lastTimeRef.current = ts;
      loopAccumRef.current += dt;

      if (running && loopAccumRef.current >= speedMs) {
        loopAccumRef.current = 0;
        eng.step();
        if (eng.state.gameOver) {
          setRunning(false);
        }
      }

      draw(ctx, eng);
      rafRef.current = requestAnimationFrame(loop);
    },
    [draw, running, speedMs]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  const start = () => {
    if (engineRef.current?.state.gameOver) {
      engineRef.current.reset();
    }
    setRunning(true);
    canvasRef.current?.focus();
  };
  const pause = () => setRunning(false);
  const reset = () => {
    engineRef.current?.reset();
    setRunning(false);
  };

  return (
    <div>
      <div className="controls" aria-label="Snake controls">
        <button className="btn" onClick={start} aria-label="Start snake game">
          ▶ Start
        </button>
        <button className="btn ghost" onClick={pause} aria-label="Pause snake game">
          ⏸ Pause
        </button>
        <button className="btn secondary" onClick={reset} aria-label="Reset snake game">
          ↺ Reset
        </button>
        <label htmlFor="snake-speed" style={{ marginLeft: 8 }}>
          Speed:
        </label>
        <select
          id="snake-speed"
          className="select"
          value={speedMs}
          onChange={(e) => setSpeedMs(Number(e.target.value))}
          aria-label="Snake speed"
        >
          <option value={200}>Slow</option>
          <option value={120}>Normal</option>
          <option value={70}>Fast</option>
          <option value={40}>Extreme</option>
        </select>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
          Controls: Arrow Keys or WASD, Space to Pause
        </span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          role="img"
          aria-label="Snake game canvas"
          tabIndex={0}
          style={{ display: "block", outline: "none" }}
        />
      </div>

      {showStatusBar && engineRef.current && (
        <StatusBar
          items={[
            { label: "Score", value: engineRef.current.state.score },
            { label: "Ticks", value: engineRef.current.state.ticks },
          ]}
        />
      )}
    </div>
  );
}
