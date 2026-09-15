// Top-down robot sim for the hero: the robot plans a route across the floor
// plan and drives it, and a click sets a new goal. Goals behind walls work
// because the route comes from A* over an inflated costmap, not from pointing
// the robot at the goal and hoping.

import {
  buildCostmap,
  findPath,
  smoothPath,
  nearestFree,
  toCell,
  toPoint,
} from "./planner.js";

const WORLD = { w: 32, h: 18 };

const RAYS = 180;
const FOV = (270 * Math.PI) / 180;
const RANGE = 7;

const MAX_V = 2.3;
const MAX_OMEGA = 2.4;
const ARRIVE = 0.45;
const DWELL = 2.2;
const WAYPOINT_REACHED = 0.5;
const ROBOT_CLEARANCE = 0.3;

const BOOT_MS = 1900;
const INTRO_MIN_MS = 2100;
const OVERSCAN = 1.16;

function walls() {
  const s = [];
  const line = (x1, y1, x2, y2) => s.push({ x1, y1, x2, y2 });
  const box = (x, y, w, h) => {
    line(x, y, x + w, y);
    line(x + w, y, x + w, y + h);
    line(x + w, y + h, x, y + h);
    line(x, y + h, x, y);
  };

  const { w, h } = WORLD;
  box(0, 0, w, h);

  // Partitions with doorways left open, so the robot can actually get through.
  line(11, 0, 11, 6);
  line(11, 9.6, 11, h);
  line(21, 0, 21, 4.2);
  line(21, 8.4, 21, h);
  line(21, 11.5, 27.5, 11.5);

  // Shelving and pillars.
  box(3.2, 3.4, 1.4, 5.2);
  box(6.6, 11.2, 3.2, 1.3);
  box(14.5, 2.6, 3.6, 1.2);
  box(14.5, 13.4, 3.6, 1.2);
  box(24.4, 3.2, 1.3, 4.4);
  box(28.2, 14.2, 1.6, 1.6);

  return s;
}

const cross = (ax, ay, bx, by) => ax * by - ay * bx;

// Ray from (px,py) along (dx,dy) against every segment; nearest hit or RANGE.
function castRay(px, py, dx, dy, segs) {
  let best = RANGE;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const sx = s.x2 - s.x1;
    const sy = s.y2 - s.y1;
    const denom = cross(dx, dy, sx, sy);
    if (denom === 0) continue;
    const qpx = s.x1 - px;
    const qpy = s.y1 - py;
    const t = cross(qpx, qpy, sx, sy) / denom;
    if (t < 0 || t >= best) continue;
    const u = cross(qpx, qpy, dx, dy) / denom;
    if (u < 0 || u > 1) continue;
    best = t;
  }
  return best;
}

function distToSegs(px, py, segs) {
  let min = Infinity;
  for (const s of segs) {
    const vx = s.x2 - s.x1;
    const vy = s.y2 - s.y1;
    const len2 = vx * vx + vy * vy || 1;
    let t = ((px - s.x1) * vx + (py - s.y1) * vy) / len2;
    t = Math.max(0, Math.min(1, t));
    const dx = px - (s.x1 + t * vx);
    const dy = py - (s.y1 + t * vy);
    min = Math.min(min, Math.hypot(dx, dy));
  }
  return min;
}

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const get = (n, fallback) => cs.getPropertyValue(n).trim() || fallback;
  return {
    accent: get("--accent", "#22d3ee"),
    // Walls need more presence than any UI border — they're the subject here,
    // not chrome, and they sit behind a darkening veil.
    wall: "#485363",
    grid: "#14171d",
  };
}

export function initHeroSim(canvas, { telemetry, boot: boot_ = {} } = {}) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const segs = walls();
  const tokens = readTokens();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const robot = { x: 5.5, y: 8.5, theta: 0.2 };
  const scan = new Float32Array(RAYS);

  const costmap = buildCostmap(WORLD, segs, distToSegs);

  let goal = { x: 16, y: 8, user: false };
  let path = [];
  let waypoint = 0;
  let dwell = 0;
  let view = { scale: 20, ox: 0, oy: 0 };
  let viewport = { width: 0, height: 0 };
  let boot = reduced ? 1 : 0;
  let raf = null;
  let last = 0;
  let elapsed = 0;
  let telemetryAt = 0;
  let running = false;

  // "intro" drives the robot along the loading bar; "merge" holds it exactly
  // where the bar left it while the map fades in around it; "run" is the
  // ordinary sim. Same robot throughout — nothing crossfades and nothing jumps.
  let phase = reduced ? "run" : "intro";
  let progress = 0;
  let assetsReady = false;
  let skipped = false;

  // Where the robot is drawn right now, in canvas pixels. On the bar during the
  // intro, otherwise wherever it sits on the map.
  function robotScreen() {
    return phase === "intro" ? trackPoint(progress) : toScreen(robot.x, robot.y);
  }

  function trackPoint(t) {
    const bar = boot_.track?.getBoundingClientRect();
    const rect = canvas.getBoundingClientRect();
    if (!bar) return [viewport.width * t, viewport.height - 40];
    return [bar.left - rect.left + bar.width * t, bar.top - rect.top];
  }

  // Hand the robot from the bar to the map without shifting it a single pixel:
  // adopt the world position under the end of the bar, then nudge the camera to
  // absorb whatever the free-space snap moved. The map fades in around it.
  function adoptBarPosition() {
    const at = trackPoint(1);
    const [wx, wy] = toWorld(at[0], at[1]);

    const cell = nearestFree(costmap, ...toCell(costmap, wx, wy));
    const [sx, sy] = cell ? toPoint(costmap, ...cell) : [wx, wy];
    robot.x = sx;
    robot.y = sy;
    robot.theta = 0;

    const clamp = (span, worldSpan, want) => {
      const size = worldSpan * view.scale;
      if (size <= span) return (span - size) / 2;
      return Math.max(span - size, Math.min(0, want));
    };
    view.ox = clamp(viewport.width, WORLD.w, at[0] - robot.x * view.scale);
    view.oy = clamp(viewport.height, WORLD.h, at[1] - robot.y * view.scale);
  }

  const toScreen = (x, y) => [x * view.scale + view.ox, y * view.scale + view.oy];
  const toWorld = (sx, sy) => [(sx - view.ox) / view.scale, (sy - view.oy) / view.scale];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Cover the hero, plus overscan. The margin is what gives the camera room
    // to pan: without it the world exactly fills the viewport, the offset is
    // pinned at zero, and the bar-to-map handoff can't land pixel-exact.
    view.scale =
      Math.max(rect.width / WORLD.w, rect.height / WORLD.h) * OVERSCAN;
    viewport = { width: rect.width, height: rect.height };
    updateView();
    draw(rect);
  }

  // Centre on the robot when the world overflows the viewport, clamped so the
  // camera never pans past the walls. Static whenever everything already fits.
  //
  // Eased rather than snapped, so when the camera takes over after the merge it
  // drifts into place while the robot drives instead of yanking the view.
  function updateView(dt = 0) {
    if (phase === "merge") return;

    const axis = (span, worldSpan, at) => {
      const size = worldSpan * view.scale;
      if (size <= span) return (span - size) / 2;
      return Math.max(span - size, Math.min(0, span / 2 - at * view.scale));
    };
    const tx = axis(viewport.width, WORLD.w, robot.x);
    const ty = axis(viewport.height, WORLD.h, robot.y);

    const k = dt > 0 ? 1 - Math.exp(-dt / 0.5) : 1;
    view.ox += (tx - view.ox) * k;
    view.oy += (ty - view.oy) * k;
  }

  // Plan to `target`, snapping it out of a wall first. Returns false when the
  // goal is genuinely unreachable so the caller can pick a different one.
  function planTo(target) {
    const snapped = nearestFree(costmap, ...toCell(costmap, target.x, target.y));
    if (!snapped) return false;

    const from = nearestFree(costmap, ...toCell(costmap, robot.x, robot.y));
    if (!from) return false;

    const raw = findPath(costmap, from, snapped);
    if (!raw) return false;

    const [gx, gy] = toPoint(costmap, ...snapped);
    goal = { x: gx, y: gy, user: target.user };
    path = smoothPath(costmap, raw);
    waypoint = 0;
    dwell = 0;
    return true;
  }

  function wander() {
    for (let i = 0; i < 60; i++) {
      const x = 1.5 + Math.random() * (WORLD.w - 3);
      const y = 1.5 + Math.random() * (WORLD.h - 3);
      if (distToSegs(x, y, segs) > 1.6 && planTo({ x, y, user: false })) return;
    }
  }

  function sense() {
    const start = robot.theta - FOV / 2;
    const step = FOV / (RAYS - 1);
    for (let i = 0; i < RAYS; i++) {
      const a = start + i * step;
      scan[i] = castRay(robot.x, robot.y, Math.cos(a), Math.sin(a), segs);
    }
  }

  function step(dt) {
    // Hold at a goal the visitor set, so arriving is visible rather than
    // instantly overwritten by the next wander target.
    if (dwell > 0) {
      dwell -= dt;
      if (dwell <= 0) wander();
      return { v: 0, omega: 0 };
    }

    if (!path.length && !planTo(goal)) wander();

    // Advance along the plan, skipping waypoints already behind us.
    while (waypoint < path.length - 1) {
      const [wx, wy] = path[waypoint];
      if (Math.hypot(wx - robot.x, wy - robot.y) > WAYPOINT_REACHED) break;
      waypoint++;
    }

    const [tx, ty] = path[waypoint] ?? [goal.x, goal.y];
    const err = wrapAngle(Math.atan2(ty - robot.y, tx - robot.x) - robot.theta);
    const toGoal = Math.hypot(goal.x - robot.x, goal.y - robot.y);

    const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, 2.6 * err));

    // Drive forward only as far as the robot is actually facing the waypoint,
    // and ease off on the final approach.
    let v = MAX_V * Math.max(0, Math.cos(err));
    v *= Math.min(1, Math.max(0.2, toGoal / 1.8));

    robot.theta = wrapAngle(robot.theta + omega * dt);

    // Try the full move, then each axis alone. Sliding along a wall means the
    // robot can always make progress instead of pinning itself against one.
    const dx = Math.cos(robot.theta) * v * dt;
    const dy = Math.sin(robot.theta) * v * dt;
    const clear = (x, y) => distToSegs(x, y, segs) > ROBOT_CLEARANCE;

    if (clear(robot.x + dx, robot.y + dy)) {
      robot.x += dx;
      robot.y += dy;
    } else if (clear(robot.x + dx, robot.y)) {
      robot.x += dx;
    } else if (clear(robot.x, robot.y + dy)) {
      robot.y += dy;
    }

    if (toGoal < ARRIVE) {
      if (goal.user) {
        dwell = DWELL;
        path = [];
      } else {
        wander();
      }
    }

    return { v, omega };
  }

  function drawGrid(rect, alpha) {
    ctx.strokeStyle = tokens.grid;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.w; x += 2) {
      const [sx] = toScreen(x, 0);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, rect.height);
    }
    for (let y = 0; y <= WORLD.h; y += 2) {
      const [, sy] = toScreen(0, y);
      ctx.moveTo(0, sy);
      ctx.lineTo(rect.width, sy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawWalls(alpha) {
    ctx.strokeStyle = tokens.wall;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.lineCap = "square";
    ctx.beginPath();
    for (const s of segs) {
      const [x1, y1] = toScreen(s.x1, s.y1);
      const [x2, y2] = toScreen(s.x2, s.y2);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawScan(sweep) {
    const start = robot.theta - FOV / 2;
    const stepA = FOV / (RAYS - 1);
    const shown = Math.max(2, Math.floor(RAYS * sweep));
    const [rx, ry] = toScreen(robot.x, robot.y);

    // Free-space wedge.
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    for (let i = 0; i < shown; i++) {
      const a = start + i * stepA;
      const [px, py] = toScreen(
        robot.x + Math.cos(a) * scan[i],
        robot.y + Math.sin(a) * scan[i]
      );
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = tokens.accent;
    ctx.globalAlpha = 0.09;
    ctx.fill();

    // Individual returns, fading with range.
    ctx.lineWidth = 1;
    ctx.strokeStyle = tokens.accent;
    for (let i = 0; i < shown; i += 2) {
      const a = start + i * stepA;
      const [px, py] = toScreen(
        robot.x + Math.cos(a) * scan[i],
        robot.y + Math.sin(a) * scan[i]
      );
      ctx.globalAlpha = 0.34 * (1 - scan[i] / RANGE) + 0.1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(px, py);
      ctx.stroke();
    }

    // Hit points on top, so the wall outline reads as a solid return.
    ctx.fillStyle = tokens.accent;
    ctx.globalAlpha = 1;
    for (let i = 0; i < shown; i++) {
      if (scan[i] >= RANGE - 0.05) continue;
      const a = start + i * stepA;
      const [px, py] = toScreen(
        robot.x + Math.cos(a) * scan[i],
        robot.y + Math.sin(a) * scan[i]
      );
      ctx.fillRect(px - 1.4, py - 1.4, 2.8, 2.8);
    }
  }

  // The global plan, drawn the way Nav2 publishes it.
  function drawPath() {
    if (path.length < 2) return;
    ctx.strokeStyle = tokens.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    path.forEach(([x, y], i) => {
      const [sx, sy] = toScreen(x, y);
      i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = tokens.accent;
    ctx.globalAlpha = 0.75;
    for (let i = waypoint; i < path.length; i++) {
      const [sx, sy] = toScreen(path[i][0], path[i][1]);
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawGoal(t) {
    const [gx, gy] = toScreen(goal.x, goal.y);
    const pulse = reduced ? 0.5 : (Math.sin(t / 380) + 1) / 2;
    const r = 9 + pulse * 5;

    ctx.strokeStyle = tokens.accent;
    ctx.globalAlpha = 0.28 + (1 - pulse) * 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = goal.user ? 0.95 : 0.5;
    ctx.beginPath();
    ctx.moveTo(gx - 7, gy);
    ctx.lineTo(gx + 7, gy);
    ctx.moveTo(gx, gy - 7);
    ctx.lineTo(gx, gy + 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawRobot([rx, ry], ringAlpha = 1) {
    const s = Math.max(9, view.scale * 0.5);
    // Nose-forward along the bar during the intro, true heading once on the map.
    const heading = phase === "intro" ? 0 : robot.theta;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(heading);

    ctx.fillStyle = tokens.accent;
    ctx.shadowColor = tokens.accent;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.72, s * 0.66);
    ctx.lineTo(-s * 0.4, 0);
    ctx.lineTo(-s * 0.72, -s * 0.66);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.globalAlpha = 0.4 * ringAlpha;
    ctx.strokeStyle = tokens.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rx, ry, s * 1.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // A short idle fan for the intro, where there is no map to range against yet.
  function drawIntroFan([rx, ry], reach) {
    const span = FOV / 2;
    ctx.strokeStyle = tokens.accent;
    ctx.lineWidth = 1;
    for (let i = 0; i < 48; i++) {
      const a = -span + (i / 47) * FOV;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(a) * reach, ry + Math.sin(a) * reach);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(rect, t = 0) {
    const r = rect || canvas.getBoundingClientRect();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, r.width, r.height);

    // Map fades up during the merge; the boot ramp stays 0 through the intro.
    const gridA = Math.min(1, boot / 0.3) * 0.9;
    const wallA = Math.max(0, Math.min(1, (boot - 0.2) / 0.4));
    const sweep = Math.max(0, Math.min(1, (boot - 0.45) / 0.55));

    drawGrid(r, gridA);
    drawWalls(wallA);

    if (phase === "intro") {
      const at = trackPoint(progress);
      drawIntroFan(at, 40);
      drawRobot(at);
      return;
    }

    if (sweep > 0) {
      drawScan(sweep);
      drawPath();
      drawGoal(t);
    }
    drawRobot(robotScreen());
  }

  function pushTelemetry(v, omega) {
    if (!telemetry) return;
    let hits = 0;
    let min = RANGE;
    for (let i = 0; i < RAYS; i++) {
      if (scan[i] < RANGE - 0.05) hits++;
      if (scan[i] < min) min = scan[i];
    }
    const deg = ((robot.theta * 180) / Math.PI).toFixed(1);
    telemetry.innerHTML =
      `<div><b>/scan</b> <i>ranges</i>[${RAYS}] <i>min</i> ${min.toFixed(2)}m <i>hits</i> ${hits}</div>` +
      `<div><b>/odom</b> <i>x</i> ${robot.x.toFixed(2)} <i>y</i> ${robot.y.toFixed(2)} <i>θ</i> ${deg}°</div>` +
      `<div><b>/cmd_vel</b> <i>linear.x</i> ${v.toFixed(2)} <i>angular.z</i> ${omega.toFixed(2)}</div>`;
  }

  const STAGES = [
    [0, "bringing up nodes"],
    [0.3, "starting /lidar_driver"],
    [0.55, "publishing /tf"],
    [0.78, "loading costmap"],
    [0.95, "ready"],
  ];

  function paintBootUi() {
    if (boot_.fill) boot_.fill.style.width = `${(progress * 100).toFixed(1)}%`;
    if (boot_.pct) boot_.pct.textContent = `${Math.round(progress * 100)}%`;
    if (boot_.stage) {
      const stage = STAGES.filter(([at]) => progress >= at).pop();
      if (stage) boot_.stage.textContent = stage[1];
    }
  }

  function advanceIntro() {
    // Paced by time so the run across the bar is actually watchable, but held
    // at 92% until fonts and the load event land — a cached visit still waits
    // for the real signal, it just never waits only on it.
    const byTime = elapsed / INTRO_MIN_MS;
    progress = skipped ? 1 : Math.min(byTime, assetsReady ? 1 : 0.92);
    paintBootUi();

    if (progress >= 1) {
      adoptBarPosition();
      phase = "merge";
      elapsed = 0;
      // The route is planned from the new pose, not the one it started with.
      if (!planTo(goal)) wander();
      document.documentElement.setAttribute("data-booted", "");
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    elapsed += dt * 1000;

    if (phase === "intro") {
      advanceIntro();
      draw(null, now);
      raf = requestAnimationFrame(frame);
      return;
    }

    // The robot holds still through the merge while the map fades up around it;
    // it only starts driving once the world is fully drawn.
    if (boot < 1) {
      boot = Math.min(1, elapsed / BOOT_MS);
      if (boot >= 1 && phase === "merge") phase = "run";
    }

    sense();
    const { v, omega } = phase === "run" ? step(dt) : { v: 0, omega: 0 };
    updateView(dt);
    draw(null, now);

    if (now - telemetryAt > 100) {
      telemetryAt = now;
      pushTelemetry(v, omega);
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (phase !== "run") return;
    const rect = canvas.getBoundingClientRect();
    const [wx, wy] = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    if (wx < 0.5 || wy < 0.5 || wx > WORLD.w - 0.5 || wy > WORLD.h - 0.5) return;
    // A click on a wall snaps to the nearest open cell rather than doing nothing.
    if (!planTo({ x: wx, y: wy, user: true })) return;
    if (reduced) {
      sense();
      draw(null, performance.now());
    }
  });

  if (!planTo(goal)) wander();

  new ResizeObserver(resize).observe(canvas);
  resize();

  if (reduced) {
    // No intro to play — show the finished state immediately.
    document.documentElement.setAttribute("data-booted", "");
    sense();
    draw(null, 0);
    pushTelemetry(0, 0);
    return;
  }

  // The bar finishes on a real signal: fonts decoded and the load event fired.
  // A ceiling keeps a slow font CDN from stranding anyone on the intro.
  const ready = () => {
    assetsReady = true;
  };
  Promise.race([
    Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((r) =>
        document.readyState === "complete"
          ? r()
          : window.addEventListener("load", r, { once: true })
      ),
    ]),
    new Promise((r) => setTimeout(r, 4000)),
  ]).then(ready);

  paintBootUi();

  // Nobody should be held on an intro they've already seen. Any click, key or
  // scroll cuts straight to the map.
  const skip = () => {
    skipped = true;
  };
  addEventListener("pointerdown", skip, { once: true });
  addEventListener("keydown", skip, { once: true });
  addEventListener("wheel", skip, { once: true, passive: true });

  new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? start() : stop()),
    { threshold: 0 }
  ).observe(canvas);
}
