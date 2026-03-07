import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Zap, CheckCircle2, Clock, ChevronDown, ChevronUp, Play } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import ReactMarkdown from "react-markdown";

export default function VideoReview() {
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).finally(() => setUserLoading(false));
  }, []);

  const isCoachOrAdmin = user?.role === "admin" || user?.role === "coach";

  const { data: throwLogs = [], isLoading: loadingThrows } = useQuery({
    queryKey: ["throwLogsWithVideo", user?.email],
    queryFn: () => {
      const filter = { video_url: { $exists: true } };
      if (!isCoachOrAdmin) filter.athlete_email = user.email;
      return base44.entities.ThrowLog.filter(filter, "-date", 50);
    },
    enabled: !!user,
  });

  const { data: trainingLogs = [], isLoading: loadingTraining } = useQuery({
    queryKey: ["trainingLogsWithVideo", user?.email],
    queryFn: () => {
      const filter = { video_url: { $exists: true } };
      if (!isCoachOrAdmin) filter.athlete_email = user.email;
      return base44.entities.TrainingLog.filter(filter, "-date", 50);
    },
    enabled: !!user,
  });

  const { data: analyses = [], isLoading: loadingAnalyses } = useQuery({
    queryKey: ["videoAnalyses", user?.email],
    queryFn: () => {
      if (isCoachOrAdmin) return base44.entities.VideoAnalysisResult.list("-analysis_date", 100);
      return base44.entities.VideoAnalysisResult.filter({ athlete_email: user.email }, "-analysis_date", 100);
    },
    enabled: !!user,
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ log_id, log_type, video_url, event, athlete_email }) => {
      const res = await base44.functions.invoke("analyzeVideo", { log_id, log_type, video_url, event, athlete_email });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoAnalyses"] });
      toast.success("AI analysis complete!");
    },
    onError: (err) => {
      toast.error(`Analysis failed: ${err.message}`);
    },
  });

  const allLogs = [
    ...throwLogs.map(l => ({ ...l, log_type: "throw" })),
    ...trainingLogs.map(l => ({ ...l, log_type: "training" })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const analyzedVideoUrls = new Set(analyses.map(a => a.video_url));

  const pendingLogs = allLogs.filter(l => !analyzedVideoUrls.has(l.video_url));
  const analyzedLogs = allLogs.filter(l => analyzedVideoUrls.has(l.video_url));

  const getAnalysisForLog = (log) => analyses.find(a => a.video_url === log.video_url);

  const eventLabel = (event) => event?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#111]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Video Review</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Analyze athlete videos with AI coaching feedback</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4 dark:bg-gray-800">
            <TabsTrigger value="pending" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Pending ({pendingLogs.length})
            </TabsTrigger>
            <TabsTrigger value="analyzed" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Analyzed ({analyzedLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Analysis */}
          <TabsContent value="pending" className="space-y-4">
            {loadingThrows || loadingTraining ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)]" />
              </div>
            ) : pendingLogs.length === 0 ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="py-12 text-center text-slate-400 dark:text-gray-500">
                  <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No videos pending analysis</p>
                </CardContent>
              </Card>
            ) : (
              pendingLogs.map((log) => (
                <VideoLogCard
                  key={log.id}
                  log={log}
                  eventLabel={eventLabel(log.event)}
                  isPending
                  isAnalyzing={analyzeMutation.isPending && analyzeMutation.variables?.log_id === log.id}
                  onAnalyze={() =>
                    analyzeMutation.mutate({
                      log_id: log.id,
                      log_type: log.log_type,
                      video_url: log.video_url,
                      event: log.event,
                      athlete_email: log.athlete_email,
                    })
                  }
                />
              ))
            )}
          </TabsContent>

          {/* Analyzed */}
          <TabsContent value="analyzed" className="space-y-4">
            {loadingAnalyses ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)]" />
              </div>
            ) : analyzedLogs.length === 0 ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="py-12 text-center text-slate-400 dark:text-gray-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No analyzed videos yet</p>
                </CardContent>
              </Card>
            ) : (
              analyzedLogs.map((log) => {
                const analysis = getAnalysisForLog(log);
                return (
                  <VideoLogCard
                    key={log.id}
                    log={log}
                    eventLabel={eventLabel(log.event)}
                    analysis={analysis}
                    expanded={expandedAnalysis === log.id}
                    onToggleExpand={() => setExpandedAnalysis(expandedAnalysis === log.id ? null : log.id)}
                  />
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AnalysisFeedback({ aiResponse }) {
  let data = null;
  try {
    data = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
  } catch {
    // fallback to markdown if not JSON
  }

  if (!data || typeof data !== "object") {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-900 rounded-lg p-4">
        <ReactMarkdown>{aiResponse}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {data.summary && (
        <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
          <p className="text-slate-700 dark:text-gray-300">{data.summary}</p>
        </div>
      )}
      {data.strengths?.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1.5">✅ Strengths</h4>
          <ul className="space-y-1 pl-4 list-disc text-slate-700 dark:text-gray-300">
            {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {data.areas_for_improvement?.length > 0 && (
        <div>
          <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-1.5">🔧 Areas for Improvement</h4>
          <ul className="space-y-1 pl-4 list-disc text-slate-700 dark:text-gray-300">
            {data.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
      {data.drill_recommendations?.length > 0 && (
        <div>
          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1.5">🎯 Drill Recommendations</h4>
          <ul className="space-y-1 pl-4 list-disc text-slate-700 dark:text-gray-300">
            {data.drill_recommendations.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      {data.technical_feedback && (
        <div>
          <h4 className="font-semibold text-slate-700 dark:text-gray-200 mb-1.5">📐 Technical Feedback</h4>
          <div className="space-y-2 bg-slate-50 dark:bg-gray-900 rounded-lg p-3 text-slate-700 dark:text-gray-300">
            {data.technical_feedback.body_positioning && (
              <div>
                <span className="font-medium">Body Positioning: </span>
                {data.technical_feedback.body_positioning}
              </div>
            )}
            {data.technical_feedback.event_specific_mechanics && (
              <div>
                <span className="font-medium">Event Mechanics: </span>
                {data.technical_feedback.event_specific_mechanics}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoLogCard({ log, eventLabel, isPending, isAnalyzing, onAnalyze, analysis, expanded, onToggleExpand }) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-gray-100">{eventLabel}</span>
              <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300 capitalize">
                {log.session_type}
              </Badge>
              {log.best_distance && (
                <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {log.best_distance} ft
                </Badge>
              )}
              {log.time && (
                <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {log.time}
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {log.athlete_email} • {log.date ? format(new Date(log.date), "MMM d, yyyy") : ""}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={log.video_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Play className="w-3.5 h-3.5" /> Video
              </Button>
            </a>
            {isPending ? (
              <Button
                size="sm"
                disabled={isAnalyzing}
                onClick={onAnalyze}
                className="gap-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white"
              >
                {isAnalyzing ? (
                  <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> Analyzing...</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Analyze</>
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="gap-1 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {/* AI Analysis Expanded */}
        {expanded && analysis && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">AI Coaching Feedback</span>
              <span className="text-xs text-slate-400 dark:text-gray-500 ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {analysis.analysis_date ? format(new Date(analysis.analysis_date), "MMM d, yyyy") : ""}
              </span>
            </div>
            <AnalysisFeedback aiResponse={analysis.ai_response} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}