import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/project.css";

import { bySlug } from "./data/projects.js";
import { profile } from "./data/profile.js";
import { initNav } from "./modules/nav.js";
import { initYouTube } from "./modules/youtube.js";
import { initAmbient } from "./modules/ambient.js";
import { initReveal } from "./modules/reveal.js";

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );

// Detail pages live one level down, so root-relative media needs a hop up.
const asset = (p) => `../${p}`;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const root = document.querySelector("[data-project]");
const project = bySlug(root?.dataset.project);

const set = (sel, html) => {
  const n = document.querySelector(sel);
  if (n) n.innerHTML = html;
};

// Drop a whole section when there's nothing to put in it.
const section = (sel, keep) => {
  const n = document.querySelector(sel);
  if (n && !keep) n.remove();
};

function renderHero() {
  set("[data-title]", esc(project.title));
  set("[data-team]", esc(project.team));
  set("[data-tagline]", esc(project.tagline));

  const meta = [
    project.period && ["Timeline", project.period],
    project.role && ["Role", project.role],
    project.award && ["Result", project.award],
  ].filter(Boolean);

  set(
    "[data-meta]",
    meta
      .map(
        ([k, v]) => `
        <div class="meta-item">
          <p class="meta-item__key">${esc(k)}</p>
          <p class="meta-item__val">${esc(v)}</p>
        </div>`
      )
      .join("")
  );

  // Built here rather than sitting in the HTML with an empty src, which would
  // ship a broken-image box before this runs.
  const media = document.querySelector("[data-hero-media]");
  if (!media) return;
  if (!project.hero) return media.remove();

  const img = new Image();
  img.src = asset(project.hero);
  img.alt = project.title;
  media.append(img);

  if (reducedMotion) return;

  // Slow parallax: the photo drifts up at a fraction of scroll speed. The image
  // is over-scaled so the drift never exposes an edge.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const shift = Math.min(window.scrollY, window.innerHeight) * 0.18;
      img.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.1)`;
      ticking = false;
    });
  };
  img.style.transform = "scale(1.1)";
  window.addEventListener("scroll", onScroll, { passive: true });
}

function galleryItem(item) {
  if (item.kind === "youtube") {
    // Facade: thumbnail now, real player only once someone asks for it. Keeps
    // three embeds from loading on every visit.
    return `
      <figure class="media media--${item.portrait ? "portrait" : "wide"}">
        <button class="media__play" type="button" data-yt="${esc(item.id)}"
                aria-label="Play ${esc(item.caption)} on YouTube">
          <img class="media__thumb" loading="lazy"
               src="https://i.ytimg.com/vi/${esc(item.id)}/maxresdefault.jpg"
               data-fallback="https://i.ytimg.com/vi/${esc(item.id)}/hqdefault.jpg" alt="" />
          <span class="media__play-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
          </span>
        </button>
        <figcaption class="media__caption">${esc(item.caption)}</figcaption>
      </figure>`;
  }

  if (item.kind === "video") {
    // Silent looping video is still motion, so hand over the controls instead
    // of autoplaying when the visitor has asked for less of it.
    const playback = reducedMotion
      ? "controls preload=\"metadata\""
      : "autoplay muted loop playsinline preload=\"metadata\"";
    return `
      <figure class="media media--wide">
        <video class="media__el" src="${esc(asset(item.src))}" ${playback}></video>
        <figcaption class="media__caption">${esc(item.caption)}</figcaption>
      </figure>`;
  }

  return `
    <figure class="media media--wide">
      <img class="media__el" src="${esc(asset(item.src))}" alt="${esc(item.caption)}" loading="lazy" />
      <figcaption class="media__caption">${esc(item.caption)}</figcaption>
    </figure>`;
}

function render() {
  document.title = `${project.title} — ${profile.name}`;

  renderHero();
  set("[data-overview]", project.overview.map((p) => `<p>${esc(p)}</p>`).join(""));

  const overviewMedia = document.querySelector("[data-overview-media]");
  if (overviewMedia) {
    if (project.overviewImage) {
      const img = new Image();
      img.src = asset(project.overviewImage.src);
      img.alt = project.overviewImage.alt ?? project.title;
      img.loading = "lazy";
      overviewMedia.append(img);
    } else {
      overviewMedia.remove();
      overviewMedia.closest(".overview__grid")?.classList.add("overview__grid--text-only");
    }
  }

  section("[data-gallery-section]", project.gallery?.length);
  if (project.gallery?.length) {
    set("[data-gallery]", project.gallery.map(galleryItem).join(""));
  }

  section("[data-specs-section]", project.specs?.length);
  if (project.specs?.length) {
    set(
      "[data-specs]",
      project.specs
        .map(
          (s) => `
          <div class="spec">
            <p class="spec__label">${esc(s.label)}</p>
            <p class="spec__value">${esc(s.value)}</p>
            ${s.note ? `<p class="spec__note">${esc(s.note)}</p>` : ""}
          </div>`
        )
        .join("")
    );
  }

  section("[data-results-section]", project.results?.length);
  if (project.results?.length) {
    set(
      "[data-results]",
      project.results.map((r) => `<li class="result">${esc(r)}</li>`).join("")
    );
  }

  const links = [
    project.repo && ["View repository", project.repo],
    project.demo && ["View demo", project.demo],
  ].filter(Boolean);
  set(
    "[data-links]",
    links
      .map(
        ([label, href]) =>
          `<a class="btn btn--ghost" href="${esc(href)}" rel="noopener">${esc(label)}</a>`
      )
      .join("")
  );
}

if (project) render();

const footerName = document.querySelector("[data-footer-name]");
if (footerName) footerName.textContent = profile.name;

const mark = document.querySelector("[data-mark]");
if (mark) mark.textContent = profile.mark ?? profile.name;

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();

initNav(document.querySelector("[data-nav]"));
initYouTube(document);
initAmbient(document.querySelector("[data-ambient]"));
initReveal();
