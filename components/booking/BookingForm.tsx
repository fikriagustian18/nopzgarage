"use client";

import { useState } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CheckCircle2, 
  Loader2, 
  Copy,
  Check,
  User, 
  Phone, 
  Bike, 
  PenTool, 
  Wrench, 
  CalendarCheck, 
  Zap, 
  Star 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { createBooking } from "@/lib/actions/orders";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatWhatsAppNumber, formatOrderNo } from "@/lib/utils";
import { 
  DEFAULT_SERVICE_OPTIONS, 
  DefaultServiceOption 
} from "@/lib/constants/serviceDefaults";

const bookingSchema = z.object({
  custName: z.string().min(3, "Nama minimal 3 karakter"),
  custPhone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .regex(/^[0-9+]+$/, "Hanya angka dan tanda +"),
  vehicle: z.string().min(3, "Merk/tipe kendaraan minimal 3 karakter"),
  plateNumber: z.string().optional(),
  serviceType: z.enum(["LIGHT_SERVICE", "MODIFICATION"]),
  complaint: z.string().min(10, "Keluhan minimal 10 karakter"),
  scheduledAt: z.string().min(1, "Tanggal & Jam Booking harus diisi"),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

export interface BookingOrderResult {
  id?: string;
  orderNumber?: string;
  queueNumber?: string;
  custName: string;
  custPhone: string;
  vehicle: string;
  plateNumber?: string;
  scheduledAt: string;
  serviceType: "LIGHT_SERVICE" | "MODIFICATION";
  complaint: string;
}

export interface BookingFormProps {
  serviceOptions?: DefaultServiceOption[];
  garagePhone?: string;
}

export function BookingForm({ 
  serviceOptions = [], 
  garagePhone = "0812-3456-7890" 
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successValues, setSuccessValues] = useState<BookingOrderResult | null>(null);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  const services = serviceOptions.length > 0 ? serviceOptions : DEFAULT_SERVICE_OPTIONS;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      custName: "",
      custPhone: "",
      vehicle: "",
      plateNumber: "",
      serviceType: "LIGHT_SERVICE",
      complaint: "",
      scheduledAt: "",
    },
  });

  async function handleSubmit(data: BookingFormData) {
    setIsSubmitting(true);

    try {
      const result = await createBooking(data);

      if (result.success) {
        setSuccessValues(result.order as BookingOrderResult);
        form.reset();
        toast.success("Booking Berhasil!", {
          description: "Silakan simpan nomor antrian Anda."
        });
      } else {
        toast.error("Gagal", {
          description: result.error || "Terjadi kesalahan sistem."
        });
      }
    } catch {
      toast.error("Error", { 
        description: "Gagal mengirim booking." 
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successValues) {
    const formattedDate = successValues.scheduledAt
      ? new Date(successValues.scheduledAt).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

    const cleanPhone = formatWhatsAppNumber(garagePhone || "0812-3456-7890");
    const orderNo = successValues.orderNumber || (successValues.id ? formatOrderNo(successValues.id) : "-");

    const waText = encodeURIComponent(
      `Halo NopzGarage, saya ingin mengonfirmasi booking service:\n\n` +
      `*No. Order:* ${orderNo}\n` +
      `*No. Antrian:* ${successValues.queueNumber || "-"}\n` +
      `*Nama:* ${successValues.custName}\n` +
      `*Motor:* ${successValues.vehicle}\n` +
      `*Plat Nomor:* ${successValues.plateNumber || "-"}\n` +
      `*Jadwal:* ${formattedDate}\n` +
      `*Layanan:* ${successValues.serviceType === "LIGHT_SERVICE" ? "Servis Ringan" : "Modifikasi"}\n` +
      `*Keluhan:* ${successValues.complaint}\n\n` +
      `Mohon konfirmasinya. Terima kasih!`
    );

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-green-200 dark:border-green-900 rounded-2xl p-8 text-left shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Booking Berhasil Dikirim!</h3>
            <p className="text-sm text-muted-foreground">Silakan simpan nomor antrian berikut untuk tracking.</p>
          </div>
        </div>

        <div className="bg-muted/40 border rounded-xl p-5 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-border/50">
            <div>
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">No. Order</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-black text-foreground font-mono">
                  {successValues.orderNumber || (successValues.id ? formatOrderNo(successValues.id) : "-")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const no = successValues.orderNumber || (successValues.id ? formatOrderNo(successValues.id) : "");
                    if (no) {
                      navigator.clipboard.writeText(no);
                      setCopiedOrderNo(true);
                      toast.success("Nomor order disalin ke clipboard!");
                      setTimeout(() => setCopiedOrderNo(false), 2000);
                    }
                  }}
                  className="h-7 px-2 text-xs gap-1 font-sans text-primary hover:bg-primary/10 rounded-lg"
                >
                  {copiedOrderNo ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="text-[10px] font-semibold">{copiedOrderNo ? "Tersalin" : "Salin"}</span>
                </Button>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">No. Antrian</span>
              <span className="text-2xl font-black text-primary font-mono">{successValues.queueNumber || "QT-PENDING"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">Pelanggan:</span>
              <span className="font-semibold text-foreground">{successValues.custName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Kendaraan:</span>
              <span className="font-semibold text-foreground">{successValues.vehicle} ({successValues.plateNumber || "-"})</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/30">
              <span className="text-muted-foreground block">Jadwal Kedatangan:</span>
              <span className="font-semibold text-foreground">{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${cleanPhone}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm"
          >
            Konfirmasi via WhatsApp
          </a>
          <Button 
            variant="outline" 
            onClick={() => setSuccessValues(null)}
            className="w-full text-xs font-semibold py-2"
          >
            Buat Booking Lain
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="space-y-6 text-left"
      >
        <div className="space-y-3">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            Pilih Paket / Jenis Layanan
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv, idx) => {
              const isSelected = form.watch("serviceType") === srv.serviceType;
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    form.setValue("serviceType", srv.serviceType);
                    const currentVal = form.getValues("complaint");
                    if (!currentVal.includes(srv.title)) {
                      form.setValue("complaint", `[Layanan: ${srv.title}] ${currentVal}`);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected 
                      ? "border-primary bg-primary/10 shadow-sm" 
                      : "border-border/60 hover:border-primary/40 bg-card/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      {srv.icon === "Zap" ? (
                        <Zap className="w-4 h-4" />
                      ) : srv.icon === "Star" ? (
                        <Star className="w-4 h-4" />
                      ) : (
                        <Wrench className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <h5 className="font-bold text-xs text-foreground truncate">{srv.title}</h5>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">{srv.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="custName"
            render={({ field }: { field: ControllerRenderProps<BookingFormData, "custName"> }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Nama Lengkap
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Contoh: Budi Santoso" 
                    className="h-10 text-xs bg-muted/20" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="custPhone"
            render={({ field }: { field: ControllerRenderProps<BookingFormData, "custPhone"> }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Nomor HP / WhatsApp
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="08123456789" 
                    className="h-10 text-xs bg-muted/20" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vehicle"
            render={({ field }: { field: ControllerRenderProps<BookingFormData, "vehicle"> }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-muted-foreground" /> Merk & Tipe Motor
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Contoh: Honda Vario 160 / NMAX" 
                    className="h-10 text-xs bg-muted/20" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plateNumber"
            render={({ field }: { field: ControllerRenderProps<BookingFormData, "plateNumber"> }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-muted-foreground" /> Plat Nomor (Opsional)
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="B 1234 ABC" 
                    className="h-10 text-xs bg-muted/20" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }: { field: ControllerRenderProps<BookingFormData, "serviceType"> }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Kategori Servis System</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 text-xs bg-muted/20">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LIGHT_SERVICE">Fast Lane / Servis Ringan</SelectItem>
                    <SelectItem value="MODIFICATION">Project Lane / Modifikasi & Berat</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }: { field: ControllerRenderProps<BookingFormData, "scheduledAt"> }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-muted-foreground" /> Rencana Tanggal & Jam Kedatangan
                </FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    className="h-10 text-xs bg-muted/20" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="complaint"
          render={({ field }: { field: ControllerRenderProps<BookingFormData, "complaint"> }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Detail Keluhan & Catatan Servis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan keluhan pada motor Anda (misal: mesin kasar, ganti oli, rem berbunyi)..."
                  className="resize-none text-xs bg-muted/20 min-h-[90px]"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-sm font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg hover:shadow-primary/25 transition-all uppercase tracking-wide"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              SENDING...
            </>
          ) : (
            <span className="flex items-center gap-3">
              <CalendarCheck className="w-5 h-5" />
              Booking Sekarang
            </span>
          )}
        </Button>
        
        <p className="text-[10px] text-center text-muted-foreground font-medium opacity-60">
          Dengan menekan tombol di atas, Anda setuju dengan jadwal operasional kami.
        </p>
      </form>
    </Form>
  );
}
