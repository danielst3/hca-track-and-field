import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useViewGuard } from "../components/shared/useViewGuard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Link as LinkIcon, Upload, Plus, ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import EventToggle from "../components/shared/EventToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Posts() {
  const { activeView, user, allowed } = useViewGuard("Posts");
  const [open, setOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [deletePostId, setDeletePostId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const [eventOptions, setEventOptions] = useState([]);
  const [filterEvents, setFilterEvents] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    file_url: "",
    link_url: "",
    event_tags: [],
  });

  const isAdmin = activeView === "admin";

  useEffect(() => {
    if (!user) return;
    if (user?.event_types && user.event_types.length > 0) {
      setEventOptions(user.event_types.map(e => ({ id: e.id, label: e.label, icon: e.icon || "🎯" })));
    } else {
      setEventOptions([
        { id: "shot", label: "Shot Put", icon: "🏋️" },
        { id: "discus", label: "Discus", icon: "🥏" },
        { id: "javelin", label: "Javelin", icon: "🎯" }
      ]);
    }
  }, [user]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create({ ...data, author_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setOpen(false);
      setFormData({ title: "", content: "", file_url: "", link_url: "", event_tags: [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Post.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setEditPost(null);
      setFormData({ title: "", content: "", file_url: "", link_url: "", event_tags: [] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setDeletePostId(null);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editPost) {
      updateMutation.mutate({ id: editPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (post) => {
    setEditPost(post);
    setFormData({
      title: post.title || "",
      content: post.content || "",
      file_url: post.file_url || "",
      link_url: post.link_url || "",
      event_tags: post.event_tags || [],
    });
  };

  const toggleFormEvent = (eventId) => {
    const newEvents = formData.event_tags.includes(eventId)
      ? formData.event_tags.filter(e => e !== eventId)
      : [...formData.event_tags, eventId];
    setFormData({ ...formData, event_tags: newEvents });
  };

  const toggleFilterEvent = (eventId) => {
    const newEvents = filterEvents.includes(eventId)
      ? filterEvents.filter(e => e !== eventId)
      : [...filterEvents, eventId];
    setFilterEvents(newEvents);
  };

  const filteredPosts = filterEvents.length === 0 
    ? posts 
    : posts.filter(post => 
        post.event_tags && post.event_tags.some(tag => filterEvents.includes(tag))
      );

  const getYouTubeEmbedUrl = (url) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
    return videoIdMatch ? `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}` : null;
  };

  const isImageUrl = (url) => {
    return url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPdfUrl = (url) => {
    return url && /\.pdf$/i.test(url);
  };

  const isYouTubeUrl = (url) => {
    return url && (url.includes("youtube.com") || url.includes("youtu.be"));
  };

  if (!allowed || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-300">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Posts</h1>
            <p className="text-slate-600 dark:text-gray-300 mt-1">Team updates and announcements</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Post title..."
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">
                      Description
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Add notes or description..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">
                      Upload File (Photo, PDF, etc.)
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("file-upload").click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Choose File"}
                      </Button>
                      {formData.file_url && (
                        <span className="text-sm text-green-600">✓ File uploaded</span>
                      )}
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">
                      Link or YouTube URL
                    </label>
                    <Input
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="https://..."
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">
                      Event Tags
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {eventOptions.map(event => (
                        <EventToggle
                          key={event.id}
                          event={event}
                          isSelected={formData.event_tags.includes(event.id)}
                          onClick={() => toggleFormEvent(event.id)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editPost} onOpenChange={(o) => { if (!o) { setEditPost(null); setFormData({ title: "", content: "", file_url: "", link_url: "", event_tags: [] }); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">Title *</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">Description</label>
                <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">Link or YouTube URL</label>
                <Input value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} placeholder="https://..." type="url" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1 block">Event Tags</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {eventOptions.map(event => (
                    <EventToggle key={event.id} event={event} isSelected={formData.event_tags.includes(event.id)} onClick={() => toggleFormEvent(event.id)} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setEditPost(null); setFormData({ title: "", content: "", file_url: "", link_url: "", event_tags: [] }); }}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletePostId} onOpenChange={(o) => { if (!o) setDeletePostId(null); }}>
          <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-gray-100">Delete Post</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-300">This will permanently delete the post. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate(deletePostId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Event Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          {eventOptions.map(event => (
            <EventToggle
              key={event.id}
              event={event}
              isSelected={filterEvents.includes(event.id)}
              onClick={() => toggleFilterEvent(event.id)}
            />
          ))}
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-gray-300">No posts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100">{post.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                        Posted by {post.created_by} • {format(new Date(post.created_date), "MMM d, yyyy")}
                      </p>
                      {post.event_tags && post.event_tags.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {post.event_tags.map((tag) => {
                            const eventOption = eventOptions.find(e => e.id === tag);
                            return (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {eventOption?.icon} {eventOption?.label || tag}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {(isAdmin || user?.email === post.created_by) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
                          <DropdownMenuItem onClick={() => handleEdit(post)} className="dark:text-gray-200 dark:hover:bg-gray-700">
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletePostId(post.id)} className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {post.content && (
                    <p className="text-slate-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                  )}

                  {/* File Attachments */}
                  {post.file_url && (
                    <div className="mb-4">
                      {isImageUrl(post.file_url) ? (
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={post.file_url}
                            alt={post.title}
                            className="w-full max-h-96 object-contain bg-slate-50"
                          />
                        </div>
                      ) : isPdfUrl(post.file_url) ? (
                        <a
                          href={post.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <FileText className="w-8 h-8 text-red-600" />
                          <div>
                            <p className="font-semibold text-red-900">PDF Document</p>
                            <p className="text-sm text-red-600">Click to view</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-red-600 ml-auto" />
                        </a>
                      ) : (
                        <a
                          href={post.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <FileText className="w-8 h-8 text-slate-600" />
                          <div>
                            <p className="font-semibold text-slate-900">Attached File</p>
                            <p className="text-sm text-slate-600">Click to view</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-600 ml-auto" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  {post.link_url && (
                    <div>
                      {isYouTubeUrl(post.link_url) && getYouTubeEmbedUrl(post.link_url) ? (
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                          <iframe
                            src={getYouTubeEmbedUrl(post.link_url)}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          href={post.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <LinkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">External Link</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{post.link_url}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}