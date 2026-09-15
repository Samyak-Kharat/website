export function initNav(nav) {
  if (!nav) return;

  const toggle = nav.querySelector("[data-nav-toggle]");
  const drawer = nav.querySelector("[data-nav-drawer]");
  const links = [...nav.querySelectorAll("[data-nav-link]")];

  const onScroll = () => {
    nav.dataset.scrolled = String(window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && drawer) {
    toggle.addEventListener("click", () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    });
    drawer.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        drawer.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const sections = links
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  // Whichever section owns the upper third of the viewport is the current one.
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const l of links) {
          l.setAttribute(
            "aria-current",
            String(l.getAttribute("href") === `#${entry.target.id}`)
          );
        }
      }
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );

  sections.forEach((s) => spy.observe(s));
}
