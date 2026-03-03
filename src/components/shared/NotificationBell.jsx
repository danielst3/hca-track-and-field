import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function NotificationBell({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () =>
      base44.entities.Notification.filter({ recipient_email: userEmail }, "-created_date", 20),
    enabled: !!userEmail,
    refetchInterval: 30000, // poll every 30s
  });

  const unread = notifications.filter((n) => !n.is_read);

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-700 hover:text-gray-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-700"
        >
          <Bell className="w-4 h-4" />
          {unread.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold dark:text-gray-100">Notifications</span>
          {unread.length > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs text-blue-500 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="dark:bg-gray-700" />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              asChild
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
              className={cn(
                "flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer",
                !n.is_read
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "dark:hover:bg-gray-700"
              )}
            >
              <Link to={n.link_page ? createPageUrl(n.link_page) : "#"}>
                <div className="flex items-center gap-2 w-full">
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <span className={cn("text-sm font-medium dark:text-gray-100", !n.is_read ? "ml-0" : "ml-4")}>
                    {n.title}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-4 leading-snug">
                  {n.message}
                </p>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}