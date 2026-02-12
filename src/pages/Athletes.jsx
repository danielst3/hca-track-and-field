import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, UserPlus } from "lucide-react";
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

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      const roleLabel = inviteRole === "user" ? "Athlete" : inviteRole === "admin" ? "Coach" : "Parent";
      toast.success(`${roleLabel} invited successfully!`);
      setInviteEmail("");
      setInviteRole("user");
      setInviteOpen(false);
    } catch (error) {
      toast.error("Failed to invite user");
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Athletes</h1>
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
                  <MobileSelect
                    value={inviteRole}
                    onValueChange={setInviteRole}
                    options={[
                      { value: "user", label: "Athlete" },
                      { value: "admin", label: "Coach" },
                      { value: "parent", label: "Parent" },
                    ]}
                  />
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
          {athletes.map((athlete) => (
            <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    to={`${createPageUrl("AthleteDetail")}?id=${athlete.id}`}
                    className="flex-1 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {athlete.full_name}
                      </p>
                      <p className="text-sm text-slate-600">{athlete.email}</p>
                      {athlete.grade && (
                        <Badge variant="outline" className="mt-2 text-xs capitalize">
                          {athlete.grade}
                        </Badge>
                      )}
                      {athlete.events && athlete.events.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {athlete.events.map((evt) => (
                            <Badge
                              key={evt}
                              className="text-xs capitalize bg-blue-100 text-blue-700"
                            >
                              {evt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </Link>
                  <div className="min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                    <MobileSelect
                      value={athlete.role}
                      onValueChange={(newRole) =>
                        roleUpdateMutation.mutate({ userId: athlete.id, newRole })
                      }
                      options={[
                        { value: "user", label: "Athlete" },
                        { value: "admin", label: "Coach" },
                        { value: "parent", label: "Parent" },
                      ]}
                      triggerClassName="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {athletes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-400 dark:text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No athletes yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Invite athletes to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}