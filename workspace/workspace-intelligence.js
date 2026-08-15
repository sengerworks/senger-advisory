(() => {
  const main = document.querySelector("main");
  const hero = main?.querySelector(":scope > section");
  if (!main || !hero) return;
  const panel = document.createElement("section");
  panel.className = "experience-intelligence";
  panel.dataset.experienceIntelligence = "";
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");
  panel.innerHTML = `<header><div><span data-intelligence-position>Decision guidance</span><h2 data-intelligence-title>Preparing the next safe action…</h2></div><b data-intelligence-role></b></header><div class="experience-intelligence-grid"><article><span>Why this is next</span><p data-intelligence-why></p></article><article><span>What remains uncertain</span><p data-intelligence-uncertainty></p></article><article class="intelligence-receipt"><span>Verified in this workspace</span><p data-intelligence-receipt></p></article></div><footer><div><span>Next best action</span><strong data-intelligence-next></strong></div><button class="primary-button" type="button" data-intelligence-primary></button><button class="text-button" type="button" data-intelligence-review hidden></button></footer>`;
  hero.insertAdjacentElement("afterend", panel);
  const fields = Object.fromEntries(["position", "title", "role", "why", "uncertainty", "receipt", "next", "primary", "review"].map(name => [name, panel.querySelector(`[data-intelligence-${name}]`)]));
  let current = null;
  function follow(selector) {
    const target = selector ? document.querySelector(selector) : null;
    if (!target) return;
    if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) target.click();
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function render(detail = {}) {
    if (!["sponsor", "participant", "steward", "operator"].includes(detail.role)) return;
    current = detail;
    fields.position.textContent = detail.position || "Decision guidance";
    fields.title.textContent = detail.title || "Review the current workspace state.";
    fields.role.textContent = detail.role;
    fields.why.textContent = detail.why || "The platform selected this action from the current governed stage.";
    fields.uncertainty.textContent = detail.uncertainty || "No conclusion should be inferred beyond the information explicitly shown here.";
    fields.receipt.textContent = detail.receipt || "Your authorized role and workspace boundary are confirmed.";
    fields.next.textContent = detail.next || detail.title || "Continue";
    fields.primary.textContent = detail.primaryLabel || "Continue";
    fields.primary.hidden = !detail.primarySelector;
    fields.review.textContent = detail.reviewLabel || "Review or revise safely";
    fields.review.hidden = !detail.reviewSelector;
    panel.hidden = false;
  }
  fields.primary.addEventListener("click", () => follow(current?.primarySelector));
  fields.review.addEventListener("click", () => follow(current?.reviewSelector));
  window.capacityGuidance = render;
  window.addEventListener("capacity:guidance", event => render(event.detail));
})();
