/**
 * Required-schema metadata for outgoing Personalization events.
 *
 * The backend that ingests events from `PersonalizationModule.track()` enforces
 * a fixed set of required fields per event/object shape (see the schema table
 * in the PR description / task). The SDK itself does not add any of these —
 * it only forwards whatever is placed in an object's `attributes` bag (or, for
 * name-based events, the event's own `attributes`). This module is the single
 * place that:
 *
 *   1. Owns the per-install `deviceId` and per-session `sessionId`.
 *   2. Mints a fresh, unique `eventId` per call.
 *   3. Produces the ISO-8601 `dateTime` for "now".
 *   4. Assembles the common metadata object shared by every schema
 *      ("base event meta": dateTime/deviceId/eventId/eventType/interactionName/sessionId).
 *
 * Kept dependency-free on purpose — React Native does not guarantee
 * `crypto.randomUUID`, so IDs are built from Date.now()/Math.random(), which
 * is normal, acceptable runtime code (not workflow-sandbox code).
 */

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/**
 * Small dependency-free unique-id generator. Not cryptographically strong —
 * good enough for client-side telemetry correlation ids (deviceId, eventId).
 */
function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const rand2 = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}${rand2}`;
}

// ---------------------------------------------------------------------------
// Per-install deviceId
// ---------------------------------------------------------------------------

// Generated once per JS module load (i.e. once per app install/process
// lifetime for this demo — a real app would persist this to disk so it
// survives app restarts).
let cachedDeviceId: string | null = null;

/** Returns the stable per-install device id, generating it on first use. */
export function getDeviceId(): string {
  if (cachedDeviceId === null) {
    cachedDeviceId = randomId('device');
  }
  return cachedDeviceId;
}

// ---------------------------------------------------------------------------
// Per-session sessionId
// ---------------------------------------------------------------------------

// Generated once per app session (module load).
const sessionIdValue = randomId('session');

/** Returns the session id, stable for the lifetime of the current app session. */
export function getSessionId(): string {
  return sessionIdValue;
}

// ---------------------------------------------------------------------------
// Per-event id + timestamp
// ---------------------------------------------------------------------------

/** Mints a fresh, unique event id. Call once per emitted event. */
export function newEventId(): string {
  return randomId('event');
}

/** Returns the current time as an ISO-8601 DateTime string. */
export function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Base event metadata (shared shape across all schema tables)
// ---------------------------------------------------------------------------

export interface BaseEventMeta {
  dateTime: string;
  deviceId: string;
  eventId: string;
  eventType: string;
  interactionName: string;
  sessionId: string;
}

/**
 * Builds the common metadata object required by every event schema table:
 * { dateTime, deviceId, eventId, eventType, interactionName, sessionId }.
 *
 * Each call mints a new `eventId`/`dateTime`, so call it once per logical
 * event (not once per line item within that event — reuse the returned
 * `eventId` for item-level metadata that needs to correlate back to the
 * parent event, e.g. Order Item Engagement's `orderEventId`).
 */
export function baseEventMeta(eventType: string, interactionName: string): BaseEventMeta {
  return {
    dateTime: nowIso(),
    deviceId: getDeviceId(),
    eventId: newEventId(),
    eventType,
    interactionName,
    sessionId: getSessionId(),
  };
}
