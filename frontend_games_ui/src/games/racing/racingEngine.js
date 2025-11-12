"use strict";

/**
 * Simple timestep-based 2D racing physics:
 * - Position (x,y), rotation (angle in radians)
 * - Velocity vector with acceleration forward/back
 * - Angular rotation with left/right
 * - Friction and bounds
 * - Lap detection via crossing a line segment with direction
 */

// PUBLIC_INTERFACE
export function createRacingEngine({
  width = 640,
  height = 400,
  start = { x: 100, y: 200, angle: 0 },
} = {}) {
  const state = {
    width,
    height,
    pos: { x: start.x, y: start.y },
    vel: { x: 0, y: 0 },
    angle: start.angle,
    angularVel: 0,
    laps: 0,
    timeMs: 0,
    lastCrossedDir: 0, // -1, 0, +1
    running: false,
  };

  const params = {
    accel: 0.0018, // px/ms^2
    brakeAccel: 0.0022,
    maxSpeed: 0.5, // px/ms
    friction: 0.0009, // speed loss per ms
    turnRate: 0.0045, // rad/ms
  };

  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  // Finish line segment for lap detection
  const finish = {
    x1: width / 2 - 40,
    y1: 60,
    x2: width / 2 + 40,
    y2: 60,
    normalY: 1, // crossing direction (from y>60 to y<60)
  };

  function reset() {
    state.pos.x = start.x;
    state.pos.y = start.y;
    state.vel.x = 0;
    state.vel.y = 0;
    state.angle = start.angle;
    state.angularVel = 0;
    state.laps = 0;
    state.timeMs = 0;
    state.lastCrossedDir = 0;
  }

  // PUBLIC_INTERFACE
  function setInput(newInput) {
    input.up = !!newInput.up;
    input.down = !!newInput.down;
    input.left = !!newInput.left;
    input.right = !!newInput.right;
  }

  // PUBLIC_INTERFACE
  function step(dtMs) {
    // update time
    state.timeMs += dtMs;

    // rotation
    if (input.left) state.angle -= params.turnRate * dtMs;
    if (input.right) state.angle += params.turnRate * dtMs;

    // forward vector
    const ax = Math.cos(state.angle);
    const ay = Math.sin(state.angle);

    // acceleration
    let acc = 0;
    if (input.up) acc += params.accel;
    if (input.down) acc -= params.brakeAccel;

    state.vel.x += ax * acc * dtMs;
    state.vel.y += ay * acc * dtMs;

    // clamp speed
    const speed = Math.hypot(state.vel.x, state.vel.y);
    if (speed > params.maxSpeed) {
      const scale = params.maxSpeed / speed;
      state.vel.x *= scale;
      state.vel.y *= scale;
    }

    // friction
    const fr = 1 - params.friction * dtMs;
    state.vel.x *= fr;
    state.vel.y *= fr;

    // position
    state.pos.x += state.vel.x * dtMs;
    state.pos.y += state.vel.y * dtMs;

    // bounds
    if (state.pos.x < 10) { state.pos.x = 10; state.vel.x = 0; }
    if (state.pos.y < 10) { state.pos.y = 10; state.vel.y = 0; }
    if (state.pos.x > width - 10) { state.pos.x = width - 10; state.vel.x = 0; }
    if (state.pos.y > height - 10) { state.pos.y = height - 10; state.vel.y = 0; }

    // lap detection: detect crossing of finish line (y=60 between x1..x2) going upward
    const prevY = state.pos.y - state.vel.y * dtMs; // approximate previous y before last integration step
    const crosses =
      ((prevY > finish.y1 && state.pos.y <= finish.y1) ||
        (prevY < finish.y1 && state.pos.y >= finish.y1)) &&
      state.pos.x >= finish.x1 &&
      state.pos.x <= finish.x2;

    if (crosses) {
      // Directional check: count only when moving upwards (prevY > y1 -> new y <= y1)
      const dir = prevY > finish.y1 && state.pos.y <= finish.y1 ? 1 : -1;
      if (dir === 1) {
        state.laps += 1;
      }
      state.lastCrossedDir = dir;
    } else {
      state.lastCrossedDir = 0;
    }

    return state;
  }

  reset();

  return {
    state,
    params,
    setInput,
    step,
    reset,
    finish,
  };
}
