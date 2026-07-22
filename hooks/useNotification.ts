// hooks/useNotification.ts
"use client";

import { addNotification, type NotificationType } from "@/lib/notifications";
import { useCallback } from "react";

export function useNotification() {
  const notify = useCallback(
    (type: NotificationType, title: string, message: string, metadata?: Record<string, any>) => {
      addNotification(type, title, message, metadata);
    },
    []
  );

  return { notify };
}

// Convenience wrapper functions for common notification types
export function notifyOrderCreated(customerName: string, orderId: string) {
  addNotification(
    "order_created",
    "Order Baru Dibuat",
    `Order untuk ${customerName} berhasil dibuat`,
    { orderId }
  );
}

export function notifyOrderUpdated(customerName: string, orderId: string, status?: string) {
  addNotification(
    "order_updated",
    "Order Diperbarui",
    status 
      ? `Order ${customerName} status berubah ke ${status}` 
      : `Order ${customerName} berhasil diperbarui`,
    { orderId, status }
  );
}

export function notifyOrderCompleted(customerName: string, orderId: string) {
  addNotification(
    "order_completed",
    "Order Selesai",
    `Order untuk ${customerName} telah selesai`,
    { orderId }
  );
}

export function notifyOrderDeleted(customerName: string, orderId: string) {
  addNotification(
    "system", // or create a specific type if needed, but 'system' or 'warning' might fit. Let's stick to system for now or create a new type if strictly needed. Actually 'system' is fine, or reusing 'order_updated' type with a delete message. 
    // Let's use 'order_updated' type but with a delete title, or better, add 'order_deleted' type to notifications.ts if I could, but for now I'll use 'system' or existing types.
    // Wait, notifications.ts has: "order_created" | "order_updated" | "order_completed" ... and "employee_deleted".
    // It doesn't have "order_deleted". I should probably add it or just use "system".
    // I'll use "system" for now to avoid modifying the type definition file again if not strictly necessary, or I can use "info".
    // Actually, let's use "warning" for deletion.
    "Order Dihapus",
    `Order untuk ${customerName} telah dihapus dari sistem`,
    { orderId }
  );
}

export function notifyEmployeeCreated(employeeName: string, employeeId: string) {
  addNotification(
    "employee_created",
    "Karyawan Baru",
    `Karyawan ${employeeName} berhasil ditambahkan`,
    { employeeId }
  );
}

export function notifyEmployeeUpdated(employeeName: string, employeeId: string) {
  addNotification(
    "employee_updated",
    "Karyawan Diperbarui",
    `Data karyawan ${employeeName} berhasil diperbarui`,
    { employeeId }
  );
}

export function notifyEmployeeDeleted(employeeName: string, employeeId: string) {
  addNotification(
    "employee_deleted",
    "Karyawan Dinonaktifkan",
    `Karyawan ${employeeName} telah dinonaktifkan`,
    { employeeId }
  );
}

export function notifyPaymentReceived(customerName: string, amount: number, orderId: string) {
  addNotification(
    "payment_received",
    "Pembayaran Diterima",
    `Pembayaran Rp ${amount.toLocaleString("id-ID")} dari ${customerName}`,
    { orderId, amount }
  );
}

export function notifySparepartAdded(sparepartName: string, sparepartId: string) {
  addNotification(
    "sparepart_added",
    "Sparepart Ditambah",
    `Sparepart ${sparepartName} berhasil ditambahkan ke katalog`,
    { sparepartId }
  );
}

export function notifySparepartUpdated(sparepartName: string, sparepartId: string) {
  addNotification(
    "sparepart_updated",
    "Sparepart Diperbarui",
    `Data sparepart ${sparepartName} berhasil diperbarui`,
    { sparepartId }
  );
}

export function notifySparepartDeleted(sparepartName: string, sparepartId: string) {
  addNotification(
    "sparepart_deleted",
    "Sparepart Dihapus",
    `Sparepart ${sparepartName} telah dihapus dari katalog`,
    { sparepartId }
  );
}

export function notifySystem(title: string, message: string) {
  addNotification("system", title, message);
}

export function notifyInfo(title: string, message: string) {
  addNotification("info", title, message);
}

export function notifyWarning(title: string, message: string) {
  addNotification("warning", title, message);
}

export function notifyError(title: string, message: string) {
  addNotification("error", title, message);
}
