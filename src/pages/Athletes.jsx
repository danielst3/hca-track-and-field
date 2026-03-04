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
import { getActiveViewRole, getAvailableViews } from "../components/shared/getActiveViewRole";

export default function Athletes() {
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [editRoles, setEditRoles] = useState([]);
  const [editEvents, setEditEvents] = useState([]);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editIsAthlete, setEditIsAthlete] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const availableViews = getAvailableViews(currentUser.user_role_preference, currentUser.role);
      const effectiveRole = getActiveViewRole(currentUser.id, availableViews, currentUser.role);
      if (effectiveRole !== "admin" && effectiveRole !== "coach") {
        window.location.href = createPageUrl("Today");
      }
    };
    fetchUser();
  }, []);

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAthletes");
      return res.data.users || [];
    },
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
   mutationFn: async ({ userId, newRoles, newEvents, firstName, lastName, isAthlete }) => {
     return base44.entities.User.update(userId, { 
       user_role_preference: newRoles.join(","),
       events: newEvents,
       ...(firstName !== undefined && { first_name: firstName }),
       ...(lastName !== undefined && { last_name: lastName }),
       is_athlete: isAthlete,
     });
   },
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["athletes"] });
     setEditingAthlete(null);
     toast.success("Updated successfully");
   },
   onError: (error) => {
     console.error("Update error:", error);
     toast.error("Failed to update");
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

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      // Only admins get admin role, everyone else gets user role
      const apiRole = role === "admin" ? "admin" : "user";
      
      // Send the invitation through Base44
      await base44.users.inviteUser(email, apiRole);
      
      // Track the invitation with the actual requested role
      const pendingInvite = await base44.entities.PendingInvitation.create({
        email: email,
        role: role,
        status: "pending"
      });
      
      return { pendingInvite, role };
    },
    onSuccess: ({ role }) => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      
      const roleLabel = role === "user" ? "Athlete" : role === "admin" ? "Admin" : role === "coach" ? "Coach" : "Parent";
      toast.success(`${roleLabel} invited successfully!`);
      
      setInviteEmail("");
      setInviteRole("user");
      setInviteOpen(false);
    },
    onError: (error) => {
      console.error("Invite error:", error);
      const errorMessage = error?.message || error?.detail || String(error) || "Failed to send invitation";
      toast.error(errorMessage);
    }
  });

  const handleInvite = async (e) => {
    e.preventDefault();

    // Validate email
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate email domain for athletes
    if (inviteRole === "user" && !inviteEmail.toLowerCase().endsWith("@hcakc.org")) {
      toast.error("Athletes must have an @hcakc.org email address");
      return;
    }

    // Check if user already exists
    const existingUser = athletes.find(a => a.email.toLowerCase() === inviteEmail.toLowerCase());
    if (existingUser) {
      toast.error("A user with this email already exists");
      return;
    }

    // Check if invitation already pending
    const existingInvite = pendingInvitations.find(inv => inv.email.toLowerCase() === inviteEmail.toLowerCase());
    if (existingInvite) {
      toast.error("An invitation to this email is already pending");
      return;
    }

    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const approveRequestMutation = useMutation({
    mutationFn: async (request) => {
      // Only admins get admin role, everyone else gets user role
      const apiRole = request.role === "admin" ? "admin" : "user";
      
      // Send invitation
      await base44.users.inviteUser(request.email, apiRole);
      
      // Create pending invitation record
      await base44.entities.PendingInvitation.create({
        email: request.email,
        role: request.role,
        status: "pending"
      });
      
      // Update request status
      await base44.entities.AccessRequest.update(request.id, { status: "approved" });
      
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessRequests"] });
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("Access request approved and invitation sent!");
    },
    onError: (error) => {
      console.error("Approve error:", error);
      const errorMessage = error?.message || error?.detail || String(error) || "Failed to approve request";
      toast.error(errorMessage);
    }
  });

  const handleApproveRequest = async (request) => {
    // Validate email domain for athletes
    if (request.role === "user" && !request.email.toLowerCase().endsWith("@hcakc.org")) {
      toast.error("Athletes must have an @hcakc.org email address");
      return;
    }

    // Check if user already exists
    const existingUser = athletes.find(a => a.email.toLowerCase() === request.email.toLowerCase());
    if (existingUser) {
      toast.error("A user with this email already exists");
      return;
    }

    approveRequestMutation.mutate(request);
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

  const handleRemoveInvitation = async (invitationId) => {
    try {
      await base44.entities.PendingInvitation.delete(invitationId);
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      toast.success("Invitation removed");
    } catch (error) {
      toast.error("Failed to remove invitation");
    }
  };

  const openEditDialog = (athlete) => {
    setEditingAthlete(athlete);
    const roles = athlete.user_role_preference ? athlete.user_role_preference.split(",") : ["user"];
    setEditRoles(roles);
    setEditEvents(athlete.events || []);
    setEditFirstName(athlete.first_name || "");
    setEditLastName(athlete.last_name || "");
    setEditIsAthlete(athlete.is_athlete === true);
  };

  const toggleRole = (role) => {
    setEditRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const toggleEvent = (event) => {
    setEditEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleSaveRoles = () => {
    if (editRoles.length === 0) {
      toast.error("At least one role must be selected");
      return;
    }
    roleUpdateMutation.mutate({ userId: editingAthlete.id, newRoles: editRoles, newEvents: editEvents, firstName: editFirstName, lastName: editLastName, isAthlete: editIsAthlete });
  };

  const [assignParentOpen, setAssignParentOpen] = useState(false);
  const [selectedAthleteForAssign, setSelectedAthleteForAssign] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState("");

  const assignAthleteMutation = useMutation({
    mutationFn: async ({ parentId, athleteId }) => {
      const parent = athletes.find(a => a.id === parentId);
      const currentAssigned = parent?.assigned_athletes || [];
      if (currentAssigned.includes(athleteId)) {
        // Remove athlete
        return base44.entities.User.update(parentId, {
          assigned_athletes: currentAssigned.filter(id => id !== athleteId)
        });
      } else {
        // Add athlete
        return base44.entities.User.update(parentId, {
          assigned_athletes: [...currentAssigned, athleteId]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      toast.success("Assignment updated");
    },
    onError: () => {
      toast.error("Failed to update assignment");
    },
  });

  const handleOpenAssignParent = (athlete) => {
    setSelectedAthleteForAssign(athlete);
    setAssignParentOpen(true);
  };

  const handleAssignToggle = (parentId) => {
    assignAthleteMutation.mutate({ parentId, athleteId: selectedAthleteForAssign.id });
  };

  const parents = athletes.filter(a => a.role === "parent" || (a.user_role_preference && a.user_role_preference.includes("parent")));

  const effectiveRole = user ? getActiveViewRole(user.id, getAvailableViews(user.user_role_preference, user.role), user.role) : null;
  
  if (!user || (effectiveRole !== "admin" && effectiveRole !== "coach")) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-gray-300 font-semibold">Access denied. Only coaches and admins can manage athletes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111] p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[var(--brand-primary)] dark:text-gray-300" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Team Management</h1>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#551e1b', color: 'white' }} className="hover:opacity-90 dark:!bg-gray-700 dark:hover:!bg-gray-600 gap-2">
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
                     <option value="coach">Coach</option>
                     <option value="admin">Admin</option>
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
                  <Button 
                    type="submit" 
                    disabled={inviteUserMutation.isPending}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    {inviteUserMutation.isPending ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {/* Active Athletes Section */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-4">All Users</h2>
            <div className="grid gap-4">
              {athletes.filter(a => !a.graduated).map((athlete) => {
                 const roles = athlete.user_role_preference ? athlete.user_role_preference.split(",") : [athlete.role];
                 const isAthlete = roles.includes("user") || roles.includes("athlete");
                 const isCoachOrAdmin = roles.includes("admin") || roles.includes("coach");
                 const isParent = roles.includes("parent");
                 const roleLabel = isCoachOrAdmin ? (roles.includes("admin") ? "Admin" : "Coach") : isParent ? "Parent" : "Athlete";
                return (
                  <Card key={athlete.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <Link
                        to={`${createPageUrl("AthleteDetail")}?id=${athlete.id}`}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-gray-100">
                              {athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : athlete.full_name}
                            </p>
                            <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                              {roleLabel}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">{athlete.email}</p>
                          {athlete.grade && isAthlete && (
                            <Badge variant="outline" className="mt-2 text-xs capitalize dark:border-gray-600 dark:text-gray-300">
                              {athlete.grade}
                            </Badge>
                          )}
                          {athlete.events && athlete.events.length > 0 && isAthlete && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {athlete.events.map((evt) => (
                                <Badge
                                  key={evt}
                                  className="text-xs capitalize bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {evt}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                      </Link>
                      <div className="flex gap-2 items-center flex-wrap">
                        {isAthlete && (
                          <Button
                            variant="outline"
                            onClick={() => handleOpenAssignParent(athlete)}
                            className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-10 px-4"
                          >
                            <Users className="w-4 h-4" />
                            Parents
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => graduateMutation.mutate({ userId: athlete.id })}
                          className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-10 px-4"
                        >
                          <GraduationCap className="w-4 h-4" />
                          Graduate
                        </Button>
                        <Dialog open={editingAthlete?.id === athlete.id} onOpenChange={(open) => !open && setEditingAthlete(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => openEditDialog(athlete)}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-10 px-4"
                            >
                              Edit Roles
                            </Button>
                          </DialogTrigger>
                           <DialogContent>
                             <DialogHeader>
                               <DialogTitle>Edit {athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : athlete.full_name}</DialogTitle>
                             </DialogHeader>
                             <div className="space-y-6 mt-4">
                               <div>
                                 <h3 className="font-semibold text-slate-900 dark:text-gray-100 mb-3">Name</h3>
                                 <div className="grid grid-cols-2 gap-3">
                                   <div className="space-y-1">
                                     <Label className="text-sm text-slate-600 dark:text-gray-400">First Name</Label>
                                     <Input
                                       value={editFirstName}
                                       onChange={(e) => setEditFirstName(e.target.value)}
                                       placeholder="First name"
                                       className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                     />
                                   </div>
                                   <div className="space-y-1">
                                     <Label className="text-sm text-slate-600 dark:text-gray-400">Last Name</Label>
                                     <Input
                                       value={editLastName}
                                       onChange={(e) => setEditLastName(e.target.value)}
                                       placeholder="Last name"
                                       className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                     />
                                   </div>
                                 </div>
                               </div>
                               <div>
                                 <h3 className="font-semibold text-slate-900 dark:text-gray-100 mb-3">Roles</h3>
                                 <div className="space-y-3">
                                   {[
                                     { value: "user", label: "Athlete" },
                                     { value: "coach", label: "Coach" },
                                     { value: "admin", label: "Admin" },
                                     { value: "parent", label: "Parent" }
                                   ].map(role => (
                                     <label key={role.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                       <input
                                         type="checkbox"
                                         checked={editRoles.includes(role.value)}
                                         onChange={() => toggleRole(role.value)}
                                         className="w-4 h-4"
                                       />
                                       <span className="dark:text-gray-200">{role.label}</span>
                                     </label>
                                   ))}
                                 </div>
                               </div>

                               <div>
                                 <h3 className="font-semibold text-slate-900 dark:text-gray-100 mb-3">Event Types</h3>
                                 <div className="space-y-3">
                                   {[
                                     { value: "shot", label: "Shot Put" },
                                     { value: "discus", label: "Discus" },
                                     { value: "javelin", label: "Javelin" }
                                   ].map(event => (
                                     <label key={event.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                       <input
                                         type="checkbox"
                                         checked={editEvents.includes(event.value)}
                                         onChange={() => toggleEvent(event.value)}
                                         className="w-4 h-4"
                                       />
                                       <span className="dark:text-gray-200">{event.label}</span>
                                     </label>
                                   ))}
                                 </div>
                               </div>

                               <div className="flex justify-end gap-3">
                                 <Button
                                   type="button"
                                   variant="outline"
                                   onClick={() => setEditingAthlete(null)}
                                 >
                                   Cancel
                                 </Button>
                                 <Button 
                                   onClick={handleSaveRoles}
                                   disabled={roleUpdateMutation.isPending}
                                   className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] dark:bg-[#6b2622] dark:hover:bg-[#551e1b] dark:text-white"
                                   >
                                     {roleUpdateMutation.isPending ? "Saving..." : "Save Changes"}
                                 </Button>
                               </div>
                             </div>
                           </DialogContent>
                         </Dialog>
                       </div>
                       </div>
                       </CardContent>
                       </Card>
                       );
                       })}
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
                             {athlete.first_name && athlete.last_name ? `${athlete.first_name} ${athlete.last_name}` : athlete.full_name}
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
                                  className="text-xs capitalize bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
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
            <Card key={request.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-gray-100">
                        {request.full_name}
                      </p>
                      <Badge className="text-xs bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                        Access Request
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                      {request.email}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">
                      Requesting: {request.role === "user" ? "Athlete" : request.role === "coach" ? "Coach" : request.role === "admin" ? "Admin" : "Parent"}
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
                      onClick={() => handleApproveRequest(request)}
                      disabled={approveRequestMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 h-10 px-4"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {approveRequestMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDenyRequest(request.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 px-4"
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
                      Invited as {invite.role === "user" ? "Athlete" : invite.role === "admin" ? "Admin" : invite.role === "coach" ? "Coach" : "Parent"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleRemoveInvitation(invite.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 px-4"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

        </div>

        {/* Assign Parent Dialog */}
        <Dialog open={assignParentOpen} onOpenChange={setAssignParentOpen}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">Assign Parents to {selectedAthleteForAssign?.first_name && selectedAthleteForAssign?.last_name ? `${selectedAthleteForAssign.first_name} ${selectedAthleteForAssign.last_name}` : selectedAthleteForAssign?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              {parents.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-gray-400 text-center py-4">
                  No parents in the system yet
                </p>
              ) : (
                parents.map((parent) => {
                  const isAssigned = parent.assigned_athletes?.includes(selectedAthleteForAssign?.id);
                  return (
                    <label
                      key={parent.id}
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => handleAssignToggle(parent.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-gray-100">{parent.full_name}</p>
                        <p className="text-xs text-slate-600 dark:text-gray-400">{parent.email}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setAssignParentOpen(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}