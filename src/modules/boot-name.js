// Parks the hero name over the centre of the boot screen, then lets it travel
// to its real position when the map arrives. FLIP: the element never leaves its
// natural place in the layout — only a transform moves it, so clearing the
// transform animates it home with nothing to re-measure or misalign.

const ABOVE_CENTRE = 56;

export function centreNameDuringBoot(name) {
  if (!name) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const place = () => {
    if (document.documentElement.hasAttribute("data-booted")) return stop();

    name.style.setProperty("--name-dx", "0px");
    name.style.setProperty("--name-dy", "0px");
    const box = name.getBoundingClientRect();

    const dx = window.innerWidth / 2 - (box.left + box.width / 2);
    const dy = window.innerHeight / 2 - ABOVE_CENTRE - (box.top + box.height / 2);
    name.style.setProperty("--name-dx", `${Math.round(dx)}px`);
    name.style.setProperty("--name-dy", `${Math.round(dy)}px`);
  };

  // No transition for the initial placement, or the name slides in from its
  // hero position on first paint.
  const prev = name.style.transition;
  name.style.transition = "none";
  place();
  void name.offsetWidth;
  name.style.transition = prev;

  const onResize = () => place();
  window.addEventListener("resize", onResize);

  function stop() {
    window.removeEventListener("resize", onResize);
    observer.disconnect();
  }

  const observer = new MutationObserver(() => {
    if (document.documentElement.hasAttribute("data-booted")) stop();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-booted"],
  });
}
