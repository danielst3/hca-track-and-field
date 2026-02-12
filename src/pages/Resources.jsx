import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Link as LinkIcon, Upload, Youtube, Image as ImageIcon, Plus, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function Resources() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    file_url: "",
    link_url: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Resource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setOpen(false);
      setFormData({ title: "", content: "", file_url: "", link_url: "" });
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
    createMutation.mutate(formData);
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Resources</h1>
            <p className="text-slate-600 mt-1">Shared materials and references</p>
          </div>
          {user?.role === "admin" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Resource Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Resource title..."
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">
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
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">
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
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">
                      Link or YouTube URL
                    </label>
                    <Input
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="https://..."
                      type="url"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Posting..." : "Post Resource"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Resources List */}
        {resources.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No resources posted yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{resource.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Posted by {resource.created_by} • {format(new Date(resource.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {resource.content && (
                    <p className="text-slate-700 mb-4 whitespace-pre-wrap">{resource.content}</p>
                  )}

                  {/* File Attachments */}
                  {resource.file_url && (
                    <div className="mb-4">
                      {isImageUrl(resource.file_url) ? (
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={resource.file_url}
                            alt={resource.title}
                            className="w-full max-h-96 object-contain bg-slate-50"
                          />
                        </div>
                      ) : isPdfUrl(resource.file_url) ? (
                        <a
                          href={resource.file_url}
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
                          href={resource.file_url}
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
                  {resource.link_url && (
                    <div>
                      {isYouTubeUrl(resource.link_url) && getYouTubeEmbedUrl(resource.link_url) ? (
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                          <iframe
                            src={getYouTubeEmbedUrl(resource.link_url)}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          href={resource.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <LinkIcon className="w-6 h-6 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-blue-900">External Link</p>
                            <p className="text-sm text-blue-600 truncate">{resource.link_url}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
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