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
  const visual = hero?.querySelector(".hero-visual");
  const canvas = hero?.querySelector("[data-flow-engine]");
  const primary = hero?.querySelector("[data-hero-title-primary]");
  const secondary = hero?.querySelector("[data-hero-title-secondary]");
  const lede = hero?.querySelector("[data-hero-lede]");
  const prompt = hero?.querySelector("[data-lens-prompt]");
  if (!hero || !copy || !visual || !canvas || !primary || !secondary || !lede || !prompt) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const states = {
    intro: {
      primary: "Growth should",
      secondary: "accelerate execution.",
      lede: "More people, ideas, and investment should create momentum."
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
      primary: "Capacity changes",
      secondary: "how work moves.",
      lede: "Increase capacity and the same organization moves with greater speed, clarity, and confidence."
    }
  };

  let currentState = "intro";
  let changeTimer = 0;
  let resolved = false;
  const startedAt = performance.now();

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
    }, immediate ? 0 : 260);
  };

  const revealResolution = () => {
    if (resolved || reducedMotion) return;
    resolved = true;
    prompt.classList.remove("visible");
    setState("resolution");
  };

  if (reducedMotion) {
    resolved = true;
    setState("resolution", true);
    hero.classList.add("narrative-ready");
    return;
  }

  window.setTimeout(() => hero.classList.add("narrative-ready"), 2800);
  window.setTimeout(() => {
    if (!resolved) {
      prompt.textContent = coarsePointer
        ? "Touch and drag through the system to reveal higher capacity."
        : "Move through the system to reveal higher capacity.";
      prompt.classList.add("visible");
    }
  }, 4800);

  visual.addEventListener("pointermove", event => {
    if (event.pointerType !== "touch") revealResolution();
  }, { passive: true, once: true });
  visual.addEventListener("pointerdown", revealResolution, { passive: true, once: true });

  const narrativeTimer = window.setInterval(() => {
    if (resolved || !canvas.flowEngine) {
      if (resolved) window.clearInterval(narrativeTimer);
      return;
    }
    const elapsed = (performance.now() - startedAt) / 1000;
    const snapshot = canvas.flowEngine.getSnapshot();
    const maxPressure = Math.max(...snapshot.nodes.map(node => node.pressure));
    if (elapsed >= 14 && maxPressure > 0.62) setState("constraint");
    else if (elapsed >= 13 || (elapsed >= 9 && snapshot.demand > 0.68)) setState("friction");
    else if (elapsed >= 6) setState("complexity");
  }, 400);
})();
