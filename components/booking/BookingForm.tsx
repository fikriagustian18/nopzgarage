"use client";

import { useState } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Loader2, User, Phone, Bike, PenTool, Wrench, CalendarCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatWhatsAppNumber } from "@/lib/utils";

// ==================== Validation Schema ====================
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

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
    serviceOptions?: any[]; // [{ title, description, serviceType, icon }]
    garagePhone?: string;
}

export function BookingForm({ serviceOptions = [], garagePhone }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successValues, setSuccessValues] = useState<any | null>(null);

  // Calculate default options if none provided
  const services = serviceOptions.length > 0 ? serviceOptions : [
        { title: "Fast Lane Service", description: "Servis ringan, ganti oli, tune up", serviceType: "LIGHT_SERVICE", icon: "Zap" },
        { title: "Project Lane / Modifikasi", description: "Turun mesin, modif, bore up", serviceType: "MODIFICATION", icon: "Settings" }
  ];

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

  const handleSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createBooking(data);

      if (result.success) {
        setSuccessValues(result.order);
        form.reset();
        toast.success("Booking Berhasil!", {
            description: "Silakan simpan nomor antrian Anda."
        });
      } else {
        toast.error("Gagal", {
            description: result.error || "Terjadi kesalahan sistem."
        });
      }
    } catch (err) {
      toast.error("Error", { description: "Gagal mengirim booking." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successValues) {
    const formattedDate = successValues.scheduledAt
      ? new Date(successValues.scheduledAt).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

    const cleanPhone = formatWhatsAppNumber(garagePhone || "0812-3456-7890");

    // Generate WhatsApp text
    const waText = encodeURIComponent(
      `Halo NopzGarage, saya ingin mengonfirmasi booking service:\n\n` +
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
            
            <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Booking Diterima!</h3>
                <p className="text-muted-foreground text-sm">
                    Silakan simpan nomor antrian Anda sebagai identitas booking.
                </p>
            </div>

            {/* Receipt Details */}
            <div className="border border-border/85 rounded-xl p-5 bg-muted/30 space-y-4 mb-6 relative font-mono text-xs">
                {/* Decorative border cutouts */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-r border-border" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-l border-border" />

                <div className="flex justify-between items-center border-b border-dashed border-border pb-3">
                    <span className="text-muted-foreground">NOMOR ANTRIAN</span>
                    <span className="text-lg font-black text-primary tracking-wider">{successValues.queueNumber || "Q-XX"}</span>
                </div>

                <div className="space-y-2.5">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Pelanggan:</span>
                        <span className="font-bold text-right">{successValues.custName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Kendaraan:</span>
                        <span className="font-bold text-right">{successValues.vehicle} {successValues.plateNumber ? `(${successValues.plateNumber})` : ""}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Jenis Layanan:</span>
                        <span className="font-bold text-right">{successValues.serviceType === "LIGHT_SERVICE" ? "Servis Ringan" : "Modifikasi"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Jadwal Kedatangan:</span>
                        <span className="font-bold text-right">{formattedDate}</span>
                    </div>
                    <div className="border-t border-dashed border-border pt-2">
                        <span className="text-muted-foreground block mb-1">Catatan/Keluhan:</span>
                        <p className="font-medium text-foreground bg-background/50 p-2 rounded border border-border/50 break-words leading-relaxed whitespace-pre-wrap">{successValues.complaint}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                <Button 
                    onClick={() => window.open(`https://wa.me/${cleanPhone}?text=${waText}`, "_blank")} 
                    className="w-full h-12 bg-[#25D366] hover:bg-[#20BA56] text-white font-bold gap-2"
                >
                    <Zap className="h-4 w-4 fill-white" />
                    Kirim Konfirmasi WhatsApp
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => window.location.href = "/status"} variant="outline" className="h-11 text-xs font-bold">
                        Cek Status Antrian
                    </Button>
                    <Button onClick={() => setSuccessValues(null)} variant="ghost" className="h-11 text-xs font-bold border border-border">
                        Booking Baru
                    </Button>
                </div>
            </div>
        </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        {/* SECTION 1: Personal Info */}
        <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                <User className="w-4 h-4 text-primary" /> Data Diri
            </h4>
            <div className="grid md:grid-cols-2 gap-5">
                <FormField
                control={form.control}
                name="custName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Nama Lengkap</FormLabel>
                    <FormControl>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input placeholder="Nama Anda" className="pl-11 h-12 bg-background/50 border-input group-hover:border-primary/50 transition-colors" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="custPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Nomor WhatsApp</FormLabel>
                    <FormControl>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input placeholder="08xxxxx" className="pl-11 h-12 bg-background/50 border-input group-hover:border-primary/50 transition-colors" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>

        <div className="h-px bg-border/50 border-t border-dashed border-border" />

        {/* SECTION 2: Vehicle Info */}
        <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                <Bike className="w-4 h-4 text-primary" /> Data Kendaraan
            </h4>
            <div className="grid md:grid-cols-2 gap-5">
                <FormField
                control={form.control}
                name="vehicle"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Merk & Tipe Motor</FormLabel>
                    <FormControl>
                        <div className="relative group">
                            <Bike className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input placeholder="Contoh: Honda Vario 150" className="pl-11 h-12 bg-background/50 border-input group-hover:border-primary/50 transition-colors" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Plat Nomor (Opsional)</FormLabel>
                    <FormControl>
                        <div className="relative group">
                            <PenTool className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input placeholder="B 1234 ABC" className="pl-11 h-12 bg-background/50 border-input group-hover:border-primary/50 transition-colors uppercase" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>

        <div className="h-px bg-border/50 border-t border-dashed border-border" />

        {/* SECTION 3: Service Details */}
        <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                <Wrench className="w-4 h-4 text-primary" /> Detail Servis
            </h4>
            
            <div className="grid md:grid-cols-2 gap-5">
                <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Jenis Layanan</FormLabel>
                    <Select 
                        onValueChange={(val) => {
                             const idx = parseInt(val);
                             const selected = services[idx];
                             if (selected) {
                                 field.onChange(selected.serviceType || "LIGHT_SERVICE");
                                 const currentComplaint = form.getValues("complaint") || "";
                                 const serviceTag = `[${selected.title}]`;
                                 if (!currentComplaint.includes(selected.title)) {
                                     form.setValue("complaint", `${serviceTag} ${currentComplaint}`);
                                 }
                             }
                        }} 
                    >
                        <FormControl>
                        <SelectTrigger className="h-12 bg-background/50 border-input hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Pilih Layanan Disini" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {services.map((svc: any, idx: number) => {
                                const svcType = (svc.serviceType === "LIGHT_SERVICE" || svc.serviceType === "MODIFICATION") 
                                    ? svc.serviceType 
                                    : "LIGHT_SERVICE";
                                    
                                const isLight = svcType === "LIGHT_SERVICE";
                                const badgeColor = isLight ? "bg-blue-500/10 text-blue-600" : "bg-primary/10 text-primary";
                                
                                return (
                                    <SelectItem key={idx} value={String(idx)}>
                                        <div className="flex items-center gap-3 py-1">
                                            <div className={`p-1.5 rounded-md ${badgeColor} w-8 h-8 flex items-center justify-center text-sm font-bold border border-current/20`}>
                                                {isLight ? <Zap className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{svc.title}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wide opacity-80">{svc.desc || svc.description?.substring(0, 40)}...</div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wide">Tanggal & Jam Booking</FormLabel>
                    <FormControl>
                        <div className="relative group">
                            <CalendarCheck className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                            <Input 
                                type="datetime-local" 
                                className="pl-11 h-12 bg-background/50 border-input group-hover:border-primary/50 transition-colors block w-full text-foreground" 
                                {...field} 
                            />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
            control={form.control}
            name="complaint"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wide">Keluhan / Catatan</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="Jelaskan keluhan motor atau request servis Anda..."
                    className="min-h-[120px] resize-none bg-background/50 border-input hover:border-primary/50 transition-colors"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button
          type="submit"
          className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl"
          size="lg"
          disabled={isSubmitting}
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
