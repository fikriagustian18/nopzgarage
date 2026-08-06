import { 
  Archive,
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  FileText, 
  Info, 
  Package, 
  Plus, 
  RefreshCw, 
  Settings, 
  User, 
  UserMinus, 
  UserPlus, 
  XCircle 
} from "lucide-react";

/**
 * Category types supported by the notification system.
 */
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

/**
 * Interface representing a notification object structure.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, unknown>;
  actor?: string;
}

/**
 * Visual style definition mapping icon and colors for notification types.
 */
export interface NotificationStyle {
  color: string;
  bgColor: string;
  icon: typeof Package;
}

const STORAGE_KEY = "nopzgarage_notifications";
const READ_STORAGE_KEY = "nopzgarage_read_notifications";
const MAX_NOTIFICATIONS = 50;

/**
 * Retrieves the list of read notification IDs from local storage.
 *
 * @returns Array of notification ID strings that have been marked as read.
 */
export function getReadNotificationIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem(READ_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Fetches all notifications stored in local storage with updated read status.
 *
 * @returns Array of stored Notification objects.
 */
export function getNotifications(): Notification[] {
  if (typeof window === "undefined") {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const readIds = getReadNotificationIds();
    const notifications = JSON.parse(stored) as Notification[];
    return notifications.map((notification) => ({
      ...notification,
      read: notification.read || readIds.includes(notification.id),
      timestamp: new Date(notification.timestamp),
    }));
  } catch {
    return [];
  }
}

/**
 * Creates and stores a new notification, dispatching a window event.
 *
 * @param type - Category of notification.
 * @param title - Title text of notification.
 * @param message - Body message content.
 * @param metadata - Additional contextual data.
 * @returns The newly created Notification object.
 */
export function addNotification(
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Notification {
  const notification: Notification = {
    id: crypto.randomUUID(),
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
    metadata,
  };

  const notifications = getNotifications();
  notifications.unshift(notification);
  
  const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    window.dispatchEvent(
      new CustomEvent("notification-added", { detail: notification })
    );
  }

  return notification;
}

/**
 * Marks a single notification as read by its unique ID.
 *
 * @param id - Unique notification ID.
 */
export function markAsRead(id: string): void {
  if (typeof window !== "undefined") {
    try {
      const readIds = getReadNotificationIds();
      if (!readIds.includes(id)) {
        readIds.push(id);
        const trimmed = readIds.slice(-200);
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(trimmed));
      }
    } catch (error) {
      console.error("Failed to save read notification status", error);
    }
  }

  const notifications = getNotifications();
  const updated = notifications.map((notification) => 
    notification.id === id ? { ...notification, read: true } : notification
  );
  
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save notifications", error);
    }
  }
}

/**
 * Marks all notifications or specified IDs as read.
 *
 * @param ids - Optional array of specific notification IDs to mark as read.
 */
export function markAllAsRead(ids?: string[]): void {
  if (typeof window !== "undefined") {
    try {
      const readIds = getReadNotificationIds();
      const newReadIds = Array.from(new Set([...readIds, ...(ids || [])]));
      const trimmed = newReadIds.slice(-200);
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  }

  const notifications = getNotifications();
  const updated = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));
  
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save notifications", error);
    }
  }
}

/**
 * Clears all notification data from local storage.
 */
export function clearNotifications(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(READ_STORAGE_KEY);
  }
}

/**
 * Calculates the number of unread notifications.
 *
 * @param notifications - Optional custom array of notifications to count.
 * @returns Count of unread items.
 */
export function getUnreadCount(notifications?: Notification[]): number {
  if (notifications) {
    return notifications.filter((notification) => !notification.read).length;
  }
  return getNotifications().filter((notification) => !notification.read).length;
}

/**
 * Returns visual styling props (color, background, icon) for a notification type.
 *
 * @param type - Category of the notification.
 * @returns NotificationStyle object with color classes and icon component.
 */
export function getNotificationStyle(type: NotificationType): NotificationStyle {
  const styles: Record<NotificationType, NotificationStyle> = {
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

