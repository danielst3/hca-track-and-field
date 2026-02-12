import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Home, Calendar, LogOut, Trophy, TrendingUp, Users, BookOpen, FileText, Trash2, RefreshCw, ArrowLeft, Settings, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalSearch from "./components/shared/UniversalSearch";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Detect if on a sub-page
    const subPages = ["AthleteDetail", "Settings"];
    setCanGoBack(subPages.includes(currentPageName));
  }, [currentPageName]);

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        const impersonating = localStorage.getItem("impersonating");
        if (impersonating && currentUser?.role === "admin") {
          const impersonatedUser = JSON.parse(impersonating);
          setUser({ ...currentUser, ...impersonatedUser, isImpersonating: true, realRole: currentUser.role });
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleStopImpersonating = () => {
    localStorage.removeItem("impersonating");
    window.location.reload();
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
          <h1 className="text-4xl font-bold text-white dark:text-gray-100 mb-3">HCA Chargers Track & Field</h1>
          <p className="text-[var(--brand-secondary-light)] dark:text-gray-400 mb-8">
            High School Track & Field Throws Program
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Today"))}
            size="lg"
            className="w-full bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-dark)] text-[var(--brand-primary)] font-bold dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 select-none"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const navItems = (user?.realRole === "admin" || user?.role === "admin") && !user?.isImpersonating
    ? [
        { name: "Today", icon: Home, page: "Today" },
        { name: "Calendar", icon: Calendar, page: "Calendar" },
        { name: "Athletes", icon: Users, page: "Athletes" },
        { name: "Seasons", icon: Trophy, page: "Seasons" },
        { name: "Posts", icon: FileText, page: "Posts" },
        { name: "Resources", icon: BookOpen, page: "Resources" },
      ]
    : user?.role === "parent"
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
        { name: "Progress", icon: TrendingUp, page: "Progress" },
        { name: "Posts", icon: FileText, page: "Posts" },
        { name: "Resources", icon: BookOpen, page: "Resources" },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] dark:from-gray-900 dark:to-gray-800 overscroll-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] dark:from-gray-950 dark:to-gray-900 border-b border-[var(--brand-primary-darker)] dark:border-gray-700 sticky top-0 z-50 select-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {canGoBack ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="text-white hover:bg-white/10"
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
              <h1 className="text-lg font-bold text-white dark:text-gray-100">
                {canGoBack ? "" : "HCA Chargers Track & Field"}
              </h1>
              <p className="text-xs text-[var(--brand-secondary-light)] dark:text-gray-400">
                {user.full_name} • {user.isImpersonating ? "Athlete (Viewing)" : (user.role === "admin" ? "Coach" : user.role === "parent" ? "Parent" : "Athlete")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UniversalSearch />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-slate-700 hover:text-white hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-800 select-none"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-700 hover:text-white hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-800 select-none"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
                {user.isImpersonating && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleStopImpersonating}
                      className="dark:text-gray-200 dark:hover:bg-gray-700 select-none bg-blue-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Stop Viewing as Athlete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="dark:bg-gray-700" />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Settings")} className="dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Privacy")} className="dark:text-gray-200 dark:hover:bg-gray-700 select-none cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <DropdownMenuItem onClick={handleLogout} className="dark:text-gray-200 dark:hover:bg-gray-700 select-none">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 shadow-lg z-50 select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-around">
          {navItems.map((item) => {
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
                      : "text-slate-600 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}