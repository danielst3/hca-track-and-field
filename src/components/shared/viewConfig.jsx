/**
 * VIEW CONFIG
 * 
 * Defines the available views, their home pages, and which views each page allows.
 * 
 * Views map to role values:
 *   "admin"  → Admin view
 *   "coach"  → Coach view
 *   "user"   → Athlete view
 *   "parent" → Parent view
 * 
 * PrimaryRole = user.role (Base44 real role, used for RLS/security)
 * AdditionalRoles = stored in user.user_role_preference (comma-separated)
 * availableViews = [PrimaryRole, ...AdditionalRoles]
 * activeView = stored in localStorage as `activeRole_{userId}`
 */

export const VIEW_HOME = {
  admin:  "Athletes",
  coach:  "Calendar",
  user:   "Today",
  parent: "Today",
};

/**
 * Which views are allowed on each page.
 * If a page is not listed, all views are allowed.
 */
export const PAGE_ALLOWED_VIEWS = {
  Today:           ["admin", "coach", "user", "parent"],
  Calendar:        ["admin", "coach", "user", "parent"],
  LogActivity:     ["admin", "coach", "user"],
  Athletes:        ["admin", "coach"],
  Seasons:         ["admin", "coach"],
  Posts:           ["admin", "coach", "user", "parent"],
  Resources:       ["admin", "coach", "user", "parent"],
  Progress:        ["admin", "coach", "user", "parent"],
  AthleteDetail:   ["admin", "coach", "parent"],
  Settings:        ["admin", "coach", "user", "parent"],
  MyAthletes:      ["parent"],
  BulkMeetEntry:   ["admin", "coach"],
  FERPACompliance: ["admin"],
  Support:         ["admin", "coach", "user", "parent"],
  Privacy:         ["admin", "coach", "user", "parent"],
};

/** All roles the user may view, with primary first */
export function getAvailableViews(user) {
  if (!user) return [];
  const primary = user.role;
  const prefs = user.user_role_preference
    ? user.user_role_preference.split(",").map(r => r.trim()).filter(Boolean)
    : [];
  return Array.from(new Set([primary, ...prefs]));
}

/** Active view, validated against available views */
export function getActiveView(user) {
  if (!user) return null;
  const available = getAvailableViews(user);
  const saved = localStorage.getItem(`activeRole_${user.id}`);
  if (saved && available.includes(saved)) return saved;
  return user.role;
}

export function getViewHome(view) {
  return VIEW_HOME[view] || "Today";
}