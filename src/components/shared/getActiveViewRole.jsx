/**
 * Returns the list of views a user can switch between.
 * primaryRole is always included. Additional views come from user_role_preference.
 *
 * @param {string|undefined} rolePref - Comma-separated user_role_preference field.
 * @param {string} primaryRole - The user's real JWT/auth role (never changes).
 * @returns {string[]} availableViews
 */
export function getAvailableViews(rolePref, primaryRole) {
  if (rolePref && rolePref.trim().length > 0) {
    const extras = rolePref.split(",").map(r => r.trim()).filter(Boolean);
    return Array.from(new Set([primaryRole, ...extras]));
  }
  return [primaryRole];
}

/**
 * Returns the currently selected view role from localStorage,
 * validated against the user's available views.
 * Falls back to primaryRole if nothing is saved or the saved value is invalid.
 *
 * @param {string} userId
 * @param {string[]} availableViews
 * @param {string} primaryRole - The user's real role (security role, never overwritten).
 * @returns {string} activeViewRole
 */
export function getActiveViewRole(userId, availableViews, primaryRole) {
  const saved = localStorage.getItem(`activeViewRole_${userId}`);
  if (saved && availableViews.includes(saved)) {
    return saved;
  }
  return primaryRole;
}

/**
 * Persists the selected view role to localStorage.
 * Does NOT mutate User.role — this is purely a UX preference.
 *
 * @param {string} userId
 * @param {string} viewRole
 */
export function setActiveViewRole(userId, viewRole) {
  localStorage.setItem(`activeViewRole_${userId}`, viewRole);
}

// ---------------------------------------------------------------------------
// Legacy alias — kept so old callers don't break during migration.
// Prefer getAvailableViews going forward.
// ---------------------------------------------------------------------------
export const getAvailableRoles = getAvailableViews;