// Section content rises in once as it enters view. Staggered within a section
// so a group reads as one arrival rather than a burst.

export function initReveal(root = document) {
  const groups = root.querySelectorAll("[data-reveal]");
  if (!groups.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    groups.forEach((g) => g.setAttribute("data-shown", ""));
    return;
  }

  for (const group of groups) {
    [...group.children].forEach((child, i) => {
      child.style.setProperty("--reveal-delay", `${Math.min(i, 6) * 70}ms`);
    });
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-shown", "");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
  );

  groups.forEach((g) => io.observe(g));
}
