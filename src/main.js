import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";

import { profile } from "./data/profile.js";
import { projects } from "./data/projects.js";
import { initHeroSim } from "./modules/hero-sim.js";
import { initAmbient } from "./modules/ambient.js";
import { initReveal } from "./modules/reveal.js";
import { initNav } from "./modules/nav.js";
import { centreNameDuringBoot } from "./modules/boot-name.js";

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );

const fill = (sel, html) => {
  const node = document.querySelector(sel);
  if (node) node.innerHTML = html;
};

function renderProfile() {
  fill("[data-role]", esc(profile.role));
  fill("[data-name]", esc(profile.name));
  fill("[data-mark]", esc(profile.mark ?? profile.name));
  fill("[data-footer-name]", esc(profile.name));
  fill("[data-blurb]", esc(profile.blurb));
  fill("[data-about]", profile.about.map((p) => `<p>${esc(p)}</p>`).join(""));

  fill(
    "[data-education]",
    profile.education
      .map(
        (e) => `
        <li class="fact">
          <p class="fact__title">${esc(e.school)}</p>
          <p class="fact__detail">${esc(e.detail)}</p>
          <p class="fact__year">${esc(e.year)}</p>
        </li>`
      )
      .join("")
  );

  fill(
    "[data-experience]",
    profile.experience
      .map(
        (x) => `
        <article class="entry">
          <p class="entry__period">${esc(x.period)}</p>
          <div class="entry__body">
            <h3 class="entry__role">${esc(x.role)}</h3>
            <p class="entry__org">${esc(x.org)}</p>
            <ul class="entry__points">
              ${x.points.map((p) => `<li>${esc(p)}</li>`).join("")}
            </ul>
          </div>
        </article>`
      )
      .join("")
  );

  fill(
    "[data-achievements]",
    profile.achievements.map((a) => `<li class="result">${esc(a)}</li>`).join("")
  );

  fill(
    "[data-stack]",
    profile.stack
      .map(
        (g) => `
        <div class="stack-row">
          <h3 class="stack-row__label">${esc(g.group)}</h3>
          <ul class="chips">
            ${g.items.map((i) => `<li class="chip">${esc(i)}</li>`).join("")}
          </ul>
        </div>`
      )
      .join("")
  );

  fill(
    "[data-channels]",
    profile.channels
      .map(
        (c) => `
        <a class="channel" href="${esc(c.href)}"${
          c.href.startsWith("http") ? ' rel="noopener"' : ""
        }>
          <span class="channel__label">${esc(c.label)}</span>
          <span class="channel__handle">${esc(c.handle)}</span>
          <span class="channel__note">${esc(c.note)}</span>
        </a>`
      )
      .join("")
  );

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
}

function renderProjects() {
  fill(
    "[data-projects]",
    projects
      .map(
        (p) => `
        <article class="project-card">
          ${
            p.hero
              ? `<img class="project-card__thumb" src="${esc(p.hero)}" alt="" loading="lazy" />`
              : ""
          }
          <h3 class="project-card__title">
            <a href="projects/${esc(p.slug)}.html">${esc(p.title)}</a>
          </h3>
          ${p.team ? `<p class="project-card__team">${esc(p.team)}</p>` : ""}
          <p class="project-card__tagline">${esc(p.tagline)}</p>
          <div class="project-card__foot">
            <ul class="chips">
              ${p.tech.map((t) => `<li class="chip">${esc(t)}</li>`).join("")}
            </ul>
          </div>
        </article>`
      )
      .join("")
  );
}

renderProfile();
renderProjects();

// Must run after renderProfile fills the name, so the box is measured at its
// real width.
centreNameDuringBoot(document.querySelector("[data-name]"));

initNav(document.querySelector("[data-nav]"));
initHeroSim(document.querySelector("[data-hero-canvas]"), {
  telemetry: document.querySelector("[data-telemetry]"),
  boot: {
    track: document.querySelector("[data-boot-track]"),
    fill: document.querySelector("[data-boot-fill]"),
    pct: document.querySelector("[data-boot-pct]"),
    stage: document.querySelector("[data-boot-stage]"),
  },
});
initAmbient(document.querySelector("[data-ambient]"));
initReveal();
