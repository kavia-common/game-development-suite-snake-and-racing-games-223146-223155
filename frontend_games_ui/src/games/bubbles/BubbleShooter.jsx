import React, { useEffect, useRef, useState } from "react";

/**
 * BubbleShooter
 *
 * HTML5 canvas Bubble Shooter implemented as a React component with imperative game loop.
 * - Uses a single <canvas> with mouse aiming and click-to-shoot controls
 * - Bubbles attach and pop in groups of 3+ of the same color
 * - Rows shift down periodically; game over when bubbles reach bottom
 * - Score tracked; game can be restarted
 *
 * Ocean Professional theme alignment:
 * - Background gradient similar to app theme
 * - Canvas wrapped with border radius and subtle border via app CSS
 * - Accent colors from theme for bubbles and UI controls
 *
 * Accessibility:
 * - Canvas is focusable and has an aria-label
 * - Buttons use descriptive labels
 *
 * Cleanup:
 * - Removes all event listeners and cancels animation frame on unmount
 */
// PUBLIC_INTERFACE
export default function BubbleShooter({ width = 480, height = 640 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // state for HUD/UI
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  // internal game refs
  const gridRef = useRef(null);
  const shooterRef = useRef(null);
  const currentBubbleRef = useRef(null);
  const nextBubbleRef = useRef(null);
  const lastTsRef = useRef(0);
  const mouseRef = useRef({ x: width / 2, y: height - 50 });
  const pendingShotRef = useRef(false);
  const rowShiftTimerRef = useRef(0);

  // constants
  const CELL_RADIUS = 16;
  const CELL_DIAM = CELL_RADIUS * 2;
  const COLS = Math.floor(width / CELL_DIAM);
  const ROWS = Math.floor((height - 160) / CELL_DIAM); // leave HUD area
  const CEILING_Y = 80; // top margin for gradient title area
  const SHIFT_INTERVAL = 6000; // ms between row shifts

  const COLORS = [
    "#2563EB", // ocean primary
    "#F59E0B", // amber
    "#10B981", // teal-ish
    "#EF4444", // red
    "#8B5CF6", // violet
    "#F472B6", // pink
  ];

  // Initialize game elements
  useEffect(() => {
    resetGame();

    const onMouseMove = (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current = { x, y };
    };
    const onClick = () => {
      pendingShotRef.current = true;
    };

    const canvas = canvasRef.current;
    canvas?.addEventListener("mousemove", onMouseMove);
    canvas?.addEventListener("click", onClick);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas?.removeEventListener("mousemove", onMouseMove);
      canvas?.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetGame() {
    setScore(0);
    setGameOver(false);
    setRunning(true);
    lastTsRef.current = 0;
    rowShiftTimerRef.current = 0;
    gridRef.current = createGrid(ROWS, COLS);
    seedTopRows(gridRef.current, 5);
    shooterRef.current = createShooter(width / 2, height - 40);
    currentBubbleRef.current = randomBubble();
    nextBubbleRef.current = randomBubble();
  }

  function createGrid(rows, cols) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = new Array(cols).fill(null);
      grid.push(row);
    }
    return grid;
  }

  function seedTopRows(grid, rows = 5) {
    for (let r = 0; r < rows && r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        // randomly fill 75% density to give some gaps
        if (Math.random() < 0.75) {
          grid[r][c] = { color: COLORS[(Math.random() * COLORS.length) | 0] };
        }
      }
    }
  }

  function createShooter(x, y) {
    return {
      x,
      y,
      angle: 0,
      // shot bubble trajectory
      shot: null, // { x, y, vx, vy, color }
    };
  }

  function randomBubble() {
    return { color: COLORS[(Math.random() * COLORS.length) | 0] };
  }

  function worldToCell(wx, wy) {
    // map to grid indices considering CEILING_Y offset
    const y = wy - CEILING_Y;
    const r = Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL_DIAM)));
    const c = Math.max(0, Math.min(COLS - 1, Math.floor(wx / CELL_DIAM)));
    return { r, c };
  }

  function cellToWorld(c, r) {
    const x = c * CELL_DIAM + CELL_RADIUS;
    const y = CEILING_Y + r * CELL_DIAM + CELL_RADIUS;
    return { x, y };
  }

  function updateShooter() {
    const shooter = shooterRef.current;
    const mouse = mouseRef.current;

    // aim
    shooter.angle = Math.atan2(mouse.y - shooter.y, mouse.x - shooter.x);

    // clamp angle to avoid shooting backward
    const minA = (-5 * Math.PI) / 6; // -150deg
    const maxA = (-1 * Math.PI) / 6; // -30deg relative to right
    if (shooter.angle > maxA) shooter.angle = maxA;
    if (shooter.angle < minA) shooter.angle = minA;

    // handle pending shot
    if (pendingShotRef.current && !shooter.shot && running && !gameOver) {
      pendingShotRef.current = false;
      const speed = 8;
      shooter.shot = {
        x: shooter.x,
        y: shooter.y,
        vx: Math.cos(shooter.angle) * speed,
        vy: Math.sin(shooter.angle) * speed,
        color: currentBubbleRef.current.color,
      };
    }
  }

  function updateShot() {
    const shooter = shooterRef.current;
    const shot = shooter.shot;
    if (!shot) return;

    // move
    shot.x += shot.vx;
    shot.y += shot.vy;

    // bounce off walls
    if (shot.x <= CELL_RADIUS || shot.x >= width - CELL_RADIUS) {
      shot.vx *= -1;
      shot.x = Math.max(CELL_RADIUS, Math.min(width - CELL_RADIUS, shot.x));
    }

    // check collision with ceiling or existing bubbles
    if (shot.y <= CEILING_Y + CELL_RADIUS) {
      // attach to first row
      attachShotToGrid(shot);
      shooter.shot = null;
      currentBubbleRef.current = nextBubbleRef.current;
      nextBubbleRef.current = randomBubble();
      return;
    }

    // check collision with any existing bubble
    const grid = gridRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = grid[r][c];
        if (!b) continue;
        const { x: bx, y: by } = cellToWorld(c, r);
        const dx = shot.x - bx;
        const dy = shot.y - by;
        const dist2 = dx * dx + dy * dy;
        const minDist = CELL_DIAM - 2; // slight overlap allowed
        if (dist2 <= minDist * minDist) {
          attachShotToGrid(shot, c, r);
          shooter.shot = null;
          currentBubbleRef.current = nextBubbleRef.current;
          nextBubbleRef.current = randomBubble();
          return;
        }
      }
    }

    // bottom bound => game over
    if (shot.y >= height - 4) {
      shooter.shot = null;
      // Let it pass (no penalty), rely on rows shift for game pressure
    }
  }

  function attachShotToGrid(shot, aroundC = null, aroundR = null) {
    // compute preferred cell
    let cc, rr;
    if (aroundC != null && aroundR != null) {
      // place near neighbor: find nearest empty neighbor cell
      const empty = neighborEmptyCellNear(aroundC, aroundR, shot.x, shot.y);
      cc = empty.c;
      rr = empty.r;
    } else {
      const cell = worldToCell(shot.x, shot.y);
      cc = cell.c;
      rr = cell.r;
      // ensure clamp to grid
      cc = Math.max(0, Math.min(COLS - 1, cc));
      rr = Math.max(0, Math.min(ROWS - 1, rr));
      // if occupied, find nearest empty around
      if (gridRef.current[rr][cc]) {
        const empty = neighborEmptyCellNear(cc, rr, shot.x, shot.y);
        cc = empty.c;
        rr = empty.r;
      }
    }

    // place shot bubble
    const grid = gridRef.current;
    if (!grid[rr][cc]) {
      grid[rr][cc] = { color: shot.color };
    } else {
      // as fallback, scan for any empty close by
      const found = spiralFindEmpty(rr, cc, grid);
      if (found) {
        grid[found.r][found.c] = { color: shot.color };
        rr = found.r;
        cc = found.c;
      }
    }

    // after placement: clear clusters and drop floating
    const popped = popClusters(rr, cc);
    if (popped > 0) {
      setScore((s) => s + popped * 10);
    }
    dropFloatingBubbles();
  }

  function neighborEmptyCellNear(c, r, wx, wy) {
    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: -1 },
      { dc: -1, dr: 1 },
    ];
    let best = { c, r, d2: Infinity };
    for (const d of dirs) {
      const nc = c + d.dc;
      const nr = r + d.dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      if (gridRef.current[nr][nc]) continue;
      const { x, y } = cellToWorld(nc, nr);
      const dx = x - wx;
      const dy = y - wy;
      const d2 = dx * dx + dy * dy;
      if (d2 < best.d2) {
        best = { c: nc, r: nr, d2 };
      }
    }
    return { c: best.c, r: best.r };
  }

  function spiralFindEmpty(r0, c0, grid) {
    // simple outward search within small radius
    const maxD = 2;
    for (let d = 1; d <= maxD; d++) {
      for (let dr = -d; dr <= d; dr++) {
        for (let dc = -d; dc <= d; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
          if (!grid[r][c]) return { r, c };
        }
      }
    }
    return null;
  }

  function neighbors(r, c) {
    const acc = [];
    const v = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    for (const [dc, dr] of v) {
      const nc = c + dc;
      const nr = r + dr;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        acc.push([nr, nc]);
      }
    }
    return acc;
  }

  function popClusters(startR, startC) {
    const grid = gridRef.current;
    const start = grid[startR][startC];
    if (!start) return 0;

    // BFS collect same-color group
    const target = start.color;
    const seen = new Set();
    const q = [[startR, startC]];
    const group = [];

    while (q.length) {
      const [r, c] = q.shift();
      const key = `${r},${c}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const b = grid[r][c];
      if (!b || b.color !== target) continue;
      group.push([r, c]);

      for (const [nr, nc] of neighbors(r, c)) {
        const nb = grid[nr][nc];
        if (nb && nb.color === target) {
          q.push([nr, nc]);
        }
      }
    }

    // threshold for popping
    if (group.length >= 3) {
      for (const [r, c] of group) {
        grid[r][c] = null;
      }
      return group.length;
    }
    return 0;
  }

  function dropFloatingBubbles() {
    const grid = gridRef.current;
    // mark connected-to-ceiling using BFS from first row
    const connected = new Set();
    const q = [];
    for (let c = 0; c < COLS; c++) {
      if (grid[0][c]) q.push([0, c]);
    }
    while (q.length) {
      const [r, c] = q.shift();
      const key = `${r},${c}`;
      if (connected.has(key)) continue;
      connected.add(key);
      for (const [nr, nc] of neighbors(r, c)) {
        if (grid[nr][nc]) q.push([nr, nc]);
      }
    }
    // drop anything not connected
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) continue;
        const key = `${r},${c}`;
        if (!connected.has(key)) {
          grid[r][c] = null;
          // extra score for drops
          setScore((s) => s + 5);
        }
      }
    }
  }

  function shiftRowsDown() {
    const grid = gridRef.current;
    // If bottom row has any bubble, game over
    for (let c = 0; c < COLS; c++) {
      if (grid[ROWS - 1][c]) {
        setRunning(false);
        setGameOver(true);
        return;
      }
    }
    // shift from bottom up
    for (let r = ROWS - 1; r > 0; r--) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = grid[r - 1][c];
      }
    }
    // new random row at the top
    for (let c = 0; c < COLS; c++) {
      grid[0][c] = Math.random() < 0.8 ? { color: COLORS[(Math.random() * COLORS.length) | 0] } : null;
    }
  }

  function update(dt) {
    if (!running || gameOver) return;

    rowShiftTimerRef.current += dt;
    if (rowShiftTimerRef.current >= SHIFT_INTERVAL) {
      rowShiftTimerRef.current = 0;
      shiftRowsDown();
    }

    updateShooter();
    updateShot();
  }

  function draw(ctx) {
    // background gradient (align with theme)
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "rgba(37,99,235,0.10)"); // blue tint top
    g.addColorStop(1, "rgba(245,158,11,0.04)"); // amber tint bottom
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // top header area
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, width, CEILING_Y - 10);

    // draw grid bubbles
    const grid = gridRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = grid[r][c];
        if (!b) continue;
        const { x, y } = cellToWorld(c, r);
        drawBubble(ctx, x, y, b.color, 1.0);
      }
    }

    // shooter
    const shooter = shooterRef.current;
    drawShooter(ctx, shooter);

    // current bubble indicator (at shooter)
    drawBubble(ctx, shooter.x, shooter.y, currentBubbleRef.current.color, 1.0);

    // next bubble preview
    drawBubble(ctx, 36, height - 36, nextBubbleRef.current.color, 0.85);
    ctx.fillStyle = "var(--text-secondary)";
    ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText("Next", 18, height - 60);

    // HUD
    ctx.fillStyle = "#0b1220";
    ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(`Score: ${score}`, 12, 22);

    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("Game Over", width / 2, height / 2 - 8);
      ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("Click Restart to play again", width / 2, height / 2 + 20);
      ctx.textAlign = "start";
    }
  }

  function drawBubble(ctx, x, y, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const highlight = "rgba(255,255,255,0.95)";
    const shadow = "rgba(0,0,0,0.25)";

    // shadow
    ctx.beginPath();
    ctx.fillStyle = shadow;
    ctx.arc(x + 2, y + 2, CELL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // main
    const grad = ctx.createRadialGradient(
      x - 6,
      y - 6,
      4,
      x,
      y,
      CELL_RADIUS
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.15, highlight);
    grad.addColorStop(0.2, color);
    grad.addColorStop(1, color);
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(x, y, CELL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // specular highlight
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.arc(x - 6, y - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawShooter(ctx, shooter) {
    // draw aiming line
    ctx.save();
    ctx.strokeStyle = "rgba(37,99,235,0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(
      shooter.x + Math.cos(shooter.angle) * 80,
      shooter.y + Math.sin(shooter.angle) * 80
    );
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // base
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(shooter.x - 26, shooter.y + 18, 52, 6);

    // cannon
    ctx.save();
    ctx.translate(shooter.x, shooter.y);
    ctx.rotate(shooter.angle);
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(-8, -8, 36, 16);
    ctx.restore();

    // draw shot bubble if active
    const shot = shooter.shot;
    if (shot) {
      drawBubble(ctx, shot.x, shot.y, shot.color, 1.0);
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
      <div className="controls" aria-label="Bubble Shooter controls">
        <button
          className="btn"
          onClick={() => setRunning(true)}
          aria-label="Start Bubble Shooter"
          disabled={running && !gameOver}
        >
          ▶ Start
        </button>
        <button
          className="btn ghost"
          onClick={() => setRunning(false)}
          aria-label="Pause Bubble Shooter"
          disabled={!running}
        >
          ⏸ Pause
        </button>
        <button
          className="btn secondary"
          onClick={resetGame}
          aria-label="Restart Bubble Shooter"
        >
          ↺ Restart
        </button>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
          Controls: Move mouse to aim, click to shoot
        </span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          role="img"
          aria-label="Bubble Shooter canvas game"
          tabIndex={0}
          style={{ display: "block", outline: "none" }}
        />
      </div>
    </div>
  );
}
