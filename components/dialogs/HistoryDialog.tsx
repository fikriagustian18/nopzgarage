// components/dialogs/HistoryDialog.tsx — Order Progress History Timeline
"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Clock,
  Wrench,
  CreditCard,
  CheckCircle,
  User,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { getOrderHistory } from "@/lib/actions/orders";
import { formatOrderNo } from "@/lib/utils";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    custName: string;
    vehicle: string;
    plateNumber: string | null;
    status: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    scheduledAt: string | null;
    mechanic?: {
      name: string;
    } | null;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  title: string;
  details: string;
  metadata: Record<string, unknown> | null;
  userName: string | null;
  role: string | null;
  createdAt: string | Date;
}

interface TimelineStep {
  title: string;
  description: string;
  badge: "Menunggu" | "Proses" | "Selesai";
  operator: string;
  time: string | Date | null;
  active: boolean;
  icon: LucideIcon;
}

export function HistoryDialog({ open, onOpenChange, order }: HistoryDialogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && order?.id) {
      fetchLogs();
    }
  }, [open, order?.id]);

  async function fetchLogs() {
    setIsLoading(true);
    try {
      const res = await getOrderHistory(order.id);
      if (res.success && res.logs) {
        setLogs(res.logs as ActivityLog[]);
      }
    } catch (err) {
      console.error("Gagal memuat log riwayat order:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Define steps dynamically based on order & logs
  // 1. Waiting for Service
  const bookingLog = logs.find((l) => l.action === "CREATE_BOOKING");
  const step1: TimelineStep = {
    title: "Menunggu Servis",
    description: "Order diterima dan menunggu antrian servis.",
    badge: "Menunggu",
    operator: bookingLog?.userName
      ? `${bookingLog.userName} (${bookingLog.role === "GUEST" ? "Pelanggan" : bookingLog.role || "Admin"})`
      : "Admin",
    time: bookingLog ? bookingLog.createdAt : order.createdAt,
    active: true,
    icon: ClipboardList,
  };

  // 2. Queueing
  const confirmLog = logs.find(
    (l) =>
      l.action === "CONFIRM_ORDER" ||
      (l.action === "UPDATE_STATUS" && l.metadata?.status === "CONFIRMED") ||
      (l.action === "UPDATE_STATUS" && l.metadata?.status === "QUEUE")
  );
  const hasAntrean = [
    "CONFIRMED",
    "QUEUE",
    "ESTIMATED",
    "IN_PROGRESS",
    "READY",
    "COMPLETED",
  ].includes(order.status);
  const step2: TimelineStep = {
    title: "Masuk Antrian",
    description: "Order masuk ke dalam antrian pengerjaan.",
    badge: "Proses",
    operator: confirmLog?.userName
      ? `${confirmLog.userName} (${confirmLog.role || "Admin"})`
      : "Admin",
    time: confirmLog
      ? confirmLog.createdAt
      : hasAntrean
      ? order.scheduledAt || order.createdAt
      : null,
    active: hasAntrean,
    icon: Clock,
  };

  // 3. In Progress
  const processLog = logs.find(
    (l) =>
      l.action === "PROCESS_ORDER" ||
      (l.action === "UPDATE_STATUS" && l.metadata?.status === "IN_PROGRESS")
  );
  const hasInProgress = ["IN_PROGRESS", "READY", "COMPLETED"].includes(order.status);
  const step3: TimelineStep = {
    title: "Sedang Dikerjakan",
    description: "Mekanik sedang melakukan pengerjaan servis.",
    badge: "Proses",
    operator: processLog?.userName
      ? `${processLog.userName} (${processLog.role || "Admin"})`
      : order.mechanic?.name
      ? `${order.mechanic.name} (Mekanik)`
      : "Mekanik",
    time: processLog
      ? processLog.createdAt
      : hasInProgress
      ? order.scheduledAt || order.updatedAt
      : null,
    active: hasInProgress,
    icon: Wrench,
  };

  // 4. Payment Events & Waiting for Payment
  const paymentLogs = logs.filter(
    (l) =>
      l.action === "CREATE_PAYMENT" ||
      l.action === "PAYMENT_RECEIVED" ||
      (l.action === "UPDATE_STATUS" && l.metadata?.paymentStatus === "PAID")
  );
  const paymentLog = paymentLogs[paymentLogs.length - 1];
  const isPaid = order.paymentStatus === "PAID";
  const isPartial = order.paymentStatus === "PARTIAL";
  const finishLog = logs.find(
    (l) =>
      l.action === "FINISH_ORDER" ||
      (l.action === "UPDATE_STATUS" && l.metadata?.status === "READY")
  );
  const hasReady = ["READY", "COMPLETED"].includes(order.status);

  // 4a. Unpaid - Waiting for Payment Step (only if NOT paid)
  const stepWaitingPayment: TimelineStep = {
    title: "Menunggu Pembayaran",
    description: "Servis selesai, menunggu konfirmasi pembayaran.",
    badge: "Menunggu",
    operator: finishLog?.userName
      ? `${finishLog.userName} (${finishLog.role || "Admin"})`
      : order.mechanic?.name
      ? `${order.mechanic.name} (Mekanik)`
      : "Mekanik",
    time: finishLog ? finishLog.createdAt : hasReady ? order.updatedAt : null,
    active: order.paymentStatus === "UNPAID" && hasReady,
    icon: CreditCard,
  };

  const stepPartialPayment: TimelineStep = {
    title: "Pembayaran Sebagian",
    description: "Sebagian pembayaran telah diterima. Masih terdapat sisa tagihan.",
    badge: "Proses",
    operator: paymentLog?.userName
      ? `${paymentLog.userName} (${paymentLog.role || "Admin"})`
      : "Admin",
    time: paymentLog ? paymentLog.createdAt : isPartial ? order.updatedAt : null,
    active: isPartial,
    icon: CreditCard,
  };

  // 4b. Paid - Payment Received Step
  const stepPaid: TimelineStep = {
    title: "Pembayaran Diterima",
    description: "Pembayaran telah berhasil diterima dan diverifikasi.",
    badge: "Selesai",
    operator: paymentLog?.userName
      ? `${paymentLog.userName} (${paymentLog.role || "Admin"})`
      : "Admin",
    time: paymentLog ? paymentLog.createdAt : isPaid ? order.updatedAt : null,
    active: isPaid,
    icon: CreditCard,
  };

  // 5. Ready for Pickup / Ready for Handover Step
  const isReadyForPickup = (order.status === "READY" && isPaid) || order.status === "COMPLETED";
  const stepReadyForPickup: TimelineStep = {
    title: "Siap Diambil",
    description: "Pengerjaan selesai dan pembayaran lunas. Kendaraan siap diserahkan kepada pelanggan.",
    badge: order.status === "COMPLETED" ? "Selesai" : "Proses",
    operator: finishLog?.userName
      ? `${finishLog.userName} (${finishLog.role || "Admin"})`
      : "Admin",
    time: finishLog ? finishLog.createdAt : isReadyForPickup ? order.updatedAt : null,
    active: isReadyForPickup,
    icon: CheckCircle,
  };

  // 6. Completed / Handover Done
  const closeLog = logs.find(
    (l) =>
      l.action === "CLOSE_ORDER" ||
      (l.action === "UPDATE_STATUS" && l.metadata?.status === "COMPLETED")
  );
  const hasCompleted = order.status === "COMPLETED";
  const stepCompleted: TimelineStep = {
    title: "Selesai & Diserahkan",
    description: "Kendaraan telah diserahkan kepada pelanggan dan servis selesai.",
    badge: "Selesai",
    operator: closeLog?.userName
      ? `${closeLog.userName} (${closeLog.role || "Admin"})`
      : "Admin",
    time: closeLog ? closeLog.createdAt : hasCompleted ? order.updatedAt : null,
    active: hasCompleted,
    icon: CheckCircle,
  };

  // Filter and order active steps (descending - newest first)
  const candidateSteps = [
    stepCompleted,
    stepReadyForPickup,
    stepPaid,
    stepPartialPayment,
    stepWaitingPayment,
    step3,
    step2,
    step1,
  ];
  const activeSteps = candidateSteps.filter((s) => s.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground uppercase">
            Riwayat Perkembangan Order
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Memuat riwayat order...</p>
          </div>
        ) : (
          <div className="py-2 pr-2">
            {/* Header info */}
            <div className="mb-6 p-4 bg-muted/40 border border-border/60 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Kendaraan</div>
                <div className="text-base font-bold text-foreground mt-0.5">{order.vehicle}</div>
                {order.plateNumber && (
                  <div className="text-xs font-semibold text-muted-foreground uppercase font-mono mt-0.5">{order.plateNumber}</div>
                )}
              </div>
              <div className="sm:text-right">
                <div className="text-xs text-muted-foreground font-semibold uppercase">Pelanggan</div>
                <div className="text-base font-bold text-foreground mt-0.5">{order.custName}</div>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">{formatOrderNo(order.id)}</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-1">
              {/* Vertical line connecting centers of circles */}
              {activeSteps.length > 1 && (
                <div className="absolute left-[20px] top-[20px] bottom-[20px] w-[2px] bg-border" />
              )}

              <div className="space-y-6">
                {activeSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isLatest = idx === 0;
                  return (
                    <div key={idx} className="relative flex gap-6">
                      {/* Icon circle */}
                      <div
                        className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center shadow-sm transition-colors ${
                          isLatest
                            ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content Card */}
                      <div className="relative flex-1 bg-card border border-border rounded-xl p-4 shadow-sm">
                        {/* Triangle pointer pointing left */}
                        <div className="absolute -left-2 top-[12px] w-4 h-4 bg-card border-l border-b border-border rotate-45 z-0" />

                        {/* Card Header */}
                        <div className="flex justify-between items-center gap-2 mb-1.5 relative z-10">
                          <h4 className="font-bold text-foreground text-sm sm:text-base">
                            {step.title}
                          </h4>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeStyle(
                              step.badge
                            )}`}
                          >
                            {step.badge}
                          </span>
                        </div>

                        {/* Card Description */}
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed relative z-10">
                          {step.description}
                        </p>

                        {/* Card Footer */}
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border/40 text-xs text-muted-foreground relative z-10">
                          <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{step.operator}</span>
                          </div>
                          <span className="font-semibold text-muted-foreground">
                            {formatDateTime(step.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== Helper Functions ====================

/**
 * Formats a date input into "DD Month YYYY, HH:MM" format.
 * 
 * @param {string | Date | null} dateInput - Date value.
 * @returns {string} Formatted date.
 */
function formatDateTime(dateInput: string | Date | null): string {
  if (!dateInput) {
    return "-";
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return "-";
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Gets CSS class styles for timeline badge type.
 * 
 * @param {"Menunggu" | "Proses" | "Selesai"} badge - Timeline badge name.
 * @returns {string} Class style.
 */
function getBadgeStyle(badge: TimelineStep["badge"]): string {
  switch (badge) {
    case "Selesai":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "Proses":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "Menunggu":
    default:
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }
}

