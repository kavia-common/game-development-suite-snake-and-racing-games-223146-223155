import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRacingEngine } from "./racingEngine";
import StatusBar from "../../components/StatusBar";

/**
 * Canvas-based minimal racing demo with physics and lap counter.
 * Controls: Arrow keys or WASD. Start/Pause/Reset.
 */
// PUBLIC_INTERFACE
export default function RacingGame({ showStatusBar = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const runningRef = useRef(false);

  const width = 720;
  const height = 420;

  const [running, setRunning] = useState(false);
  const engineRef = useRef(null);

  useEffect(() => {
    engineRef.current = createRacingEngine({
      width,
      height,
      start: { x: width / 2, y: height - 80, angle: -Math.PI / 2 },
    });
  }, []);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  // input
  useEffect(() => {
    const keys = {};
    const update = () => {
      engineRef.current?.setInput({
        up: keys["ArrowUp"] || keys["w"],
        down: keys["ArrowDown"] || keys["s"],
        left: keys["ArrowLeft"] || keys["a"],
        right: keys["ArrowRight"] || keys["d"],
      });
    };
    const onDown = (e) => {
      keys[e.key] = true;
      if (e.key === " ") setRunning((r) => !r);
      update();
    };
    const onUp = (e) => {
      keys[e.key] = false;
      update();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const drawTrack = useCallback((ctx, eng) => {
    const w = eng.state.width;
    const h = eng.state.height;

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
    const f = eng.finish;
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
  }, []);

  const drawCar = useCallback((ctx, eng) => {
    const { pos, angle } = eng.state;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
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

  const loop = useCallback(
    (ts) => {
      const eng = engineRef.current;
      if (!eng) return;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const dt = ts - (lastTimeRef.current || ts);
      lastTimeRef.current = ts;

      if (runningRef.current) {
        eng.step(dt);
      }

      drawTrack(ctx, eng);
      drawCar(ctx, eng);

      rafRef.current = requestAnimationFrame(loop);
    },
    [drawCar, drawTrack]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    engineRef.current?.reset();
    setRunning(false);
  };

  return (
    <div>
      <div className="controls" aria-label="Racing controls">
        <button className="btn" onClick={start} aria-label="Start racing demo">
          ▶ Start
        </button>
        <button className="btn ghost" onClick={pause} aria-label="Pause racing demo">
          ⏸ Pause
        </button>
        <button className="btn secondary" onClick={reset} aria-label="Reset racing demo">
          ↺ Reset
        </button>
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
          aria-label="Racing game canvas"
          tabIndex={0}
          style={{ display: "block", outline: "none" }}
        />
      </div>

      {showStatusBar && engineRef.current && (
        <StatusBar
          items={[
            { label: "Laps", value: engineRef.current.state.laps },
            { label: "Time", value: `${Math.round(engineRef.current.state.timeMs / 1000)}s` },
          ]}
        />
      )}
    </div>
  );
}
