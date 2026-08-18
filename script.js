const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

const capacityConcernProfiles = {
  scaling: { label: "scaling strain", demandSource: "growth-scale", journeyTitle: "See how scaling strain becomes a question the organization can actually examine.", journeyLede: "Follow one executive sponsor from the friction growth makes visible to confidential evidence, a governed finding, and focused action." },
  retention: { label: "customer retention pressure", demandSource: "customer-retention-experience", journeyTitle: "See how customer retention pressure can reveal what is happening beneath delivery symptoms.", journeyLede: "Follow one executive sponsor from customer and revenue exposure to confidential cross-functional evidence and a defensible organizational finding." },
  decisions: { label: "decision escalation", demandSource: "operating-model-complexity", journeyTitle: "See why recurring decision escalation may be an operating-system signal.", journeyLede: "Follow one executive sponsor from decisions that keep moving upward to evidence about authority, information, coordination, and execution." },
  change: { label: "AI and change strain", demandSource: "organizational-change", journeyTitle: "See whether change is outrunning the organization’s ability to absorb it.", journeyLede: "Follow one executive sponsor from adoption friction and change fatigue to protected evidence about what the operating system can carry." },
  coordination: { label: "cross-functional friction", demandSource: "operating-model-complexity", journeyTitle: "See how cross-functional friction becomes an organizational inquiry—not a blame exercise.", journeyLede: "Follow one executive sponsor from broken handoffs and local explanations to a shared, evidence-governed view of the system." },
  leadership: { label: "increasing leadership load", demandSource: "operating-model-complexity", journeyTitle: "See what increasing leadership effort may be concealing about the operating system.", journeyLede: "Follow one executive sponsor from escalating leadership load to confidential evidence about where the organization depends on personal compensation." }
};

function capacityConcernFromUrl() {
  const key = new URLSearchParams(location.search).get("concern");
  return capacityConcernProfiles[key] ? { key, ...capacityConcernProfiles[key] } : null;
}

function contextualHref(href, concernKey = capacityConcernFromUrl()?.key) {
  if (!concernKey || href.startsWith("#") || /^(?:https?:|mailto:|tel:)/.test(href)) return href;
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) return href;
  url.searchParams.set("concern", concernKey);
  return `${url.pathname.split("/").pop() || "index.html"}${url.search}${url.hash}`;
}

window.capacityExperienceContext = { profiles: capacityConcernProfiles, current: capacityConcernFromUrl, contextualHref };

(() => {
  const header = document.querySelector(".site-header");
  const main = document.querySelector("main");
  if (!header || !main || document.querySelector("[data-capacity-path]")) return;

  const stages = [
    { id: "recognize", label: "Recognize the strain", href: "signs.html", pages: ["index.html", "", "signs.html"], why: "Name the operating conditions that feel familiar before reaching for an explanation.", next: "Learn what may be producing the strain", nextHref: "framework.html" },
    { id: "understand", label: "Understand the system", href: "framework.html", pages: ["framework.html"], why: "Use the Capacity Lens to see how complexity, operating mechanisms, and compensation interact.", next: "See how the organization comes into focus", nextHref: "platform-journey.html" },
    { id: "examine", label: "See how it is examined", href: "platform-journey.html", pages: ["platform-journey.html", "diagnostic.html", "capacity-brief-example.html"], why: "See how confidential perspectives become a governed finding without exposing individual responses.", next: "Get a bounded Capacity Signal", nextHref: "assessment.html" },
    { id: "signal", label: "Get a bounded signal", href: "assessment.html", pages: ["assessment.html", "saved-capacity-signal.html", "saved-results.html"], why: "Test whether capacity may be under pressure without mistaking a lightweight signal for a diagnosis.", next: "Decide whether a deeper conversation is warranted", nextHref: "contact.html" },
    { id: "decide", label: "Decide the next move", href: "contact.html", pages: ["contact.html", "success.html"], why: "Bring the execution condition into a focused conversation and determine whether the Diagnostic fits.", next: "Start a Capacity Conversation", nextHref: "contact.html" }
  ];
  const pathSegment = location.pathname.split("/").filter(Boolean).pop() || "";
  const page = pathSegment && !pathSegment.includes(".") ? `${pathSegment}.html` : pathSegment;
  const current = stages.find(stage => stage.pages.includes(page));
  if (!current) return;
  const position = stages.indexOf(current);
  const path = document.createElement("section");
  path.className = "capacity-path";
  path.dataset.capacityPath = current.id;
  path.setAttribute("aria-label", "Your path through Organizational Capacity");
  path.innerHTML = `
    <div class="capacity-path-inner">
      <div class="capacity-path-context">
        <span>Where you are · Step ${position + 1} of ${stages.length}</span>
        <strong>${current.label}</strong>
        <p>${current.why}</p>
      </div>
      <nav class="capacity-path-steps" aria-label="Organizational Capacity path">
        ${stages.map((stage, index) => `<a href="${contextualHref(stage.href)}" ${stage === current ? 'aria-current="step"' : ""}><i>${index + 1}</i><span>${stage.label}</span></a>`).join("")}
      </nav>
      <a class="capacity-path-next" href="${contextualHref(current.nextHref)}"><span>What happens next</span><strong>${current.next}</strong><i aria-hidden="true">→</i></a>
    </div>`;
  header.insertAdjacentElement("afterend", path);
  requestAnimationFrame(() => {
    const activeStep = path.querySelector('[aria-current="step"]');
    const track = activeStep?.parentElement;
    if (activeStep && track && track.scrollWidth > track.clientWidth) {
      track.scrollLeft = activeStep.offsetLeft - (track.clientWidth - activeStep.offsetWidth) / 2;
    }
  });

  if (nav) {
    const navPath = [
      ["signs.html", "The Problem"],
      ["framework.html", "Capacity Lens"],
      ["platform-journey.html", "Platform Demo"],
      ["assessment.html", "Free Assessment"],
      ["contact.html", "Start a Conversation"]
    ];
    nav.replaceChildren(...navPath.map(([href, label]) => {
      const link = document.createElement("a");
      link.href = contextualHref(href);
      link.textContent = label;
      if (href === current.href || (current.id === "examine" && href === "platform-journey.html")) link.setAttribute("aria-current", "page");
      if (href === "assessment.html") link.className = "nav-primary-action";
      return link;
    }));
  }

  const entryPointPages = ["", "index.html", "signs.html", "framework.html", "platform-journey.html", "diagnostic.html", "assessment.html", "insights.html", "about.html", "contact.html"];
  if (entryPointPages.includes(page) && !document.querySelector("[data-public-entry-points]")) {
    const entryPoints = document.createElement("section");
    entryPoints.className = "public-entry-points";
    entryPoints.dataset.publicEntryPoints = "";
    entryPoints.setAttribute("aria-labelledby", "public-entry-points-title");
    entryPoints.innerHTML = `
      <div class="public-entry-points-inner">
        <div class="public-entry-points-heading">
          <p class="eyebrow">Choose your starting point</p>
          <h2 id="public-entry-points-title">See a signal—or see the complete experience.</h2>
          <p>Both are designed to help you see the organization more clearly without assuming a diagnosis.</p>
        </div>
        <div class="public-entry-point-options">
          <a href="${contextualHref("assessment.html")}">
            <span>About five minutes</span>
            <strong>Take the Free Assessment</strong>
            <p>Get a lightweight Capacity Signal grounded in one consequential execution demand.</p>
            <i aria-hidden="true">Begin assessment →</i>
          </a>
          <a href="${contextualHref("platform-journey.html")}">
            <span>Interactive walkthrough</span>
            <strong>Explore the Platform Demo</strong>
            <p>Follow the sponsor journey from organizational concern to protected evidence and focused direction.</p>
            <i aria-hidden="true">View the demo →</i>
          </a>
        </div>
      </div>`;
    main.insertAdjacentElement("afterend", entryPoints);
  }
})();

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
  const root = document.querySelector("#is-this-you");
  if (!root) return;
  const concerns = {
    scaling: {
      kicker: "Scaling strain",
      title: "The organization may be compensating for a capacity constraint.",
      pattern: "Decision rights, coordination, and operating rhythms have not kept pace with the complexity growth created.",
      cost: "Temporary heroics become the operating model. Execution slows while leadership attention and employee energy absorb the difference.",
      lens: "Whether priority, authority, information, coordination, and capability deployment can carry the new execution demand.",
      next: "Begin with a lightweight Capacity Signal before choosing an intervention.",
      stage: "complexity"
    },
    retention: {
      kicker: "Customer and revenue exposure",
      title: "Retention pressure may be the downstream result of an operating-system mismatch.",
      pattern: "Commercial promises, product capacity, implementation, support, and renewal decisions may be moving through different operating realities.",
      cost: "Teams fight individual fires while recurring delivery and customer-experience conditions continue to put revenue at risk.",
      lens: "Where customer commitments lose fidelity as information, authority, resources, and work move across functional boundaries.",
      next: "Use the Capacity Signal to distinguish a localized service issue from broader execution strain.",
      stage: "friction"
    },
    decisions: {
      kicker: "Decision escalation",
      title: "Senior leadership may be carrying decisions the operating system should resolve.",
      pattern: "Authority, information, or accountability may be too ambiguous for recurring tradeoffs to resolve at the right level.",
      cost: "Executive attention becomes a throughput constraint, managers wait for permission, and important decisions reopen instead of moving into execution.",
      lens: "Whether decision rights, information readiness, and cross-functional commitments are aligned with the decisions the strategy now requires.",
      next: "Begin with a Capacity Signal focused on the consequential decisions that keep slowing or escalating.",
      stage: "constraint"
    },
    change: {
      kicker: "AI and change readiness",
      title: "The initiative may be asking the organization to carry more change than its operating system can absorb.",
      pattern: "Technology, priorities, roles, and working practices may be changing faster than attention, authority, learning, and coordination can adapt.",
      cost: "Adoption activity increases while operating behavior remains unchanged—creating fatigue, skepticism, and repeated reinvestment.",
      lens: "Whether the organization has the attention, decision clarity, information, coordination, and capability deployment required to turn change into work.",
      next: "Use the Capacity Signal before adding another adoption, training, or communication layer.",
      stage: "complexity"
    },
    coordination: {
      kicker: "Cross-functional friction",
      title: "The work may be failing between functions—not within them.",
      pattern: "Each team can perform locally while ownership, information, timing, and tradeoffs degrade at the boundaries between them.",
      cost: "Waiting, rework, meetings, and escalation compound even as every function reports high activity and reasonable internal performance.",
      lens: "How shared priorities, boundary-spanning authority, operating information, coordination, and resources interact around the work that must move.",
      next: "Begin with the Capacity Signal anchored to one consequential cross-functional outcome.",
      stage: "friction"
    },
    leadership: {
      kicker: "Leadership load",
      title: "Leadership effort may be concealing how much capacity the system lacks.",
      pattern: "A small number of trusted leaders may be integrating information, resolving ambiguity, and holding commitments together through personal intervention.",
      cost: "Performance becomes fragile, succession becomes harder, and leaders lose the attention required for strategy because they are carrying the operating system themselves.",
      lens: "Which mechanisms depend on individual compensation rather than repeatable organizational clarity and movement.",
      next: "Use the Capacity Signal to make the hidden leadership load visible before adding more effort or headcount.",
      stage: "constraint"
    }
  };
  const fields = {
    kicker: root.querySelector("[data-concern-kicker]"),
    title: root.querySelector("[data-concern-title]"),
    pattern: root.querySelector("[data-concern-pattern]"),
    cost: root.querySelector("[data-concern-cost]"),
    lens: root.querySelector("[data-concern-lens]"),
    next: root.querySelector("[data-concern-next]")
  };
  const applyConcernContext = key => {
    const url = new URL(location.href);
    url.searchParams.set("concern", key);
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    document.querySelectorAll('a[href*="assessment.html"],a[href*="platform-journey.html"],.capacity-path a,.site-nav a').forEach(link => {
      link.href = contextualHref(link.getAttribute("href"), key);
    });
  };
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-capacity-concern]");
    if (!button) return;
    const concern = concerns[button.dataset.capacityConcern];
    if (!concern) return;
    applyConcernContext(button.dataset.capacityConcern);
    root.querySelectorAll("[data-capacity-concern]").forEach(option => {
      const active = option === button;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    });
    for (const [key, element] of Object.entries(fields)) element.textContent = concern[key];
    document.querySelector("[data-flow-engine]")?.flowEngine?.setNarrativeStage(concern.stage);
  });
  const initialConcern = capacityConcernFromUrl();
  if (initialConcern) root.querySelector(`[data-capacity-concern="${initialConcern.key}"]`)?.click();
})();
