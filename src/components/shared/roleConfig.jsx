/**
 * Single source of truth for role-based access configuration.
 * Import this in Layout, useRoleContext, and any page that needs it.
 */

export const VALID_ROLES = ["admin", "coach", "user", "parent"];

/** Where to land after switching to each role view */
export const landingPageByRole = {
  admin:  "Today",
  coach:  "Today",
  user:   "Today",
  parent: "Today",
};

/**
 * Which view roles can access each page.
 */
export const pageAccessConfig = {
  Today:           ["admin", "coach", "user", "parent"],
  Calendar:        ["admin", "coach", "user", "parent"],
  Posts:           ["admin", "coach", "user", "parent"],
  Resources:       ["admin", "coach", "user", "parent"],
  Settings:        ["admin", "coach", "user", "parent"],
  Privacy:         ["admin", "coach", "user", "parent"],
  Support:         ["admin", "coach", "user", "parent"],
  LogActivity:     ["admin", "coach", "user"],
  Progress:        ["admin", "coach", "user"],
  Athletes:        ["admin", "coach"],
  Seasons:         ["admin", "coach"],
  BulkMeetEntry:   ["admin", "coach"],
  AthleteDetail:   ["admin", "coach"],
  FERPACompliance: ["admin"],
  MyAthletes:      ["admin", "coach", "parent"],
};

/** Label for display */
export const roleLabel = {
  admin:  "Admin",
  coach:  "Coach",
  user:   "Athlete",
  parent: "Parent",
};