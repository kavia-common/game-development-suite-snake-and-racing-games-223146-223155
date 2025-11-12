import React, { useEffect, useRef, useState } from "react";

/**
 * BuildingBlocks
 *
 * A simple stacking blocks game using HTML5 canvas.
 * - A moving block travels horizontally across the top
 * - Click (or tap) to drop the block
 * - Blocks stack; if a dropped block misses the stack -> game over
 * - Score counts the number of successfully stacked blocks
 * - Click after game over to restart
 *
 * Canvas styling (local only):
 * - background: #dbeafe
 * - border: 3px solid #3b82f6
 * - borderRadius: 10px
 *
 * Cleanup:
 * - Cancels animation frame
 * - Removes event listeners on unmount
 */
// PUBLIC_INTERFACE
export default function BuildingBlocks({ width = 400, height = 600 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // UI state
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  // Game refs
  const blocksRef = useRef([]); // stacked blocks
  const movingRef = useRef(null); // current moving block
  const lastTsRef = useRef(0);

  // Constants
  const BLOCK_WIDTH = 80;
  const BLOCK_HEIGHT = 20;
  const GRAVITY = 0.35; // pixels per ms^2 scaled
  const COLORS = ["#2563EB", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#F472B6", "#1E3A8A"];

  // Initialize on mount
  useEffect(() => {
    init();

    const onClick = () => {
      if (gameOver) {
        // restart on click when game over
        reset();
        return;
      }
      dropBlock();
    };

    const canvas = canvasRef.current;
    canvas?.addEventListener("click", onClick);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas?.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  function init() {
    // Ground block base (spans width of canvas)
    const base = {
      x: 0,
      y: height - BLOCK_HEIGHT,
      w: width,
      h: BLOCK_HEIGHT,
      color: "#1E3A8A",
      static: true,
      falling: false,
      vy: 0,
    };
    blocksRef.current = [base];
    createMovingBlock();
    setScore(0);
    setGameOver(false);
    setRunning(true);
    lastTsRef.current = 0;
  }

  function reset() {
    init();
  }

  function createMovingBlock() {
    // Moving block starts near top
    const y = 80;
    const margin = 16;
    const w = BLOCK_WIDTH;
    const speed = 2.2; // horizontal speed
    const startLeft = Math.random() < 0.5;

    movingRef.current = {
      x: startLeft ? margin : width - margin - w,
      y,
      w,
      h: BLOCK_HEIGHT,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      vx: startLeft ? speed : -speed, // bounce across
      falling: false,
      vy: 0,
    };
  }

  function dropBlock() {
    if (!movingRef.current || movingRef.current.falling) return;
    movingRef.current.falling = true;
    movingRef.current.vy = 0;
  }

  function update(dt) {
    if (!running || gameOver) return;

    // Move moving block horizontally or falling
    const mb = movingRef.current;
    if (mb) {
      if (!mb.falling) {
        // simple horizontal bounce
        mb.x += mb.vx * (dt / 16.6667);
        if (mb.x <= 0) {
          mb.x = 0;
          mb.vx *= -1;
        }
        if (mb.x + mb.w >= width) {
          mb.x = width - mb.w;
          mb.vx *= -1;
        }
      } else {
        // falling under gravity
        mb.vy += GRAVITY * (dt / 16.6667);
        mb.y += mb.vy * (dt / 16.6667);

        // collision with stack (check against topmost non-moving block)
        const top = topOfStack();
        if (top && rectsOverlap(mb, top)) {
          // snap on top and add to stack
          const snapped = {
            x: mb.x,
            y: top.y - mb.h,
            w: mb.w,
            h: mb.h,
            color: mb.color,
            static: true,
            falling: false,
            vy: 0,
          };
          blocksRef.current.push(snapped);
          setScore((s) => s + 1);
          // spawn new mover
          createMovingBlock();
        } else if (mb.y + mb.h >= height) {
          // missed -> game over
          setRunning(false);
          setGameOver(true);
        }
      }
    }
  }

  function topOfStack() {
    // last in blocksRef is the topmost stacked block (after base)
    const arr = blocksRef.current;
    return arr[arr.length - 1] || null;
  }

  function rectsOverlap(a, b) {
    return !(
      a.x + a.w < b.x ||
      a.x > b.x + b.w ||
      a.y + a.h < b.y ||
      a.y > b.y + b.h
    );
  }

  function drawBlock(ctx, b) {
    // subtle shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(b.x + 2, b.y + 2, b.w, b.h);

    // body
    const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.15, "rgba(255,255,255,0.85)");
    grad.addColorStop(0.2, b.color);
    grad.addColorStop(1, b.color);
    ctx.fillStyle = grad;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // top highlight line
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(b.x, b.y, b.w, 2);
  }

  function draw(ctx) {
    // sky background gradient to fit theme
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "rgba(59,130,246,0.15)"); // blue-500/15
    bgGrad.addColorStop(1, "rgba(245,158,11,0.06)"); // amber-500/06
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // HUD Title and Score
    ctx.fillStyle = "#1e3a8a"; // deep blue text as guidance suggested
    ctx.font = "bold 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText("Building Blocks", 12, 24);
    ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(`Score: ${score}`, 12, 46);

    // Draw stacked blocks
    for (const b of blocksRef.current) {
      drawBlock(ctx, b);
    }

    // Draw moving block
    if (movingRef.current) {
      drawBlock(ctx, movingRef.current);
    }

    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("Game Over", width / 2, height / 2 - 8);
      ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("Click to Restart", width / 2, height / 2 + 20);
      ctx.textAlign = "start";
    }
  }

  const loop = (ts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!lastTsRef.current) lastTsRef.current = ts;
    const dt = ts - lastTsRef.current;
    lastTsRef.current = ts;

    update(dt);
    draw(ctx);

    rafRef.current = requestAnimationFrame(loop);
  };

  return (
    <div>
      <div className="controls" aria-label="Building Blocks controls">
        <button
          className="btn"
          onClick={() => setRunning(true)}
          aria-label="Start Building Blocks"
          disabled={!gameOver && running}
        >
          ▶ Start
        </button>
        <button
          className="btn ghost"
          onClick={() => setRunning(false)}
          aria-label="Pause Building Blocks"
          disabled={!running}
        >
          ⏸ Pause
        </button>
        <button
          className="btn secondary"
          onClick={reset}
          aria-label="Restart Building Blocks"
        >
          ↺ Restart
        </button>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
          Controls: Click to drop; after Game Over click to restart
        </span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          role="img"
          aria-label="Building Blocks canvas game"
          tabIndex={0}
          style={{
            display: "block",
            outline: "none",
            background: "#dbeafe",
            border: "3px solid #3b82f6",
            borderRadius: 10,
          }}
        />
      </div>
    </div>
  );
}
