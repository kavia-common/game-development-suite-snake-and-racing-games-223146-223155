import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * CarRacerCanvas.jsx
 *
 * Minimal canvas-based top-down car racer with simple physics.
 * - Controls: Arrow keys or WASD to drive and steer
 * - Press R to restart
 * - RequestAnimationFrame loop with cleanup on unmount (no leaks)
 *
 * Notes:
 * - No external dependencies
 * - Keeps rendering in a single component
 * - Uses refs to avoid unnecessary React re-renders on each frame
 */

// PUBLIC_INTERFACE
export default function CarRacerCanvas({ width = 720, height = 420, showStatusBar = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  // Car/game state kept in refs to minimize re-renders
  const stateRef = useRef({
    x: width / 2,
    y: height - 80,
    angle: -Math.PI / 2, // facing up
    vx: 0,
    vy: 0,
    laps: 0,
    timeMs: 0,
  });

  // Controls tracking
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Local UI state for status bar (derived from refs)
  const [laps, setLaps] = useState(0);
  const [time, setTime] = useState(0);

  // Finish line segment (horizontal line)
  const finishRef = useRef({
    x1: width / 2 - 40,
    y1: 60,
    x2: width / 2 + 40,
    y2: 60,
  });

  // Physics params
  const paramsRef = useRef({
    accel: 0.0018,
    brakeAccel: 0.0022,
    maxSpeed: 0.5,
    friction: 0.0009,
    turnRate: 0.0045,
  });

  const reset = useCallback(() => {
    stateRef.current.x = width / 2;
    stateRef.current.y = height - 80;
    stateRef.current.angle = -Math.PI / 2;
    stateRef.current.vx = 0;
    stateRef.current.vy = 0;
    stateRef.current.laps = 0;
    stateRef.current.timeMs = 0;
    setLaps(0);
    setTime(0);
  }, [height, width]);

  // Key handlers
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keysRef.current.up = true;
      if (k === "arrowdown" || k === "s") keysRef.current.down = true;
      if (k === "arrowleft" || k === "a") keysRef.current.left = true;
      if (k === "arrowright" || k === "d") keysRef.current.right = true;

      if (k === "r") {
        reset();
      }
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keysRef.current.up = false;
      if (k === "arrowdown" || k === "s") keysRef.current.down = false;
      if (k === "arrowleft" || k === "a") keysRef.current.left = false;
      if (k === "arrowright" || k === "d") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [reset]);

  const step = useCallback((dt) => {
    const s = stateRef.current;
    const p = paramsRef.current;
    const keys = keysRef.current;

    // update clock
    s.timeMs += dt;

    // steering
    if (keys.left) s.angle -= p.turnRate * dt;
    if (keys.right) s.angle += p.turnRate * dt;

    // acceleration
    const ax = Math.cos(s.angle);
    const ay = Math.sin(s.angle);
    let acc = 0;
    if (keys.up) acc += p.accel;
    if (keys.down) acc -= p.brakeAccel;

    s.vx += ax * acc * dt;
    s.vy += ay * acc * dt;

    // clamp speed
    const speed = Math.hypot(s.vx, s.vy);
    if (speed > p.maxSpeed) {
      const scale = p.maxSpeed / speed;
      s.vx *= scale;
      s.vy *= scale;
    }

    // friction
    const fr = 1 - p.friction * dt;
    s.vx *= fr;
    s.vy *= fr;

    // integrate
    const prevY = s.y;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // bounds (soft walls)
    if (s.x < 10) { s.x = 10; s.vx = 0; }
    if (s.y < 10) { s.y = 10; s.vy = 0; }
    if (s.x > width - 10) { s.x = width - 10; s.vx = 0; }
    if (s.y > height - 10) { s.y = height - 10; s.vy = 0; }

    // lap detection crossing upward over finish line segment
    const f = finishRef.current;
    const crosses =
      ((prevY > f.y1 && s.y <= f.y1) || (prevY < f.y1 && s.y >= f.y1)) &&
      s.x >= f.x1 && s.x <= f.x2;
    if (crosses && prevY > f.y1 && s.y <= f.y1) {
      s.laps += 1;
      setLaps(s.laps);
    }

    // update UI timer roughly
    setTime(s.timeMs);
  }, [height, width]);

  const drawTrack = useCallback((ctx) => {
    const w = width;
    const h = height;

    // background asphalt
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, w, h);

    // simple rounded rectangle track
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    const margin = 40;
    const radius = 70;
    ctx.moveTo(margin + radius, margin);
    ctx.lineTo(w - margin - radius, margin);
    ctx.arcTo(w - margin, margin, w - margin, margin + radius, radius);
    ctx.lineTo(w - margin, h - margin - radius);
    ctx.arcTo(w - margin, h - margin, w - margin - radius, h - margin, radius);
    ctx.lineTo(margin + radius, h - margin);
    ctx.arcTo(margin, h - margin, margin, h - margin - radius, radius);
    ctx.lineTo(margin, margin + radius);
    ctx.arcTo(margin, margin, margin + radius, margin, radius);
    ctx.closePath();
    ctx.stroke();

    // finish line
    const f = finishRef.current;
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(f.x1, f.y1);
    ctx.lineTo(f.x2, f.y2);
    ctx.stroke();

    // finish label
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText("Finish", f.x2 + 8, f.y2 + 4);
  }, [height, width]);

  const drawCar = useCallback((ctx) => {
    const s = stateRef.current;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    // body
    ctx.fillStyle = "#60A5FA";
    ctx.fillRect(-12, -8, 24, 16);
    // cockpit
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(-6, -6, 12, 12);
    // nose
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(10, -4, 6, 8);
    ctx.restore();
  }, []);

  const loop = useCallback((ts) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const last = lastTsRef.current || ts;
    const dt = ts - last;
    lastTsRef.current = ts;

    step(dt);
    drawTrack(ctx);
    drawCar(ctx);

    rafRef.current = requestAnimationFrame(loop);
  }, [drawCar, drawTrack, step]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  return (
    <div>
      <div className="controls" aria-label="Racing controls">
        <button className="btn secondary" onClick={reset} aria-label="Restart racing game (R)">
          ↺ Restart (R)
        </button>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
          Controls: Arrow Keys or WASD · R to Restart
        </span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          role="img"
          aria-label="Car racer canvas"
          tabIndex={0}
          style={{ display: "block", outline: "none" }}
        />
      </div>

      {showStatusBar && (
        <div className="status-bar" aria-label="Game status">
          <span className="badge"><strong>Laps:</strong> {laps}</span>
          <span className="badge"><strong>Time:</strong> {Math.round(time / 1000)}s</span>
        </div>
      )}
    </div>
  );
}
