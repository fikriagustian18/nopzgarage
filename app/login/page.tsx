// app/login/page.tsx - Login Page
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Mail, AlertCircle } from "lucide-react";
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
} from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
         <Image 
            src="/skull.svg" 
            alt="Background Skull" 
            width={1200} 
            height={1200}
            style={{ height: 'auto' }}
            className="object-contain"
            priority
         />
      </div>

      {/* Theme Toggle (Moved to Top Right for better visibility) */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[600px] z-10 relative">
        {/* Login Card */}
        <Card className="border shadow-lg bg-card/40 backdrop-blur-xl pt-6">
          <div className="flex flex-col items-center px-4">
             {/* Logo Replacement - 3x size */}
             <div className="mb-2 relative w-64 h-64"> 
                <Image 
                  src="/logo.svg" 
                  alt="NopzGarage Logo" 
                  fill
                  sizes="(max-width: 768px) 100vw, 256px"
                  className="object-contain"
                  priority
                />
             </div>
            <h1 className="text-3xl font-black text-foreground mb-1 tracking-tight text-center">NopzGarage</h1>
            <p className="text-muted-foreground text-sm text-center">Sistem Manajemen Bengkel</p>
          </div>
          
          <div className="flex justify-center mb-4">
             <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-full h-8"
                onClick={() => router.push("/")}
             >
                ← Kembali ke Beranda
             </Button>
          </div>

          <CardHeader className="space-y-1 pb-4 pt-4">
            <CardTitle className="text-xl font-bold text-center">Masuk</CardTitle>
            <CardDescription className="text-xs text-center">
              Masukkan email dan password untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-bold transition-all hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hover:underline"
                >
                  Lupa password?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2024 NopzGarage. All rights reserved.
        </p>
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
