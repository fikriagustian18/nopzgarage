"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Package,
  Menu,
  Wallet,
  TrendingUp,
  Globe,
  User,
  Database,
  CreditCard,
  Clock,
  Wrench,
  Shield,
  BookOpen,
  Book,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const menuItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/admin/orders/kanban",
      label: "Antrian Servis",
      icon: Clock,
    },
    {
      href: "/admin/pelayanan",
      label: "Pelayanan",
      icon: Wrench,
    },
    {
      href: "/admin/employees",
      label: "Karyawan",
      icon: Users,
    },
    {
      href: "/admin/payroll",
      label: "Gaji & Payroll",
      icon: CreditCard,
    },
    {
      href: "/admin/inventory",
      label: "Inventory",
      icon: Package,
    },
    {
      href: "/admin/expenses",
      label: "Pengeluaran",
      icon: Wallet,
    },
    {
      href: "/admin/income",
      label: "Pemasukan Lain",
      icon: TrendingUp,
    },
    {
      href: "/admin/journal",
      label: "Jurnal Umum",
      icon: BookOpen,
    },
    {
      href: "/admin/transactions",
      label: "Transaksi & Pembayaran",
      icon: CreditCard,
    },
    {
      href: "/admin/finance",
      label: "Keuangan",
      icon: DollarSign,
    },
    {
      href: "/admin/reports",
      label: "Laporan",
      icon: FileText,
    },
    {
      href: "/admin/docs",
      label: "Documentation",
      icon: Book,
    },
    {
      href: "/admin/content",
      label: "Konten Website",
      icon: Globe,
    },
    {
      href: "/admin/media",
      label: "Media Gallery",
      icon: ImagePlus,
    },
    {
      href: "/query",
      label: "Database Console",
      icon: Database,
    },
    {
      href: "/admin/users",
      label: "Pengguna",
      icon: Shield,
    },
    {
      href: "/admin/settings",
      label: "Pengaturan",
      icon: Settings,
    },
    {
      href: "/admin/profile",
      label: "Profil",
      icon: User,
    },
  ];

  const userRole = session?.user?.role;
  const filteredMenuItems = menuItems.filter((item) => {
    if (userRole === "ADMIN") {
      return [
        "/admin",
        "/admin/orders/kanban",
        "/admin/orders",
        "/admin/pelayanan",
        "/admin/inventory",
        "/admin/transactions",
        "/admin/payroll",
        "/admin/profile"
      ].includes(item.href);
    }
    if (userRole === "OWNER") {
      return ![
        "/admin/orders",
        "/admin/pelayanan"
      ].includes(item.href);
    }
    return false;
  });

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
        <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
        <div className="flex flex-col h-full p-6">
          <div className="flex flex-col items-start gap-1 mb-8 group cursor-pointer" onClick={() => { router.push("/"); setOpen(false); }}>
            <div className="relative p-1">
              <Image 
                src="/logo.svg" 
                alt="NopzGarage" 
                width={150} 
                height={35} 
                style={{ height: 'auto' }}
                className="relative z-10"
                priority
              />
            </div>
            <div className="px-1">
              <p className="text-xs text-muted-foreground font-medium tracking-wide">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-white" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                  <span className="font-medium">
                     {item.href === "/admin/payroll" && userRole === "ADMIN" ? "Slip Gaji" : item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 mt-auto border-t border-sidebar-border space-y-3">
             {session && (
              <div className="px-2 py-2 mb-2 flex items-center gap-3 rounded-lg bg-sidebar-accent/50">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{session.user?.employeeName || "Admin"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
