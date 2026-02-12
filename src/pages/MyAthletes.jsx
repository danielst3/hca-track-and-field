import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight } from "lucide-react";

export default function MyAthletes() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== "parent") {
        window.location.href = createPageUrl("Today");
      }
    };
    fetchUser();
  }, []);

  const { data: athletes = [] } = useQuery({
    queryKey: ["myAthletes", user?.email],
    queryFn: () => base44.entities.User.filter({ parent_email: user.email }),
    enabled: !!user,
  });

  if (!user || user.role !== "parent") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">My Athletes</h1>
        </div>

        <div className="grid gap-4">
          {athletes.map((athlete) => (
            <Card
              key={athlete.id}
              className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
            >
              <CardContent className="p-4">
                <Link
                  to={`${createPageUrl("AthleteDetail")}?id=${athlete.id}`}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-gray-100">
                      {athlete.full_name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-gray-400">{athlete.email}</p>
                    {athlete.grade && (
                      <Badge variant="outline" className="mt-2 text-xs capitalize dark:border-gray-600">
                        {athlete.grade}
                      </Badge>
                    )}
                    {athlete.events && athlete.events.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {athlete.events.map((evt) => (
                          <Badge
                            key={evt}
                            className="text-xs capitalize bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            {evt}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </Link>
              </CardContent>
            </Card>
          ))}

          {athletes.length === 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-400 dark:text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-gray-300">No athletes assigned</p>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  Contact a coach to link your athletes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}