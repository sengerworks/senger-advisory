(() => {
  const viewButtons = [...document.querySelectorAll("[data-brief-view]")];
  const viewPanels = [...document.querySelectorAll("[data-view-panel]")];
  const routeButtons = [...document.querySelectorAll("[data-delivery-route]")];
  const routeDescription = document.querySelector("[data-delivery-description]");
  const serviceRoute = document.querySelector("[data-service-route]");

  const routeCopy = {
    automated: {
      description: "The platform guides check-ins, evidence prompts, learning, and escalation while preserving the same validated diagnostic record.",
      service: "Platform-guided with human escalation available."
    },
    "advisor-led": {
      description: "The advisor facilitates reviews, adds contextual interpretation, and coordinates learning or specialists within the same validated diagnostic record.",
      service: "Advisor-guided with platform-supported evidence and reassessment."
    }
  };

  function showView(viewName, moveFocus = false) {
    viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.briefView === viewName)));
    viewPanels.forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== viewName; });
    if (moveFocus) document.querySelector(`[data-view-panel="${viewName}"] .view-heading h3`)?.focus({ preventScroll: true });
  }

  viewButtons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.briefView)));
  document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => {
    const viewName = button.dataset.openView;
    showView(viewName);
    document.querySelector(`[data-view-panel="${viewName}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  routeButtons.forEach((button) => button.addEventListener("click", () => {
    const route = button.dataset.deliveryRoute;
    routeButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
    routeDescription.textContent = routeCopy[route].description;
    serviceRoute.textContent = routeCopy[route].service;
  }));
})();
