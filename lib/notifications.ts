// lib/notifications.ts
// Simple notification/activity log system

import { 
  Package, FileText, CheckCircle, User, UserPlus, UserMinus, 
  DollarSign, Settings, Info, AlertTriangle, XCircle, 
  Plus, RefreshCw, Archive
} from "lucide-react";

export type NotificationType = 
  | "order_created"
  | "order_updated"
  | "order_completed"
  | "employee_created"
  | "employee_updated"
  | "employee_deleted"
  | "payment_received"
  | "sparepart_added"
  | "sparepart_updated"
  | "sparepart_deleted"
  | "system"
  | "info"
  | "success"
  | "warning"
  | "error";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, any>;
  actor?: string; // e.g. "Admin", "User", "System"
};

// In-memory store for notifications (will persist in localStorage)
const STORAGE_KEY = "nopzgarage_notifications";
const MAX_NOTIFICATIONS = 50;

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const notifications = JSON.parse(stored) as Notification[];
    return notifications.map(n => ({
      ...n,
      timestamp: new Date(n.timestamp)
    }));
  } catch {
    return [];
  }
}

export function addNotification(
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Notification {
  const notification: Notification = {
    id: crypto.randomUUID(),
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
    metadata
  };

  const notifications = getNotifications();
  notifications.unshift(notification);
  
  // Keep only the last MAX_NOTIFICATIONS
  const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent("notification-added", { detail: notification }));
  }

  return notification;
}

export function markAsRead(id: string): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  );
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function markAllAsRead(): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function clearNotifications(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

// Helper to get icon and color based on notification type
export function getNotificationStyle(type: NotificationType) {
  const styles = {
    order_created: { color: "text-green-500", bgColor: "bg-green-500/10", icon: Package },
    order_updated: { color: "text-blue-500", bgColor: "bg-blue-500/10", icon: FileText },
    order_completed: { color: "text-emerald-500", bgColor: "bg-emerald-500/10", icon: CheckCircle },
    employee_created: { color: "text-purple-500", bgColor: "bg-purple-500/10", icon: UserPlus },
    employee_updated: { color: "text-blue-500", bgColor: "bg-blue-500/10", icon: User },
    employee_deleted: { color: "text-red-500", bgColor: "bg-red-500/10", icon: UserMinus },
    payment_received: { color: "text-green-500", bgColor: "bg-green-500/10", icon: DollarSign },
    sparepart_added: { color: "text-orange-500", bgColor: "bg-orange-500/10", icon: Plus },
    sparepart_updated: { color: "text-blue-500", bgColor: "bg-blue-500/10", icon: RefreshCw },
    sparepart_deleted: { color: "text-red-500", bgColor: "bg-red-500/10", icon: Archive },
    system: { color: "text-primary", bgColor: "bg-primary/10", icon: Settings },
    info: { color: "text-blue-500", bgColor: "bg-blue-500/10", icon: Info },
    success: { color: "text-green-500", bgColor: "bg-green-500/10", icon: CheckCircle },
    warning: { color: "text-yellow-500", bgColor: "bg-yellow-500/10", icon: AlertTriangle },
    error: { color: "text-red-500", bgColor: "bg-red-500/10", icon: XCircle },
  };
  
  return styles[type] || styles.info;
}
