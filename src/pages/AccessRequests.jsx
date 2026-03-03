import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Mail, UserCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AccessRequests() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ["accessRequests"],
    queryFn: async () => {
      const all = await base44.entities.AccessRequest.list("-created_date", 100);
      return all || [];
    },
    refetchOnMount: true,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.AccessRequest.update(requestId, { status: "approved" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessRequests"] });
      toast.success("Request approved");
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to approve request");
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.AccessRequest.update(requestId, { status: "denied" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessRequests"] });
      toast.success("Request denied");
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to deny request");
    },
  });

  const handleApprove = async (request) => {
    await base44.users.inviteUser(request.email, request.role);
    approveMutation.mutate(request.id);
  };

  const statusColor = {
    pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    approved: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    denied: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  };

  const roleLabel = {
    user: "Athlete",
    coach: "Coach",
    parent: "Parent",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-950 dark:to-gray-900 p-6 mb-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Access Requests</h1>
          </div>
          <p className="text-slate-300 dark:text-gray-400">Manage sign-up requests and user invitations</p>
        </div>

        {requests.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-12 text-center">
              <p className="text-slate-600 dark:text-gray-400 mb-2">No access requests yet</p>
              <p className="text-sm text-slate-500 dark:text-gray-500">Users will appear here when they request access</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4 dark:bg-gray-700 dark:border-gray-600">
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100">{request.full_name}</h3>
                        <Badge className={statusColor[request.status]}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                          <Mail className="w-4 h-4" />
                          {request.email}
                        </div>
                        <div className="text-slate-600 dark:text-gray-300">
                          <span className="font-semibold">Role:</span> {roleLabel[request.role] || request.role}
                        </div>
                        {request.athlete_name && (
                          <div className="text-slate-600 dark:text-gray-300">
                            <span className="font-semibold">Athlete:</span> {request.athlete_name}
                          </div>
                        )}
                        {request.notes && (
                          <div className="text-slate-600 dark:text-gray-300 p-2 bg-slate-50 dark:bg-gray-900 rounded">
                            <span className="font-semibold">Notes:</span> {request.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            onClick={() => handleApprove(request)}
                            disabled={approveMutation.isPending}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => denyMutation.mutate(request.id)}
                            disabled={denyMutation.isPending}
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                          >
                            <X className="w-4 h-4" />
                            Deny
                          </Button>
                        </>
                      )}
                      {request.status !== "pending" && (
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="dark:border-gray-600 dark:text-gray-300"
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">{selectedRequest?.full_name}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {selectedRequest?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold dark:text-gray-200">Status</p>
              <Badge className={statusColor[selectedRequest?.status]}>
                {selectedRequest?.status.charAt(0).toUpperCase() + selectedRequest?.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold dark:text-gray-200">Role</p>
              <p className="dark:text-gray-400">{roleLabel[selectedRequest?.role]}</p>
            </div>
            {selectedRequest?.athlete_name && (
              <div>
                <p className="text-sm font-semibold dark:text-gray-200">Athlete</p>
                <p className="dark:text-gray-400">{selectedRequest.athlete_name}</p>
              </div>
            )}
            {selectedRequest?.notes && (
              <div>
                <p className="text-sm font-semibold dark:text-gray-200">Notes</p>
                <p className="dark:text-gray-400 whitespace-pre-wrap">{selectedRequest.notes}</p>
              </div>
            )}
          </div>
          <Button onClick={() => setDialogOpen(false)} variant="outline" className="w-full dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}