import React, { useEffect, useRef, useState } from "react";

/**
 * BuildingBlocks - Block City Builder (React Canvas)
 *
 * Enhanced stacking game with multiple block types, levels, and lives.
 * - Click/tap to drop the moving block.
 * - Shapes: square, rectangle, triangle, circle.
 * - Levels: each level requires placing a target number of blocks; difficulty scales.
 * - Lives: miss a drop and you lose a life; when lives reach 0 => game over.
 * - Next Level: when target placed, progress to next level with faster speed and different background mood.
 *
 * Canvas styling is scoped to this component:
 * - background: #f0f9ff
 * - border: 3px solid #2563eb
 * - borderRadius: 10px
 *
 * Public controls:
 * - Start, Pause, Restart buttons
 *
 * Cleanup:
 * - Cancels animation frames and removes listeners on unmount.
 */
// PUBLIC_INTERFACE
export default function BuildingBlocks({ width = 500, height = 600 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // UI/Game states
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [placedThisLevel, setPlacedThisLevel] = useState(0);

  // Internals
  const blocksRef = useRef([]); // stacked/ground blocks
  const movingRef = useRef(null); // current moving block/shape
  const lastTsRef = useRef(0);

  // Config & constants
  const GRAVITY = 0.45;
  const COLORS = ["#2563EB", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#F472B6", "#14B8A6"];
  const LEVEL_TARGET_BASE = 6; // blocks to place in Level 1
  const SPEED_BASE = 2.0; // base horizontal speed
  const SHAPES = ["square", "rectangle", "triangle", "circle"];

  // Difficulty scales per level
  function getLevelTarget(lv) {
    return LEVEL_TARGET_BASE + (lv - 1) * 2;
  }
  function getHorizontalSpeed(lv) {
    return SPEED_BASE + (lv - 1) * 0.6;
  }
  function getBackgroundForLevel(lv) {
    // slight mood shift by level
    const moods = [
      { top: "rgba(37,99,235,0.15)", bottom: "rgba(59,130,246,0.08)" }, // 1
      { top: "rgba(59,130,246,0.15)", bottom: "rgba(245,158,11,0.08)" }, // 2
      { top: "rgba(16,185,129,0.15)", bottom: "rgba(37,99,235,0.08)" }, // 3
      { top: "rgba(139,92,246,0.15)", bottom: "rgba(16,185,129,0.08)" }, // 4
      { top: "rgba(244,63,94,0.15)", bottom: "rgba(139,92,246,0.08)" }, // 5
    ];
    return moods[(lv - 1) % moods.length];
  }

  useEffect(() => {
    startNewGame(); // initialize

    const onClick = () => {
      if (gameOver) {
        resetGame();
        return;
      }
      dropBlock();
    };

    const c = canvasRef.current;
    c?.addEventListener("click", onClick);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      c?.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  function startNewGame() {
    // ground base (full-width)
    const baseH = 22;
    const base = {
      type: "rectangle",
      x: 0,
      y: height - baseH,
      w: width,
      h: baseH,
      color: "#1E3A8A",
      falling: false,
      vy: 0,
      static: true,
    };
    blocksRef.current = [base];
    setGameOver(false);
    setRunning(true);
    setScore(0);
    setLevel(1);
    setLives(3);
    setPlacedThisLevel(0);
    lastTsRef.current = 0;
    spawnMovingBlock();
  }

  function resetGame() {
    startNewGame();
  }

  function nextLevel() {
    // PUBLIC_INTERFACE
    /**
     * Move to the next level:
     * - Increase level, reset per-level placed counter
     * - Speed increases (handled in moving block spawn)
     * - Spawn a fresh moving block
     */
    setLevel((lv) => lv + 1);
    setPlacedThisLevel(0);
    spawnMovingBlock(true);
  }

  function spawnMovingBlock(forceFromEdge = false) {
    const margin = 16;
    const shape = SHAPES[(Math.random() * SHAPES.length) | 0];
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    const y = 80;
    const speed = getHorizontalSpeed(level);
    const startLeft = forceFromEdge ? Math.random() < 0.5 : Math.random() < 0.5;

    // Dimensions based on shape
    let w = 70;
    let h = 24;
    let r = 18;
    if (shape === "square") {
      w = 40;
      h = 40;
    } else if (shape === "rectangle") {
      w = 70;
      h = 24;
    } else if (shape === "triangle") {
      w = 52;
      h = 40;
    } else if (shape === "circle") {
      r = 20;
      w = r * 2;
      h = r * 2;
    }

    movingRef.current = {
      type: shape,
      x: startLeft ? margin : width - margin - w,
      y,
      w,
      h,
      r, // for circle
      color,
      vx: startLeft ? speed : -speed,
      vy: 0,
      falling: false,
      static: false,
      _precisionEval: false,
    };
  }

  // PUBLIC_INTERFACE
  function dropBlock() {
    /**
     * Begin falling the current block. Precision and scoring applied on landing.
     */
    const mb = movingRef.current;
    if (!mb || mb.falling) return;
    mb.falling = true;
    mb.vy = 0;
    mb._precisionEval = true;
  }

  function topOfStack() {
    const arr = blocksRef.current;
    return arr[arr.length - 1] || null;
  }

  function update(dt) {
    if (!running || gameOver) return;

    const mb = movingRef.current;
    if (mb) {
      if (!mb.falling) {
        // horizontal bounce motion
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
        // falling motion
        mb.vy += GRAVITY * (dt / 16.6667);
        mb.y += mb.vy * (dt / 16.6667);

        const top = topOfStack();
        if (top && overlap(mb, top)) {
          // snap block on top
          const snapped = snapToTop(mb, top);
          blocksRef.current.push(snapped);

          // scoring based on precision alignment
          let gain = 1;
          if (mb._precisionEval) {
            const acc = alignmentAccuracy(mb, top); // 0..1
            gain += Math.round(acc * 10);
          }
          setScore((s) => s + gain);

          // placed for level
          setPlacedThisLevel((p) => {
            const placed = p + 1;
            // level progression
            if (placed >= getLevelTarget(level)) {
              nextLevel();
            } else {
              spawnMovingBlock();
            }
            return placed;
          });

          movingRef.current = null;
        } else if (mb.y + mb.h >= height) {
          // miss
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setRunning(false);
              setGameOver(true);
            } else {
              // allow retry on same level: spawn new moving block
              spawnMovingBlock(true);
            }
            return nextL;
          });
          movingRef.current = null;
        }
      }
    }
  }

  // collision logic
  function overlap(a, b) {
    // approximate for triangle/circle using bounding boxes
    const ar = { x: a.x, y: a.y, w: a.w, h: a.h };
    const br = { x: b.x, y: b.y, w: b.w, h: b.h };
    return !(
      ar.x + ar.w < br.x ||
      ar.x > br.x + br.w ||
      ar.y + ar.h < br.y ||
      ar.y > br.y + br.h
    );
  }

  function snapToTop(mb, top) {
    return {
      type: mb.type,
      x: mb.x,
      y: top.y - mb.h,
      w: mb.w,
      h: mb.h,
      r: mb.r,
      color: mb.color,
      falling: false,
      vy: 0,
      static: true,
    };
  }

  function alignmentAccuracy(mb, top) {
    const mbCenter = mb.x + mb.w / 2;
    const topCenter = top.x + top.w / 2;
    const maxOffset = top.w / 2;
    const offset = Math.abs(mbCenter - topCenter);
    return Math.max(0, 1 - offset / maxOffset);
  }

  function draw(ctx) {
    // level-tinted background
    const mood = getBackgroundForLevel(level);
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, mood.top);
    g.addColorStop(1, mood.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // ground/blocks
    for (const b of blocksRef.current) {
      drawShape(ctx, b);
    }
    if (movingRef.current) {
      drawShape(ctx, movingRef.current);
    }

    // HUD
    drawHud(ctx);

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

  function drawHud(ctx) {
    ctx.fillStyle = "#0b1220";
    ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(`Level: ${level}`, 12, 24);
    ctx.fillText(`Score: ${score}`, 12, 44);
    ctx.fillText(`Lives: ${lives}`, 12, 64);
    ctx.fillText(`Placed: ${placedThisLevel}/${getLevelTarget(level)}`, 12, 84);
  }

  function drawShape(ctx, s) {
    // subtle shadow
    ctx.save();
    ctx.globalAlpha = 1.0;
    const shadow = "rgba(0,0,0,0.18)";

    if (s.type === "rectangle" || s.type === "square") {
      // shadow
      ctx.fillStyle = shadow;
      ctx.fillRect(s.x + 2, s.y + 2, s.w, s.h);

      // body gradient
      const grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.12, "rgba(255,255,255,0.85)");
      grad.addColorStop(0.2, s.color);
      grad.addColorStop(1, s.color);
      ctx.fillStyle = grad;
      ctx.fillRect(s.x, s.y, s.w, s.h);

      // top highlight
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(s.x, s.y, s.w, 2);
    } else if (s.type === "triangle") {
      // shadow
      ctx.fillStyle = shadow;
      drawTrianglePath(ctx, s.x + 2, s.y + 2, s.w, s.h);
      ctx.fill();

      // main
      const grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.12, "rgba(255,255,255,0.85)");
      grad.addColorStop(0.2, s.color);
      grad.addColorStop(1, s.color);
      ctx.fillStyle = grad;
      drawTrianglePath(ctx, s.x, s.y, s.w, s.h);
      ctx.fill();

      // edge line
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.stroke();
    } else if (s.type === "circle") {
      const r = s.r || Math.min(s.w, s.h) / 2;
      const cx = s.x + r;
      const cy = s.y + r;

      // shadow
      ctx.beginPath();
      ctx.fillStyle = shadow;
      ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
      ctx.fill();

      // body
      const grad = ctx.createRadialGradient(cx - 6, cy - 6, 4, cx, cy, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.12, "rgba(255,255,255,0.9)");
      grad.addColorStop(0.2, s.color);
      grad.addColorStop(1, s.color);
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // specular
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.arc(cx - 6, cy - 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawTrianglePath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
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
      <div className="controls" aria-label="Block City Builder controls">
        <button
          className="btn"
          onClick={() => setRunning(true)}
          aria-label="Start Block City Builder"
          disabled={!gameOver && running}
        >
          ▶ Start
        </button>
        <button
          className="btn ghost"
          onClick={() => setRunning(false)}
          aria-label="Pause Block City Builder"
          disabled={!running}
        >
          ⏸ Pause
        </button>
        <button
          className="btn secondary"
          onClick={resetGame}
          aria-label="Restart Block City Builder"
        >
          ↺ Restart
        </button>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
          Controls: Click to drop; after Game Over click anywhere to restart
        </span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          role="img"
          aria-label="Block City Builder canvas"
          tabIndex={0}
          style={{
            display: "block",
            outline: "none",
            background: "#f0f9ff",
            border: "3px solid #2563eb",
            borderRadius: 10,
          }}
        />
      </div>
    </div>
  );
}
