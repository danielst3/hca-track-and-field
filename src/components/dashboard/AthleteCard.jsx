import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap } from "lucide-react";
import { format } from "date-fns";

export default function AthleteCard({ user, nextMeet, recentPosts }) {
  const eventLabels = {
    shot: "Shot Put",
    discus: "Discus",
    javelin: "Javelin"
  };

  return (
    <div className="space-y-4">
      {/* Events Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {user?.events?.map(event => (
          <Badge key={event} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
            {eventLabels[event]}
          </Badge>
        ))}
      </div>

      {/* Next Meet */}
      {nextMeet && (
        <Card className="border-green-200 bg-green-50 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-300">Next Meet</p>
                <p className="text-lg font-bold text-green-900 dark:text-gray-100">{nextMeet.name}</p>
                <p className="text-sm text-green-700 dark:text-gray-400">{format(new Date(nextMeet.date), "MMMM d, yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      {recentPosts && recentPosts.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-gray-100 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPosts.slice(0, 3).map(post => (
              <div key={post.id} className="border-l-4 border-blue-400 pl-3 py-1">
                <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{post.title}</p>
                <p className="text-xs text-slate-600 dark:text-gray-400">{format(new Date(post.created_date), "MMM d")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}