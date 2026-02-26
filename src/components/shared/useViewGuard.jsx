import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getActiveViewRole, getAvailableViews } from "./getActiveViewRole";
import { createPageUrl } from "../../utils";

/**
 * Guards a page to only allow users whose active view role is in allowedRoles.
 * Redirects to Today if not allowed.
 * Returns { ready } — render nothing until ready is true.
 */
export function useViewGuard(allowedRoles) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    base44.auth.me().then((currentUser) => {
      const availableViews = getAvailableViews(currentUser.user_role_preference, currentUser.role);
      const activeViewRole = getActiveViewRole(currentUser.id, availableViews, currentUser.role);
      if (!allowedRoles.includes(activeViewRole)) {
        window.location.href = createPageUrl("Today");
      } else {
        setReady(true);
      }
    });
  }, []);

  return { ready };
}