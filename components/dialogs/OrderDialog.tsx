// components/OrderDialog.tsx
"use client";

import { useState, useEffect } from "react";
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
import { ServiceType } from "@prisma/client";
import { createOrder, updateOrder } from "@/lib/actions/orders";
import { getContent } from "@/lib/actions/content"; // Added import
import { toast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";
import { notifyOrderCreated, notifyOrderUpdated } from "@/hooks/useNotification";

import { DEFAULT_SERVICES } from "@/lib/constants/serviceDefaults";

type OrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "view";
  order?: {
    id: string;
    custName: string;
    custPhone: string;
    vehicle: string;
    plateNumber: string | null;
    complaint: string;
    serviceType: ServiceType;
  };
  onSuccess?: () => void;
};

// Helper: Extract service title from complaint e.g. "[Layanan: Fast Lane Service]\nKeluhan..."
function extractServiceTitle(complaint: string): string | null {
  if (!complaint) return null;
  const match = complaint.match(/^\[Layanan:\s*([^\]]+)\]/m);
  return match ? match[1].trim() : null;
}

// Helper: Add, update or remove [Layanan: ...] header in complaint string cleanly
function formatComplaintWithService(complaint: string, serviceTitle: string | null): string {
  const clean = complaint.replace(/^\[Layanan:\s*[^\]]+\]\s*/g, "").trim();
  if (!serviceTitle) return clean;
  return clean ? `[Layanan: ${serviceTitle}]\n${clean}` : `[Layanan: ${serviceTitle}]`;
}

export function OrderDialog({
  open,
  onOpenChange,
  mode,
  order,
  onSuccess,
}: OrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]); 
  const [selectedServiceId, setSelectedServiceId] = useState<string>("NONE");
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
      const result = await getContent('services');
      if (result.success && result.data && result.data.content && Array.isArray((result.data.content as any).items) && (result.data.content as any).items.length > 0) {
        setServices((result.data.content as any).items);
      } else {
        setServices(DEFAULT_SERVICES);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (open) {
      if (order && mode !== "create") {
        const initialComplaint = order.complaint || "";
        setFormData({
          custName: order.custName || "",
          custPhone: order.custPhone || "",
          vehicle: order.vehicle || "",
          plateNumber: order.plateNumber || "",
          complaint: initialComplaint,
          serviceType: order.serviceType || "LIGHT_SERVICE",
        });

        const extractedTitle = extractServiceTitle(initialComplaint);
        if (extractedTitle) {
          const matched = services.find(
            (s) => s.title?.toLowerCase() === extractedTitle.toLowerCase() || s.id === extractedTitle
          );
          setSelectedServiceId(matched ? matched.id : `custom-${extractedTitle}`);
        } else {
          setSelectedServiceId("NONE");
        }
      } else {
        setFormData({
          custName: "",
          custPhone: "",
          vehicle: "",
          plateNumber: "",
          complaint: "",
          serviceType: "LIGHT_SERVICE",
        });
        setSelectedServiceId("NONE");
      }
    }
  }, [order, mode, open, services]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === "NONE" || !serviceId) {
      setFormData((prev) => ({
        ...prev,
        complaint: formatComplaintWithService(prev.complaint, null),
      }));
      return;
    }

    let selectedService = services.find((s) => s.id === serviceId);
    let title = selectedService?.title;
    let sType = selectedService?.serviceType;

    if (!selectedService && serviceId.startsWith("custom-")) {
      title = serviceId.replace("custom-", "");
    }

    if (title) {
      setFormData((prev) => ({
        ...prev,
        serviceType: (sType as ServiceType) || prev.serviceType || "LIGHT_SERVICE",
        complaint: formatComplaintWithService(prev.complaint, title),
      }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (mode === "view") return;

    setLoading(true);

    try {
      let result;
      
      if (mode === "create") {
        result = await createOrder({
          ...formData,
          plateNumber: formData.plateNumber || undefined,
        });
      } else {
        result = await updateOrder(order!.id, {
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
        if (onSuccess) onSuccess();
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
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === "create" && " Buat Order Baru"}
            {mode === "edit" && "Edit Order"}
            {mode === "view" && "Detail Order"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" && "Buat order servis baru untuk pelanggan"}
            {mode === "edit" && "Update informasi order pelanggan"}
            {mode === "view" && "Informasi detail order pelanggan"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Informasi Pelanggan */}
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
                  disabled={isReadOnly}
                  className={isReadOnly ? "bg-gray-50" : ""}
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
                  disabled={isReadOnly}
                  className={isReadOnly ? "bg-gray-50" : ""}
                />
              </div>
            </div>
          </div>

          {/* Informasi Kendaraan */}
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
                  disabled={isReadOnly}
                  className={isReadOnly ? "bg-gray-50" : ""}
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
                  disabled={isReadOnly}
                  className={isReadOnly ? "bg-gray-50" : ""}
                />
              </div>
            </div>
          </div>

          {/* Detail Servis */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
               Detail Servis
            </h3>
            
            {/* Paket Layanan (Dynamic from Website Content) */}
            <div className="space-y-2">
              <Label>Pilih Paket Layanan (Opsional)</Label>
              <Select
                value={selectedServiceId}
                onValueChange={handleServiceSelect}
                disabled={isReadOnly}
              >
                <SelectTrigger className={isReadOnly ? "bg-gray-50" : ""}>
                  <SelectValue placeholder="Pilih dari daftar layanan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">-- Tidak Pilih Paket --</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title} ({service.serviceType === 'MODIFICATION' ? 'Modifikasi' : 'Ringan'})
                    </SelectItem>
                  ))}
                  {selectedServiceId && selectedServiceId.startsWith("custom-") && !services.some(s => s.id === selectedServiceId) && (
                    <SelectItem value={selectedServiceId}>
                      {selectedServiceId.replace("custom-", "")}
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
                disabled={isReadOnly}
              >
                <SelectTrigger className={isReadOnly ? "bg-gray-50" : ""}>
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
                disabled={isReadOnly}
                className={`min-h-[120px] ${isReadOnly ? "bg-gray-50" : ""}`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {!isReadOnly && (
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
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
