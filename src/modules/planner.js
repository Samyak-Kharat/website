// Occupancy grid + A*, the two pieces that make a clicked goal reachable when
// a wall is in the way. Obstacles are inflated by the robot radius, so a path
// that exists on the grid is one the robot can actually drive.

const RES = 0.25;
const INFLATION = 0.55;

export function buildCostmap(world, segs, distToSegs) {
  const cols = Math.ceil(world.w / RES);
  const rows = Math.ceil(world.h / RES);
  const occ = new Uint8Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * RES;
      const y = (r + 0.5) * RES;
      if (distToSegs(x, y, segs) < INFLATION) occ[r * cols + c] = 1;
    }
  }

  return { cols, rows, occ, res: RES };
}

const idx = (m, c, r) => r * m.cols + c;
const inBounds = (m, c, r) => c >= 0 && r >= 0 && c < m.cols && r < m.rows;
export const isFree = (m, c, r) => inBounds(m, c, r) && !m.occ[idx(m, c, r)];

export const toCell = (m, x, y) => [Math.floor(x / m.res), Math.floor(y / m.res)];
export const toPoint = (m, c, r) => [(c + 0.5) * m.res, (r + 0.5) * m.res];

// Nearest free cell by expanding rings — lets a click land on a wall and still
// mean something sensible.
export function nearestFree(m, c, r) {
  if (isFree(m, c, r)) return [c, r];
  for (let rad = 1; rad < 40; rad++) {
    for (let dc = -rad; dc <= rad; dc++) {
      for (let dr = -rad; dr <= rad; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad) continue;
        if (isFree(m, c + dc, r + dr)) return [c + dc, r + dr];
      }
    }
  }
  return null;
}

class Heap {
  constructor() {
    this.a = [];
  }
  push(node) {
    const a = this.a;
    a.push(node);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let s = i;
        if (l < a.length && a[l].f < a[s].f) s = l;
        if (r < a.length && a[r].f < a[s].f) s = r;
        if (s === i) break;
        [a[s], a[i]] = [a[i], a[s]];
        i = s;
      }
    }
    return top;
  }
  get size() {
    return this.a.length;
  }
}

const NEIGHBOURS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

// Octile distance — the admissible heuristic for 8-connected movement.
function heuristic(c, r, gc, gr) {
  const dx = Math.abs(c - gc);
  const dy = Math.abs(r - gr);
  return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

export function findPath(m, start, goal) {
  const [sc, sr] = start;
  const [gc, gr] = goal;
  if (!isFree(m, sc, sr) || !isFree(m, gc, gr)) return null;

  const n = m.cols * m.rows;
  const gScore = new Float32Array(n).fill(Infinity);
  const cameFrom = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);

  const startI = idx(m, sc, sr);
  const goalI = idx(m, gc, gr);
  gScore[startI] = 0;

  const open = new Heap();
  open.push({ c: sc, r: sr, f: heuristic(sc, sr, gc, gr) });

  while (open.size) {
    const cur = open.pop();
    const i = idx(m, cur.c, cur.r);
    if (closed[i]) continue;
    closed[i] = 1;

    if (i === goalI) {
      const path = [];
      for (let k = i; k !== -1; k = cameFrom[k]) {
        path.push(toPoint(m, k % m.cols, (k / m.cols) | 0));
      }
      return path.reverse();
    }

    for (const [dc, dr, cost] of NEIGHBOURS) {
      const nc = cur.c + dc;
      const nr = cur.r + dr;
      if (!isFree(m, nc, nr)) continue;
      // No cutting diagonally through a wall corner.
      if (dc && dr && (!isFree(m, cur.c + dc, cur.r) || !isFree(m, cur.c, cur.r + dr))) continue;

      const ni = idx(m, nc, nr);
      if (closed[ni]) continue;
      const tentative = gScore[i] + cost;
      if (tentative >= gScore[ni]) continue;

      gScore[ni] = tentative;
      cameFrom[ni] = i;
      open.push({ c: nc, r: nr, f: tentative + heuristic(nc, nr, gc, gr) });
    }
  }

  return null;
}

function clearLine(m, ax, ay, bx, by) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / (m.res * 0.5));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [c, r] = toCell(m, ax + (bx - ax) * t, ay + (by - ay) * t);
    if (!isFree(m, c, r)) return false;
  }
  return true;
}

// String-pulling: drop any waypoint the robot can see past, so it drives
// straight lines and smooth corners instead of grid staircases.
export function smoothPath(m, path) {
  if (!path || path.length < 3) return path;
  const out = [path[0]];
  let anchor = 0;
  for (let i = 2; i < path.length; i++) {
    const [ax, ay] = path[anchor];
    const [bx, by] = path[i];
    if (!clearLine(m, ax, ay, bx, by)) {
      out.push(path[i - 1]);
      anchor = i - 1;
    }
  }
  out.push(path[path.length - 1]);
  return out;
}
