import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Upload, Loader2, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function VideoAnalysis({ event, athleteName, athleteEmail }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const eventLabel = event === "shot" ? "Shot Put" : event === "discus" ? "Discus" : "Javelin";

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    let fileUrl;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      fileUrl = file_url;
    } catch (e) {
      setError("Failed to upload video. Please try a shorter clip.");
      setUploading(false);
      return;
    }
    setUploading(false);
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert ${eventLabel} throwing coach. Analyze this video of an athlete throwing the ${eventLabel}. 
        ${athleteName ? `Athlete name: ${athleteName}.` : ""}
        Provide specific, actionable feedback covering:
        1. **Technique Observations** - what you can see in the video
        2. **Key Strengths** - what they're doing well
        3. **Areas to Improve** - specific mechanical issues
        4. **Drills to Try** - 2-3 targeted drills to address the issues
        5. **Coaching Cues** - short phrases they can repeat during practice
        
        Be encouraging but specific. Focus on the most impactful improvements first.`,
        file_urls: [fileUrl],
      });
      const aiText = typeof result === "string" ? result : JSON.stringify(result);
      setAnalysis(aiText);
      setVideoUrl(fileUrl);
      // Save to database for coach review
      if (athleteEmail) {
        const { format } = await import("date-fns");
        await base44.entities.VideoAnalysisResult.create({
          athlete_email: athleteEmail,
          event,
          video_url: fileUrl,
          ai_response: aiText,
          analysis_date: format(new Date(), "yyyy-MM-dd"),
        });
      }
    } catch (e) {
      setError("AI analysis failed. Please try again.");
    }
    setAnalyzing(false);
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Video className="w-4 h-4 text-purple-500" />
          AI Video Analysis
          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-600">Beta</Badge>
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 bg-white dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload a short video clip of your {eventLabel} throw and get AI-powered technique feedback.
          </p>

          {!analysis && (
            <div className="space-y-3">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  file
                    ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600"
                    : "border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <Video className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate max-w-[180px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tap to select a video</span>
                    <span className="text-xs text-gray-400">MP4, MOV, etc.</span>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!file || uploading || analyzing}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : analyzing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Analyze with AI</>
                )}
              </Button>
            </div>
          )}

          {analysis && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Analysis
                </p>
                <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs h-6 text-gray-500 dark:text-gray-400">
                  Analyze Another
                </Button>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 max-h-80 overflow-y-auto">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}