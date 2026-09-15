// Click-to-play YouTube. The page ships a thumbnail; the real iframe is only
// created when someone asks for it, then autoplays so the click is the play.

export function initYouTube(scope) {
  // maxresdefault is the sharp one but doesn't exist for every video, so drop
  // to hqdefault when it 404s. Capture phase — img errors don't bubble.
  scope.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!img.dataset?.fallback) return;
      img.src = img.dataset.fallback;
      delete img.dataset.fallback;
    },
    true
  );

  scope.addEventListener("click", (e) => {
    const button = e.target.closest("[data-yt]");
    if (!button) return;

    const id = button.dataset.yt;
    const frame = document.createElement("iframe");
    frame.className = "media__el";
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`;
    frame.title = button.getAttribute("aria-label") || "YouTube video";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";

    button.replaceWith(frame);
  });
}
