import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Video, FileText } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { cn } from "@/lib/utils";

const eventLabel = (e) => e ? e.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : null;

function FeedbackItem({ icon: Icon, badgeLabel, badgeClass, title, date, content, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div
      className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer"
      onClick={() => setOpen(v => !v)}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-750">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="font-medium text-sm text-slate-800 dark:text-gray-100 truncate">{title}</span>
          {badgeLabel && (
            <Badge className={cn("text-xs", badgeClass)}>{badgeLabel}</Badge>
          )}
        </div>
        <span className="text-xs text-slate-400 dark:text-gray-500 flex-shrink-0">{date}</span>
      </div>
      {open && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700">
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-gray-300">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedbackSection({ athleteEmail }) {
  const { data: generalFeedbacks = [] } = useQuery({
    queryKey: ["generalFeedback", athleteEmail],
    queryFn: () => base44.entities.GeneralFeedback.filter({ athlete_email: athleteEmail }, "-created_date", 20),
    enabled: !!athleteEmail,
  });

  const { data: videoFeedbacks = [] } = useQuery({
    queryKey: ["videoFeedbackForAthlete", athleteEmail],
    queryFn: () => base44.entities.VideoAnalysisResult.filter(
      { athlete_email: athleteEmail, status: "approved" },
      "-analysis_date",
      20
    ),
    enabled: !!athleteEmail,
  });

  const allItems = [
    ...generalFeedbacks.map(f => ({
      id: f.id,
      type: "general",
      date: f.created_date,
      title: f.event ? `${eventLabel(f.event)} Feedback` : "General Feedback",
      content: f.feedback_content,
    })),
    ...videoFeedbacks.map(f => ({
      id: f.id,
      type: "video",
      date: f.analysis_date,
      title: f.event ? `${eventLabel(f.event)} Video Feedback` : "Video Feedback",
      content: typeof f.coach_feedback === "string"
        ? (() => { try { const p = JSON.parse(f.coach_feedback); return p.summary || f.coach_feedback; } catch { return f.coach_feedback; } })()
        : (f.ai_response || ""),
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allItems.length === 0) return null;

  return (
    <Card className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-gray-100">
          <MessageSquare className="w-4 h-4 text-[var(--brand-primary)]" />
          Coaching Feedback
          <Badge className="ml-1 text-xs bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300">
            {allItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {allItems.map((item, idx) => (
          <FeedbackItem
            key={item.id}
            icon={item.type === "video" ? Video : FileText}
            badgeLabel={item.type === "video" ? "Video" : "General"}
            badgeClass={item.type === "video" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}
            title={item.title}
            date={item.date ? format(new Date(item.date), "MMM d, yyyy") : ""}
            content={item.content}
            defaultOpen={idx === 0}
          />
        ))}
      </CardContent>
    </Card>
  );
}