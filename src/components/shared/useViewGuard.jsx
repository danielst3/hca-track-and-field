import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { PAGE_ALLOWED_VIEWS, getActiveView, getViewHome } from "./viewConfig";

/**
 * useViewGuard(pageName)
 * 
 * Call at the top of every page to enforce view-based access control.
 * If the user's activeView is not in the allowed list for this page,
 * they are immediately redirected to their view's home page.
 * 
 * Returns { activeView, user, allowed } so pages can gate components.
 * `allowed` is false while checking (renders nothing to avoid flicker).
 */
export function useViewGuard(pageName) {
  const [state, setState] = useState({ activeView: null, user: null, allowed: false });

  useEffect(() => {
    const check = async () => {
      const user = await base44.auth.me();
      const activeView = getActiveView(user);
      const allowedViews = PAGE_ALLOWED_VIEWS[pageName];

      // If no restriction defined, allow all
      if (!allowedViews) {
        setState({ activeView, user, allowed: true });
        return;
      }

      if (!allowedViews.includes(activeView)) {
        // Redirect to this view's home — no flicker since allowed stays false
        window.location.href = createPageUrl(getViewHome(activeView));
        return;
      }

      setState({ activeView, user, allowed: true });
    };
    check();
  }, [pageName]);

  return state;
}