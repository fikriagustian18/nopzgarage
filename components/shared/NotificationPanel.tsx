"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Button } from "@/components/ui/Button";

import { getRecentLogs } from "@/lib/actions/logs";
import {
  clearNotifications,
  getNotifications,
  getNotificationStyle,
  getReadNotificationIds,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/notifications";

import type { Notification } from "@/lib/notifications";

const MAX_NOTIFICATIONS_COUNT = 50;
const RECENT_LOGS_LIMIT = 10;
const POLL_INTERVAL_MS = 5000;

interface ServerLog {
  id: string;
  action: string;
  title: string;
  details: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
  role?: string;
  createdAt: string;
}

/**
 * NotificationPanel component renders a notification bell button and dropdown panel.
 * Displays combined local notifications and server activity logs for OWNER users.
 */
export function NotificationPanel() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOwner = session?.user?.role === "OWNER";

  const loadNotifications = useCallback(async () => {
    const clientNotifications = getNotifications();
    const readIds = getReadNotificationIds();

    try {
      const serverResult = await getRecentLogs(RECENT_LOGS_LIMIT);
      if (serverResult.success && serverResult.logs) {
        const serverNotifications: Notification[] = (
          serverResult.logs as unknown as ServerLog[]
        ).map((log) => ({
          id: log.id,
          type: mapActionToType(log.action),
          title: log.title,
          message: log.details,
          timestamp: new Date(log.createdAt),
          read: readIds.includes(log.id),
          metadata: log.metadata,
          actor: log.userName || (log.userId ? "User" : "System"),
        }));

        // Deduplicate notifications by ID
        const clientOnly = clientNotifications.filter(
          (clientNotification) =>
            !serverNotifications.some(
              (serverNotification) => serverNotification.id === clientNotification.id
            )
        );

        const combinedNotifications = [
          ...clientOnly,
          ...serverNotifications,
        ];
        const sortedNotifications = combinedNotifications.sort(
          (firstNotification, secondNotification) =>
            new Date(secondNotification.timestamp).getTime() -
            new Date(firstNotification.timestamp).getTime()
        );

        const sliced = sortedNotifications.slice(0, MAX_NOTIFICATIONS_COUNT);
        setNotifications(sliced);
        setUnreadCount(getUnreadCount(sliced));
        return;
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
    }

    setNotifications(clientNotifications);
    setUnreadCount(getUnreadCount(clientNotifications));
  }, []);

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    loadNotifications();

    function handleNewNotification() {
      loadNotifications();
    }

    window.addEventListener("notification-added", handleNewNotification);
    const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("notification-added", handleNewNotification);
      clearInterval(interval);
    };
  }, [isOwner, loadNotifications]);

  function handleToggleOpen() {
    setIsOpen((prev) => !prev);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleMarkAsRead(id: string) {
    markAsRead(id);
    loadNotifications();
  }

  function handleMarkAllAsRead() {
    const allIds = notifications.map((notification) => notification.id);
    markAllAsRead(allIds);
    loadNotifications();
  }

  function handleClear() {
    clearNotifications();
    loadNotifications();
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggleOpen}
        className="relative w-10 h-10 border-sidebar-border hover:bg-sidebar-accent"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />

          {/* Main Panel Content */}
          <div className="absolute right-0 top-12 w-96 max-h-[500px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notifikasi
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs h-7"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Baca Semua
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[380px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Belum ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const style = getNotificationStyle(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <style.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`font-medium text-sm ${style.color}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(notification.timestamp, {
                                  addSuffix: true,
                                  locale: idLocale,
                                })}
                              </p>
                              {notification.actor && (
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                  Oleh: {notification.actor}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border bg-muted/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Hapus Semua Notifikasi
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Maps a log action string to a visual notification type.
 *
 * @param action - Log action name.
 * @returns Corresponding notification type identifier.
 */
function mapActionToType(action: string): Notification["type"] {
  if (action.includes("CREATE")) {
    return "success";
  }
  if (action.includes("UPDATE")) {
    return "info";
  }
  if (action.includes("DELETE")) {
    return "error";
  }
  if (action.includes("PAYMENT")) {
    return "success";
  }
  return "system";
}

