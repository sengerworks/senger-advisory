const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    });
  });
}

document.querySelectorAll(
  ".belief-shift, .progression-chapter, .truth-section .section-inner, .section-inner, .diagnosis-copy, .prescription-list, .diagnosis-shift > p"
).forEach(el => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.14 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
}

(() => {
  const hero = document.querySelector(".hero");
  const copy = hero?.querySelector(".hero-copy");
  const canvas = hero?.querySelector("[data-flow-engine]");
  const primary = hero?.querySelector("[data-hero-title-primary]");
  const secondary = hero?.querySelector("[data-hero-title-secondary]");
  const lede = hero?.querySelector("[data-hero-lede]");
  if (!hero || !copy || !canvas || !primary || !secondary || !lede) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const states = {
    intro: {
      primary: "Every organization",
      secondary: "is asked to carry complexity.",
      lede: "The question is whether the operating system can carry what execution now requires."
    },
    complexity: {
      primary: "Strategy, change, and growth",
      secondary: "alter what must be carried.",
      lede: "Volume, variety, interdependence, uncertainty, and rate of change reshape the demand."
    },
    friction: {
      primary: "Work starts to wait.",
      secondary: "Execution starts to slow.",
      lede: "Not necessarily because strategy failed—but because the operating system no longer fits the demand."
    },
    constraint: {
      primary: "When the system cannot carry it,",
      secondary: "people compensate.",
      lede: "Meetings, escalation, workarounds, and extraordinary effort preserve performance—for a time."
    },
    resolution: {
      primary: "That ability has a name:",
      secondary: "Organizational Capacity.",
      lede: "The Capacity Lens shows what the organization must carry, where the system is constrained, and what should change."
    }
  };

  let currentState = "intro";
  let changeTimer = 0;
  const setState = (name, immediate = false) => {
    if (name === currentState && !immediate) return;
    currentState = name;
    window.clearTimeout(changeTimer);
    if (!immediate) copy.classList.add("is-changing");
    changeTimer = window.setTimeout(() => {
      const state = states[name];
      primary.textContent = state.primary;
      secondary.textContent = state.secondary;
      lede.textContent = state.lede;
      copy.classList.remove("is-changing");
      canvas.flowEngine?.setNarrativeStage(name);
    }, immediate ? 0 : 260);
  };

  if (reducedMotion) {
    setState("resolution", true);
    hero.classList.add("narrative-ready");
    return;
  }

  window.setTimeout(() => hero.classList.add("narrative-ready"), 2800);
  canvas.flowEngine?.setNarrativeStage("intro");
  [
    [3500, "complexity"],
    [7000, "friction"],
    [10500, "constraint"],
    [14000, "resolution"]
  ].forEach(([delay, state]) => window.setTimeout(() => setState(state), delay));
})();
