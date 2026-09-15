// A sparse point cloud drifting behind the page body, with a slow scan ring
// passing through it. Deliberately near-invisible — it should register as the
// page being alive, not as something to look at.

const DENSITY = 1 / 16000; // points per square pixel
const MAX_POINTS = 130;

export function initAmbient(canvas) {
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim() || "#22d3ee";

  let points = [];
  let w = 0;
  let h = 0;
  let raf = null;
  let last = 0;
  let ring = 0;
  let parallax = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = rect.width;
    h = rect.height;

    const count = Math.min(MAX_POINTS, Math.round(w * h * DENSITY));
    points = Array.from({ length: count }, () => spawn());
  }

  const spawn = () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 5,
    vy: (Math.random() - 0.5) * 5,
    // Depth drives size, brightness and parallax together, so far points read
    // as further away rather than just dimmer.
    z: 0.25 + Math.random() * 0.75,
  });

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    // Scroll shifts the field opposite to the page, at a depth-scaled rate.
    const target = -window.scrollY * 0.04;
    parallax += (target - parallax) * 0.08;

    ring = (ring + dt * 0.055) % 1.6;

    ctx.clearRect(0, 0, w, h);

    const ringY = ring * h;
    for (const p of points) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      const y = p.y + parallax * p.z;
      // Points brighten as the scan ring sweeps past them.
      const near = Math.max(0, 1 - Math.abs(y - ringY) / 150);
      const size = p.z * 1.5 + near * 1.2;

      ctx.globalAlpha = 0.05 + p.z * 0.08 + near * 0.3;
      ctx.fillStyle = accent;
      ctx.fillRect(p.x - size / 2, y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  const start = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  new ResizeObserver(resize).observe(canvas);
  resize();

  // Nothing to animate while the tab is in the background.
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start()
  );
  start();
}
