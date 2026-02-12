import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  Users, 
  BookOpen, 
  Trophy,
  ChevronRight,
  FileText,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const downloadAthleteData = async () => {
    try {
      setDownloading(true);
      const logs = await base44.entities.ThrowLog.filter({ athlete_email: user.email });
      
      if (logs.length === 0) {
        toast.error("No data to download");
        return;
      }

      const csvHeader = "Date,Event,Distance,Implement,Notes,Is PR,Is Meet\n";
      const csvRows = logs.map(log => 
        `${log.date},"${log.event}",${log.distance},"${log.implement || ''}","${(log.notes || '').replace(/"/g, '""')}",${log.is_pr ? 'Yes' : 'No'},${log.is_meet ? 'Yes' : 'No'}`
      ).join("\n");
      
      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.full_name.replace(/\s/g, '_')}_throwing_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download data");
    } finally {
      setDownloading(false);
    }
  };

  const downloadAllAthleteData = async () => {
    try {
      setDownloading(true);
      const logs = await base44.entities.ThrowLog.list();
      
      if (logs.length === 0) {
        toast.error("No data to download");
        return;
      }

      const csvHeader = "Athlete,Email,Date,Event,Distance,Implement,Notes,Is PR,Is Meet\n";
      const csvRows = logs.map(log => 
        `"${log.athlete_name}","${log.athlete_email}",${log.date},"${log.event}",${log.distance},"${log.implement || ''}","${(log.notes || '').replace(/"/g, '""')}",${log.is_pr ? 'Yes' : 'No'},${log.is_meet ? 'Yes' : 'No'}`
      ).join("\n");
      
      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all_athletes_throwing_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download data");
    } finally {
      setDownloading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]" />
      </div>
    );
  }

  const isCoach = user.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 select-none">Settings</h1>
          <p className="text-slate-700 dark:text-gray-300 mt-1">
            {isCoach ? "Manage your team and practice plans" : "Manage your profile and preferences"}
          </p>
        </div>

        {/* Profile Section */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription className="dark:text-gray-300">
              View and update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">Name</p>
              <p className="font-medium text-slate-900 dark:text-gray-100">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">Email</p>
              <p className="font-medium text-slate-900 dark:text-gray-100">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-gray-300 font-medium">Role</p>
              <p className="font-medium text-slate-900 dark:text-gray-100">{isCoach ? "Coach" : "Athlete"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Coach-only Settings */}
        {isCoach && (
          <>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Team Management</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Manage athletes and team settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Athletes")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      Manage Athletes
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Practice & Training</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Manage practice plans and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Seasons")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Trophy className="w-5 h-5" />
                      Manage Seasons
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to={createPageUrl("Calendar")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      Edit Practice Plans
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to={createPageUrl("Resources")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5" />
                      Manage Resources
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Communication</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Manage team posts and announcements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Posts")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      Manage Posts
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Export Data</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Download team throwing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={downloadAllAthleteData}
                  disabled={downloading}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Downloading..." : "Download All Athletes Data (CSV)"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Athlete-only Settings */}
        {!isCoach && (
          <>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">My Progress</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  View your training and performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl("Progress")}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <Trophy className="w-5 h-5" />
                      View My Stats
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Export Data</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Download your throwing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={downloadAthleteData}
                  disabled={downloading}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Downloading..." : "Download My History (CSV)"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}