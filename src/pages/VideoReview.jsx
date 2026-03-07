import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Video, Zap, CheckCircle2, Clock, ChevronDown, ChevronUp, Play, Send, Edit2, Save, X, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function VideoReview() {
  const [expandedId, setExpandedId] = useState(null);
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
      // Athletes only see approved analyses
      return base44.entities.VideoAnalysisResult.filter(
        { athlete_email: user.email, status: "approved" },
        "-analysis_date",
        100
      );
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
      toast.success("AI analysis complete! Review and approve before sending to athlete.");
    },
    onError: (err) => toast.error(`Analysis failed: ${err.message}`),
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
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            {isCoachOrAdmin ? "Analyze videos and approve feedback for athletes" : "Your approved coaching feedback"}
          </p>
        </div>

        <Tabs defaultValue={isCoachOrAdmin ? "pending" : "analyzed"}>
          <TabsList className="mb-4 dark:bg-gray-800">
            {isCoachOrAdmin && (
              <TabsTrigger value="pending" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
                Pending ({pendingLogs.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="analyzed" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              {isCoachOrAdmin ? `Analyzed (${analyzedLogs.length})` : `Feedback (${analyzedLogs.length})`}
            </TabsTrigger>
          </TabsList>

          {isCoachOrAdmin && (
            <TabsContent value="pending" className="space-y-4">
              {loadingThrows || loadingTraining ? (
                <Spinner />
              ) : pendingLogs.length === 0 ? (
                <EmptyState icon={Video} message="No videos pending analysis" />
              ) : (
                pendingLogs.map((log) => (
                  <PendingLogCard
                    key={log.id}
                    log={log}
                    eventLabel={eventLabel(log.event)}
                    isAnalyzing={analyzeMutation.isPending && analyzeMutation.variables?.log_id === log.id}
                    onAnalyze={() => analyzeMutation.mutate({
                      log_id: log.id,
                      log_type: log.log_type,
                      video_url: log.video_url,
                      event: log.event,
                      athlete_email: log.athlete_email,
                    })}
                  />
                ))
              )}
            </TabsContent>
          )}

          <TabsContent value="analyzed" className="space-y-4">
            {loadingAnalyses ? (
              <Spinner />
            ) : analyzedLogs.length === 0 ? (
              <EmptyState icon={CheckCircle2} message={isCoachOrAdmin ? "No analyzed videos yet" : "No approved feedback yet"} />
            ) : (
              analyzedLogs.map((log) => {
                const analysis = getAnalysisForLog(log);
                return (
                  <AnalyzedLogCard
                    key={log.id}
                    log={log}
                    analysis={analysis}
                    eventLabel={eventLabel(log.event)}
                    isCoachOrAdmin={isCoachOrAdmin}
                    expanded={expandedId === log.id}
                    onToggleExpand={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ["videoAnalyses"] })}
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

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)]" />
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <div className="py-12 text-center text-slate-400 dark:text-gray-500">
        <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>{message}</p>
      </div>
    </Card>
  );
}

function PendingLogCard({ log, eventLabel, isAnalyzing, onAnalyze }) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-gray-100">{eventLabel}</span>
              <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300 capitalize">{log.session_type}</Badge>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyzedLogCard({ log, analysis, eventLabel, isCoachOrAdmin, expanded, onToggleExpand, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [followUpQ, setFollowUpQ] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [approvingLoading, setApprovingLoading] = useState(false);

  const isApproved = analysis?.status === "approved";

  const handleEditStart = () => {
    setFeedbackDraft(analysis?.coach_feedback || analysis?.ai_response || "");
    setEditing(true);
  };

  const handleSaveFeedback = async () => {
    setSavingFeedback(true);
    await base44.entities.VideoAnalysisResult.update(analysis.id, { coach_feedback: feedbackDraft });
    setSavingFeedback(false);
    setEditing(false);
    onUpdate();
    toast.success("Feedback saved.");
  };

  const handleApprove = async () => {
    setApprovingLoading(true);
    await base44.entities.VideoAnalysisResult.update(analysis.id, {
      status: "approved",
      coach_feedback: editing ? feedbackDraft : (analysis?.coach_feedback || analysis?.ai_response),
    });
    setApprovingLoading(false);
    setEditing(false);
    onUpdate();
    toast.success("Feedback approved and sent to athlete!");
  };

  const handleUnapprove = async () => {
    await base44.entities.VideoAnalysisResult.update(analysis.id, { status: "pending_review" });
    onUpdate();
    toast.success("Feedback unpublished from athlete.");
  };

  const handleFollowUp = async () => {
    if (!followUpQ.trim()) return;
    setFollowUpLoading(true);
    setFollowUpAnswer("");
    const res = await base44.functions.invoke("followUpAnalysis", {
      analysis_id: analysis.id,
      question: followUpQ,
      video_url: log.video_url,
      event: log.event,
      prior_analysis: analysis?.coach_feedback || analysis?.ai_response || "",
    });
    setFollowUpLoading(false);
    if (res.data?.response) {
      setFollowUpAnswer(res.data.response);
    } else {
      toast.error("Follow-up failed.");
    }
  };

  const displayFeedback = editing ? feedbackDraft : (analysis?.coach_feedback || analysis?.ai_response || "");

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-gray-100">{eventLabel}</span>
              <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300 capitalize">{log.session_type}</Badge>
              {isCoachOrAdmin && (
                <Badge className={`text-xs ${isApproved ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}`}>
                  {isApproved ? "Approved" : "Pending Review"}
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
            <Button variant="ghost" size="sm" onClick={onToggleExpand} className="gap-1 dark:text-gray-300 dark:hover:bg-gray-700">
              <CheckCircle2 className={`w-3.5 h-3.5 ${isApproved ? "text-green-500" : "text-yellow-500"}`} />
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Expanded */}
        {expanded && analysis && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700 space-y-4">
            {/* Feedback section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                  {isCoachOrAdmin ? "Coaching Feedback (sent to athlete)" : "Coaching Feedback"}
                </span>
                <span className="text-xs text-slate-400 dark:text-gray-500 ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {analysis.analysis_date ? format(new Date(analysis.analysis_date), "MMM d, yyyy") : ""}
                </span>
              </div>

              {editing ? (
                <Textarea
                  value={feedbackDraft}
                  onChange={(e) => setFeedbackDraft(e.target.value)}
                  rows={10}
                  className="text-sm font-mono dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                />
              ) : (
                <AnalysisFeedback aiResponse={displayFeedback} />
              )}

              {/* Coach action buttons */}
              {isCoachOrAdmin && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {editing ? (
                    <>
                      <Button size="sm" onClick={handleSaveFeedback} disabled={savingFeedback} className="gap-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white">
                        <Save className="w-3.5 h-3.5" /> {savingFeedback ? "Saving..." : "Save Edits"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1.5 dark:border-gray-600 dark:text-gray-300">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleEditStart} className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      <Edit2 className="w-3.5 h-3.5" /> Edit Feedback
                    </Button>
                  )}

                  {!isApproved ? (
                    <Button size="sm" onClick={handleApprove} disabled={approvingLoading} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {approvingLoading ? "Approving..." : "Approve & Send to Athlete"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleUnapprove} className="gap-1.5 text-yellow-700 border-yellow-400 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-gray-700">
                      Unpublish
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* AI Follow-up Q&A (coach only) */}
            {isCoachOrAdmin && (
              <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">Ask AI a Follow-up</span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={followUpQ}
                    onChange={(e) => setFollowUpQ(e.target.value)}
                    placeholder="Ask the AI for more detail, additional drills, corrections..."
                    rows={2}
                    className="text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200 flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleFollowUp(); } }}
                  />
                  <Button size="sm" onClick={handleFollowUp} disabled={followUpLoading || !followUpQ.trim()} className="self-end gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                    {followUpLoading ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                {followUpAnswer && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm text-slate-700 dark:text-gray-200 border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1 text-xs">AI Response:</p>
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{followUpAnswer}</ReactMarkdown>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => {
                        setFeedbackDraft((analysis?.coach_feedback || analysis?.ai_response || "") + "\n\n---\n**Additional Notes:**\n" + followUpAnswer);
                        setEditing(true);
                        setFollowUpAnswer("");
                        setFollowUpQ("");
                      }}
                    >
                      Add to Feedback
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisFeedback({ aiResponse }) {
  let data = null;
  try {
    data = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
  } catch {
    // fallback to markdown
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
              <div><span className="font-medium">Body Positioning: </span>{data.technical_feedback.body_positioning}</div>
            )}
            {data.technical_feedback.event_specific_mechanics && (
              <div><span className="font-medium">Event Mechanics: </span>{data.technical_feedback.event_specific_mechanics}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}