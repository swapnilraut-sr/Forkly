/**
 * Tiny in-app event log.
 *
 * Every call the demo makes into the Personalization plugin is mirrored here so
 * the "Activity" screen can show, in real time, exactly which public API was
 * exercised and with what payload. This is a demo-only aid — a real app would
 * not keep this log.
 */

export type LogCategory =
  | 'event' // PersonalizationModule.track(...)
  | 'identity' // profile id / attributes / party
  | 'consent' // consent opt-in / opt-out
  | 'engagement' // trackEngagement / getPayloadFor*
  | 'preview' // handlePreviewUrl / isPreview
  | 'contentzone' // ContentZone lifecycle (load/success/error)
  | 'logging'; // setLogging

export type LogEntry = {
  id: string;
  at: number; // epoch ms
  category: LogCategory;
  label: string;
  detail?: Record<string, unknown>;
};

type Listener = (entries: LogEntry[]) => void;

let entries: LogEntry[] = [];
const listeners = new Set<Listener>();
let seq = 0;

export function logCall(
  category: LogCategory,
  label: string,
  detail?: Record<string, unknown>,
): void {
  seq += 1;
  const entry: LogEntry = {
    // Date.now is fine at runtime on-device; only the workflow sandbox forbids it.
    id: `${Date.now()}-${seq}`,
    at: Date.now(),
    category,
    label,
    detail,
  };
  entries = [entry, ...entries].slice(0, 200);
  listeners.forEach(l => l(entries));
  // Mirror to Metro console for good measure.
  console.log(`[Forkly:${category}] ${label}`, detail ?? '');
}

export function getEntries(): LogEntry[] {
  return entries;
}

export function clearEntries(): void {
  entries = [];
  listeners.forEach(l => l(entries));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(entries);
  return () => {
    listeners.delete(listener);
  };
}
