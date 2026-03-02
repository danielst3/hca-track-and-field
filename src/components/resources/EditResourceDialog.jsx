import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import ResourceTagSelector from "./ResourceTagSelector";

export default function EditResourceDialog({ resource, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    link_url: "",
    tags: [],
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title || "",
        content: resource.content || "",
        link_url: resource.link_url || "",
        tags: resource.tags || [],
      });
    } else {
      setFormData({
        title: "",
        content: "",
        link_url: "",
        tags: [],
      });
    }
  }, [resource]);

  const resourceMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (id) {
        return base44.entities.Resource.update(id, data);
      } else {
        return base44.entities.Resource.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource saved!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save resource");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource deleted");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to delete resource");
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url });
      toast.success("File uploaded!");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    resourceMutation.mutate({
      id: resource?.id,
      data: formData,
    });
  };

  const handleDelete = () => {
    if (resource?.id && confirm("Delete this resource?")) {
      deleteMutation.mutate(resource.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            {resource ? "Edit Resource" : "Add Resource"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-200">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Resource title"
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Description / Notes</Label>
            <Textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Details about this resource..."
              rows={4}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Link URL (optional)</Label>
            <Input
              value={formData.link_url}
              onChange={(e) =>
                setFormData({ ...formData, link_url: e.target.value })
              }
              placeholder="https://youtube.com/..."
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-200">Upload File (optional)</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload").click()}
                disabled={uploading}
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
              {formData.file_url && (
                <span className="text-sm text-green-600 dark:text-green-400">File uploaded ✓</span>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,.pdf"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={resourceMutation.isPending}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {resourceMutation.isPending ? "Saving..." : "Save Resource"}
            </Button>
            {resource && (
              <Button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                variant="destructive"
              >
                Delete
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="ml-auto dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}