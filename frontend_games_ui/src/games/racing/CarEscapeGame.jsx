import React, { useRef, useEffect, useState } from "react";

/**
 * CarEscapeGame
 *
 * A minimal, self-contained car escape/avoidance game using Canvas.
 * Controls:
 * - Left/Right Arrow keys to steer the car
 * - "R" to restart after game over
 *
 * Props:
 * - width: number (default 400)
 * - height: number (default 600)
 *
 * This component intentionally uses inline canvas logic for clarity and portability.
 */
// PUBLIC_INTERFACE
export default function CarEscapeGame({ width = 400, height = 600 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // Game state
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Player car
  const carRef = useRef({
    x: width / 2 - 20,
    y: height - 100,
    w: 40,
    h: 70,
    speed: 6,
  });

  // Obstacles
  const obstaclesRef = useRef([]);
  const spawnTimerRef = useRef(0);
  const spawnIntervalRef = useRef(1000); // ms

  // Input
  const inputRef = useRef({
    left: false,
    right: false,
  });

  // Time tracking
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") inputRef.current.left = true;
      if (e.key === "ArrowRight") inputRef.current.right = true;

      // restart
      if (e.key.toLowerCase() === "r" && gameOver) {
        restart();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "ArrowLeft") inputRef.current.left = false;
      if (e.key === "ArrowRight") inputRef.current.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver]);

  function restart() {
    setRunning(true);
    setGameOver(false);
    setScore(0);
    carRef.current = {
      x: width / 2 - 20,
      y: height - 100,
      w: 40,
      h: 70,
      speed: 6,
    };
    obstaclesRef.current = [];
    spawnTimerRef.current = 0;
    lastTimeRef.current = 0;
  }

  function spawnObstacle() {
    const laneWidth = width / 4; // 4 lanes
    const lane = Math.floor(Math.random() * 4); // 0..3
    const w = laneWidth * 0.66;
    const x = lane * laneWidth + (laneWidth - w) / 2;
    const h = 30 + Math.random() * 30;
    const speed = 2 + Math.random() * 2.5;

    obstaclesRef.current.push({
      x,
      y: -h,
      w,
      h,
      speed,
      color: "rgba(239, 68, 68, 0.9)", // red-ish
    });
  }

  function update(dt) {
    if (!running) return;

    // Move car
    const car = carRef.current;
    if (inputRef.current.left) {
      car.x -= car.speed;
    }
    if (inputRef.current.right) {
      car.x += car.speed;
    }
    if (car.x < 10) car.x = 10;
    if (car.x + car.w > width - 10) car.x = width - 10 - car.w;

    // Spawn obstacles
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= spawnIntervalRef.current) {
      spawnTimerRef.current = 0;
      spawnObstacle();
    }

    // Move obstacles
    obstaclesRef.current.forEach((ob) => {
      ob.y += ob.speed * (dt / 16.6667); // approximate scale to 60fps baseline
    });

    // Remove off-screen obstacles
    obstaclesRef.current = obstaclesRef.current.filter((ob) => ob.y < height + 50);

    // Collision check
    for (const ob of obstaclesRef.current) {
      if (rectsOverlap(car, ob)) {
        setRunning(false);
        setGameOver(true);
        break;
      }
    }

    // Score
    setScore((prev) => prev + Math.floor(dt / 10));
  }

  function rectsOverlap(a, b) {
    return !(
      a.x + a.w < b.x ||
      a.x > b.x + b.w ||
      a.y + a.h < b.y ||
      a.y > b.y + b.h
    );
  }

  function draw(ctx) {
    // Background road
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);

    // Road lanes
    const laneWidth = width / 4;
    for (let i = 1; i < 4; i++) {
      const x = i * laneWidth;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 14]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw car
    const car = carRef.current;
    ctx.fillStyle = "#F59E0B"; // amber
    ctx.fillRect(car.x, car.y, car.w, car.h);
    // car windshield/headlights detail
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(car.x + 6, car.y + 10, car.w - 12, 10);

    // Draw obstacles
    for (const ob of obstaclesRef.current) {
      ctx.fillStyle = ob.color;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(`Score: ${score}`, 12, 22);

    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("Crash!", width / 2, height / 2 - 4);
      ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText("Press R to Restart", width / 2, height / 2 + 24);
      ctx.textAlign = "start";
    }
  }

  const loop = (ts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!lastTimeRef.current) lastTimeRef.current = ts;
    const dt = ts - lastTimeRef.current;
    lastTimeRef.current = ts;

    update(dt);
    draw(ctx);

    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, gameOver]); // re-bind loop on state changes that influence update/draw

  return (
    <div>
      <div className="controls" aria-label="Racing controls">
        <button
          className="btn"
          onClick={() => setRunning(true)}
          aria-label="Start/Resume racing game"
          disabled={!gameOver && running}
        >
          ▶ Start
        </button>
        <button
          className="btn ghost"
          onClick={() => setRunning(false)}
          aria-label="Pause racing game"
          disabled={!running}
        >
          ⏸ Pause
        </button>
        <button
          className="btn secondary"
          onClick={restart}
          aria-label="Restart racing game"
        >
          ↺ Restart
        </button>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>
          Controls: ← → arrows, R to restart
        </span>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          role="img"
          aria-label="Car escape racing game canvas"
          style={{ display: "block", outline: "none" }}
          tabIndex={0}
        />
      </div>
    </div>
  );
}
