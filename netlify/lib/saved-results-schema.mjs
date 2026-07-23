import { createHash } from "node:crypto";
import { validateEncryptedEnvelope } from "../../saved-results-crypto.js";

const ACTIONS = new Set(["create", "read", "update", "rotate", "delete"]);
const CAPABILITY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_CLOCK_SKEW_MS = 7 * 86400000;
const MAX_RETENTION_MS = 370 * 86400000;

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every(key => allowed.has(key));
}

export function isAuthenticationCapability(value) {
  return typeof value === "string" && CAPABILITY_PATTERN.test(value);
}

export function accessIdForCapability(capability) {
  if (!isAuthenticationCapability(capability)) throw new Error("Invalid authentication capability.");
  return createHash("sha256").update(Buffer.from(capability, "base64url")).digest("base64url");
}

export function validateEnvelopeWindow(envelope, now = Date.now(), existingCreatedAt = null) {
  if (!validateEncryptedEnvelope(envelope)) return false;
  const created = Date.parse(envelope.createdAt);
  const updated = Date.parse(envelope.updatedAt);
  const expires = Date.parse(envelope.expiresAt);
  if (created > now + MAX_CLOCK_SKEW_MS || updated > now + MAX_CLOCK_SKEW_MS) return false;
  if (expires <= now || expires > now + MAX_RETENTION_MS) return false;
  if (existingCreatedAt !== null && envelope.createdAt !== existingCreatedAt) return false;
  return true;
}

export function validateSavedResultsPayload(payload, now = Date.now()) {
  if (!isObject(payload) || payload.website) return { ok: false, error: "Invalid request." };
  if (!ACTIONS.has(payload.action)) return { ok: false, error: "Invalid action." };

  const common = ["action", "website"];
  const allowed = {
    create: new Set([...common, "authenticationCapability", "envelope"]),
    read: new Set([...common, "authenticationCapability"]),
    update: new Set([...common, "authenticationCapability", "envelope", "expectedEtag"]),
    rotate: new Set([...common, "authenticationCapability", "newAuthenticationCapability", "envelope"]),
    delete: new Set([...common, "authenticationCapability"])
  }[payload.action];
  if (!hasOnlyKeys(payload, allowed)) return { ok: false, error: "Unexpected data." };
  if (!isAuthenticationCapability(payload.authenticationCapability)) return { ok: false, error: "Invalid recovery capability." };

  if (["create", "update", "rotate"].includes(payload.action) && !validateEnvelopeWindow(payload.envelope, now)) {
    return { ok: false, error: "Invalid encrypted envelope." };
  }
  if (payload.action === "update" && (typeof payload.expectedEtag !== "string" || payload.expectedEtag.length < 1 || payload.expectedEtag.length > 200)) {
    return { ok: false, error: "Invalid version token." };
  }
  if (payload.action === "rotate") {
    if (!isAuthenticationCapability(payload.newAuthenticationCapability)) return { ok: false, error: "Invalid replacement capability." };
    if (payload.newAuthenticationCapability === payload.authenticationCapability) return { ok: false, error: "Replacement capability must be new." };
  }

  const clean = { ...payload };
  delete clean.website;
  return { ok: true, value: clean };
}
