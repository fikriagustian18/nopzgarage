// components/AdminHeader.tsx
"use client";

import { ThemeToggle } from "./ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";
import { MobileSidebar } from "./MobileSidebar";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Globe, ChevronDown } from "lucide-react";

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname === "/admin/orders/kanban") return "Antrian Servis";
    if (pathname.startsWith("/admin/orders")) return "Order Servis";
    if (pathname.startsWith("/admin/pelayanan")) return "Pelayanan";
    if (pathname.startsWith("/admin/transactions")) return "Transaksi & Pembayaran";
    if (pathname.startsWith("/admin/employees")) return "Karyawan";
    if (pathname.startsWith("/admin/payroll")) return "Gaji & Payroll";
    if (pathname.startsWith("/admin/inventory")) return "Inventory";
    if (pathname.startsWith("/admin/expenses")) return "Pengeluaran";
    if (pathname.startsWith("/admin/income")) return "Pemasukan Lain";
    if (pathname.startsWith("/admin/journal")) return "Jurnal Umum";
    if (pathname.startsWith("/admin/finance")) return "Keuangan";
    if (pathname.startsWith("/admin/reports")) return "Laporan";
    if (pathname.startsWith("/admin/docs")) return "Documentation";
    if (pathname.startsWith("/admin/content")) return "Konten Website";
    if (pathname.startsWith("/admin/media")) return "Media Gallery";
    if (pathname.startsWith("/admin/settings")) return "Pengaturan";
    if (pathname.startsWith("/admin/profile")) return "Profil Pengguna";
    return "Dashboard";
  };

  const getRoleLabel = (role?: string) => {
    if (role === "OWNER") return "Owner";
    if (role === "ADMIN") return "Administrator";
    return role || "Administrator";
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Left Side: Mobile Menu & dynamic page title */}
        <div className="flex items-center gap-3 flex-1">
          <MobileSidebar />
          <h1 className="text-lg font-black tracking-tight text-foreground hidden md:block">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationPanel />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-full hover:bg-accent hover:text-accent-foreground select-none cursor-pointer">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(session?.user?.employeeName || session?.user?.email || "AD")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-none text-foreground">{session?.user?.employeeName || "Admin Bengkel"}</span>
                  <span className="text-[10px] leading-none text-muted-foreground mt-1">{getRoleLabel(session?.user?.role)}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.employeeName || "Administrator"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profil Saya</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open('/', '_blank')} className="cursor-pointer">
                <Globe className="mr-2 h-4 w-4" />
                <span>Lihat Landing Page</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
