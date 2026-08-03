"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ServiceType } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

import { createOrder, updateOrder } from "@/lib/actions/orders";
import { getContent } from "@/lib/actions/content";
import { toast } from "@/hooks/useToast";
import { notifyOrderCreated, notifyOrderUpdated } from "@/hooks/useNotification";
import { DEFAULT_SERVICES, type DefaultService } from "@/lib/constants/serviceDefaults";
import { formatDetailDate, formatOrderNo } from "@/lib/utils";

interface OrderItemData {
  id: string;
  custName: string;
  custPhone?: string;
  vehicle: string;
  plateNumber: string | null;
  complaint?: string;
  serviceType?: ServiceType;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  scheduledAt?: string | Date | null;
  mechanic?: {
    id?: string;
    name: string;
    role?: string;
  } | null;
}

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "view";
  order?: OrderItemData;
  onSuccess?: () => void;
}

interface ServiceContentData {
  items?: DefaultService[];
}

interface OrderActionResult {
  success: boolean;
  error?: string;
  order?: {
    id: string;
  };
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
  align?: "center" | "start";
}

const SERVICE_HEADER_REGEX = /^\[Layanan:\s*([^\]]+)\]/m;
const CUSTOM_PREFIX = "custom-";
const NO_SERVICE = "NONE";

export function OrderDialog({
  open,
  onOpenChange,
  mode,
  order,
  onSuccess,
}: OrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<DefaultService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(NO_SERVICE);
  const [formData, setFormData] = useState({
    custName: "",
    custPhone: "",
    vehicle: "",
    plateNumber: "",
    complaint: "",
    serviceType: "LIGHT_SERVICE" as ServiceType,
  });

  // Fetch Services from Website Content (with fallback to DEFAULT_SERVICES)
  useEffect(() => {
    const fetchServices = async () => {
      const result = await getContent("services");
      const content = result.data?.content as ServiceContentData | undefined;

      if (result.success && content?.items && Array.isArray(content.items) && content.items.length > 0) {
        setServices(content.items);
      } else {
        setServices(DEFAULT_SERVICES);
      }
    };
    fetchServices();
  }, []);

  // Reset form when dialog opens or order/mode changes (NOT when services load)
  useEffect(() => {
    if (!open) {
      return;
    }

    if (order && mode !== "create") {
      setFormData({
        custName: order.custName || "",
        custPhone: order.custPhone || "",
        vehicle: order.vehicle || "",
        plateNumber: order.plateNumber || "",
        complaint: order.complaint || "",
        serviceType: order.serviceType || "LIGHT_SERVICE",
      });
    } else {
      setFormData({
        custName: "",
        custPhone: "",
        vehicle: "",
        plateNumber: "",
        complaint: "",
        serviceType: "LIGHT_SERVICE",
      });
      setSelectedServiceId(NO_SERVICE);
    }
  }, [order, mode, open]);

  // Sync selectedServiceId when services are loaded or order changes
  useEffect(() => {
    if (!open || !order || mode === "create" || services.length === 0) {
      return;
    }

    const extractedTitle = extractServiceTitle(order.complaint || "");
    if (extractedTitle) {
      const matched = services.find(
        (s) => s.title?.toLowerCase() === extractedTitle.toLowerCase() || s.id === extractedTitle
      );
      setSelectedServiceId(matched ? matched.id : `${CUSTOM_PREFIX}${extractedTitle}`);
    } else {
      setSelectedServiceId(NO_SERVICE);
    }
  }, [order, mode, open, services]);

  const handleServiceSelect = useCallback((serviceId: string) => {
    setSelectedServiceId(serviceId);

    if (serviceId === NO_SERVICE || !serviceId) {
      setFormData((prev) => ({
        ...prev,
        complaint: formatComplaintWithService(prev.complaint, null),
      }));
      return;
    }

    const selectedService = services.find((s) => s.id === serviceId);
    const title = selectedService?.title
      ?? (serviceId.startsWith(CUSTOM_PREFIX) ? serviceId.slice(CUSTOM_PREFIX.length) : undefined);
    const serviceType = selectedService?.serviceType;

    if (title) {
      setFormData((prev) => ({
        ...prev,
        serviceType: (serviceType as ServiceType) || prev.serviceType || "LIGHT_SERVICE",
        complaint: formatComplaintWithService(prev.complaint, title),
      }));
    }
  }, [services]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (mode === "view") {
      return;
    }

    setLoading(true);

    try {
      let result: OrderActionResult;
      
      if (mode === "create") {
        result = await createOrder({
          ...formData,
          plateNumber: formData.plateNumber || undefined,
        });
      } else {
        if (!order) {
          setLoading(false);
          return;
        }
        result = await updateOrder(order.id, {
          ...formData,
          plateNumber: formData.plateNumber || undefined,
        });
      }

      if (result.success) {
        toast({
          title: "✅ Berhasil!",
          description: mode === "create" 
            ? "Order berhasil dibuat" 
            : "Order berhasil diupdate",
        });
        
        // Add notification
        if (mode === "create" && result.order) {
          notifyOrderCreated(formData.custName, result.order.id);
        } else if (mode === "edit" && order) {
          notifyOrderUpdated(formData.custName, order.id);
        }
        
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: result.error || "Terjadi kesalahan",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan pada sistem",
      });
    } finally {
      setLoading(false);
    }
  }

  if (mode === "view" && order) {
    const orderId = formatOrderNo(order.id);
    const statusText = getStatusBadgeText(order.status);
    const isFinished = ["READY", "COMPLETED"].includes(order.status || "");

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0 border rounded-2xl overflow-hidden">
          {/* Card Header matching mock */}
          <div className="p-5 border-b border-border bg-card flex justify-between items-center">
            <h2 className="text-base font-extrabold tracking-wider text-foreground uppercase">
              DETAIL ORDER
            </h2>
          </div>

          <div className="p-6 space-y-6 bg-card">
            {/* 2 Column Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-sm">
              {/* Left Column */}
              <div className="space-y-3.5">
                <DetailRow label="No. Order">
                  <span className="font-bold text-foreground">{orderId}</span>
                </DetailRow>
                <DetailRow label="Pelanggan">
                  <span className="font-bold text-foreground">{order.custName || "-"}</span>
                </DetailRow>
                <DetailRow label="No. Polisi">
                  <span className="font-bold text-foreground uppercase">{order.plateNumber || "-"}</span>
                </DetailRow>
                <DetailRow label="Kendaraan">
                  <span className="font-bold text-foreground">{order.vehicle || "-"}</span>
                </DetailRow>
                <DetailRow label="Tanggal Order">
                  <span className="font-bold text-foreground">{formatDetailDate(order.createdAt)}</span>
                </DetailRow>
              </div>

              {/* Right Column */}
              <div className="space-y-3.5">
                <DetailRow label="Mekanik">
                  <span className="font-bold text-foreground">{order.mechanic?.name || "-"}</span>
                </DetailRow>
                <DetailRow label="Status Terakhir">
                  <div>
                    <span className="px-3 py-1 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold text-xs inline-block">
                      {statusText}
                    </span>
                  </div>
                </DetailRow>
                <DetailRow label="Estimasi Selesai">
                  <span className="font-bold text-foreground">{formatDetailDate(order.scheduledAt || order.createdAt)}</span>
                </DetailRow>
                <DetailRow label="Selesai">
                  <span className="font-bold text-foreground">
                    {isFinished ? formatDetailDate(order.updatedAt) : "-"}
                  </span>
                </DetailRow>
              </div>
            </div>

            {/* Complaint / Catatan if present */}
            {order.complaint && (
              <div className="pt-4 border-t border-border text-sm">
                <DetailRow label="Keluhan / Catatan" align="start">
                  <span className="font-medium text-foreground leading-relaxed whitespace-pre-line">
                    {order.complaint}
                  </span>
                </DetailRow>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-4 border-t border-border flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="px-6 font-semibold"
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === "create" ? "Buat Order Baru" : "Edit Order"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Buat order servis baru untuk pelanggan" : "Update informasi order pelanggan"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
               Informasi Pelanggan
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custName">
                  Nama Pelanggan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custName"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.custName}
                  onChange={(e) =>
                    setFormData({ ...formData, custName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custPhone">
                  No. Telepon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custPhone"
                  type="tel"
                  placeholder="08123456789"
                  value={formData.custPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, custPhone: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              Informasi Kendaraan
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">
                  Jenis Kendaraan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicle"
                  placeholder="Contoh: Honda Vario 150"
                  value={formData.vehicle}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicle: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plateNumber">Nomor Plat</Label>
                <Input
                  id="plateNumber"
                  placeholder="B1234XYZ"
                  value={formData.plateNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, plateNumber: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
               Detail Servis
            </h3>
            
            {/* Service Package (Dynamic from Website Content) */}
            <div className="space-y-2">
              <Label>Pilih Paket Layanan (Opsional)</Label>
              <Select
                value={selectedServiceId}
                onValueChange={handleServiceSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dari daftar layanan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SERVICE}>-- Tidak Pilih Paket --</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title} ({service.serviceType === "MODIFICATION" ? "Modifikasi" : "Ringan"})
                    </SelectItem>
                  ))}
                  {selectedServiceId.startsWith(CUSTOM_PREFIX) && !services.some((s) => s.id === selectedServiceId) && (
                    <SelectItem value={selectedServiceId}>
                      {selectedServiceId.slice(CUSTOM_PREFIX.length)}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">
                Jenis Servis <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value: ServiceType) =>
                  setFormData({ ...formData, serviceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis servis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT_SERVICE">
                    Servis Ringan (Fast Lane)
                  </SelectItem>
                  <SelectItem value="MODIFICATION">
                     Modifikasi (Project Lane)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaint">
                Keluhan / Catatan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="complaint"
                placeholder="Deskripsikan keluhan atau pekerjaan yang perlu dilakukan..."
                value={formData.complaint}
                onChange={(e) =>
                  setFormData({ ...formData, complaint: e.target.value })
                }
                required
                className="min-h-[120px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "create" ? "Buat Order" : "Simpan Perubahan"}
              </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Reusable row component for detail view grids */
function DetailRow({ label, children, align = "center" }: DetailRowProps) {
  return (
    <div className={`grid grid-cols-[130px_16px_1fr] items-${align}`}>
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-muted-foreground font-medium">:</span>
      {children}
    </div>
  );
}

function getStatusBadgeText(status?: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "Pending",
    ESTIMATED: "Diestimasi",
    CONFIRMED: "Menunggu Servis",
    QUEUE: "Dalam Antrian",
    IN_PROGRESS: "Diproses",
    READY: "Siap Diambil",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return status ? (statusMap[status] || status) : "-";
}

/** Extract service title from complaint e.g. "[Layanan: Fast Lane Service]\nKeluhan..." */
function extractServiceTitle(complaint: string): string | null {
  if (!complaint) {
    return null;
  }
  const match = complaint.match(SERVICE_HEADER_REGEX);
  return match ? match[1].trim() : null;
}

/** Add, update or remove [Layanan: ...] header in complaint string */
function formatComplaintWithService(complaint: string, serviceTitle: string | null): string {
  // Remove existing header (always at the start, possibly followed by whitespace/newline)
  const clean = complaint.replace(/^\[Layanan:\s*[^\]]+\]\s*/m, "").trim();
  if (!serviceTitle) {
    return clean;
  }
  return clean ? `[Layanan: ${serviceTitle}]\n${clean}` : `[Layanan: ${serviceTitle}]`;
}

