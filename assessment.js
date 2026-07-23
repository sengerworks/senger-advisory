import {
  decryptSavedProfile,
  encryptSavedProfile,
  recoveryCredentialsFromUrl,
  recoverySecretFromUrl
} from "./saved-results-crypto.js?v=action-cycle-v1";
import {
  createPrivateResult,
  privateResultsEnvironment,
  readPrivateResult,
  updatePrivateResult
} from "./private-results-api.js";

(() => {
  "use strict";

  const app = document.querySelector("[data-assessment-app]");
  if (!app) return;

  const assessmentVersion = "1.0.0";
  const scoringVersion = "0.1.0";
  const evidenceEndpoint = "/.netlify/functions/assessment-evidence";

  const domains = [
    {
      id: "leadership",
      name: "Leadership",
      description: "How leaders create clarity, make tradeoffs, and prevent ambiguity from accumulating at the top.",
      interpretation: "Leadership capacity may be constrained when senior attention becomes the organization’s default routing mechanism for ambiguity.",
      implication: "Clarify the decisions that require senior judgment, then move routine ambiguity to explicit owners closer to the work.",
      strength: "Leadership is creating useful clarity without becoming the default path for every decision.",
      prompts: [
        "Which decisions still reach senior leaders that should be owned elsewhere?",
        "Where are strategic tradeoffs clear to leaders but ambiguous to teams?",
        "What leadership work is being displaced by recurring escalation?"
      ],
      questions: [
        "Leaders translate strategic priorities into clear tradeoffs.",
        "Leadership attention remains focused on decisions only leaders can make.",
        "Teams resolve routine ambiguity without escalating it upward."
      ]
    },
    {
      id: "decisions",
      name: "Decision Velocity",
      description: "How efficiently ambiguity becomes committed action at the appropriate level.",
      interpretation: "Decision capacity may be constrained when ownership is unclear, escalation is routine, or settled choices repeatedly reopen.",
      implication: "Make decision ownership and escalation thresholds explicit, then reinforce closure unless material new evidence emerges.",
      strength: "Decision ownership and closure are supporting timely action at the appropriate level.",
      prompts: [
        "Which decisions wait longest, and what are they waiting for?",
        "Where is input being mistaken for shared decision ownership?",
        "Which settled decisions routinely reopen during execution?"
      ],
      questions: [
        "The owner of an important decision is usually clear.",
        "Decisions are made at the appropriate level without unnecessary delay.",
        "Decisions remain stable unless meaningful new evidence emerges."
      ]
    },
    {
      id: "rhythm",
      name: "Operating Rhythm",
      description: "How recurring cadences convert priorities into coordinated movement without creating meeting debt.",
      interpretation: "Operating rhythm may be constrained when coordination consumes more capacity than it creates or issues surface too late.",
      implication: "Redesign recurring forums around the decisions, risks, and commitments they must produce—not the information they can collect.",
      strength: "Operating cadences are converting information into coordinated movement with limited meeting debt.",
      prompts: [
        "Which recurring meetings consume attention without changing action?",
        "How early do operating cadences expose risk or dependency failure?",
        "Where does cross-functional coordination rely on informal rescue work?"
      ],
      questions: [
        "Recurring meetings reliably produce decisions, ownership, or action.",
        "Operating cadences expose execution risks early enough to respond.",
        "Cross-functional work moves without excessive coordination overhead."
      ]
    },
    {
      id: "alignment",
      name: "Alignment",
      description: "How consistently teams understand priorities, ownership, and changes in direction.",
      interpretation: "Alignment capacity may be constrained when teams require constant translation or ownership becomes unclear at organizational boundaries.",
      implication: "Create a repeatable translation path from strategy to team priorities, especially where work crosses organizational boundaries.",
      strength: "Teams are receiving coherent priorities and ownership signals across organizational boundaries.",
      prompts: [
        "Where do teams interpret the same priority differently?",
        "Which cross-functional outcomes lack one clearly accountable owner?",
        "How long does a change in direction take to reach affected work?"
      ],
      questions: [
        "Teams interpret the organization’s strategic priorities consistently.",
        "Ownership is clear where functions or teams intersect.",
        "Changes in direction reach affected teams quickly and coherently."
      ]
    },
    {
      id: "technology",
      name: "Technology",
      description: "How systems reduce coordination load and create leverage rather than hard-coding complexity.",
      interpretation: "Technology capacity may be constrained when systems add handoffs, information is unreliable, or adoption lacks process ownership.",
      implication: "Prioritize technology changes that remove handoffs or improve decision information, with clear ownership for process adoption.",
      strength: "Technology is reducing coordination load and making reliable information available at the point of decision.",
      prompts: [
        "Which manual handoffs create the most delay or rework?",
        "Where do leaders make consequential decisions with unreliable information?",
        "Which tools were implemented without changing process ownership?"
      ],
      questions: [
        "Technology reduces manual handoffs and coordination work.",
        "Teams have reliable information when and where decisions are made.",
        "New technology is introduced with clear process ownership and adoption support."
      ]
    },
    {
      id: "culture",
      name: "Culture",
      description: "How repeated and rewarded behaviors support execution as the organization grows.",
      interpretation: "Cultural capacity may be constrained when risk stays hidden, rewarded behavior conflicts with priorities, or change exhausts the system.",
      implication: "Align visible leadership responses and rewards with the behaviors required for early risk disclosure, adaptation, and execution.",
      strength: "Repeated and rewarded behaviors are helping the organization surface risk and adapt without exhausting execution.",
      prompts: [
        "What behavior is rewarded in practice but discouraged in principle?",
        "Which risks remain hidden until leaders can no longer respond early?",
        "Where is change fatigue signaling accumulated execution debt?"
      ],
      questions: [
        "The behaviors leaders reward reinforce stated priorities.",
        "People surface execution risks early, even when the message is uncomfortable.",
        "The organization adapts without change fatigue overwhelming execution."
      ]
    }
  ];

  const scale = [
    [1, "Rarely"],
    [2, "Inconsistently"],
    [3, "Sometimes"],
    [4, "Usually"],
    [5, "Consistently"]
  ];

  const elements = {
    form: app.querySelector("[data-assessment-form]"),
    returnProfile: document.querySelector("[data-return-profile]"),
    context: app.querySelector("[data-assessment-context]"),
    panel: app.querySelector("[data-question-panel]"),
    questions: app.querySelector("[data-questions]"),
    domainTitle: app.querySelector("[data-domain-title]"),
    domainDescription: app.querySelector("[data-domain-description]"),
    progressLabel: app.querySelector("[data-progress-label]"),
    progressName: app.querySelector("[data-progress-name]"),
    progressBar: app.querySelector("[data-progress-bar]"),
    error: app.querySelector("[data-assessment-error]"),
    previous: app.querySelector("[data-previous]"),
    next: app.querySelector("[data-next]"),
    results: app.querySelector("[data-assessment-results]"),
    overallScore: app.querySelector("[data-overall-score]"),
    resultsBand: app.querySelector("[data-results-band]"),
    resultsSummary: app.querySelector("[data-results-summary]"),
    contextSummary: app.querySelector("[data-context-summary]"),
    domainResults: app.querySelector("[data-domain-results]"),
    constraintName: app.querySelector("[data-constraint-name]"),
    constraintInterpretation: app.querySelector("[data-constraint-interpretation]"),
    reportDate: app.querySelector("[data-report-date]"),
    patternSummary: app.querySelector("[data-pattern-summary]"),
    strengthName: app.querySelector("[data-strength-name]"),
    strengthInterpretation: app.querySelector("[data-strength-interpretation]"),
    priorityResults: app.querySelector("[data-priority-results]"),
    leadershipQuestions: app.querySelector("[data-leadership-questions]"),
    evidenceConsent: app.querySelector("[data-evidence-consent]"),
    evidenceResultConsent: app.querySelector("[data-evidence-result-consent]"),
    evidenceHoneypot: app.querySelector("[data-evidence-honeypot]"),
    evidenceFeedback: app.querySelector("[data-evidence-feedback]"),
    evidenceStatus: app.querySelector("[data-evidence-status]"),
    followUpContext: app.querySelector("[data-follow-up-context]"),
    followUpBaseline: app.querySelector("[data-follow-up-baseline]"),
    followUpError: app.querySelector("[data-follow-up-error]"),
    followUpChange: app.querySelector(".follow-up-change"),
    changeCategory: app.querySelector("[data-change-category]"),
    changeStart: app.querySelector("[data-change-start]"),
    changeMagnitude: app.querySelector("[data-change-magnitude]"),
    changeStatus: app.querySelector("[data-change-status]"),
    changeTargets: [...app.querySelectorAll("[data-change-target]")],
    changeNote: app.querySelector("[data-change-note]"),
    newProfileSave: app.querySelector("[data-new-profile-save]"),
    privateSaveTitle: app.querySelector("[data-private-save-title]"),
    privateSaveDescription: app.querySelector("[data-private-save-description]"),
    privateSaveAck: app.querySelector("[data-private-save-ack]"),
    privateSave: app.querySelector("[data-private-save]"),
    privateSaveStatus: app.querySelector("[data-private-save-status]"),
    privateSaveResult: app.querySelector("[data-private-save-result]"),
    privateSaveLink: app.querySelector("[data-private-save-link]"),
    privateCopy: app.querySelector("[data-private-copy]"),
    privateOpen: app.querySelector("[data-private-open]"),
    retake: app.querySelector("[data-retake]"),
    print: app.querySelector("[data-print]")
  };

  let currentDomain = 0;
  const responses = {};
  let lastResult = null;
  let completionPromise = null;
  let followUpState = null;
  let followUpSaved = false;
  let followUpInitializationFailed = false;

  function createSessionId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  function newEvidenceState() {
    return { sessionId: createSessionId(), startedAt: Date.now(), started: false, completed: false, completionShared: false };
  }

  let evidenceState = newEvidenceState();

  const escapeHtml = value => value.replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

  function renderDomain(scroll = false) {
    const domain = domains[currentDomain];
    elements.domainTitle.textContent = domain.name;
    elements.domainDescription.textContent = domain.description;
    elements.progressLabel.textContent = `Domain ${currentDomain + 1} of ${domains.length}`;
    elements.progressName.textContent = domain.name;
    elements.progressBar.style.width = `${((currentDomain + 1) / domains.length) * 100}%`;
    elements.previous.disabled = currentDomain === 0;
    elements.next.textContent = currentDomain === domains.length - 1 ? "See my results" : "Next domain";
    elements.error.hidden = true;
    elements.context.hidden = currentDomain !== 0;

    elements.questions.innerHTML = domain.questions.map((question, questionIndex) => {
      const key = `${domain.id}-${questionIndex}`;
      return `<div class="assessment-question">
        <p><span>${questionIndex + 1}</span>${escapeHtml(question)}</p>
        <div class="assessment-scale" role="radiogroup" aria-label="${escapeHtml(question)}">
          ${scale.map(([value, label]) => `<label>
            <input type="radio" name="${key}" value="${value}" ${responses[key] === value ? "checked" : ""} />
            <span><strong>${value}</strong><small>${label}</small></span>
          </label>`).join("")}
        </div>
      </div>`;
    }).join("");

    elements.panel.focus({ preventScroll: true });
    if (scroll) {
      elements.panel.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  function captureDomain() {
    const domain = domains[currentDomain];
    let complete = true;
    domain.questions.forEach((_, questionIndex) => {
      const key = `${domain.id}-${questionIndex}`;
      const selected = elements.form.querySelector(`input[name="${key}"]:checked`);
      if (!selected) complete = false;
      else responses[key] = Number(selected.value);
    });
    return complete;
  }

  function bandFor(score) {
    if (score < 40) return ["Constrained", "Execution is likely relying on leadership effort and workarounds more than scalable organizational systems."];
    if (score < 60) return ["Strained", "The organization has meaningful capacity, but growth pressure is exposing recurring friction and uneven execution."];
    if (score < 80) return ["Developing", "Core capacity is present, with specific domains still limiting consistency, speed, or leverage."];
    return ["Enabling", "Organizational systems generally support coordinated execution, though continued growth will create new capacity demands."];
  }

  function scoreAssessment() {
    const scores = domains.map(domain => {
      const values = domain.questions.map((_, index) => responses[`${domain.id}-${index}`]);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      return { ...domain, score: Math.round((average - 1) * 25) };
    });
    const mean = scores.reduce((sum, domain) => sum + domain.score, 0) / scores.length;
    const weakest = Math.min(...scores.map(domain => domain.score));
    const overall = Math.round(mean * 0.75 + weakest * 0.25);
    return { scores, overall };
  }

  function hasEvidenceConsent() {
    return elements.results.hidden ? elements.evidenceConsent.checked : elements.evidenceResultConsent.checked;
  }

  function evidenceBase(event) {
    return {
      event,
      sessionId: evidenceState.sessionId,
      assessmentVersion,
      scoringVersion,
      website: elements.evidenceHoneypot.value
    };
  }

  function durationSeconds() {
    return Math.min(86400, Math.max(0, Math.round((Date.now() - evidenceState.startedAt) / 1000)));
  }

  function contextPayload() {
    return {
      organizationSize: elements.context.querySelector('[name="organization-size"]').value,
      respondentRole: elements.context.querySelector('[name="respondent-role"]').value,
      growthPressure: elements.context.querySelector('[name="growth-pressure"]').value
    };
  }

  function assessmentInstance(now) {
    const lowest = Math.min(...lastResult.scores.map(domain => domain.score));
    return {
      assessmentInstanceId: crypto.randomUUID(),
      completedAt: now.toISOString(),
      assessmentVersion,
      scoringVersion,
      reportVersion: "1.0.0",
      contextVersion: "1.0.0",
      context: contextPayload(),
      domainScores: Object.fromEntries(lastResult.scores.map(domain => [domain.id, domain.score])),
      overallIndex: lastResult.overall,
      interpretationBand: lastResult.band,
      primaryConstraintIds: lastResult.scores.filter(domain => domain.score === lowest).map(domain => domain.id),
      accuracyRating: null
    };
  }

  function savedProfile(now = new Date()) {
    const expiresAt = new Date(now.getTime() + 365 * 86400000);
    return {
      schemaVersion: "1.2.0",
      profileId: crypto.randomUUID(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      displayLabel: `Capacity Profile · ${new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(now)}`,
      assessmentInstances: [assessmentInstance(now)],
      outcomeSnapshots: [],
      changeRecords: [],
      researchParticipation: null,
      actionCycles: []
    };
  }

  function changeRecord() {
    if (!elements.changeCategory.value) return null;
    const started = new Date(`${elements.changeStart.value}T12:00:00`);
    if (!elements.changeStart.value || !Number.isFinite(started.getTime())) {
      throw new Error("Add the date the material change began, or select “No change to record.”");
    }
    return {
      changeRecordId: crypto.randomUUID(),
      startedAt: started.toISOString(),
      endedAt: elements.changeStatus.value === "completed" ? new Date().toISOString() : null,
      category: elements.changeCategory.value,
      targetDomainIds: elements.changeTargets.filter(input => input.checked).map(input => input.value),
      magnitude: elements.changeMagnitude.value,
      status: elements.changeStatus.value,
      note: elements.changeNote.value.trim()
    };
  }

  function followUpProfile(now = new Date()) {
    const change = changeRecord();
    const expiresAt = new Date(now.getTime() + 365 * 86400000);
    return {
      ...followUpState.profile,
      schemaVersion: "1.2.0",
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      researchParticipation: followUpState.profile.researchParticipation || null,
      actionCycles: followUpState.profile.actionCycles || [],
      assessmentInstances: [...followUpState.profile.assessmentInstances, assessmentInstance(now)],
      changeRecords: change
        ? [...followUpState.profile.changeRecords, change]
        : followUpState.profile.changeRecords
    };
  }

  function savedResultsUrl() {
    const url = new URL("saved-results.html", location.href);
    url.hash = location.hash;
    return url.toString();
  }

  async function initializeFollowUp() {
    if (!location.hash.startsWith("#recovery=v1.")) return;
    elements.returnProfile.href = savedResultsUrl();
    elements.returnProfile.hidden = false;
    try {
      const credentials = await recoveryCredentialsFromUrl(location.href);
      const stored = await readPrivateResult(credentials);
      const restored = await decryptSavedProfile(stored.envelope, location.href);
      if (restored.profile.assessmentInstances.length >= 24) {
        throw new Error("This private profile has reached its 24-observation limit.");
      }
      followUpState = {
        credentials,
        profile: restored.profile,
        envelope: stored.envelope,
        etag: stored.etag
      };
      const latest = restored.profile.assessmentInstances.at(-1);
      elements.followUpContext.hidden = false;
      elements.followUpBaseline.textContent = `Your most recent saved observation was completed ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(latest.completedAt))}. The same recovery link will reopen the updated profile.`;
      elements.changeStart.value = new Date().toISOString().slice(0, 10);
      Object.entries(latest.context).forEach(([key, value]) => {
        const names = { organizationSize: "organization-size", respondentRole: "respondent-role", growthPressure: "growth-pressure" };
        elements.context.querySelector(`[name="${names[key]}"]`).value = value;
      });
      elements.newProfileSave.hidden = true;
      elements.privateSaveTitle.textContent = "Add this observation to your encrypted profile.";
      elements.privateSaveDescription.textContent = "This result and any material-change context will be encrypted in your browser and appended to the private profile opened by this recovery link.";
      elements.privateSave.textContent = "Save follow-up observation";
      elements.privateSave.disabled = false;
      elements.privateOpen.href = savedResultsUrl();
      elements.privateOpen.textContent = "Open updated comparison";
    } catch (error) {
      followUpInitializationFailed = true;
      app.querySelector(".assessment-progress").hidden = true;
      elements.followUpContext.hidden = false;
      elements.followUpError.hidden = false;
      elements.followUpError.textContent = error.message || "This private profile could not be opened for a follow-up.";
      elements.followUpChange.hidden = true;
      elements.context.hidden = true;
      elements.panel.hidden = true;
      elements.form.querySelector(".assessment-controls").hidden = true;
    }
  }

  async function postEvidence(payload, showStatus = false) {
    try {
      const response = await fetch(evidenceEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
        keepalive: true
      });
      if (!response.ok) throw new Error("Evidence request failed");
      return true;
    } catch {
      if (showStatus) elements.evidenceStatus.textContent = "We couldn’t share this evidence right now. Your assessment results are unaffected.";
      return false;
    }
  }

  function sendLifecycleBeacon(event, details = {}) {
    if (!hasEvidenceConsent()) return false;
    const body = new Blob([JSON.stringify({ ...evidenceBase(event), ...details })], { type: "application/json" });
    return navigator.sendBeacon(evidenceEndpoint, body);
  }

  function shareCompletion(showStatus = false) {
    if (evidenceState.completionShared) return Promise.resolve(true);
    if (completionPromise) return completionPromise;
    if (!lastResult || !hasEvidenceConsent()) return Promise.resolve(false);
    const scores = Object.fromEntries(lastResult.scores.map(domain => [domain.id, domain.score]));
    completionPromise = postEvidence({
      ...evidenceBase("completion"),
      scores,
      overall: lastResult.overall,
      band: lastResult.band,
      context: contextPayload(),
      durationSeconds: durationSeconds()
    }, showStatus).then(shared => {
      evidenceState.completionShared = shared;
      if (shared && showStatus) elements.evidenceStatus.textContent = "Anonymous result shared. Feedback remains optional.";
      return shared;
    }).finally(() => { completionPromise = null; });
    return completionPromise;
  }

  function showResults() {
    const { scores, overall } = scoreAssessment();
    const [band, summary] = bandFor(overall);
    const constraint = [...scores].sort((a, b) => a.score - b.score)[0];
    const strongest = [...scores].sort((a, b) => b.score - a.score)[0];
    const priorities = [...scores].sort((a, b) => a.score - b.score).slice(0, 3);
    const spread = strongest.score - constraint.score;
    lastResult = { scores, overall, band };
    evidenceState.completed = true;

    elements.form.hidden = true;
    app.querySelector(".assessment-progress").hidden = true;
    elements.results.hidden = false;
    elements.overallScore.textContent = overall;
    elements.resultsBand.textContent = band;
    elements.resultsBand.dataset.band = band.toLowerCase();
    elements.resultsSummary.textContent = summary;
    const contextValues = [...elements.context.querySelectorAll("select")].map(select => select.value).filter(Boolean);
    elements.contextSummary.hidden = contextValues.length === 0;
    elements.contextSummary.textContent = contextValues.length ? `Context: ${contextValues.join(" · ")}` : "";
    elements.constraintName.textContent = constraint.name;
    elements.constraintInterpretation.textContent = constraint.interpretation;
    elements.reportDate.textContent = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
    elements.patternSummary.textContent = spread >= 35
      ? `Your profile is uneven: ${spread} points separate the strongest and most constrained domains. This suggests that execution may depend on where work travels through the organization, not only on its difficulty.`
      : spread >= 15
        ? `Your profile shows meaningful variation across domains. The ${spread}-point spread indicates specific constraints that may reduce the leverage created elsewhere.`
        : `Your profile is relatively balanced across domains, with a ${spread}-point spread. The overall band is therefore a more useful system signal than any single isolated score.`;
    elements.strengthName.textContent = strongest.name;
    elements.strengthInterpretation.textContent = strongest.strength;
    elements.priorityResults.innerHTML = priorities.map((domain, index) => {
      const [domainBand] = bandFor(domain.score);
      return `<article class="report-priority">
        <div class="report-priority-number">0${index + 1}</div>
        <div>
          <div class="report-priority-heading"><h4>${domain.name}</h4><span>${domainBand} · ${domain.score}/100</span></div>
          <p>${domain.implication}</p>
        </div>
      </article>`;
    }).join("");
    elements.leadershipQuestions.innerHTML = constraint.prompts.map(prompt => `<li>${prompt}</li>`).join("");
    elements.results.focus({ preventScroll: true });
    elements.domainResults.innerHTML = scores.map(domain => {
      const [domainBand] = bandFor(domain.score);
      return `<article class="domain-result">
        <div><h3>${domain.name}</h3><span>${domainBand} · ${domain.score}/100</span></div>
        <progress class="domain-score-track" max="100" value="${domain.score}" aria-label="${domain.name}: ${domain.score} out of 100">${domain.score}%</progress>
      </article>`;
    }).join("");
    elements.evidenceResultConsent.checked = elements.evidenceConsent.checked;
    if (hasEvidenceConsent()) shareCompletion(true);
    elements.results.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  elements.next.addEventListener("click", () => {
    if (!captureDomain()) {
      elements.error.hidden = false;
      return;
    }
    if (currentDomain === 0 && hasEvidenceConsent() && !evidenceState.started) {
      evidenceState.started = true;
      postEvidence(evidenceBase("start"));
    }
    if (currentDomain === domains.length - 1) showResults();
    else {
      currentDomain += 1;
      renderDomain(true);
    }
  });

  elements.previous.addEventListener("click", () => {
    captureDomain();
    currentDomain = Math.max(0, currentDomain - 1);
    renderDomain(true);
  });

  elements.retake.addEventListener("click", () => {
    Object.keys(responses).forEach(key => delete responses[key]);
    currentDomain = 0;
    lastResult = null;
    completionPromise = null;
    evidenceState = newEvidenceState();
    elements.evidenceFeedback.reset();
    elements.evidenceFeedback.querySelector('button[type="submit"]').disabled = false;
    elements.evidenceResultConsent.checked = elements.evidenceConsent.checked;
    elements.evidenceStatus.textContent = "";
    elements.privateSaveAck.checked = false;
    elements.privateSave.disabled = !followUpState;
    elements.privateSaveResult.hidden = true;
    elements.privateSaveLink.value = "";
    elements.privateSaveStatus.textContent = "";
    followUpSaved = false;
    elements.results.hidden = true;
    elements.form.hidden = false;
    app.querySelector(".assessment-progress").hidden = false;
    renderDomain();
    app.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.evidenceConsent.addEventListener("change", () => {
    elements.evidenceResultConsent.checked = elements.evidenceConsent.checked;
  });

  elements.privateSaveAck.addEventListener("change", () => {
    if (!followUpState) elements.privateSave.disabled = !elements.privateSaveAck.checked;
  });

  elements.privateSave.addEventListener("click", async () => {
    if (!lastResult || (!followUpState && !elements.privateSaveAck.checked) || followUpSaved) return;
    elements.privateSave.disabled = true;
    elements.privateSaveStatus.textContent = followUpState
      ? "Encrypting and adding this observation…"
      : "Encrypting and saving your private profile…";
    try {
      let recoveryUrl;
      if (followUpState) {
        const now = new Date();
        const profile = followUpProfile(now);
        const encrypted = await encryptSavedProfile(profile, {
          secret: recoverySecretFromUrl(location.href),
          baseUrl: savedResultsUrl(),
          createdAt: followUpState.envelope.createdAt,
          now,
          expiresAt: profile.expiresAt
        });
        const saved = await updatePrivateResult({
          ...followUpState.credentials,
          envelope: encrypted.envelope,
          expectedEtag: followUpState.etag
        });
        followUpState = {
          ...followUpState,
          profile,
          envelope: encrypted.envelope,
          etag: saved.etag
        };
        followUpSaved = true;
        recoveryUrl = savedResultsUrl();
      } else {
        const recoveryBase = new URL("saved-results.html", location.href).toString();
        const encrypted = await encryptSavedProfile(savedProfile(), { baseUrl: recoveryBase });
        await createPrivateResult(encrypted);
        recoveryUrl = encrypted.recoveryUrl;
      }
      elements.privateSaveLink.value = recoveryUrl;
      elements.privateOpen.href = recoveryUrl;
      elements.privateSaveResult.hidden = false;
      elements.privateSaveStatus.textContent = followUpState
        ? "Follow-up saved. Open the updated profile to compare observations."
        : privateResultsEnvironment.localDevelopment
          ? "Encrypted profile saved to this browser’s local development store."
          : "Encrypted profile saved. Copy the recovery link before leaving this page.";
    } catch (error) {
      elements.privateSave.disabled = false;
      elements.privateSaveStatus.textContent = error.message || "We couldn’t save this encrypted profile.";
    }
  });

  elements.privateCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elements.privateSaveLink.value);
      elements.privateSaveStatus.textContent = "Recovery link copied. Protect it like a password.";
    } catch {
      elements.privateSaveLink.select();
      elements.privateSaveStatus.textContent = "Copy was unavailable. The recovery link has been selected for manual copying.";
    }
  });

  elements.evidenceResultConsent.addEventListener("change", () => {
    elements.evidenceConsent.checked = elements.evidenceResultConsent.checked;
    if (elements.evidenceResultConsent.checked) shareCompletion(true);
  });

  elements.evidenceFeedback.addEventListener("submit", async event => {
    event.preventDefault();
    const accuracy = elements.evidenceFeedback.querySelector('input[name="accuracy"]:checked');
    if (!accuracy) {
      elements.evidenceStatus.textContent = "Select an accuracy rating before sharing feedback.";
      return;
    }
    if (!elements.evidenceResultConsent.checked) {
      elements.evidenceStatus.textContent = "Confirm anonymous evidence sharing before submitting.";
      elements.evidenceResultConsent.focus();
      return;
    }
    elements.evidenceStatus.textContent = "Sharing anonymous evidence…";
    const completionShared = await shareCompletion(true);
    if (!completionShared) return;
    const feedback = elements.evidenceFeedback.querySelector('textarea[name="feedback"]').value;
    const shared = await postEvidence({
      ...evidenceBase("feedback"),
      accuracy: Number(accuracy.value),
      feedback
    }, true);
    if (shared) {
      elements.evidenceStatus.textContent = "Thank you. Your anonymous feedback was shared.";
      elements.evidenceFeedback.querySelector('button[type="submit"]').disabled = true;
    }
  });

  elements.print.addEventListener("click", () => {
    if (hasEvidenceConsent()) postEvidence({ ...evidenceBase("report_action"), durationSeconds: durationSeconds() });
    window.print();
  });

  window.addEventListener("pagehide", () => {
    if (evidenceState.started && !evidenceState.completed && hasEvidenceConsent()) {
      sendLifecycleBeacon("abandonment", { lastDomain: currentDomain + 1, durationSeconds: durationSeconds() });
    }
  });
  elements.panel.setAttribute("tabindex", "-1");
  initializeFollowUp().finally(() => {
    if (!followUpInitializationFailed) renderDomain();
  });
})();
