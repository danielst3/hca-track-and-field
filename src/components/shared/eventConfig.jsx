import { Circle, Disc3, Zap, ArrowRight, RefreshCw, MoveUp, Timer, Activity } from "lucide-react";

export const EVENT_CATEGORIES = [
  { id: "throwing", label: "Throwing", color: "text-amber-500 border-amber-400 bg-amber-50 dark:bg-amber-950/30" },
  { id: "jumping",  label: "Jumping",  color: "text-blue-500 border-blue-400 bg-blue-50 dark:bg-blue-950/30" },
  { id: "running",  label: "Running",  color: "text-green-500 border-green-400 bg-green-50 dark:bg-green-950/30" },
];

export const EVENTS_BY_CATEGORY = {
  throwing: [
    { id: "shot_put", label: "Shot Put",  Icon: Circle,    color: "text-amber-500", planField: "shot_text" },
    { id: "discus",   label: "Discus",    Icon: Disc3,     color: "text-amber-600", planField: "discus_text" },
    { id: "javelin",  label: "Javelin",   Icon: Zap,       color: "text-amber-700", planField: "javelin_text" },
  ],
  jumping: [
    { id: "long_jump",   label: "Long Jump",   Icon: ArrowRight, color: "text-blue-500", planField: "long_jump_text" },
    { id: "triple_jump", label: "Triple Jump", Icon: RefreshCw,  color: "text-blue-600", planField: "triple_jump_text" },
    { id: "high_jump",   label: "High Jump",   Icon: MoveUp,     color: "text-blue-700", planField: "high_jump_text" },
    { id: "pole_vault",  label: "Pole Vault",  Icon: Columns2,   color: "text-blue-800", planField: "pole_vault_text" },
  ],
  running: [
    { id: "100m",          label: "100m",          Icon: Timer,    color: "text-green-500", planField: "100m_text" },
    { id: "200m",          label: "200m",          Icon: Timer,    color: "text-green-500", planField: "200m_text" },
    { id: "400m",          label: "400m",          Icon: Timer,    color: "text-green-600", planField: "400m_text" },
    { id: "800m",          label: "800m",          Icon: Activity, color: "text-green-600", planField: "800m_text" },
    { id: "1600m",         label: "1600m",         Icon: Activity, color: "text-green-700", planField: "1600m_text" },
    { id: "3200m",         label: "3200m",         Icon: Activity, color: "text-green-700", planField: "3200m_text" },
    { id: "100m_hurdles",  label: "100m Hurdles",  Icon: Timer,    color: "text-green-500", planField: "hurdles_text" },
    { id: "110m_hurdles",  label: "110m Hurdles",  Icon: Timer,    color: "text-green-500", planField: "hurdles_text" },
    { id: "300m_hurdles",  label: "300m Hurdles",  Icon: Timer,    color: "text-green-600", planField: "hurdles_text" },
    { id: "4x100_relay",   label: "4x100 Relay",   Icon: Timer,    color: "text-green-500", planField: "relays_text" },
    { id: "4x400_relay",   label: "4x400 Relay",   Icon: Timer,    color: "text-green-600", planField: "relays_text" },
    { id: "4x800_relay",   label: "4x800 Relay",   Icon: Activity, color: "text-green-700", planField: "relays_text" },
  ],
};

export const ALL_EVENTS = Object.values(EVENTS_BY_CATEGORY).flat();

export function getEventById(id) {
  return ALL_EVENTS.find(e => e.id === id);
}

export function getCategoryForEvent(eventId) {
  for (const [catId, events] of Object.entries(EVENTS_BY_CATEGORY)) {
    if (events.find(e => e.id === eventId)) return catId;
  }
  return null;
}

// Legacy id mapping for old data (shot -> shot_put, etc.)
export const LEGACY_EVENT_MAP = {
  shot: "shot_put",
  discus: "discus",
  javelin: "javelin",
};

export function normalizeEventId(id) {
  return LEGACY_EVENT_MAP[id] || id;
}

// Whether a category/event uses time (seconds) vs distance (feet)
export function isTimeBasedEvent(eventId) {
  return getCategoryForEvent(eventId) === "running";
}