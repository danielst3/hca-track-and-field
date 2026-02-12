import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Home, Calendar, LogOut, Trophy, TrendingUp, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalSearch from "./components/shared/UniversalSearch";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="text-center max-w-md">
          <Trophy className="w-20 h-20 text-blue-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-3">Throws Daily</h1>
          <p className="text-slate-300 mb-8">
            High School Track & Field Throws Program
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Today"))}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const navItems = user?.role === "admin"
    ? [
        { name: "Today", icon: Home, page: "Today" },
        { name: "Calendar", icon: Calendar, page: "Calendar" },
        { name: "Athletes", icon: Users, page: "Athletes" },
        { name: "Appendix", icon: BookOpen, page: "Appendix" },
      ]
    : [
        { name: "Today", icon: Home, page: "Today" },
        { name: "Calendar", icon: Calendar, page: "Calendar" },
        { name: "Progress", icon: TrendingUp, page: "Progress" },
        { name: "Appendix", icon: BookOpen, page: "Appendix" },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold text-white">Throws Daily</h1>
              <p className="text-xs text-slate-400">
                {user.full_name} • {user.role === "admin" ? "Coach" : "Athlete"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UniversalSearch />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">{children}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2 px-4",
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
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