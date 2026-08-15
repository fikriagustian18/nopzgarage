"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, 
  Gauge, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Settings,
  Phone,
  Calendar,
  Info,
  LogIn,
  ChevronRight,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { ThemeToggle } from "./ThemeToggle";

import { searchOrderByPlate } from "@/lib/actions/orderStatus";
import { formatDetailDate, formatOrderNo } from "@/lib/utils";
import { normalizeRole } from "@/lib/authCheck";

interface GeneralSettings {
  phone?: string;
  days?: string[];
  openTime?: string;
  closeTime?: string;
}

interface UserSession {
  user: {
    role?: string;
    name?: string;
    email?: string;
  };
}

interface StatusOrderMechanic {
  id?: string;
  name: string;
  role?: string;
}

interface StatusOrder {
  id: string;
  custName: string;
  plateNumber: string | null;
  vehicle: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  scheduledAt?: string | Date | null;
  complaint?: string | null;
  mechanic?: StatusOrderMechanic | null;
}

interface StatusPageClientProps {
  generalSettings?: GeneralSettings;
  session?: UserSession | null;
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
  align?: "center" | "start";
}

interface MilestoneItem {
  step: number;
  title: string;
  label: string;
  time: string;
}

export function StatusPageClient({ generalSettings = {}, session }: StatusPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<StatusOrder[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }

    setError("");
    setOrders([]);
    setLoading(true);

    try {
      const result = await searchOrderByPlate(searchQuery);
      setLoading(false);

      if (!result.success || !result.orders) {
        setError(result.error || "Data tidak ditemukan.");
        return;
      }

      setOrders(result.orders as StatusOrder[]);
    } catch (err) {
      setLoading(false);
      setError("Terjadi kesalahan sistem saat mencari data.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/90 border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex flex-col items-start gap-1 group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
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

            {/* Navigation */}
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
                  href={normalizeRole(session.user?.role) === "EMPLOYEE" ? "/employee" : "/admin"} 
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

      {/* MAIN BODY */}
      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-1">
            <Gauge className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">Cek Status Servis</h1>
          <p className="text-muted-foreground font-medium text-sm sm:text-base max-w-lg mx-auto">
            Pantau progress pengerjaan motor Anda secara real-time.
          </p>
        </div>

        {/* 2-Columns Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SEARCH CONTAINER CARD */}
            <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <h3 className="font-black text-lg text-foreground">Lacak Kendaraan Anda</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      Masukkan nomor order atau nomor WhatsApp untuk melihat status servis.
                    </p>
                  </div>
                  <div>
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Contoh: ORD-2024-0001 atau 0812xxxx"
                        className="h-12 bg-background/50 border-input"
                        disabled={loading}
                      />
                      <Button
                        type="submit"
                        disabled={loading}
                        className="gap-2 h-12 px-5 font-bold shrink-0"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span>Cek Sekarang</span>
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="h-px bg-border my-5 border-t border-dashed" />
                
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground leading-relaxed">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p>Data diperbarui secara real-time oleh teknisi kami.</p>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* SEARCH RESULTS CARD (Iterate found orders) */}
            {orders.map((order) => {
              const currentStatus = order.status;
              const statusLabel = getStatusLabel(currentStatus);

              const milestones: MilestoneItem[] = [
                { 
                  step: 1, 
                  title: "1. Booking Diterima", 
                  label: "Booking Anda telah diterima.", 
                  time: formatScheduledDate(order.createdAt)
                },
                { 
                  step: 2, 
                  title: "2. Antrian Servis", 
                  label: "Menunggu giliran servis.", 
                  time: getMilestoneState(currentStatus, 2) !== "inactive" ? formatScheduledDate(order.createdAt) : "-" 
                },
                { 
                  step: 3, 
                  title: "3. Sedang Dikerjakan", 
                  label: "Mekanik sedang mengerjakan kendaraan Anda.", 
                  time: getMilestoneState(currentStatus, 3) !== "inactive" ? formatScheduledDate(order.updatedAt) : "-" 
                },
                { 
                  step: 4, 
                  title: "4. Selesai", 
                  label: "Servis telah selesai dan siap diambil.", 
                  time: (currentStatus === "READY" || currentStatus === "COMPLETED") ? formatScheduledDate(order.updatedAt) : "Estimasi selesai segera" 
                }
              ];

              return (
                <div key={order.id} className="space-y-6 animate-in fade-in-0 duration-300">
                  
                  {/* 1. Detail Order Card */}
                  <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                    <div className="p-4 bg-muted/40 border-b border-border flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                        DETAIL ORDER
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Status Saat Ini</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-wider rounded-lg uppercase">
                          <Settings className="h-3 w-3 animate-spin-slow" />
                          <span>{statusLabel}</span>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-sm">
                        {/* Left Column */}
                        <div className="space-y-3.5">
                          <DetailRow label="No. Order">
                            <span className="font-bold text-foreground">{formatOrderNo(order.id)}</span>
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
                                {statusLabel}
                              </span>
                            </div>
                          </DetailRow>
                          <DetailRow label="Estimasi Selesai">
                            <span className="font-bold text-foreground">{formatDetailDate(order.scheduledAt || order.createdAt)}</span>
                          </DetailRow>
                          <DetailRow label="Selesai">
                            <span className="font-bold text-foreground">
                              {["READY", "COMPLETED"].includes(order.status || "") ? formatDetailDate(order.updatedAt) : "-"}
                            </span>
                          </DetailRow>
                        </div>
                      </div>

                      {order.complaint && (
                        <div className="pt-4 border-t border-border text-sm">
                          <DetailRow label="Keluhan / Catatan" align="start">
                            <span className="font-medium text-foreground leading-relaxed whitespace-pre-line">
                              {order.complaint}
                            </span>
                          </DetailRow>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 2. Work Progress Card */}
                  <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                    <div className="p-4 bg-muted/40 border-b border-border">
                      <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                        Progres Pengerjaan
                      </h3>
                    </div>
                    <CardContent className="p-6 md:p-8">
                      {/* Horizontal Stepper Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {/* Stepper Steps */}
                        {milestones.map((m) => {
                          const state = getMilestoneState(currentStatus, m.step);

                          return (
                            <div key={m.step} className="flex flex-col items-center text-center space-y-2">
                              {/* Step circle */}
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${
                                state === "completed" ? "bg-primary border-primary text-primary-foreground" :
                                state === "active" ? "bg-foreground border-foreground text-background" :
                                "bg-background border-muted-foreground/30 text-muted-foreground"
                              }`}>
                                {state === "completed" ? <Check className="h-4.5 w-4.5" /> : m.step}
                              </div>
                              <h4 className="font-bold text-xs text-foreground mt-1">{m.title}</h4>
                              <p className="text-[10px] text-muted-foreground leading-normal max-w-[150px]">{m.label}</p>
                              <span className="text-[9px] font-mono text-primary font-bold">{m.time}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                </div>
              );
            })}

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            {/* CARD 1: NEED HELP */}
            <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 bg-muted/40 border-b border-border">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  BUTUH BANTUAN?
                </h3>
              </div>
              <CardContent className="p-5 space-y-3.5 text-xs font-medium">
                <p className="text-muted-foreground leading-relaxed">
                  Jika ada pertanyaan seputar order Anda, hubungi kami melalui:
                </p>
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

            {/* CARD 2: NOTES */}
            <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 bg-muted/40 border-b border-border flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  CATATAN
                </h3>
              </div>
              <CardContent className="p-5 text-xs text-muted-foreground leading-relaxed">
                Estimasi waktu servis dapat berubah tergantung kondisi kendaraan dan antrean servis di bengkel.
              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </div>
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

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "MENUNGGU KONFIRMASI",
    ESTIMATED: "SUDAH DIESTIMASI",
    CONFIRMED: "MENUNGGU SERVIS",
    QUEUE: "DALAM ANTRIAN",
    IN_PROGRESS: "DIPROSES",
    READY: "SIAP DIAMBIL",
    COMPLETED: "SELESAI",
    CANCELLED: "DIBATALKAN",
  };
  return statusMap[status] || status;
}

function formatScheduledDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) {
    return "-";
  }
  try {
    return format(new Date(dateStr), "dd MMMM yyyy, HH:mm", { locale: id });
  } catch (error) {
    return "-";
  }
}

/** Stepper milestones helper function */
function getMilestoneState(status: string, stepNum: number): "completed" | "active" | "inactive" {
  // 1: Booking Diterima, 2: Antrian Servis, 3: Sedang Dikerjakan, 4: Selesai
  if (status === "CANCELLED") {
    return "inactive";
  }

  const statusWeights: Record<string, number> = {
    PENDING: 1,
    ESTIMATED: 1,
    CONFIRMED: 1,
    QUEUE: 2,
    IN_PROGRESS: 3,
    READY: 4,
    COMPLETED: 4,
  };

  const currentWeight = statusWeights[status] || 1;

  if (currentWeight > stepNum) {
    return "completed";
  }
  if (currentWeight === stepNum) {
    return "active";
  }
  return "inactive";
}

