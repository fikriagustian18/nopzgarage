"use client";

import { useCallback } from "react";
import { addNotification, type NotificationType } from "@/lib/notifications";

export function useNotification() {
  const notify = useCallback(
    (type: NotificationType, title: string, message: string, metadata?: Record<string, unknown>) => {
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

export function notifyOrderCancelled(customerName: string, orderId: string) {
  addNotification(
    "order_updated",
    "Booking Dibatalkan",
    `Booking untuk ${customerName} telah dibatalkan`,
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
