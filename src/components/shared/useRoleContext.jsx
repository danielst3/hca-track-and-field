/**
 * useRoleContext — Single source of truth for role resolution.
 *
 * Returns:
 *   primaryRole    — user.role from JWT (never mutated)
 *   roles          — all allowed view roles for this user
 *   activeViewRole — currently selected view role (from localStorage)
 *   setActiveViewRole(role) — persists, clears cache, redirects
 *   roleLabel(r)   — display label for a role string
 *   isLoading      — true while user is being fetched
 *   user           — raw user object
 */

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { VALID_ROLES, landingPageByRole, roleLabel as ROLE_LABELS } from "./roleConfig";

let _cachedContext = null; // module-level cache so multiple callers share state

export function useRoleContext() {
  const [user, setUser] = useState(_cachedContext?.user ?? null);
  const [isLoading, setIsLoading] = useState(_cachedContext ? false : true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (_cachedContext) {
      setUser(_cachedContext.user);
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const currentUser = await base44.auth.me();
        const primaryRole = currentUser.role; // never mutate this

        // Build list of allowed view roles
        const prefRoles = currentUser.user_role_preference
          ? currentUser.user_role_preference.split(",").map(r => r.trim()).filter(r => VALID_ROLES.includes(r))
          : [];
        const roles = Array.from(new Set([primaryRole, ...prefRoles]));

        // Resolve active view role from localStorage
        const stored = localStorage.getItem(`activeRole_${currentUser.id}`);
        const activeViewRole = (stored && roles.includes(stored)) ? stored : primaryRole;

        const enriched = {
          ...currentUser,
          primaryRole,
          roles,
          activeViewRole,
        };

        _cachedContext = { user: enriched };
        setUser(enriched);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setActiveViewRole = useCallback((role) => {
    if (!user) return;
    if (!user.roles.includes(role)) return;
    localStorage.setItem(`activeRole_${user.id}`, role);
    // Invalidate module cache so next mount re-resolves
    _cachedContext = null;
    // Clear all react-query caches
    queryClient.clear();
    // Navigate to landing page for new role
    const landing = landingPageByRole[role] || "Today";
    window.location.href = createPageUrl(landing);
  }, [user, queryClient]);

  return {
    user,
    isLoading,
    primaryRole: user?.primaryRole ?? user?.role ?? null,
    roles: user?.roles ?? (user?.role ? [user.role] : []),
    activeViewRole: user?.activeViewRole ?? user?.role ?? null,
    setActiveViewRole,
    roleLabelFor: (r) => ROLE_LABELS[r] ?? r,
  };
}

/** Call this to bust the module-level cache (e.g. after impersonation changes) */
export function bustRoleCache() {
  _cachedContext = null;
}