import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RoleManagement() {
  const [newRoleName, setNewRoleName] = useState("");
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editPermissions, setEditPermissions] = useState({});
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["rolePermissions"],
    queryFn: () => base44.entities.RolePermission.list(),
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleName) => {
      return base44.entities.RolePermission.create({
        role_name: roleName.toLowerCase(),
        permissions: {
          view_all_athletes: false,
          edit_athletes: false,
          view_practice_plans: false,
          edit_practice_plans: false,
          view_meets: false,
          edit_meets: false,
          manage_seasons: false,
          view_posts: false,
          create_posts: false,
          edit_posts: false,
          view_resources: false,
          edit_resources: false,
          invite_users: false,
          manage_roles: false,
          view_ferpa: false,
          manage_ferpa: false,
        },
        is_system_role: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      setNewRoleName("");
      setAddRoleOpen(false);
      toast.success("Role created successfully");
    },
    onError: () => {
      toast.error("Failed to create role");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, permissions }) => {
      return base44.entities.RolePermission.update(roleId, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      setEditingRole(null);
      toast.success("Permissions updated");
    },
    onError: () => {
      toast.error("Failed to update permissions");
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId) => base44.entities.RolePermission.delete(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      toast.success("Role deleted");
    },
    onError: () => {
      toast.error("Failed to delete role");
    },
  });

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }
    if (roles.some(r => r.role_name === newRoleName.toLowerCase())) {
      toast.error("A role with this name already exists");
      return;
    }
    createRoleMutation.mutate(newRoleName);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setEditPermissions(role.permissions || {});
  };

  const togglePermission = (permissionKey) => {
    setEditPermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const handleSavePermissions = () => {
    updateRoleMutation.mutate({
      roleId: editingRole.id,
      permissions: editPermissions,
    });
  };

  const permissionsList = [
    { key: "view_all_athletes", label: "View All Athletes" },
    { key: "edit_athletes", label: "Edit Athletes" },
    { key: "view_practice_plans", label: "View Practice Plans" },
    { key: "edit_practice_plans", label: "Edit Practice Plans" },
    { key: "view_meets", label: "View Meets" },
    { key: "edit_meets", label: "Edit Meets" },
    { key: "manage_seasons", label: "Manage Seasons" },
    { key: "view_posts", label: "View Posts" },
    { key: "create_posts", label: "Create Posts" },
    { key: "edit_posts", label: "Edit Posts" },
    { key: "view_resources", label: "View Resources" },
    { key: "edit_resources", label: "Edit Resources" },
    { key: "invite_users", label: "Invite Users" },
    { key: "manage_roles", label: "Manage Roles" },
    { key: "view_ferpa", label: "View FERPA Compliance" },
    { key: "manage_ferpa", label: "Manage FERPA Compliance" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Role Management</h2>
        </div>
        <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">Add New Role</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRole} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Role Name</Label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., assistant_coach"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddRoleOpen(false)}
                  className="dark:bg-gray-700 dark:text-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="capitalize dark:text-gray-100">
                    {role.role_name.replace(/_/g, " ")}
                  </CardTitle>
                  {role.is_system_role && (
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                      System Role
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRole(role)}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    Edit Permissions
                  </Button>
                  {!role.is_system_role && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteRoleMutation.mutate(role.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(role.permissions || {})
                  .filter(([_, value]) => value === true)
                  .map(([key]) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                    >
                      {permissionsList.find(p => p.key === key)?.label || key.replace(/_/g, " ")}
                    </Badge>
                  ))}
                {Object.values(role.permissions || {}).every(v => !v) && (
                  <span className="text-sm text-slate-500 dark:text-gray-400">No permissions set</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {roles.length === 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-gray-300">No roles configured</p>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                Add roles to define custom permissions
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Edit Permissions: {editingRole?.role_name.replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid gap-3">
              {permissionsList.map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-slate-200 dark:border-gray-600"
                >
                  <input
                    type="checkbox"
                    checked={editPermissions[permission.key] || false}
                    onChange={() => togglePermission(permission.key)}
                    className="w-4 h-4"
                  />
                  <span className="dark:text-gray-200">{permission.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingRole(null)}
                className="dark:bg-gray-700 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePermissions}
                disabled={updateRoleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Save className="w-4 h-4" />
                {updateRoleMutation.isPending ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}