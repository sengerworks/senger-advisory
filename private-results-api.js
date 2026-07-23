const endpoint = "/api/private-results";
const localPrefix = "senger-private-results-mvp:";
const localDevelopment = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);

export class PrivateResultsError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "PrivateResultsError";
    this.status = status;
  }
}

function localKey(accessId) {
  return `${localPrefix}${accessId}`;
}

function localRead(accessId) {
  const value = localStorage.getItem(localKey(accessId));
  return value ? JSON.parse(value) : null;
}

function newLocalEtag() {
  return `"local-${crypto.randomUUID()}"`;
}

function localRequest(payload) {
  const accessId = payload.accessId;
  if (payload.action === "create") {
    if (localRead(accessId)) throw new PrivateResultsError("A saved result already exists for this recovery link.", 409);
    const record = { envelope: payload.envelope, etag: newLocalEtag() };
    localStorage.setItem(localKey(accessId), JSON.stringify(record));
    return { saved: true, etag: record.etag, expiresAt: payload.envelope.expiresAt, local: true };
  }
  if (payload.action === "read") {
    const record = localRead(accessId);
    if (!record) throw new PrivateResultsError("Saved result unavailable.", 404);
    if (Date.parse(record.envelope.expiresAt) <= Date.now()) {
      localStorage.removeItem(localKey(accessId));
      throw new PrivateResultsError("This saved result has expired.", 410);
    }
    return { ...record, expiresAt: record.envelope.expiresAt, local: true };
  }
  if (payload.action === "update") {
    const current = localRead(accessId);
    if (!current) throw new PrivateResultsError("Saved result unavailable.", 404);
    if (current.etag !== payload.expectedEtag) throw new PrivateResultsError("This saved result changed in another session. Reopen it before updating.", 409);
    const record = { envelope: payload.envelope, etag: newLocalEtag() };
    localStorage.setItem(localKey(accessId), JSON.stringify(record));
    return { saved: true, etag: record.etag, expiresAt: payload.envelope.expiresAt, local: true };
  }
  if (payload.action === "rotate") {
    const current = localRead(accessId);
    if (!current) throw new PrivateResultsError("Saved result unavailable.", 404);
    if (localRead(payload.newAccessId)) throw new PrivateResultsError("Unable to rotate this recovery link.", 409);
    const record = { envelope: payload.envelope, etag: newLocalEtag() };
    localStorage.setItem(localKey(payload.newAccessId), JSON.stringify(record));
    localStorage.removeItem(localKey(accessId));
    return { rotated: true, etag: record.etag, expiresAt: payload.envelope.expiresAt, local: true };
  }
  localStorage.removeItem(localKey(accessId));
  return { deleted: true, local: true };
}

async function remoteRequest(payload) {
  const { accessId: _accessId, newAccessId: _newAccessId, ...serverPayload } = payload;
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ website: "", ...serverPayload })
    });
  } catch {
    throw new PrivateResultsError("Private saved-results storage is unavailable. Try again shortly.");
  }
  let body = {};
  try { body = await response.json(); } catch { /* use fallback below */ }
  if (!response.ok) throw new PrivateResultsError(body.error || "Private saved-results request failed.", response.status);
  return body;
}

async function send(payload) {
  return localDevelopment ? localRequest(payload) : remoteRequest(payload);
}

export function createPrivateResult({ accessId, authenticationCapability, envelope }) {
  return send({ action: "create", accessId, authenticationCapability, envelope });
}

export function readPrivateResult({ accessId, authenticationCapability }) {
  return send({ action: "read", accessId, authenticationCapability });
}

export function updatePrivateResult({ accessId, authenticationCapability, envelope, expectedEtag }) {
  return send({ action: "update", accessId, authenticationCapability, envelope, expectedEtag });
}

export function rotatePrivateResult({ accessId, authenticationCapability, newAccessId, newAuthenticationCapability, envelope }) {
  return send({ action: "rotate", accessId, authenticationCapability, newAccessId, newAuthenticationCapability, envelope });
}

export function deletePrivateResult({ accessId, authenticationCapability }) {
  return send({ action: "delete", accessId, authenticationCapability });
}

export const privateResultsEnvironment = Object.freeze({ localDevelopment });
