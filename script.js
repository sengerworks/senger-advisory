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
      primary: "Every growing organization",
      secondary: "eventually feels the strain.",
      lede: "Complexity grows faster than the systems, leadership, and operating rhythms built to carry it."
    },
    complexity: {
      primary: "As organizations grow,",
      secondary: "complexity compounds.",
      lede: "More decisions, dependencies, and handoffs create more paths for work to travel."
    },
    friction: {
      primary: "Work starts to wait.",
      secondary: "Execution starts to slow.",
      lede: "Not because strategy failed. Because capacity did not keep pace."
    },
    constraint: {
      primary: "When capacity constrains,",
      secondary: "the whole system feels it.",
      lede: "A local bottleneck becomes delay, rerouting, and friction across the organization."
    },
    resolution: {
      primary: "That ability has a name:",
      secondary: "Organizational Capacity.",
      lede: "The Capacity Lens makes the forces shaping speed, clarity, and coordination visible."
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
