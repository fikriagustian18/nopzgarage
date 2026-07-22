"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { getAllSettings, updateSetting, GeneralSettings, HolidaySettings } from "@/lib/actions/settings";
import { getRecentLogs } from "@/lib/actions/logs";
import { getUsers } from "@/lib/actions/auth";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Building2,
  Bell,
  Lock,
  Palette,
  Database,
  Activity,
  User,
  Save,
  Clock,
  Power,
  Loader2,
  AlertCircle,
  Users,
  Shield,
  Key,
  CreditCard,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { UserManagementTab } from "@/components/admin/UserManagementTab";
import { ForgotPasswordRequestsTab } from "@/components/admin/ForgotPasswordRequestsTab";

import { BankAccountsTab } from "@/components/admin/BankAccountsTab";

export default function SettingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State Settings
  const [general, setGeneral] = useState<GeneralSettings>({
      garageName: "", phone: "", email: "", address: "", 
      openTime: "", closeTime: "", days: []
  });
  const [holiday, setHoliday] = useState<HolidaySettings>({
      isHoliday: false, reason: "", openAt: ""
  });
  
  // Dummy State for non-implemented logic (but saved)
  const [notifications, setNotifications] = useState({
      newOrder: true, orderDone: true, payment: true, marketing: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab]);

  async function loadSettings() {
    try {
        const data = await getAllSettings();
        setGeneral(data.general);
        setHoliday(data.holiday);
    } catch (e) {
        toast.error("Gagal memuat pengaturan");
    } finally {
        setLoading(false);
    }
  }

  async function loadLogs() {
    const res = await getRecentLogs(50);
    if (res.success && res.logs) setLogs(res.logs);
  }

  async function saveGeneral() {
    const res = await updateSetting('general', general);
    if (res.success) toast.success("Info bengkel disimpan");
    else toast.error("Gagal menyimpan");
  }

  async function saveHoliday() {
    const res = await updateSetting('holiday', holiday);
    if (res.success) {
        setHasUnsavedChanges(false);
        toast.success(holiday.isHoliday ? "Status Libur Diaktifkan" : "Status Buka Diaktifkan");
        router.refresh();
    }
    else toast.error("Gagal menyimpan");
  }

  async function saveNotifications() {
      // Just save to DB as preference
      await updateSetting('notifications', notifications);
      toast.success("Preferensi notifikasi disimpan");
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-8 space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-foreground mb-2">Pengaturan</h2>
          <p className="text-muted-foreground">
            Kelola konfigurasi sistem NopzGarage secara menyeluruh.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigasi */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {[
                    { id: "general", label: "Info Bengkel", icon: Building2 },
                    { id: "operational", label: "Jam Kerja & Libur", icon: Clock },
                    { id: "payment-methods", label: "Metode Pembayaran", icon: CreditCard },
                    { id: "users", label: "User & Akses", icon: Users },
                    { id: "forgot-password", label: "Lupa Password", icon: Key },
                    { id: "notifications", label: "Notifikasi", icon: Bell },
                    { id: "logs", label: "Aktivitas Log", icon: Activity },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Konten */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === "general" && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Identitas Bengkel</CardTitle>
                  <CardDescription>Informasi ini akan muncul di website, invoice, dan header laporan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Bengkel</Label>
                      <Input 
                        value={general.garageName} 
                        onChange={(e) => setGeneral({...general, garageName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nomor Telepon</Label>
                      <Input 
                        value={general.phone} 
                        onChange={(e) => setGeneral({...general, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Resmi</Label>
                    <Input 
                        value={general.email} 
                        onChange={(e) => setGeneral({...general, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat Lengkap</Label>
                    <Textarea 
                      rows={3}
                      value={general.address}
                      onChange={(e) => setGeneral({...general, address: e.target.value})}
                    />
                  </div>
                  <Button onClick={saveGeneral} className="gap-2">
                    <Save className="h-4 w-4" /> Simpan Identitas
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* --- OPERATIONAL TAB (NEW) --- */}
            {activeTab === "operational" && (
              <div className="space-y-6">
                {/* Jam Kerja */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Jam Operasional</CardTitle>
                        <CardDescription>Atur jam buka dan tutup harian.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Jam Buka</Label>
                                <Input 
                                    type="time" 
                                    value={general.openTime}
                                    onChange={(e) => setGeneral({...general, openTime: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jam Tutup</Label>
                                <Input 
                                    type="time" 
                                    value={general.closeTime}
                                    onChange={(e) => setGeneral({...general, closeTime: e.target.value})}
                                />
                            </div>
                        </div>
                        <Button onClick={saveGeneral} className="gap-2">
                            <Save className="h-4 w-4" /> Update Jam Kerja
                        </Button>
                    </CardContent>
                </Card>

                {/* Mode Libur / Darurat */}
                <Card className={`border ${holiday.isHoliday ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-border bg-card'}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Power className={`h-5 w-5 ${holiday.isHoliday ? 'text-red-600' : 'text-muted-foreground'}`} />
                                    Status Operasional Bengkel
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    {holiday.isHoliday 
                                        ? 'Bengkel saat ini dalam MODE LIBUR. Customer akan melihat banner penutupan di website.'
                                        : 'Bengkel saat ini BUKA. Customer dapat melakukan booking normal.'
                                    }
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold ${holiday.isHoliday ? 'text-red-600' : 'text-green-600'}`}>
                                    {holiday.isHoliday ? 'TUTUP' : 'BUKA'}
                                </span>
                                <Switch 
                                    checked={holiday.isHoliday}
                                    onCheckedChange={(c) => {
                                        setHoliday({...holiday, isHoliday: c});
                                        setHasUnsavedChanges(true);
                                    }}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {holiday.isHoliday && (
                            <div className="space-y-4 p-4 bg-background rounded-lg border border-border">
                                <div className="space-y-2">
                                    <Label>Alasan Tutup (ditampilkan di banner)</Label>
                                    <Input 
                                        placeholder="Contoh: Libur Lebaran, Renovasi"
                                        value={holiday.reason}
                                        onChange={(e) => {
                                            setHoliday({...holiday, reason: e.target.value});
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Buka Kembali Pada</Label>
                                    <Input 
                                        placeholder="Contoh: Senin, 1 Januari jam 08:00"
                                        value={holiday.openAt}
                                        onChange={(e) => {
                                            setHoliday({...holiday, openAt: e.target.value});
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Warning Alert - Only show if unsaved */}
                        {hasUnsavedChanges && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-400 dark:border-yellow-600 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Perubahan belum tersimpan
                                </p>
                            </div>
                        )}

                        {/* Save Button */}
                        <Button 
                            onClick={saveHoliday} 
                            className={`w-full gap-2 ${holiday.isHoliday ? 'bg-red-600 hover:bg-red-700' : ''}`}
                            variant={holiday.isHoliday ? 'default' : 'default'}
                        >
                            <Save className="h-4 w-4" /> 
                            Simpan Perubahan
                        </Button>
                    </CardContent>
                </Card>
              </div>
            )}

            {/* --- PAYMENT METHODS TAB (NEW) --- */}
            {activeTab === "payment-methods" && <BankAccountsTab />}



            {/* --- NOTIFICATIONS TAB --- */}
            {activeTab === "notifications" && (
              // ... existing content ...
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Preferensi Notifikasi</CardTitle>
                    <CardDescription>Pilih notifikasi apa saja yang ingin diterima.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label>Order Baru</Label>
                      <Switch checked={notifications.newOrder} onCheckedChange={(c) => setNotifications({...notifications, newOrder: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Order Selesai</Label>
                      <Switch checked={notifications.orderDone} onCheckedChange={(c) => setNotifications({...notifications, orderDone: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Pembayaran Masuk</Label>
                      <Switch checked={notifications.payment} onCheckedChange={(c) => setNotifications({...notifications, payment: c})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Email Marketing</Label>
                      <Switch checked={notifications.marketing} onCheckedChange={(c) => setNotifications({...notifications, marketing: c})} />
                    </div>
                    <Button onClick={saveNotifications} className="gap-2">
                        <Save className="h-4 w-4" /> Simpan Preferensi
                    </Button>
                  </CardContent>
                </Card>
            )}

            {/* --- USER MANAGEMENT TAB --- */}
            {activeTab === "users" && <UserManagementTab />}

            {/* --- FORGOT PASSWORD TAB --- */}
            {activeTab === "forgot-password" && <ForgotPasswordRequestsTab />}

            {/* --- LOGS TAB --- */}
            {activeTab === "logs" && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Riwayat Aktivitas System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {logs.map((log) => (
                            <div key={log.id} className="grid grid-cols-12 gap-4 p-4 text-sm border-b last:border-0 hover:bg-muted/50">
                                <div className="col-span-12 md:col-span-4">
                                    <p className="font-medium">{log.title}</p>
                                    <Badge variant="outline" className="mt-1 text-[10px]">{log.action}</Badge>
                                </div>
                                <div className="col-span-12 md:col-span-5 text-muted-foreground">
                                    {log.details}
                                </div>
                                <div className="col-span-12 md:col-span-3 text-right text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: idLocale })}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  </RoleGuard>
  );
}
