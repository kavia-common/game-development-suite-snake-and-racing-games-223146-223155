import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StatusBar from "../../components/StatusBar";
import { createSnakeEngine, INITIAL_SNAKE_LENGTH } from "./snakeEngine";

/**
 * Canvas-based Snake game component.
 * - Renders a grid snake game using a pure engine that operates in grid units.
 * - Renderer translates grid cells to pixels based on the selected cellSize preset.
 * - Provides controls for Start, Pause, Reset, Speed, Cell Size, and Initial Length presets.
 *
 * Props:
 * - showStatusBar?: boolean = true
 *
 * PUBLIC_INTERFACE
 */
export default function SnakeGame({ showStatusBar = true }) {
  // Grid size is fixed in grid cells; renderer maps to pixels using cellSize preset.
  const COLS = 20;
  const ROWS = 20;

  // Presets
  const cellSizeOptions = [16, 24, 32];
  const initialLengthOptions = [10, 15, 20, 25, 30];

  const [cellSize, setCellSize] = useState(32); // larger default per requirements
  const [initialLength, setInitialLength] = useState(INITIAL_SNAKE_LENGTH); // 20 by default
  const [speed, setSpeed] = useState("normal"); // slow | normal | fast | extreme
  const [running, setRunning] = useState(false);

  // Timing (ms per tick) based on speed
  const tickMs = useMemo(() => {
    switch (speed) {
      case "slow":
        return 180;
      case "fast":
        return 90;
      case "extreme":
        return 55;
      default:
        return 120;
    }
  }, [speed]);

  // Canvas refs and loop
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const engineRef = useRef(null);

  // Initialize engine
  const initEngine = useCallback(() => {
    engineRef.current = createSnakeEngine({
      cols: COLS,
      rows: ROWS,
      initialLength,
    });
  }, [initialLength]);

  // Draw function maps grid to canvas pixels
  const draw = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = COLS * cellSize;
    const h = ROWS * cellSize;

    // background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, w, h);

    // grid (light)
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(w, y * cellSize + 0.5);
      ctx.stroke();
    }

    // food
    if (eng.state.food) {
      const fx = eng.state.food.x * cellSize;
      const fy = eng.state.food.y * cellSize;
      ctx.fillStyle = "#F59E0B";
      const pad = Math.max(2, Math.floor(cellSize * 0.15));
      ctx.fillRect(fx + pad, fy + pad, cellSize - pad * 2, cellSize - pad * 2);
    }

    // snake
    const segPad = Math.max(1, Math.floor(cellSize * 0.1));
    eng.state.snake.forEach((seg, idx) => {
      const sx = seg.x * cellSize;
      const sy = seg.y * cellSize;
      // head with accent
      if (idx === 0) {
        ctx.fillStyle = "#60A5FA";
        ctx.fillRect(sx + segPad, sy + segPad, cellSize - segPad * 2, cellSize - segPad * 2);
        ctx.fillStyle = "#2563EB";
        ctx.fillRect(
          sx + segPad,
          sy + segPad,
          cellSize - segPad * 2,
          Math.max(3, Math.floor((cellSize - segPad * 2) / 3))
        );
      } else {
        ctx.fillStyle = "#2563EB";
        ctx.fillRect(sx + segPad, sy + segPad, cellSize - segPad * 2, cellSize - segPad * 2);
      }
    });
  }, [cellSize]);

  // Step and redraw
  const step = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.step();
    draw();
  }, [draw]);

  // Controls
  const start = () => {
    if (engineRef.current?.state.gameOver) return;
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    engineRef.current?.reset();
    setRunning(false);
    draw();
  };

  // Input
  useEffect(() => {
    const onKey = (e) => {
      if (!engineRef.current) return;
      if (e.key === " ") {
        setRunning((r) => !r);
        e.preventDefault();
        return;
      }
      engineRef.current.changeDirection(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Recreate engine when initialLength changes (Reset behavior expected)
  useEffect(() => {
    initEngine();
    draw();
  }, [initEngine, draw]);

  // Manage game loop interval based on running and speed
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (running) {
      intervalRef.current = setInterval(step, tickMs);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, tickMs, step]);

  // Resize canvas when cellSize changes
  const canvasWidth = COLS * cellSize;
  const canvasHeight = ROWS * cellSize;

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

        <label style={{ marginLeft: 10 }}>
          <span style={{ marginRight: 6, color: "var(--text-secondary)" }}>Speed</span>
          <select
            className="select"
            aria-label="Speed selector"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
            <option value="extreme">Extreme</option>
          </select>
        </label>

        <label style={{ marginLeft: 10 }}>
          <span style={{ marginRight: 6, color: "var(--text-secondary)" }}>Cell Size</span>
          <select
            className="select"
            aria-label="Cell size selector"
            value={cellSize}
            onChange={(e) => setCellSize(parseInt(e.target.value, 10))}
          >
            {cellSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: 10 }}>
          <span style={{ marginRight: 6, color: "var(--text-secondary)" }}>Initial Length</span>
          <select
            className="select"
            aria-label="Initial length selector"
            value={initialLength}
            onChange={(e) => setInitialLength(parseInt(e.target.value, 10))}
          >
            {initialLengthOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
          Controls: Arrow Keys or WASD, Space to Pause
        </span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          role="img"
          aria-label="Snake game canvas"
          tabIndex={0}
          style={{ display: "block", outline: "none", background: "transparent" }}
        />
      </div>

      {showStatusBar && engineRef.current && (
        <StatusBar
          items={[
            { label: "Score", value: engineRef.current.state.score },
            { label: "Ticks", value: engineRef.current.state.ticks },
            { label: "Cell", value: `${cellSize}px` },
          ]}
        />
      )}
    </div>
  );
}
