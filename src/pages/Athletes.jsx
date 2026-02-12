import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, UserPlus, Check, X, GraduationCap } from "lucide-react";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Athletes() {
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteOpen, setInviteOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== "admin") {
        window.location.href = createPageUrl("Today");
      }
    };
    fetchUser();
  }, []);

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ["pendingInvitations"],
    queryFn: async () => {
      const invites = await base44.entities.PendingInvitation.filter({ status: "pending" });
      return invites;
    },
  });

  const { data: accessRequests = [] } = useQuery({
    queryKey: ["accessRequests"],
    queryFn: async () => {
      const requests = await base44.entities.AccessRequest.filter({ status: "pending" });
      return requests;
    },
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ userId, newRole }) => base44.entities.User.update(userId, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("Role updated successfully");
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  const graduateMutation = useMutation({
    mutationFn: ({ userId }) => base44.entities.User.update(userId, { graduated: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("Student graduated successfully");
    },
    onError: () => {
      toast.error("Failed to graduate student");
    },
  });

  const ungraduateMutation = useMutation({
    mutationFn: ({ userId }) => base44.entities.User.update(userId, { graduated: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("Student re-activated");
    },
    onError: () => {
      toast.error("Failed to re-activate student");
    },
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    
    // Validate email domain for athletes
    if (inviteRole === "user" && !inviteEmail.toLowerCase().endsWith("@hcakc.org")) {
      toast.error("Athletes must have an @hcakc.org email address");
      return;
    }
    
    try {
      // For inviteUser API, use "user" for both athletes and parents
      const apiRole = inviteRole === "admin" ? "admin" : "user";
      
      // Send the invitation
      await base44.users.inviteUser(inviteEmail, apiRole);
      
      // Track the pending invitation with the actual role
      await base44.entities.PendingInvitation.create({
        email: inviteEmail,
        role: inviteRole,
        status: "pending"
      });
      
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      
      const roleLabel = inviteRole === "user" ? "Athlete" : inviteRole === "admin" ? "Coach" : "Parent";
      toast.success(`${roleLabel} invited successfully!`);
      setInviteEmail("");
      setInviteRole("user");
      setInviteOpen(false);
    } catch (error) {
      toast.error("Failed to invite user");
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      // Validate email domain for athletes
      if (request.role === "user" && !request.email.toLowerCase().endsWith("@hcakc.org")) {
        toast.error("Athletes must have an @hcakc.org email address");
        return;
      }

      const apiRole = request.role === "admin" ? "admin" : "user";
      await base44.users.inviteUser(request.email, apiRole);
      
      await base44.entities.PendingInvitation.create({
        email: request.email,
        role: request.role,
        status: "pending"
      });

      await base44.entities.AccessRequest.update(request.id, { status: "approved" });
      
      queryClient.invalidateQueries({ queryKey: ["accessRequests"] });
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      
      toast.success("Access request approved and invitation sent!");
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleDenyRequest = async (requestId) => {
    try {
      await base44.entities.AccessRequest.update(requestId, { status: "denied" });
      queryClient.invalidateQueries({ queryKey: ["accessRequests"] });
      toast.success("Access request denied");
    } catch (error) {
      toast.error("Failed to deny request");
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Athletes</h1>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <UserPlus className="w-4 h-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                   <Label>Role</Label>
                   <select
                     value={inviteRole}
                     onChange={(e) => setInviteRole(e.target.value)}
                     className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                   >
                     <option value="user">Athlete</option>
                     <option value="admin">Coach</option>
                     <option value="parent">Parent</option>
                   </select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Send Invite
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {/* Active Athletes Section */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-4">Current Roster</h2>
            <div className="grid gap-4">
              {athletes.filter(a => !a.graduated).map((athlete) => (
                <Card key={athlete.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Link
                        to={`${createPageUrl("AthleteDetail")}?id=${athlete.id}`}
                        className="flex-1 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-gray-100">
                            {athlete.full_name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-gray-400">{athlete.email}</p>
                          {athlete.grade && (
                            <Badge variant="outline" className="mt-2 text-xs capitalize dark:border-gray-600 dark:text-gray-300">
                              {athlete.grade}
                            </Badge>
                          )}
                          {athlete.events && athlete.events.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {athlete.events.map((evt) => (
                                <Badge
                                  key={evt}
                                  className="text-xs capitalize bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                >
                                  {evt}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                      </Link>
                      <div className="flex gap-2 items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => graduateMutation.mutate({ userId: athlete.id })}
                          className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <GraduationCap className="w-4 h-4" />
                          Graduate
                        </Button>
                        <div className="min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={athlete.role || "user"}
                            onChange={(e) => roleUpdateMutation.mutate({ userId: athlete.id, newRole: e.target.value })}
                            className="w-full px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          >
                            <option value="user">Athlete</option>
                            <option value="admin">Coach</option>
                            <option value="parent">Parent</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {athletes.filter(a => !a.graduated).length === 0 && (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-gray-300">No active athletes</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                      Invite athletes to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Graduated Athletes Section */}
          {athletes.some(a => a.graduated) && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-4 mt-6">Graduated Students</h2>
              <div className="grid gap-4">
                {athletes.filter(a => a.graduated).map((athlete) => (
                  <Card key={athlete.id} className="opacity-75 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 border border-slate-300 dark:border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-gray-100">
                              {athlete.full_name}
                            </p>
                            <Badge className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs">
                              Graduated
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">{athlete.email}</p>
                          {athlete.events && athlete.events.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {athlete.events.map((evt) => (
                                <Badge
                                  key={evt}
                                  className="text-xs capitalize bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                >
                                  {evt}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => ungraduateMutation.mutate({ userId: athlete.id })}
                          className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Undo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Access Requests and Pending Invitations */}
           {accessRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 border-2 border-blue-300 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-gray-100">
                        {request.full_name}
                      </p>
                      <Badge className="text-xs bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400">
                        Access Request
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                      {request.email}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">
                      Requesting: {request.role === "user" ? "Athlete" : "Parent"}
                    </p>
                    {request.athlete_name && (
                      <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                        Athlete: {request.athlete_name}
                      </p>
                    )}
                    {request.notes && (
                      <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 italic">
                        "{request.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDenyRequest(request.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingInvitations.map((invite) => (
            <Card key={invite.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 border-dashed opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-gray-100">
                        {invite.email}
                      </p>
                      <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400">
                        Pending Invitation
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                      Invited as {invite.role === "user" ? "Athlete" : invite.role === "admin" ? "Coach" : "Parent"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        </div>
      </div>
    </div>
  );
}