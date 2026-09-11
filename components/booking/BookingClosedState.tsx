"use client";

import Link from "next/link";
import { AlertOctagon, Calendar, Clock, Home, MessageCircle, Gauge, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatWhatsAppNumber } from "@/lib/utils";
import type { GeneralSettings, HolidaySettings } from "@/lib/actions/settings";

interface BookingClosedStateProps {
  holiday: HolidaySettings;
  generalSettings?: GeneralSettings;
}

export function BookingClosedState({ holiday, generalSettings }: BookingClosedStateProps) {
  const garagePhone = generalSettings?.phone || "0812-3456-7890";
  const cleanPhone = formatWhatsAppNumber(garagePhone);
  const waMessage = encodeURIComponent(
    `Halo Admin ${generalSettings?.garageName || "NopzGarage"}, saya ingin bertanya terkait jadwal buka/servis bengkel.`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background glow decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full mx-auto relative z-10">
        <div className="bg-card/90 backdrop-blur-xl border-2 border-border/80 shadow-2xl rounded-3xl p-6 sm:p-10 text-center space-y-8">
          {/* Header Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center text-destructive animate-pulse shadow-lg shadow-destructive/10">
            <AlertOctagon className="w-10 h-10" />
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
              Pemberitahuan Operasional
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Bengkel Sedang Tutup
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Mohon maaf, saat ini pendaftaran booking online sedang dinonaktifkan sementara karena bengkel sedang dalam masa libur/tutup operasional.
            </p>
          </div>

          {/* Holiday Information Cards */}
          <div className="grid gap-3 text-left">
            {holiday.reason && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5 flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block">
                    Keterangan / Alasan
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {holiday.reason}
                  </span>
                </div>
              </div>
            )}

            {holiday.openAt && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-primary/20 text-primary mt-0.5 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-primary block">
                    Estimasi Buka Kembali
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {holiday.openAt}
                  </span>
                </div>
              </div>
            )}

            {generalSettings && (
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{generalSettings.garageName} • {generalSettings.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    Jadwal Reguler: {generalSettings.days?.join(", ") || "Senin - Sabtu"} ({generalSettings.openTime} - {generalSettings.closeTime})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Hubungi via WhatsApp</span>
            </a>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl gap-2 font-semibold hover:border-primary/40"
                >
                  <Home className="w-4 h-4" />
                  <span>Beranda</span>
                </Button>
              </Link>
              <Link href="/status">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl gap-2 font-semibold hover:border-primary/40"
                >
                  <Gauge className="w-4 h-4" />
                  <span>Cek Status</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
