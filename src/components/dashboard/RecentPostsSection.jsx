import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Link as LinkIcon, ChevronDown, ChevronUp, Circle, Disc3, Zap } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const EVENT_ICONS = {
  shot: <Circle className="w-3 h-3" />,
  discus: <Disc3 className="w-3 h-3" />,
  javelin: <Zap className="w-3 h-3" />,
};

const getYouTubeEmbedUrl = (url) => {
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
};

const isImageUrl = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
const isPdfUrl = (url) => url && /\.pdf$/i.test(url);
const isYouTubeUrl = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be"));

function PostCard({ post, eventOptions }) {
  const [expanded, setExpanded] = useState(false);
  const hasMedia = post.file_url || post.link_url;
  const hasContent = post.content;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      {/* Header row - always visible */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-gray-100">{post.title}</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              {post.created_by} · {format(new Date(post.created_date), "MMM d")}
            </p>
            {post.event_tags && post.event_tags.length > 0 && (
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {post.event_tags.map((tag) => {
                  const eventOption = eventOptions.find(e => e.id === tag);
                  return (
                    <Badge key={tag} variant="outline" className="text-xs flex items-center gap-1 py-0">
                      {EVENT_ICONS[tag] || null} {eventOption?.label || tag}
                    </Badge>
                  );
                })}
              </div>
            )}
            {/* Preview of content when collapsed */}
            {!expanded && hasContent && (
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1.5 line-clamp-1">{post.content}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-slate-400 dark:text-gray-500 mt-0.5">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-gray-700 pt-3">
          {post.content && (
            <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
          )}

          {/* File attachment */}
          {post.file_url && (
            <div>
              {isImageUrl(post.file_url) ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
                  <img src={post.file_url} alt={post.title} className="w-full max-h-72 object-contain bg-slate-50 dark:bg-gray-800" />
                </div>
              ) : isPdfUrl(post.file_url) ? (
                <a href={post.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-300">PDF Document</span>
                  <ExternalLink className="w-4 h-4 text-red-600 dark:text-red-400 ml-auto" />
                </a>
              ) : (
                <a href={post.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                  <FileText className="w-6 h-6 text-slate-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-gray-100">Attached File</span>
                  <ExternalLink className="w-4 h-4 text-slate-600 dark:text-gray-400 ml-auto" />
                </a>
              )}
            </div>
          )}

          {/* Link / YouTube */}
          {post.link_url && (
            <div>
              {isYouTubeUrl(post.link_url) && getYouTubeEmbedUrl(post.link_url) ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
                  <iframe
                    src={getYouTubeEmbedUrl(post.link_url)}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={post.title}
                  />
                </div>
              ) : (
                <a href={post.link_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                  <LinkIcon className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  <span className="text-sm text-slate-700 dark:text-gray-300 truncate flex-1">{post.link_url}</span>
                  <ExternalLink className="w-4 h-4 text-slate-600 dark:text-gray-400 flex-shrink-0" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecentPostsSection({ recentPosts, eventOptions }) {
  return (
    <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <FileText className="w-5 h-5" />
            Recent Posts
          </CardTitle>
          <Link to={createPageUrl("Posts")}>
            <Button variant="outline" size="sm" className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {recentPosts.map((post) => (
          <PostCard key={post.id} post={post} eventOptions={eventOptions} />
        ))}
      </CardContent>
    </Card>
  );
}