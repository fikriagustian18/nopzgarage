// app/login/page.tsx - Login Page
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, Lock, User, Eye, EyeOff, ShieldCheck, Settings, Wrench, AlertCircle, Home } from "lucide-react";
import { toast } from "sonner";
import { createForgotPasswordRequest } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); // acts as username/email input
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let emailToSubmit = email.trim();
      const lowerInput = emailToSubmit.toLowerCase();
      
      // Smart mapping for common usernames
      if (lowerInput === "owner") {
        emailToSubmit = "owner@nopzgarage.com";
      } else if (lowerInput === "admin") {
        emailToSubmit = "admin@nopzgarage.com";
      } else if (lowerInput === "mechanic" || lowerInput === "mekanik") {
        emailToSubmit = "mechanic@nopzgarage.com";
      } else if (!emailToSubmit.includes("@")) {
        emailToSubmit = `${emailToSubmit}@nopzgarage.com`;
      }

      const result = await signIn("credentials", {
        email: emailToSubmit,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Fetch session to get user role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      
      // Redirect based on role sesuai flowchart
      if (session?.user?.role === "EMPLOYEE") {
        router.push("/employee");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error("Masukkan email Anda");
      return;
    }

    setForgotLoading(true);
    const result = await createForgotPasswordRequest(forgotEmail);
    setForgotLoading(false);

    if (result.success) {
      toast.success(result.message);
      setForgotPasswordOpen(false);
      setForgotEmail("");
    } else {
      toast.error(result.error || "Gagal mengirim permintaan");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background font-sans relative overflow-hidden">
      {/* Background Skull Image */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-25 pointer-events-none">
        <Image 
          src="/skull.svg" 
          alt="Background Skull" 
          width={1000} 
          height={1000}
          className="object-contain w-full max-w-[800px]"
          style={{ height: 'auto' }}
          priority
        />
      </div>

      {/* Left Panel: Branding & Illustration */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-card/25 dark:bg-card/10 backdrop-blur-sm border-r border-border/40 relative z-10">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="max-w-md text-left">
          <div className="mb-6 relative w-full h-[320px] hover:scale-[1.02] transition-transform duration-500">
            <Image
              src="/motorcycle_garage.png"
              alt="NopzGarage Illustration"
              fill
              className="object-contain dark:invert dark:opacity-80 transition-all"
              priority
            />
          </div>
          <h1 className="text-4xl font-black text-primary tracking-wider mb-2">
            NopzGarage
          </h1>
          <h2 className="text-base font-semibold text-foreground/80 mb-4">
            Sistem Manajemen Antrian Bengkel & Laporan Keuangan
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kelola antrian, pelayanan, inventory, dan laporan keuangan bengkel menjadi lebih mudah dan terintegrasi.
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex items-center justify-center p-6 md:p-12 relative z-10">
        {/* Theme & Back buttons in top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-9 h-9 border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-all hover:bg-primary/10"
                onClick={() => router.push("/")}
                aria-label="Kembali ke Beranda"
              >
                <Home className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              Kembali ke Beranda
            </TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>

        {/* Center Login Container */}
        <div className="w-full max-w-[420px]">
          <Card className="border border-border/60 shadow-xl bg-card/45 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="pt-8 px-6 pb-8 md:px-8">
              {/* Header Gear Logo with Wrench */}
              <div className="relative mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Settings 
                  className="w-12 h-12" 
                  style={{ animation: 'spin 12s linear infinite' }} 
                />
                <Wrench className="w-6 h-6 absolute transform -rotate-45" />
              </div>

              <h2 className="text-2xl font-bold text-center text-foreground tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-xs text-muted-foreground text-center mt-1 mb-6">
                Silakan masuk untuk melanjutkan
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="Masukkan username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-10"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    Ingat saya
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Lupa password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold py-2.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "MASUK"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-2xs uppercase">
                    <span className="bg-card/90 px-2 text-muted-foreground font-medium text-[10px] tracking-wider">
                      atau masuk dengan
                    </span>
                  </div>
                </div>

                {/* Peran / Roles Box */}
                <div className="flex items-start gap-3 p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center justify-center p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground mb-1">
                      Akses berdasarkan peran:
                    </h4>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                      <li>Admin</li>
                      <li>Mekanik</li>
                      <li>Owner</li>
                    </ul>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lupa Password?</DialogTitle>
            <DialogDescription>
              Masukkan email Anda. Admin akan menerima notifikasi dan akan mereset password Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="nama@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForgotPasswordOpen(false)}
              disabled={forgotLoading}
            >
              Batal
            </Button>
            <Button onClick={handleForgotPassword} disabled={forgotLoading}>
              {forgotLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Permintaan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
