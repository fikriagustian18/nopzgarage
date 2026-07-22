// components/BookingWizard.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createBooking } from "@/lib/actions/orders";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Wrench, 
  Calendar, 
  CheckCircle2, 
  Check,
  Info, 
  Bike, 
  PenTool, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  Globe,
  LogIn,
  ChevronDown,
  Gauge,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatWhatsAppNumber } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

// ==================== Validation Schemas ====================
const step1Schema = z.object({
  custName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  custPhone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .regex(/^[0-9+]+$/, "Hanya angka dan tanda +"),
  email: z
    .union([z.string().email("Format email tidak valid"), z.literal("")])
    .optional(),
  address: z.string().optional(),
});

const step3Schema = z.object({
  vehicle: z.string().min(3, "Merk & tipe kendaraan minimal 3 karakter"),
  plateNumber: z.string().optional(),
  scheduledAt: z.string().min(1, "Tanggal & Jam Booking harus diisi"),
  complaint: z.string().min(10, "Keluhan minimal 10 karakter"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface BookingWizardProps {
  serviceOptions?: any[];
  generalSettings?: any;
  session?: any;
}

export function BookingWizard({ serviceOptions = [], generalSettings = {}, session }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successValues, setSuccessValues] = useState<any | null>(null);

  // Form states for each step
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      custName: "",
      custPhone: "",
      email: "",
      address: "",
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      vehicle: "",
      plateNumber: "",
      scheduledAt: "",
      complaint: "",
    },
  });

  // Services available
  const services = serviceOptions.length > 0 ? serviceOptions : [
    { id: "1", title: "Fast Lane Service", description: "Servis ringan, ganti oli, tune up dalam 30 menit", serviceType: "LIGHT_SERVICE" },
    { id: "2", title: "Project Custom", description: "Modifikasi mesin, body, cat, dan custom parts", serviceType: "MODIFICATION" },
    { id: "3", title: "Performance Upgrade", description: "Bore up, remap ECU, upgrade CVT & kelistrikan", serviceType: "MODIFICATION" }
  ];

  // Helper formatting values
  const step1Values = step1Form.watch();
  const step3Values = step3Form.watch();

  const handleNextStep1 = async () => {
    const isValid = await step1Form.trigger();
    if (isValid) {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    if (!selectedService) {
      toast.error("Pilih Layanan", { description: "Silakan pilih salah satu jenis layanan terlebih dahulu." });
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = async () => {
    const isValid = await step3Form.trigger();
    if (isValid) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const formatScheduledDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMMM yyyy, HH:mm", { locale: id });
    } catch (e) {
      return dateStr;
    }
  };

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    try {
      const data1 = step1Form.getValues();
      const data3 = step3Form.getValues();
      
      const mappedServiceType = (selectedService?.title?.toLowerCase().includes("fast") || selectedService?.title?.toLowerCase().includes("ringan")) 
        ? "LIGHT_SERVICE" 
        : "MODIFICATION";

      const mergedComplaint = `[Email: ${data1.email}] [Alamat: ${data1.address}] [Layanan Pilihan: ${selectedService?.title}] Catatan: ${data3.complaint}`;

      const submitData = {
        custName: data1.custName,
        custPhone: data1.custPhone,
        vehicle: data3.vehicle,
        plateNumber: data3.plateNumber || "",
        serviceType: mappedServiceType as any,
        scheduledAt: data3.scheduledAt,
        complaint: mergedComplaint,
      };

      const result = await createBooking(submitData);

      if (result.success) {
        setSuccessValues(result.order);
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

  const garagePhone = generalSettings.phone || "0812-3456-7890";
  const cleanPhone = formatWhatsAppNumber(garagePhone);

  const getWaText = () => {
    if (!successValues) return "";
    const formattedDate = successValues.scheduledAt
      ? new Date(successValues.scheduledAt).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

    return encodeURIComponent(
      `Halo NopzGarage, saya ingin mengonfirmasi booking service:\n\n` +
      `*No. Antrian:* ${successValues.queueNumber || "-"}\n` +
      `*Nama:* ${successValues.custName}\n` +
      `*Motor:* ${successValues.vehicle}\n` +
      `*Plat Nomor:* ${successValues.plateNumber || "-"}\n` +
      `*Jadwal:* ${formattedDate}\n` +
      `*Layanan:* ${selectedService?.title || "Servis"}\n` +
      `Mohon konfirmasinya. Terima kasih!`
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased">
      {/* Header - Enhanced with better visual weight */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/90 border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Better spacing and hover effect */}
            <Link href="/" className="flex flex-col items-start gap-1 group cursor-pointer transition-all duration-300 hover:scale-[1.02]">
              <div className="relative">
                <Image 
                  src="/logo.svg" 
                  alt="NopzGarage" 
                  width={180} 
                  height={45} 
                  style={{ height: "auto" }}
                  className="relative z-10 transition-opacity duration-300 group-hover:opacity-90"
                  priority
                />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground tracking-[0.2em] pl-0.5 font-nfs uppercase font-bold">
               REMAP N CUSTOM
              </p>
            </Link>

            {/* Navigation - Better spacing and hover states */}
            <nav className="flex gap-3 md:gap-4 items-center">
              <Link 
                href="/status" 
                className="hidden md:flex group items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-all duration-300 px-4 py-2 rounded-lg hover:bg-primary/5"
              >
                <Gauge className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>Cek Status</span>
              </Link>
              
              <ThemeToggle />

              {session ? (
                <Link 
                  href={session.user.role === "EMPLOYEE" ? "/employee" : "/admin"} 
                  className="group px-5 md:px-6 py-2.5 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                  <span>Dashboard</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="group px-5 md:px-6 py-2.5 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN BODY CONTENT */}
      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Booking Servis</span>
          </Link>
        </div>

        {successValues ? (
          /* SUCCESS SCREEN */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto bg-card border border-border rounded-3xl p-8 text-center shadow-xl relative overflow-hidden mt-6"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Booking Berhasil Dibuat!</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Silakan simpan tiket antrian Anda. Anda bisa datang ke bengkel sesuai jadwal yang dipilih.
            </p>

            <div className="border border-border/80 rounded-2xl p-6 bg-muted/40 text-left font-mono text-xs space-y-4 mb-6 relative">
              <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border-r border-border" />
              <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background border-l border-border" />

              <div className="flex justify-between items-center border-b border-dashed border-border pb-3">
                <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Nomor Antrian</span>
                <span className="text-xl font-black text-primary tracking-wider">{successValues.queueNumber || "Q-XX"}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pelanggan:</span>
                  <span className="font-bold">{successValues.custName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kendaraan:</span>
                  <span className="font-bold">{successValues.vehicle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jadwal:</span>
                  <span className="font-bold">{formatScheduledDate(successValues.scheduledAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Layanan:</span>
                  <span className="font-bold">{selectedService?.title}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.open(`https://wa.me/${cleanPhone}?text=${getWaText()}`, "_blank")} 
                className="w-full h-12 bg-[#25D366] hover:bg-[#20BA56] text-white font-bold gap-2 rounded-xl"
              >
                Kirim Konfirmasi WhatsApp
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/status" className="w-full">
                  <Button variant="outline" className="w-full h-11 text-xs font-bold rounded-xl">
                    Cek Status Antrian
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    setStep(1);
                    setSelectedService(null);
                    setSuccessValues(null);
                    step1Form.reset();
                    step3Form.reset();
                  }} 
                  variant="ghost" 
                  className="h-11 text-xs font-bold border border-border rounded-xl"
                >
                  Booking Baru
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* WORKFLOW LAYOUT (2 COLUMNS) */
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left Content Area (Columns 2 span) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Stepper Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none text-foreground">
                  Siap untuk Performa Puncak?
                </h1>
                <p className="text-muted-foreground font-medium text-sm sm:text-base leading-relaxed">
                  Jangan biarkan motor Anda menunggu. Booking jadwal servis sekarang dan nikmati pelayanan tanpa antri.
                </p>
              </div>

              {/* Mockup Horizontal Stepper */}
              <div className="relative py-4">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 -z-10" />
                <div className="flex justify-between items-center w-full">
                  {[
                    { num: 1, label: "Data Diri" },
                    { num: 2, label: "Layanan" },
                    { num: 3, label: "Jadwal" },
                    { num: 4, label: "Konfirmasi" }
                  ].map((s) => {
                    const isCompleted = step > s.num;
                    const isActive = step === s.num;

                    return (
                      <div key={s.num} className="flex flex-col items-center gap-2 relative bg-background px-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold ${
                          isCompleted ? "bg-primary border-primary text-primary-foreground" :
                          isActive ? "bg-foreground border-foreground text-background" :
                          "bg-background border-muted-foreground/35 text-muted-foreground"
                        }`}>
                          {isCompleted ? <Check className="h-4.5 w-4.5" /> : s.num}
                        </div>
                        <span className={`text-xs font-bold tracking-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step Forms */}
              <Card className="bg-card border border-border shadow-sm rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div 
                        key="step1" 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider mb-2">
                          <User className="h-4.5 w-4.5 text-primary" />
                          <span>DATA DIRI</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap *</label>
                            <div className="relative group">
                              <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="Masukkan nama lengkap Anda" 
                                className="pl-11 h-12 bg-background/50 border-input"
                                {...step1Form.register("custName")}
                              />
                            </div>
                            {step1Form.formState.errors.custName && (
                              <p className="text-xs text-red-500 font-medium">{step1Form.formState.errors.custName.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nomor WhatsApp *</label>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="08xxxxxxxxxx" 
                                className="pl-11 h-12 bg-background/50 border-input"
                                {...step1Form.register("custPhone")}
                              />
                            </div>
                            {step1Form.formState.errors.custPhone && (
                              <p className="text-xs text-red-500 font-medium">{step1Form.formState.errors.custPhone.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="nama@email.com (Opsional)" 
                                className="pl-11 h-12 bg-background/50 border-input"
                                {...step1Form.register("email")}
                              />
                            </div>
                            {step1Form.formState.errors.email && (
                              <p className="text-xs text-red-500 font-medium">{step1Form.formState.errors.email.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alamat</label>
                            <div className="relative group">
                              <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="Masukkan alamat lengkap Anda (Opsional)" 
                                className="pl-11 h-12 bg-background/50 border-input"
                                {...step1Form.register("address")}
                              />
                            </div>
                            {step1Form.formState.errors.address && (
                              <p className="text-xs text-red-500 font-medium">{step1Form.formState.errors.address.message}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div 
                        key="step2" 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider mb-2">
                          <Wrench className="h-4.5 w-4.5 text-primary" />
                          <span>PILIH LAYANAN</span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          {services.map((svc) => (
                            <div 
                              key={svc.id}
                              onClick={() => setSelectedService(svc)}
                              className={`border-2 rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                                selectedService?.id === svc.id 
                                  ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                  : "border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className={`p-2 rounded-xl text-primary bg-primary/10`}>
                                  <Wrench className="h-5 w-5" />
                                </span>
                                {selectedService?.id === svc.id && (
                                  <span className="p-1 bg-primary text-primary-foreground rounded-full">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-sm text-foreground mb-1">{svc.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{svc.description || svc.desc}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div 
                        key="step3" 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider mb-2">
                          <Calendar className="h-4.5 w-4.5 text-primary" />
                          <span>JADWAL & DATA KENDARAAN</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Merk & Tipe Motor *</label>
                            <div className="relative group">
                              <Bike className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="Contoh: Honda Vario 150" 
                                className="pl-11 h-12 bg-background/50 border-input"
                                {...step3Form.register("vehicle")}
                              />
                            </div>
                            {step3Form.formState.errors.vehicle && (
                              <p className="text-xs text-red-500 font-medium">{step3Form.formState.errors.vehicle.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plat Nomor (Opsional)</label>
                            <div className="relative group">
                              <PenTool className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                placeholder="Contoh: B 1234 ABC" 
                                className="pl-11 h-12 bg-background/50 border-input uppercase"
                                {...step3Form.register("plateNumber")}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tanggal & Jam Kedatangan *</label>
                            <div className="relative group">
                              <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input 
                                type="datetime-local" 
                                className="pl-11 h-12 bg-background/50 border-input"
                                {...step3Form.register("scheduledAt")}
                              />
                            </div>
                            {step3Form.formState.errors.scheduledAt && (
                              <p className="text-xs text-red-500 font-medium">{step3Form.formState.errors.scheduledAt.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Keluhan / Catatan *</label>
                          <Textarea 
                            placeholder="Jelaskan secara detail keluhan motor Anda (misal: rem belakang seret, oli rembes, dll)..." 
                            className="min-h-[120px] bg-background/50 border-input"
                            {...step3Form.register("complaint")}
                          />
                          {step3Form.formState.errors.complaint && (
                            <p className="text-xs text-red-500 font-medium">{step3Form.formState.errors.complaint.message}</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div 
                        key="step4" 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider mb-2">
                          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                          <span>KONFIRMASI DATA BOOKING</span>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Silakan tinjau kembali data di bawah ini dan data pada **Ringkasan Booking** sebelum menekan tombol konfirmasi untuk membuat pesanan servis Anda.
                        </p>

                        <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-3.5 text-xs">
                          <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-muted-foreground">Nama Lengkap</span>
                            <span className="font-bold text-foreground">{step1Values.custName}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-muted-foreground">WhatsApp</span>
                            <span className="font-bold text-foreground">{step1Values.custPhone}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-muted-foreground">Email</span>
                            <span className="font-bold text-foreground">{step1Values.email || "-"}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-muted-foreground">Motor</span>
                            <span className="font-bold text-foreground">{step3Values.vehicle}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-muted-foreground">Layanan Pilihan</span>
                            <span className="font-bold text-foreground">{selectedService?.title}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-muted-foreground">Tanggal & Waktu</span>
                            <span className="font-bold text-foreground">{formatScheduledDate(step3Values.scheduledAt)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Buttons inside Form Container */}
                  <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
                    {step > 1 ? (
                      <Button variant="outline" onClick={handlePrevStep} className="gap-2 h-11 px-5 text-xs font-bold rounded-xl">
                        Kembali
                      </Button>
                    ) : (
                      <Link href="/">
                        <Button variant="outline" className="h-11 px-5 text-xs font-bold rounded-xl">
                          Batal
                        </Button>
                      </Link>
                    )}

                    {step === 1 && (
                      <Button onClick={handleNextStep1} className="gap-2 h-11 px-5 text-xs font-bold rounded-xl">
                        <span>Selanjutnya</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {step === 2 && (
                      <Button onClick={handleNextStep2} className="gap-2 h-11 px-5 text-xs font-bold rounded-xl">
                        <span>Selanjutnya</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {step === 3 && (
                      <Button onClick={handleNextStep3} className="gap-2 h-11 px-5 text-xs font-bold rounded-xl">
                        <span>Selanjutnya</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {step === 4 && (
                      <Button 
                        onClick={handleSubmitBooking} 
                        disabled={isSubmitting} 
                        className="gap-2 h-11 px-6 text-xs font-bold rounded-xl"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            <span>Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <span>Booking Sekarang</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side Sticky Sidebar Column */}
            <div className="space-y-6">
              {/* CARD 1: RINGKASAN BOOKING */}
              <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 bg-muted/40 border-b border-border">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>RINGKASAN BOOKING</span>
                  </h3>
                </div>
                <CardContent className="p-5 space-y-4">
                  {/* Nama Lengkap */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      <User className="h-3 w-3" />
                      <span>Nama Lengkap</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground pl-5 truncate">{step1Values.custName || "-"}</p>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      <Phone className="h-3 w-3" />
                      <span>No. WhatsApp</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground pl-5">{step1Values.custPhone || "-"}</p>
                  </div>

                  <div className="h-px bg-border border-t border-dashed" />

                  {/* Data Kendaraan */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block">DATA KENDARAAN</span>
                    <div className="space-y-2 pl-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                          <Bike className="h-3.5 w-3.5" />
                          <span>Motor</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground pl-5">{step3Values.vehicle || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-muted-foreground pl-5">
                          <span>Plat Nomor (Opsional)</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground pl-5 uppercase">{step3Values.plateNumber || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border border-t border-dashed" />

                  {/* Detail Servis */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block font-bold">DETAIL SERVIS</span>
                    <div className="space-y-3 pl-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                          <Wrench className="h-3.5 w-3.5" />
                          <span>Layanan</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground pl-5">{selectedService?.title || "-"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Tanggal & Jam</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground pl-5">{formatScheduledDate(step3Values.scheduledAt)}</p>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-muted-foreground pl-5">
                          <span>Keluhan / Catatan</span>
                        </div>
                        <p className="text-xs font-semibold text-foreground pl-5 line-clamp-3 leading-relaxed">{step3Values.complaint || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border/80 border-t border-dashed" />

                  {/* Price disclaimer */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-foreground">Total</span>
                    <span className="text-sm font-black text-green-600 dark:text-green-400">GRATIS</span>
                  </div>

                  {/* Info alert box */}
                  <div className="flex items-start gap-2 bg-muted/60 border border-border p-3 rounded-xl text-[10px] text-muted-foreground leading-relaxed mt-2">
                    <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                    <p>Anda tidak akan dikenakan biaya saat melakukan booking.</p>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: BUTUH BANTUAN? */}
              <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 bg-muted/40 border-b border-border">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    BUTUH BANTUAN?
                  </h3>
                </div>
                <CardContent className="p-5 space-y-3.5 text-xs font-medium">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{generalSettings.phone || "0812-3456-7890"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{generalSettings.phone || "0812-3456-7890"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {generalSettings.days?.join(" - ") || "Senin - Sabtu"} ({generalSettings.openTime || "08:00"} - {generalSettings.closeTime || "17:00"} WIB)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
