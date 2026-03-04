import React from "react";
import { ExternalLink } from "lucide-react";

export default function DrillDetailPanel({ drill }) {
  if (!drill) return null;

  const getYouTubeEmbedId = (url) => {
    const match = url?.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3 text-sm border border-gray-200 dark:border-gray-600">
      {drill.purpose && (
        <p className="text-gray-600 dark:text-gray-300 italic">{drill.purpose}</p>
      )}
      {drill.setup && (
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Setup</p>
          <p className="text-gray-700 dark:text-gray-300">{drill.setup}</p>
        </div>
      )}
      {drill.execution && (
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Execution</p>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{drill.execution}</p>
        </div>
      )}
      {drill.executionSteps && drill.executionSteps.length > 0 && (
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Steps</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {drill.executionSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}
      {drill.cues && drill.cues.length > 0 && (
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Cues</p>
          <div className="flex flex-wrap gap-2">
            {drill.cues.map((cue, i) => (
              <span key={i} className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full font-medium">
                {cue}
              </span>
            ))}
          </div>
        </div>
      )}
      {drill.commonFaults && drill.commonFaults.length > 0 && (
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Common Faults</p>
          <ul className="space-y-1 text-gray-700 dark:text-gray-300">
            {drill.commonFaults.map((f, i) => <li key={i} className="text-xs">⚠ {f}</li>)}
          </ul>
        </div>
      )}
      {drill.commonFaultsFixes && drill.commonFaultsFixes.length > 0 && (
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Common Faults & Fixes</p>
          <ul className="space-y-1 text-gray-700 dark:text-gray-300">
            {drill.commonFaultsFixes.map((f, i) => <li key={i} className="text-xs">⚠ {f}</li>)}
          </ul>
        </div>
      )}
      {drill.youtube_url && (() => {
        const embedId = getYouTubeEmbedId(drill.youtube_url);
        return embedId ? (
          <div>
            <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Video</p>
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${embedId}`}
                title={drill.name}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <a href={drill.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 underline text-xs">
            <ExternalLink className="w-3 h-3" /> Watch Video
          </a>
        );
      })()}
    </div>
  );
}