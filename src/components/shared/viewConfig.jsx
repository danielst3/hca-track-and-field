/**
 * VIEW CONFIG
 * ============================================================
 * ROLE MODEL
 *   PrimaryRole    = user.role  (Base44 real role; RLS/security enforced here)
 *   AdditionalRoles = stored in user.user_role_preference (comma-separated)
 *   availableViews  = [PrimaryRole, ...AdditionalRoles]
 *   activeView      = persisted in localStorage as `activeRole_{userId}`
 *
 * IMPORTANT: user.role is ALWAYS the PrimaryRole.
 * AdditionalRoles only change the UX view, NOT backend security.
 *
 * VIEW VALUES (match Base44 role strings):
 *   "admin"  → Admin view
 *   "coach"  → Coach view
 *   "user"   → Athlete view
 *   "parent" → Parent view
 *
 * HOME PAGE per view (canonical landing page after view switch):
 *   admin  → Athletes
 *   coach  → Calendar
 *   user   → Today
 *   parent → Today
 *
 * PAGE ACCESS TABLE:
 * ┌──────────────────┬──────────────────────────────────────┐
 * │ Page             │ Allowed Views                        │
 * ├──────────────────┼──────────────────────────────────────┤
 * │ Today            │ admin, coach, user, parent           │
 * │ Calendar         │ admin, coach, user, parent           │
 * │ LogActivity      │ admin, coach, user                   │
 * │ Athletes         │ admin, coach                         │
 * │ Seasons          │ admin, coach                         │
 * │ Posts            │ admin, coach, user, parent           │
 * │ Resources        │ admin, coach, user, parent           │
 * │ Progress         │ user, parent                        │
 * │ AthleteDetail    │ admin, coach, parent                 │
 * │ Settings         │ admin, coach, user, parent           │
 * │ MyAthletes       │ parent                               │
 * │ BulkMeetEntry    │ admin, coach                         │
 * │ FERPACompliance  │ admin                                │
 * │ Support          │ admin, coach, user, parent           │
 * │ Privacy          │ admin, coach, user, parent           │
 * └──────────────────┴──────────────────────────────────────┘
 */

/** Canonical home page for each view */
export const VIEW_HOME = {
  admin:  "Athletes",
  coach:  "Calendar",
  user:   "Today",
  parent: "Today",
};

/** Which views are allowed on each page. Missing = all views allowed. */
export const PAGE_ALLOWED_VIEWS = {
  Today:           ["admin", "coach", "user", "parent"],
  Calendar:        ["admin", "coach", "user", "parent"],
  LogActivity:     ["admin", "coach", "user"],
  Athletes:        ["admin", "coach"],
  Seasons:         ["admin", "coach"],
  Posts:           ["admin", "coach", "user", "parent"],
  Resources:       ["admin", "coach", "user", "parent"],
  Progress:        ["user", "parent"],
  AthleteDetail:   ["admin", "coach", "parent"],
  Settings:        ["admin", "coach", "user", "parent"],
  MyAthletes:      ["parent"],
  BulkMeetEntry:   ["admin", "coach"],
  FERPACompliance: ["admin"],
  Support:         ["admin", "coach", "user", "parent"],
  Privacy:         ["admin", "coach", "user", "parent"],
};

/**
 * Returns all views available to the user.
 * PrimaryRole (user.role) is always first; AdditionalRoles follow.
 */
export function getAvailableViews(user) {
  if (!user) return [];
  const primary = user.role; // PrimaryRole = user.role (enforced by Base44)
  const additional = user.user_role_preference
    ? user.user_role_preference.split(",").map(r => r.trim()).filter(Boolean)
    : [];
  return Array.from(new Set([primary, ...additional]));
}

/**
 * Returns the active view for the user.
 * Defaults to last-selected if still in availableViews, otherwise PrimaryRole.
 */
export function getActiveView(user) {
  if (!user) return null;
  const available = getAvailableViews(user);
  const saved = localStorage.getItem(`activeRole_${user.id}`);
  if (saved && available.includes(saved)) return saved;
  // Default: PrimaryRole
  return user.role;
}

/** Returns the home page for a given view */
export function getViewHome(view) {
  return VIEW_HOME[view] || "Today";
}

/** Human-readable label for a view */
export function getViewLabel(view) {
  return { admin: "Admin", coach: "Coach", user: "Athlete", parent: "Parent" }[view] || view;
}