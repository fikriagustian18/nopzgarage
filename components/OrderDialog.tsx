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
import { createOrder, updateOrder } from "@/app/actions/orders";
import { getContent } from "@/app/actions/content"; // Added import
import { toast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";
import { notifyOrderCreated, notifyOrderUpdated } from "@/hooks/useNotification";

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

export function OrderDialog({
  open,
  onOpenChange,
  mode,
  order,
  onSuccess,
}: OrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]); // Added state
  const [formData, setFormData] = useState({
    custName: "",
    custPhone: "",
    vehicle: "",
    plateNumber: "",
    complaint: "",
    serviceType: "LIGHT_SERVICE" as ServiceType,
  });

  // Fetch Services from Website Content
  useEffect(() => {
    const fetchServices = async () => {
      const result = await getContent('services');
      if (result.success && result.data && result.data.content && Array.isArray((result.data.content as any).items)) {
        setServices((result.data.content as any).items);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (order && mode !== "create") {
      setFormData({
        custName: order.custName,
        custPhone: order.custPhone,
        vehicle: order.vehicle,
        plateNumber: order.plateNumber || "",
        complaint: order.complaint,
        serviceType: order.serviceType,
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
    }
  }, [order, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
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
                onValueChange={(serviceId) => {
                  const service = services.find((s) => s.id === serviceId);
                  if (service) {
                    setFormData(prev => ({
                      ...prev,
                      serviceType: (service.serviceType as ServiceType) || "LIGHT_SERVICE",
                      // Prepend service name to complaint if not already present
                      complaint: prev.complaint.includes(`[Layanan: ${service.title}]`) 
                        ? prev.complaint 
                        : `[Layanan: ${service.title}]\n${prev.complaint}`
                    }));
                  }
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger className={isReadOnly ? "bg-gray-50" : ""}>
                  <SelectValue placeholder="Pilih dari daftar layanan..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title} ({service.serviceType === 'MODIFICATION' ? 'Modifikasi' : 'Ringan'})
                    </SelectItem>
                  ))}
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
