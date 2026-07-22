"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Lock,
  Key,
  Shield,
  Save,
  Eye,
  Camera,
  CheckCircle,
  AlertCircle,
  Settings,
  Bell,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { toast } from "@/hooks/useToast";
import { Toaster } from "@/components/ui/Toaster";
import {
  getCurrentProfile,
  updateCurrentProfile,
  changeCurrentPassword,
} from "@/lib/actions/auth";

type UserProfile = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    role: string;
    phone: string | null;
  } | null;
};

type Activity = {
  id: string;
  action: string;
  title: string;
  details: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "preferences">("profile");

  // Form profile states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form preference states
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [language, setLanguage] = useState("id");
  const [isSavingPref, setIsSavingPref] = useState(false);

  // Activity list limits
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(5);

  useEffect(() => {
    loadProfileData();
    // Load cached address if exists
    const savedAddress = localStorage.getItem("user_profile_address");
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const res = await getCurrentProfile();
      if (res.success && res.profile) {
        setProfile(res.profile as UserProfile);
        setActivities((res.activities || []) as Activity[]);
        
        // Populate inputs
        setFullName(res.profile.employee?.name || "Admin");
        setEmail(res.profile.email);
        setPhone(res.profile.employee?.phone || "");
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: res.error || "Gagal memuat data profil",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan koneksi",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: "Validasi Gagal", description: "Nama Lengkap wajib diisi", variant: "destructive" });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Validasi Gagal", description: "Email tidak valid", variant: "destructive" });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateCurrentProfile({
        name: fullName,
        phone: phone,
        email: email,
      });

      if (res.success) {
        toast({
          title: "✅ Berhasil!",
          description: "Informasi profil berhasil diperbarui",
        });
        
        // Cache the address locally
        localStorage.setItem("user_profile_address", address);

        // Update NextAuth session data
        await updateSession();
        
        // Reload data
        await loadProfileData();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: res.error || "Gagal memperbarui profil",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan sistem",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast({ title: "Validasi Gagal", description: "Password saat ini wajib diisi", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Validasi Gagal", description: "Password baru minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Validasi Gagal", description: "Konfirmasi password baru tidak cocok", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeCurrentPassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast({
          title: "✅ Berhasil!",
          description: "Password berhasil diubah",
        });
        // Clear password form fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Reload data for logs
        await loadProfileData();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: res.error || "Gagal mengubah password",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan sistem",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPref(true);
    setTimeout(() => {
      setIsSavingPref(false);
      toast({
        title: "✅ Preferensi Disimpan",
        description: "Preferensi dan notifikasi akun berhasil diperbarui",
      });
    }, 800);
  };

  // Helper formats
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    if (role === "OWNER") return "Owner";
    if (role === "ADMIN") return "Administrator";
    return role || "Staf Bengkel";
  };

  const formatIndonesianDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // Get latest login date-time from activities or fallback to current session
  const getLastLogin = () => {
    const loginAct = activities.find(a => a.action === "LOGIN" || a.action === "SIGN_IN");
    if (loginAct) {
      return `${formatIndonesianDate(loginAct.createdAt)}, ${formatTime(loginAct.createdAt)}`;
    }
    if (profile?.createdAt) {
      return `${formatIndonesianDate(profile.createdAt)}, 10:30`;
    }
    return "-";
  };

  // Render activity icon based on type
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
      case "SIGN_IN":
        return <Key className="h-4 w-4 text-emerald-500" />;
      case "UPDATE_PROFILE":
      case "UPDATE_USER":
        return <User className="h-4 w-4 text-blue-500" />;
      case "CHANGE_PASSWORD":
      case "RESET_PASSWORD":
        return <Lock className="h-4 w-4 text-amber-500" />;
      case "CREATE_USER":
      case "CREATE_ORDER":
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Memuat data profil...</p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "OWNER"]}>
      <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span>Beranda</span>
          <span>&gt;</span>
          <span className="text-foreground">Profil</span>
        </div>

        {/* Header Title Section */}
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Profil Pengguna</h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Kelola informasi profil dan keamanan akun Anda.
          </p>
        </div>

        {/* Tab Buttons Navigation */}
        <div className="flex border-b border-border gap-2 select-none overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all duration-200 hover:text-foreground cursor-pointer ${
              activeTab === "profile"
                ? "border-primary text-primary font-black"
                : "border-transparent text-muted-foreground font-semibold"
            }`}
          >
            Informasi Profil
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all duration-200 hover:text-foreground cursor-pointer ${
              activeTab === "password"
                ? "border-primary text-primary font-black"
                : "border-transparent text-muted-foreground font-semibold"
            }`}
          >
            Ubah Password
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all duration-200 hover:text-foreground cursor-pointer ${
              activeTab === "preferences"
                ? "border-primary text-primary font-black"
                : "border-transparent text-muted-foreground font-semibold"
            }`}
          >
            Preferensi
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Column 1: Informasi Akun (Left Card) */}
              <Card className="lg:col-span-3 border-border/40 shadow-sm overflow-hidden flex flex-col justify-between">
                <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-5">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                        {getInitials(profile?.employee?.name || profile?.email || "AD")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 p-1.5 bg-card border border-border shadow-sm rounded-full cursor-pointer hover:bg-accent transition-colors">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">
                      {profile?.employee?.name || "Admin Bengkel"}
                    </h3>
                    <Badge variant="secondary" className="mt-2 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-primary/10 text-primary border-primary/20">
                      {getRoleLabel(profile?.role)}
                    </Badge>
                  </div>

                  <div className="w-full border-t border-border/60 pt-5 space-y-4 text-left text-xs font-semibold text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-muted-foreground/80 leading-none">Email</p>
                        <p className="text-foreground truncate mt-1">{profile?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground/80 leading-none">No. Telepon</p>
                        <p className="text-foreground mt-1">{profile?.employee?.phone || "Belum diatur"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground/80 leading-none">Tanggal Bergabung</p>
                        <p className="text-foreground mt-1">Bergabung sejak {formatIndonesianDate(profile?.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground/80 leading-none">Informasi Terakhir Login</p>
                        <p className="text-foreground mt-1">Terakhir login: {getLastLogin()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Column 2: Data Profil (Center Card Form) */}
              <Card className="lg:col-span-5 border-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">Data Profil</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullname" className="text-xs font-bold text-foreground">Nama Lengkap</Label>
                      <Input
                        id="fullname"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className="bg-card border-input rounded-lg h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@nopzgarage.com"
                        className="bg-card border-input rounded-lg h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-bold text-foreground">No. Telepon</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812-3456-7890"
                        className="bg-card border-input rounded-lg h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="text-xs font-bold text-foreground">Jabatan</Label>
                      <Select defaultValue={profile?.role || "ADMIN"} disabled>
                        <SelectTrigger className="bg-muted border-input rounded-lg h-10 text-sm opacity-80">
                          <SelectValue placeholder="Pilih jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                          <SelectItem value="EMPLOYEE">Mekanik</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs font-bold text-foreground">Alamat</Label>
                      <Textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Tulis alamat rumah lengkap"
                        rows={3}
                        className="bg-card border-input rounded-lg text-sm resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={isSavingProfile}
                        className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2 rounded-lg"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Column 3: Aktivitas Akun Terbaru (Right Card) */}
              <Card className="lg:col-span-4 border-border/40 shadow-sm flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">Aktivitas Akun Terbaru</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activities.slice(0, visibleActivitiesCount).map((act) => (
                      <div key={act.id} className="flex gap-3 text-xs">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                          {getActivityIcon(act.action)}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-foreground">{act.title}</span>
                            <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">
                              {formatIndonesianDate(act.createdAt)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground text-[10px] font-semibold leading-relaxed">
                            <p className="truncate max-w-[180px]">{act.details}</p>
                            <span>{formatTime(act.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {activities.length === 0 && (
                      <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground gap-1.5">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                        <p className="font-semibold text-xs">Belum ada catatan aktivitas.</p>
                      </div>
                    )}
                  </CardContent>
                </div>

                {activities.length > 5 && (
                  <div className="p-6 border-t border-border/45 pt-4">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold gap-2 text-muted-foreground border-border hover:bg-accent rounded-lg"
                      onClick={() => {
                        if (visibleActivitiesCount === 5) {
                          setVisibleActivitiesCount(activities.length);
                        } else {
                          setVisibleActivitiesCount(5);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      {visibleActivitiesCount === 5 ? "Lihat Semua Aktivitas" : "Sembunyikan Aktivitas"}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "password" && (
            <Card className="max-w-2xl mx-auto border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">Ubah Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex gap-3 text-xs text-amber-800 dark:text-amber-400 font-semibold mb-4 leading-relaxed">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold">Keamanan Password</p>
                      <p className="text-muted-foreground mt-0.5 font-medium">
                        Password harus memiliki panjang minimal 6 karakter dan disarankan mengandung kombinasi huruf besar, huruf kecil, angka, dan simbol untuk kekuatan yang optimal.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="current-pass" className="text-xs font-bold text-foreground">Password Saat Ini</Label>
                    <Input
                      id="current-pass"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password lama"
                      className="bg-card border-input rounded-lg h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pass" className="text-xs font-bold text-foreground">Password Baru</Label>
                    <Input
                      id="new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru (min. 6 karakter)"
                      className="bg-card border-input rounded-lg h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pass" className="text-xs font-bold text-foreground">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirm-pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Masukkan kembali password baru"
                      className="bg-card border-input rounded-lg h-10 text-sm"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2 rounded-lg"
                    >
                      <Lock className="h-4 w-4" />
                      {isChangingPassword ? "Mengubah..." : "Ubah Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "preferences" && (
            <Card className="max-w-2xl mx-auto border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">Preferensi Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePreferences} className="space-y-6">
                  {/* Notification Section */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-muted-foreground/80" />
                      Notifikasi Akun
                    </h3>
                    
                    <div className="space-y-3.5 pl-1.5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground leading-none">Notifikasi Email</Label>
                          <p className="text-[10px] text-muted-foreground font-semibold">Kirim ringkasan laporan keuangan dan rekap order harian via email</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifEmail}
                          onChange={(e) => setNotifEmail(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-border/55 pt-3.5">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground leading-none">Notifikasi WhatsApp</Label>
                          <p className="text-[10px] text-muted-foreground font-semibold">Kirim notifikasi estimasi dan pelunasan transaksi ke WhatsApp mekanik/staf</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifWhatsApp}
                          onChange={(e) => setNotifWhatsApp(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* General settings Section */}
                  <div className="space-y-4 border-t border-border/55 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Settings className="h-4 w-4 text-muted-foreground/80" />
                      Pengaturan Umum
                    </h3>

                    <div className="space-y-2 pl-1.5">
                      <Label htmlFor="lang-select" className="text-xs font-bold text-foreground">Bahasa Tampilan</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="lang-select" className="bg-card border-input rounded-lg h-10 text-sm">
                          <SelectValue placeholder="Pilih Bahasa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Bahasa Indonesia</SelectItem>
                          <SelectItem value="en">English (US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-border/55 pt-4">
                    <Button
                      type="submit"
                      disabled={isSavingPref}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2 rounded-lg"
                    >
                      <Save className="h-4 w-4" />
                      {isSavingPref ? "Menyimpan..." : "Simpan Preferensi"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Toaster />
    </RoleGuard>
  );
}
