import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Plus, LogOut, Trophy, TrendingUp, Users, BookOpen, FileText, Trash2, RefreshCw, ArrowLeft, Settings, Moon, Sun, MoreHorizontal, Download, Shield, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalSearch from "./components/shared/UniversalSearch";
import { useRoleContext, bustRoleCache } from "./components/shared/useRoleContext";
import { pageAccessConfig, landingPageByRole, roleLabel as ROLE_LABELS } from "./components/shared/roleConfig";

import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Layout({ children, currentPageName }) {
  const { user, isLoading: loading, activeViewRole, roles, setActiveViewRole, primaryRole, roleLabelFor } = useRoleContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef(null);
  const queryClient = useQueryClient();
  const scrollPositions = useRef({});
  const [canGoBack, setCanGoBack] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      
      // Detect system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.removeItem('theme'); // Clear saved preference to follow system
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);
  const [requestData, setRequestData] = useState({ email: "", full_name: "", role: "user", athlete_name: "", notes: "" });
  const [showOverflow, setShowOverflow] = useState(false);
  const navRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Detect if on a sub-page
    const subPages = ["AthleteDetail", "Settings"];
    setCanGoBack(subPages.includes(currentPageName));
  }, [currentPageName]);

  useEffect(() => {
    // Check if nav items overflow
    const checkOverflow = () => {
      if (navRef.current) {
        const containerWidth = navRef.current.offsetWidth;
        const itemCount = navItems.length;
        const minItemWidth = 80; // minimum width per nav item
        setShowOverflow(containerWidth < itemCount * minItemWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [user]);

  useEffect(() => {
    // Apply theme
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Restore scroll position when page changes
    const container = scrollContainerRef.current;
    if (container && scrollPositions.current[currentPageName] !== undefined) {
      container.scrollTop = scrollPositions.current[currentPageName];
    }

    return () => {
      // Save scroll position when leaving page
      if (container) {
        scrollPositions.current[currentPageName] = container.scrollTop;
      }
    };
  }, [currentPageName]);



  const handleStopImpersonating = () => {
    localStorage.removeItem("impersonating");
    bustRoleCache();
    window.location.reload();
  };

  const handleSwitchRole = (role) => {
    toast.success(`Switched to ${roleLabelFor(role)} view`);
    setActiveViewRole(role); // handles persist + cache clear + redirect
  };

  const handleLogout = () => {
    localStorage.removeItem("impersonating");
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    try {
      await base44.entities.User.delete(user.id);
      toast.success("Account deleted successfully");
      base44.auth.logout();
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success("App installed successfully!");
      }
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  const requestAccessMutation = useMutation({
    mutationFn: async (data) => {
      const request = await base44.entities.AccessRequest.create(data);
      
      // Notify all coaches
      const admins = await base44.entities.User.filter({ role: "admin" });
      const roleLabel = data.role === "user" ? "Athlete" : data.role === "coach" ? "Coach" : "Parent";
      const athleteInfo = data.athlete_name ? `\nAthlete: ${data.athlete_name}` : "";
      const notesInfo = data.notes ? `\n\nNotes: ${data.notes}` : "";
      
      await Promise.all(admins.map(admin => 
        base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `New Access Request - ${data.full_name}`,
          body: `A new access request has been submitted:\n\nName: ${data.full_name}\nEmail: ${data.email}\nRequesting: ${roleLabel}${athleteInfo}${notesInfo}\n\nPlease review in the Athletes management page.`
        })
      ));
      
      return request;
    },
    onSuccess: () => {
      toast.success("Access request submitted! We'll review and get back to you soon.");
      setRequestData({ email: "", full_name: "", role: "user", athlete_name: "", notes: "" });
      setRequestAccessOpen(false);
    },
    onError: () => {
      toast.error("Failed to submit request. Please try again.");
    },
  });

  const handleRequestAccess = (e) => {
    e.preventDefault();
    if (requestData.role === "parent" && !requestData.athlete_name.trim()) {
      toast.error("Please enter your athlete's name");
      return;
    }
    requestAccessMutation.mutate(requestData);
  };

  const handleTouchStart = (e) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(currentY - touchStartY.current, 80));
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await queryClient.invalidateQueries();
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Refreshed");
      }, 500);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-secondary)] mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] dark:from-gray-950 dark:to-gray-900 p-4">
        <div className="text-center max-w-md">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698de82661ea1d1ad2bf86f9/785163a71_HorseLogoOfficial1.png" 
            alt="HCA Chargers" 
            className="w-32 h-32 object-contain mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">HCA Chargers Track & Field</h1>
          <p className="text-gray-700 dark:text-gray-400 mb-8">
            High School Track & Field Throws Program
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Today"))}
              size="lg"
              className="w-full bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-dark)] text-gray-900 font-bold dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 select-none"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setRequestAccessOpen(true)}
              size="lg"
              variant="outline"
              className="w-full border-gray-800 text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 select-none"
            >
              Request Access
            </Button>
          </div>

          <Dialog open={requestAccessOpen} onOpenChange={setRequestAccessOpen}>
            <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-gray-100">Request Access</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRequestAccess} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Full Name</Label>
                  <Input
                    value={requestData.full_name}
                    onChange={(e) => setRequestData({ ...requestData, full_name: e.target.value })}
                    placeholder="Your full name"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Email</Label>
                  <Input
                    type="email"
                    value={requestData.email}
                    onChange={(e) => setRequestData({ ...requestData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">I am a</Label>
                  <select
                    value={requestData.role}
                    onChange={(e) => setRequestData({ ...requestData, role: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    required
                  >
                    <option value="user">Athlete</option>
                    <option value="coach">Coach</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                {requestData.role === "parent" && (
                  <div className="space-y-2">
                    <Label className="dark:text-gray-200">Athlete's Name</Label>
                    <Input
                      value={requestData.athlete_name}
                      onChange={(e) => setRequestData({ ...requestData, athlete_name: e.target.value })}
                      placeholder="Your athlete's full name"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Notes (Optional)</Label>
                  <Textarea
                    value={requestData.notes}
                    onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                    placeholder="Additional information"
                    rows={3}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRequestAccessOpen(false)}
                    className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={requestAccessMutation.isPending}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    {requestAccessMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Route guard: if current page is not allowed for activeRole, redirect
  const activeRole = user?.role;
  const allowedPages = ROLE_PAGES[activeRole] || ROLE_PAGES["user"];
  if (!UNIVERSAL_PAGES.includes(currentPageName) && !allowedPages.includes(currentPageName)) {
    const landing = DEFAULT_PAGE[activeRole] || "Today";
    window.location.replace(createPageUrl(landing));
    return null;
  }

  // Nav items are driven purely by activeRole (viewMode)
  const navItems = (activeRole === "admin" || activeRole === "coach") && !user?.isImpersonating
    ? [
        { name: "Today", icon: Home, page: "Today" },
        { name: "Calendar", icon: Calendar, page: "Calendar" },
        { name: "Log Activity", icon: Plus, page: "LogActivity" },
        { name: "Athletes", icon: Users, page: "Athletes" },
        { name: "Seasons", icon: Trophy, page: "Seasons" },
      ]
    : activeRole === "parent"
    ? [
        { name: "Today", icon: Home, page: "Today" },
        { name: "Calendar", icon: Calendar, page: "Calendar" },
        { name: "Athletes", icon: Users, page: "MyAthletes" },
        { name: "Posts", icon: FileText, page: "Posts" },
        { name: "Resources", icon: BookOpen, page: "Resources" },
      ]
    : [
        { name: "Today", icon: Home, page: "Today" },
        { name: "Calendar", icon: Calendar, page: "Calendar" },
        { name: "Log Activity", icon: Plus, page: "LogActivity" },
        { name: "Progress", icon: TrendingUp, page: "Progress" },
        { name: "Resources", icon: BookOpen, page: "Resources" },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] dark:from-[#111] dark:to-[#111] overscroll-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] dark:from-black dark:to-gray-950 border-b border-[var(--brand-primary-darker)] dark:border-gray-800 sticky top-0 z-50 select-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {canGoBack ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="text-gray-200 dark:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698de82661ea1d1ad2bf86f9/785163a71_HorseLogoOfficial1.png" 
                alt="HCA Chargers" 
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {canGoBack ? "" : "HCA Chargers Track & Field"}
              </h1>
              <p className="text-xs text-gray-700 dark:text-gray-400">
                    {(user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : user.full_name} • {user.isImpersonating ? "Athlete (Viewing)" : (user.role === "admin" ? "Admin" : user.role === "coach" ? "Coach" : user.role === "parent" ? "Parent" : "Athlete")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UniversalSearch />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-gray-700 hover:text-gray-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-700 select-none"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 hover:text-gray-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-700 select-none"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
                {user.isImpersonating && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleStopImpersonating}
                      className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Stop Viewing as Athlete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="dark:bg-gray-700" />
                  </>
                )}
                {user.realRole === "admin" && user.is_parent && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleToggleParentView}
                      className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {user.isViewingAsParent ? "Switch to Coach View" : "Switch to Parent View"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="dark:bg-gray-700" />
                  </>
                )}
                {(activeRole === "admin" || activeRole === "coach") && !user?.isImpersonating && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                      <Users className="w-4 h-4 mr-2" />
                      Team Management
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="dark:bg-gray-800 dark:border-gray-700">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Athletes")} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                          Athletes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Seasons")} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                          Seasons
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Calendar")} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                          Practice Plans
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Resources")} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                          Resources
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Settings")} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Privacy")} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                {canInstall && (
                  <>
                    <DropdownMenuItem onClick={handleInstallPWA} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none">
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="dark:bg-gray-700" />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 select-none">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700 select-none"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Role Switcher Dropdown */}
      {user?.availableRoles && user.availableRoles.length > 1 && (
        <div className="bg-[var(--brand-primary-dark)] dark:bg-black border-b border-[var(--brand-primary-darker)] dark:border-gray-800 px-4 py-1.5 flex items-center gap-2 select-none">
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">View as:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-white dark:text-gray-100 bg-white/10 dark:bg-gray-800 hover:bg-white/20 dark:hover:bg-gray-700 px-3 py-1 rounded-full transition-colors">
                {user.role === "admin" ? "Admin" : user.role === "coach" ? "Coach" : user.role === "parent" ? "Parent" : "Athlete"}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-black border-gray-800 dark:bg-black dark:border-gray-800">
              {user.availableRoles.filter(r => r === user.role || (user.user_role_preference && user.user_role_preference.split(",").includes(r))).map(role => {
                const label = role === "admin" ? "Admin" : role === "coach" ? "Coach" : role === "parent" ? "Parent" : "Athlete";
                const isActive = user.role === role;
                return (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => handleSwitchRole(role)}
                    className={cn(
                      "text-xs cursor-pointer",
                      isActive
                        ? "text-white font-semibold bg-gray-800"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    )}
                  >
                    {label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40"
          style={{ opacity: pullDistance / 60 }}
        >
          <RefreshCw className={cn("w-6 h-6 text-[var(--brand-primary)] dark:text-gray-300", isRefreshing && "animate-spin")} />
        </div>
      )}

      {/* Main Content */}
      <div 
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="pb-20 overflow-auto"
        style={{ transform: `translateY(${pullDistance}px)`, transition: pullDistance === 0 ? 'transform 0.3s' : 'none' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 select-none">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 select-none"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <div ref={navRef} className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 shadow-lg z-50 select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-around">
          {(showOverflow ? navItems.slice(0, 3) : navItems).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2 px-4 select-none",
                    isActive
                      ? "text-[var(--brand-primary)] bg-[var(--brand-secondary)] dark:text-gray-100 dark:bg-gray-800"
                      : "text-gray-700 hover:text-gray-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Button>
              </Link>
            );
          })}
          {showOverflow && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2 px-4 select-none text-gray-700 hover:text-gray-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreHorizontal className="w-5 h-5" />
                  <span className="text-xs font-medium">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700 mb-2">
                {navItems.slice(3).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <DropdownMenuItem key={item.page} asChild>
                      <Link 
                        to={createPageUrl(item.page)}
                        className={cn(
                          "cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700",
                          isActive && "bg-[var(--brand-secondary)] dark:bg-gray-700"
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}