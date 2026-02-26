/**
 * Single source of truth for determining the active view role.
 *
 * @param {string} userId - The authenticated user's ID.
 * @param {string[]} availableRoles - The roles this user is allowed to view as.
 * @param {string} primaryRole - The user's real/primary role from auth.
 * @returns {string} The validated active view role.
 */
export function getActiveViewRole(userId, availableRoles, primaryRole) {
  const saved = localStorage.getItem(`activeRole_${userId}`);
  if (saved && availableRoles.includes(saved)) {
    return saved;
  }
  return primaryRole;
}

/**
 * Parse user_role_preference string into an array of roles.
 * Falls back to [primaryRole] if not set.
 *
 * @param {string|undefined} rolePref - The user_role_preference field value.
 * @param {string} primaryRole - The user's real role.
 * @returns {string[]}
 */
export function getAvailableRoles(rolePref, primaryRole) {
  if (rolePref && rolePref.trim().length > 0) {
    return rolePref.split(",").map(r => r.trim()).filter(Boolean);
  }
  return [primaryRole];
}