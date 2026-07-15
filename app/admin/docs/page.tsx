// app/admin/docs/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  Book, 
  Database, 
  Code, 
  FileText, 
  Package, 
  Settings, 
  BarChart3, 
  CheckCircle2, 
  GitBranch,
  Repeat,
  DollarSign,
  Calculator,
  Lock,
  Folder,
  FolderTree,
  FolderOpen,
  Wrench,
  Users,
  Layers,
  Image,
  LayoutTemplate,
  UserCheck,
  Activity,
  Workflow,
  Network,
  Database as DatabaseIcon,
  Boxes,
  FileCode,
  Shield,
  CreditCard,
  WalletCards,
  KeyRound
} from "lucide-react";
import MermaidDiagram from "@/components/MermaidDiagram";

export default function TechnicalDocsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const stats = {
    totalTables: 15,
    totalRelationships: 20,
    totalEnums: 4,
    totalComponents: 50,
    totalPages: 16,
    totalServerActions: 12,
  };

  const tables = [
    { name: "Order", columns: 14, purpose: "Transaksi servis kendaraan" },
    { name: "OrderItem", columns: 8, purpose: "Detail item order (jasa & sparepart)" },
    { name: "OrderFee", columns: 7, purpose: "Komisi karyawan per order" },
    { name: "Employee", columns: 11, purpose: "Data karyawan bengkel" },
    { name: "User", columns: 10, purpose: "Akun login sistem" },
    { name: "SparePart", columns: 10, purpose: "Master data sparepart & stok" },
    { name: "Payment", columns: 9, purpose: "Pembayaran order & payroll" },
    { name: "Payroll", columns: 10, purpose: "Penggajian karyawan" },
    { name: "BankAccount", columns: 9, purpose: "Master rekening bank" },
    { name: "Account", columns: 6, purpose: "Chart of Accounts (COA)" },
    { name: "JournalEntry", columns: 6, purpose: "Header jurnal akuntansi" },
    { name: "JournalItem", columns: 5, purpose: "Detail jurnal (debit/kredit)" },
    { name: "ActivityLog", columns: 9, purpose: "Audit trail sistem" },
    { name: "SystemSetting", columns: 4, purpose: "Konfigurasi sistem" },
    { name: "ContentSection", columns: 8, purpose: "Konten website dinamis" },
  ];

  const accounts = [
    { code: "101", name: "Kas Tunai", type: "ASSET" },
    { code: "102", name: "Bank", type: "ASSET" },
    { code: "103", name: "Piutang Usaha", type: "ASSET" },
    { code: "111", name: "Persediaan Sparepart", type: "ASSET" },
    { code: "201", name: "Hutang Usaha", type: "LIABILITY" },
    { code: "202", name: "Utang Gaji & Komisi", type: "LIABILITY" },
    { code: "301", name: "Modal Pemilik", type: "EQUITY" },
    { code: "401", name: "Pendapatan Jasa Servis", type: "REVENUE" },
    { code: "402", name: "Pendapatan Penjualan Sparepart", type: "REVENUE" },
    { code: "501", name: "Beban Gaji & Komisi", type: "EXPENSE" },
    { code: "511", name: "Harga Pokok Penjualan (HPP)", type: "EXPENSE" },
  ];

  const components = [
    { name: "PaymentDialog", type: "Dialog", used: "Order Payment" },
    { name: "ProcessOrderDialog", type: "Dialog", used: "Order Processing" },
    { name: "EmployeeDetailDialog", type: "Dialog", used: "Employee Details" },
    { name: "DashboardOverview", type: "Component", used: "Admin Dashboard" },
    { name: "KanbanBoard", type: "Component", used: "Order Tracking" },
    { name: "BankAccountsManager", type: "Component", used: "Bank Settings" },
    { name: "WebsiteContentTab", type: "Component", used: "CMS Settings" },
  ];

  const features = [
    { title: "Order Management", status: "Complete", icon: FileText },
    { title: "Inventory Management", status: "Complete", icon: Package },
    { title: "Employee & Payroll", status: "Complete", icon: Settings },
    { title: "Accounting System", status: "Complete", icon: BarChart3 },
    { title: "Bank Integration", status: "Complete", icon: Database },
    { title: "Financial Reports", status: "Complete", icon: Book },
    { title: "Website CMS", status: "Complete", icon: Code },
  ];

  // Mermaid Definitions based on user's reference files
  const diagrams = {
    erd: `erDiagram
    USER {
        string id PK
        string email UK
        string role
        string employeeId FK
        boolean isActive
    }   
    EMPLOYEE {
        string id PK
        string name
        string role
        string salaryType
        decimal dailyRate
        decimal commissionRate
        boolean isActive
    }
    ORDER {
        string id PK
        string custName
        string vehicle
        string status
        decimal totalPrice
        decimal totalPaid
        string paymentStatus
        string mechanicId FK
    }
    ORDER_ITEM {
        string id PK
        string orderId FK
        string itemType
        string itemName
        int quantity
        decimal unitPrice
        decimal totalPrice
    }
    ORDER_FEE {
        string id PK
        string orderId FK
        string employeeId FK
        decimal amount
        boolean isPaid
    }
    PAYMENT {
        string id PK
        datetime date
        decimal amount
        string orderId FK
        string payrollId FK
        string bankAccountId FK
        string paymentMethod
    }
    BANK_ACCOUNT {
        string id PK
        string bankName
        string accountNumber
        string accountName
        boolean isActive
    }
    JOURNAL_ENTRY {
        string id PK
        datetime date
        string description
        string reference
        string paymentId FK
    }
    JOURNAL_ITEM {
        string id PK
        string journalEntryId FK
        string accountId FK
        decimal debit
        decimal credit
    }
    ACCOUNT {
        string id PK
        string code UK
        string name
        string type
    }
    PAYROLL {
        string id PK
        string employeeId FK
        decimal totalEarned
        string status
    }
    SPARE_PART {
        string id PK
        string code UK
        string name
        int stock
        decimal buyPrice
        decimal sellPrice
    }
    CONTENT_SECTION {
        string id PK
        string sectionKey UK
        string title
        text content
    }

    USER ||--o| EMPLOYEE : "links_to"
    EMPLOYEE ||--o{ ORDER : "handles"
    EMPLOYEE ||--o{ PAYROLL : "receives"
    EMPLOYEE ||--o{ ORDER_FEE : "earns"
    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER ||--o{ ORDER_FEE : "has"
    ORDER ||--o{ PAYMENT : "receives"
    SPARE_PART ||--o{ ORDER_ITEM : "used_in"
    PAYROLL ||--o{ PAYMENT : "paid_via"
    BANK_ACCOUNT ||--o{ PAYMENT : "transfer_to"
    PAYMENT ||--o| JOURNAL_ENTRY : "creates"
    JOURNAL_ENTRY ||--o{ JOURNAL_ITEM : "contains"
    ACCOUNT ||--o{ JOURNAL_ITEM : "in"`,

    dfd0: `flowchart LR
    Customer["CUSTOMER<br/>Pemilik Motor"]
    Owner["OWNER<br/>Pemilik Bengkel"]
    Admin["ADMIN<br/>Staff Admin"]
    Mechanic["MECHANIC<br/>Mekanik"]
    
    System(["0<br/>SISTEM MANAJEMEN<br/>NOPZGARAGE"])
    
    Customer -->|"Data Order"| System
    System -->|"Estimasi & Status"| Customer
    Customer -->|"Pembayaran"| System
    System -->|"Bukti Bayar"| Customer
    
    Owner -->|"Login & Konfigurasi"| System
    System -->|"Laporan & Dashboard"| Owner
    Owner -->|"Persetujuan"| System
    
    Admin -->|"Input Order"| System
    System -->|"Dashboard & Notifikasi"| Admin
    Admin -->|"Manajemen Stok"| System
    
    Mechanic -->|"Update Progress"| System
    System -->|"Daftar Order"| Mechanic
    System -->|"Slip Gaji"| Mechanic`,

    dfd1: `flowchart TB
    Pelanggan["PELANGGAN (Tidak Login)"]
    Admin["ADMIN (Staff Admin)"]
    Mekanik["MEKANIK (Mekanik)"]
    Owner["OWNER (Pemilik Bengkel)"]

    P1(["1.0<br/>Manajemen Pengguna"])
    P2(["2.0<br/>Manajemen Pelayanan<br/>(Antrian & Servis)"])
    P3(["3.0<br/>Manajemen Inventory"])
    P4(["4.0<br/>Transaksi & Pembayaran"])
    P5(["5.0<br/>Laporan & Keuangan"])

    D1[("D1 Users")]
    D2[("D2 Order Servis")]
    D3[("D3 Inventory")]
    D4[("D4 Transaksi")]
    D5[("D5 Keuangan")]

    P1 <-->|"Data Pengguna"| D1
    P1 --> P2

    Pelanggan -->|"Data Booking Servis<br/>Data Kendaraan<br/>Keluhan Kendaraan"| P2
    P2 -->|"Nomor Antrian<br/>Estimasi Biaya<br/>Status Servis<br/>Bukti Pembayaran"| Pelanggan
    Admin -->|"Input Order / Servis"| P2
    P2 -->|"Kelola Pengguna<br/>& Hak Akses"| Admin
    P2 <-->|"Data Order Servis"| D2
    P2 --> P3

    Admin -->|"Daftar Order<br/>Dashboard & Notifikasi"| P3
    Mekanik -->|"Update Progress/Order"| P3
    P3 -->|"Daftar Pekerjaan / Order"| Mekanik
    P3 <-->|"Data Inventory"| D3
    P3 --> P4

    P4 -->|"Slip Gaji"| Mekanik
    Owner -->|"Konfigurasi Sistem"| P4
    P4 <-->|"Data Transaksi"| D4
    P4 --> P5

    Owner -->|"Approval Gaji"| P5
    P5 -->|"Laporan & Dashboard"| Owner
    P5 <-->|"Data Keuangan"| D5`,

    dfd2user: `flowchart TB
    Admin["ADMIN (Staff Admin)"]
    Mekanik["MEKANIK (Mekanik)"]
    Owner["OWNER (Pemilik Bengkel)"]

    P11(["1.1<br/>Login<br/>(Autentikasi Pengguna)"])
    P12(["1.2<br/>Kelola Pengguna<br/>(Tambah, Ubah, Hapus)"])
    P13(["1.3<br/>Kelola Hak Akses<br/>(Assign Role / Hak Akses)"])
    P14(["1.4<br/>Lihat Data Pengguna<br/>dan Hak Akses<br/>(Monitoring)"])

    D1[("D1 Users<br/>- id_user (PK)<br/>- nama<br/>- username<br/>- password<br/>- role_id (FK)<br/>- status")]
    D2[("D2 Hak Akses<br/>- id_role (PK)<br/>- nama_role<br/>- deskripsi<br/>- hak_akses")]

    Admin -->|"Data Login<br/>(username, password)"| P11
    Mekanik -->|"Data Login<br/>(username, password)"| P11
    P11 -->|"Status Login<br/>(berhasil / gagal)"| Admin
    P11 -->|"Status Login<br/>(berhasil / gagal)"| Mekanik
    P11 <-->|"Data Pengguna"| D1
    P11 -->|"Validasi Login"| P12

    Mekanik -->|"Kelola Pengguna<br/>(tambah, ubah, hapus)"| P12
    P12 -->|"Informasi Pengguna<br/>(berhasil disimpan / diubah / dihapus)"| Mekanik
    P12 <-->|"Data Pengguna"| D1
    P12 --> P13

    Owner -->|"Kelola Hak Akses<br/>(ubah role / hak akses)"| P13
    P13 -->|"Informasi Hak Akses<br/>(berhasil disimpan / diubah)"| Owner
    P13 <-->|"Data Hak Akses"| D2
    P13 --> P14

    Owner -->|"Permintaan Data Pengguna<br/>dan Hak Akses"| P14
    P14 -->|"Informasi Data Pengguna<br/>dan Hak Akses"| Owner
    P14 <-->|"Data Pengguna"| D1
    P14 <-->|"Data Hak Akses"| D2`,

    dfd2service: `flowchart TB
    Pelanggan["PELANGGAN (Tidak Login)"]
    Admin["ADMIN (Staff Admin)"]
    Mekanik["MEKANIK (Mekanik)"]

    P21(["2.1<br/>Kelola Booking Servis<br/>(Pembuatan Booking)"])
    P22(["2.2<br/>Kelola Antrian Servis<br/>(Pengelolaan Antrian)"])
    P23(["2.3<br/>Kelola Order Servis<br/>(Pencatatan Order Servis)"])
    P24(["2.4<br/>Kelola Progres Servis<br/>(Update Pekerjaan)"])
    P25(["2.5<br/>Kelola Selesai Servis<br/>(Selesai & Serah Terima)"])

    D1[("D1 Users<br/>- id_user (PK)<br/>- nama")]
    D6[("D6 Booking Servis<br/>- id_booking (PK)<br/>- id_user (FK)<br/>- tgl_booking<br/>- layanan<br/>- kendaraan<br/>- keluhan<br/>- status_booking")]
    D2[("D2 Order Servis<br/>- id_order (PK)<br/>- id_booking (FK)<br/>- tgl_order<br/>- status_order")]
    D7[("D7 Detail Servis<br/>- id_detail (PK)<br/>- id_order (FK)<br/>- pekerjaan<br/>- status_pekerjaan<br/>- keterangan")]

    Pelanggan -->|"Data Booking Servis<br/>(data diri, kendaraan, layanan, keluhan)"| P21
    P21 -->|"Informasi Booking<br/>(berhasil / gagal)"| Pelanggan
    P21 <-->|"Data Pengguna"| D1
    P21 <-->|"Data Booking Servis"| D6
    P21 --> P22

    Admin -->|"Lihat & Kelola Antrian<br/>(atur antrian)"| P22
    P22 -->|"Informasi Antrian<br/>(daftar antrian)"| Admin
    P22 <-->|"Data Booking Servis"| D6
    P22 --> P23

    Mekanik -->|"Input Order Servis<br/>(dari booking / walk-in)"| P23
    P23 -->|"Informasi Order<br/>(berhasil disimpan)"| Mekanik
    P23 <-->|"Data Booking Servis"| D6
    P23 <-->|"Data Order Servis"| D2
    P23 --> P24

    Mekanik -->|"Update Progres / Pekerjaan<br/>(pekerjaan servis)"| P24
    P24 -->|"Informasi Progres<br/>(berhasil diperbarui)"| Mekanik
    P24 <-->|"Data Order Servis"| D2
    P24 <-->|"Data Detail Servis (progres)"| D7
    P24 --> P25

    Mekanik -->|"Konfirmasi Selesai Servis<br/>(selesai & serah terima)"| P25
    P25 -->|"Informasi Selesai Servis<br/>(selesai / tidak selesai)"| Mekanik
    P25 <-->|"Data Order Servis (selesai)"| D2
    P25 <-->|"Data Detail Servis (selesai)"| D7`,

    dfd2inventory: `flowchart TB
    Admin["ADMIN (Staff Admin)"]
    Mekanik["MEKANIK (Mekanik)"]

    P31(["3.1<br/>Kelola Kategori Barang<br/>(Master Kategori)"])
    P32(["3.2<br/>Kelola Barang<br/>(Master Barang)"])
    P33(["3.3<br/>Kelola Stok Masuk<br/>(Penerimaan Barang)"])
    P34(["3.4<br/>Kelola Stok Keluar<br/>(Pemakaian / Penyesuaian)"])
    P35(["3.5<br/>Laporan Inventory<br/>(Stok Barang)"])

    D8[("D8 Kategori Barang<br/>- id_kategori (PK)<br/>- nama_kategori")]
    D3[("D3 Barang<br/>- id_barang (PK)<br/>- id_kategori (FK)<br/>- nama_barang<br/>- satuan<br/>- stok_minimum<br/>- harga_beli<br/>- harga_jual<br/>- status")]
    D9[("D9 Stok Masuk<br/>- id_stok_masuk (PK)<br/>- tgl_masuk<br/>- id_supplier (FK)<br/>- total<br/>- keterangan")]
    D10[("D10 Stok Masuk Detail<br/>- id_detail_masuk (PK)<br/>- id_stok_masuk (FK)<br/>- id_barang (FK)<br/>- qty<br/>- harga_beli")]
    D11[("D11 Stok Keluar<br/>- id_stok_keluar (PK)<br/>- tgl_keluar<br/>- jenis_keluar<br/>- keterangan")]
    D12[("D12 Stok Keluar Detail<br/>- id_detail_keluar (PK)<br/>- id_stok_keluar (FK)<br/>- id_barang (FK)<br/>- qty")]

    Admin -->|"Data Kategori Barang<br/>(tambah, ubah, hapus)"| P31
    P31 -->|"Informasi Kategori Barang<br/>(berhasil disimpan / diubah / dihapus)"| Admin
    P31 <-->|"Data Kategori Barang"| D8
    P31 --> P32

    Admin -->|"Data Barang<br/>(tambah, ubah, hapus)"| P32
    P32 -->|"Informasi Barang<br/>(berhasil disimpan / diubah / dihapus)"| Admin
    P32 <-->|"Data Barang"| D3
    P32 --> P33

    Admin -->|"Data Stok Masuk<br/>(pembelian / penerimaan)"| P33
    P33 -->|"Informasi Stok Masuk<br/>(berhasil disimpan)"| Admin
    P33 <-->|"Data Stok Masuk"| D9
    P33 <-->|"Data Stok Masuk Detail"| D10
    P33 --> P34

    Admin -->|"Data Stok Keluar<br/>(pemakaian / penyesuaian)"| P34
    P34 -->|"Informasi Stok Keluar<br/>(berhasil disimpan)"| Admin
    P34 <-->|"Data Stok Keluar"| D11
    P34 <-->|"Data Stok Keluar Detail"| D12
    P34 --> P35

    Admin -->|"Permintaan Laporan Inventory"| P35
    P35 -->|"Laporan Inventory<br/>(stok barang)"| Admin
    Mekanik -->|"Permintaan Barang<br/>(barang servis)"| P35
    P35 -->|"Informasi Ketersediaan Barang<br/>(tersedia / tidak tersedia)"| Mekanik
    P35 <-->|"Data Inventory"| D12`,

    dfd2transaction: `flowchart TB
    Pelanggan["PELANGGAN (Tidak Login)"]
    Admin["ADMIN (Staff Admin)"]
    Owner["OWNER (Pemilik Bengkel)"]

    P41(["4.1<br/>Kelola Transaksi<br/>(Pencatatan Transaksi)"])
    P42(["4.2<br/>Proses Pembayaran<br/>(Validasi & Konfirmasi)"])
    P43(["4.3<br/>Cetak Bukti Pembayaran<br/>(Pembuatan Bukti)"])
    P44(["4.4<br/>Rekonsiliasi Pembayaran<br/>(Pencocokan & Validasi)"])
    P45(["4.5<br/>Laporan Transaksi & Pembayaran<br/>(Penyusunan Laporan)"])

    D4[("D4 Transaksi<br/>- id_transaksi (PK)<br/>- id_order (FK)<br/>- tgl_transaksi<br/>- total<br/>- metode_bayar<br/>- status_bayar")]
    D13[("D13 Detail Pembayaran<br/>- id_bayar (PK)<br/>- id_transaksi (FK)<br/>- tgl_bayar<br/>- nominal<br/>- metode_bayar<br/>- referensi<br/>- status")]
    D2[("D2 Order Servis<br/>- id_order (PK)<br/>- id_booking (FK)<br/>- tgl_order<br/>- status_order")]

    Pelanggan -->|"Pembayaran<br/>(tunai / non-tunai)"| P41
    P41 -->|"Informasi Pembayaran<br/>(berhasil / gagal)"| Pelanggan
    P41 <-->|"Data Transaksi"| D4
    P41 --> P42

    Admin -->|"Input / Verifikasi Pembayaran<br/>(data pembayaran)"| P42
    P42 -->|"Informasi Status Pembayaran<br/>(berhasil / gagal)"| Admin
    P42 <-->|"Data Transaksi"| D4
    P42 <-->|"Data Detail Pembayaran"| D13
    P42 --> P43

    Admin -->|"Permintaan Cetak Bukti<br/>(id_transaksi)"| P43
    P43 -->|"Bukti Pembayaran<br/>(cetak / digital)"| Admin
    P43 <-->|"Data Transaksi"| D4
    P43 <-->|"Data Detail Pembayaran"| D13
    P43 --> P44

    Admin -->|"Rekonsiliasi Pembayaran<br/>(periode)"| P44
    P44 -->|"Informasi Hasil Rekonsiliasi<br/>(cocok / tidak cocok)"| Admin
    P44 <-->|"Data Transaksi"| D4
    P44 <-->|"Data Detail Pembayaran"| D13
    P44 --> P45

    Admin -->|"Permintaan Laporan Transaksi<br/>dan Pembayaran (periode)"| P45
    P45 -->|"Laporan Transaksi & Pembayaran<br/>(ringkasan)"| Admin
    Owner -->|"Laporan Keuangan<br/>(transaksi & pembayaran)"| P45
    P45 -->|"Laporan Keuangan<br/>(transaksi & pembayaran)"| Owner
    P45 <-->|"Data Transaksi"| D4
    P45 <-->|"Data Detail Pembayaran"| D13
    P45 <-->|"Data Order Servis"| D2`,

    dfd2report: `flowchart TB
    Owner["OWNER (Pemilik Bengkel)"]
    Admin["ADMIN (Staff Admin)"]

    P51(["5.1<br/>Kelola Laporan Penjualan<br/>(Laporan Pendapatan)"])
    P52(["5.2<br/>Kelola Laporan Inventory<br/>(Laporan Persediaan)"])
    P53(["5.3<br/>Kelola Laporan Servis<br/>(Laporan Pekerjaan Servis)"])
    P54(["5.4<br/>Kelola Laporan Keuangan<br/>(Laporan Keuangan)"])
    P55(["5.5<br/>Dashboard & Ringkasan<br/>(Rekapitulasi & Analisis)"])

    D4[("D4 Transaksi<br/>- id_transaksi (PK)<br/>- id_order (FK)<br/>- tgl_transaksi<br/>- total<br/>- metode_bayar<br/>- status_bayar")]
    D3[("D3 Inventory<br/>- id_barang (PK)<br/>- id_kategori (FK)<br/>- nama_barang<br/>- stok_minimum<br/>- harga_beli<br/>- harga_jual")]
    D2[("D2 Order Servis<br/>- id_order (PK)<br/>- id_booking (FK)<br/>- tgl_order<br/>- status_order")]
    D7[("D7 Detail Servis<br/>- id_detail (PK)<br/>- id_order (FK)<br/>- pekerjaan<br/>- status_pekerjaan<br/>- keterangan")]
    D13[("D13 Detail Pembayaran<br/>- id_bayar (PK)<br/>- id_transaksi (FK)<br/>- tgl_bayar<br/>- nominal<br/>- metode_bayar<br/>- status")]

    Owner -->|"Permintaan Laporan Penjualan<br/>(periode)"| P51
    P51 -->|"Laporan Penjualan<br/>(pendapatan)"| Owner
    P51 <-->|"Data Transaksi"| D4
    P51 --> P52

    Admin -->|"Permintaan Laporan Inventory<br/>(periode)"| P52
    P52 -->|"Laporan Inventory<br/>(stok & nilai persediaan)"| Admin
    P52 <-->|"Data Inventory"| D3
    P52 --> P53

    Admin -->|"Permintaan Laporan Servis<br/>(periode / mekanik / jenis servis)"| P53
    P53 -->|"Laporan Servis<br/>(pekerjaan servis)"| Admin
    Admin -->|"Permintaan Laporan Pekerjaan<br/>(pribadi / periode)"| P53
    P53 -->|"Laporan Pekerjaan<br/>(pekerjaan terselesaikan)"| Admin
    P53 <-->|"Data Order Servis"| D2
    P53 <-->|"Data Detail Servis"| D7
    P53 --> P54

    Admin -->|"Permintaan Laporan Keuangan<br/>(periode)"| P54
    P54 -->|"Laporan Keuangan<br/>(laba rugi, arus kas, dll)"| Admin
    P54 <-->|"Data Transaksi"| D4
    P54 --> P55

    Admin -->|"Permintaan Dashboard & Ringkasan<br/>(periode)"| P55
    P55 -->|"Dashboard & Ringkasan<br/>(grafik & ringkasan)"| Admin
    P55 <-->|"Data Pembayaran"| D13
    P55 <-->|"Data Transaksi"| D4
    P55 <-->|"Data Order Servis"| D2
    P55 <-->|"Data Inventory"| D3`,

     flowOrder: `flowchart TD
    Start([Mulai: Customer Datang])
    
    %% Input Order
    Input[Admin Input Order<br/>- Nama Customer<br/>- No. HP<br/>- Data Motor<br/>- Keluhan]
    SaveOrder[(Simpan Order<br/>Status: PENDING)]
    
    %% Estimasi
    Review{Admin Review<br/>Kompleksitas?}
    CheckParts[Cek Sparepart<br/>yang Dibutuhkan]
    InputEstimate[Input Estimasi:<br/>- Item Servis<br/>- Sparepart<br/>- Total Harga]
    UpdateEstimated[(Update Order<br/>Status: ESTIMATED)]
    SendEstimate[Kirim Estimasi<br/>ke Customer]
    
    %% Konfirmasi
    CustomerApprove{Customer<br/>Setuju?}
    Cancelled[(Update Order<br/>Status: CANCELLED)]
    EndCancelled([Selesai:<br/>Order Dibatalkan])
    
    %% Pembayaran DP
    InputDP[Input Pembayaran DP<br/>Min 30%]
    UpdateConfirmed[(Update Order<br/>Status: CONFIRMED<br/>Status Bayar: PARTIAL)]
    
    %% Scheduling
    ScheduleCheck{Cek Jadwal<br/>Tersedia?}
    SelectSlot[Pilih Slot Waktu]
    UpdateScheduled[(Set Jadwal<br/>Status: QUEUE)]
    
    %% Assignment
    AssignMechanic[Tugaskan Mekanik]
    UpdateAssigned[(Set ID Mekanik<br/>Notif ke Mekanik)]
    
    %% Work Process
    MechanicReceive[Mekanik Terima Order]
    StartWork[Mulai Pengerjaan]
    UpdateInProgress[(Update Order<br/>Status: IN_PROGRESS)]
    
    Work[Proses Servis/<br/>Modifikasi]
    Complete[Pekerjaan Selesai]
    UpdateReady[(Update Order<br/>Status: READY)]
    NotifyCustomer[Notifikasi Customer<br/>Motor Siap Diambil]
    
    %% Completion
    CustomerPickup[Customer<br/>Ambil Motor]
    Pelunasan[Pelunasan<br/>Sisa Pembayaran]
    UpdatePaid[(Update Order<br/>Status Bayar: PAID)]
    
    CalculateFee[Hitung Komisi Mekanik]
    SaveFee[(Buat Data OrderFee)]
    
    UpdateCompleted[(Update Order<br/>Status: COMPLETED)]
    GenerateInvoice[Buat Invoice]
    
    End([Selesai:<br/>Order Rampung])
    
    %% Flow
    Start --> Input
    Input --> SaveOrder
    SaveOrder --> Review
    
    Review -->|Jalur Cepat<br/>Servis Ringan| InputEstimate
    Review -->|Jalur Proyek<br/>Modifikasi| CheckParts
    CheckParts --> InputEstimate
    
    InputEstimate --> UpdateEstimated
    UpdateEstimated --> SendEstimate
    SendEstimate --> CustomerApprove
    
    CustomerApprove -->|Tidak| Cancelled
    Cancelled --> EndCancelled
    
    CustomerApprove -->|Ya| InputDP
    InputDP --> UpdateConfirmed
    UpdateConfirmed --> ScheduleCheck
    
    ScheduleCheck -->|Penuh| SelectSlot
    SelectSlot --> ScheduleCheck
    ScheduleCheck -->|Tersedia| UpdateScheduled
    
    UpdateScheduled --> AssignMechanic
    AssignMechanic --> UpdateAssigned
    UpdateAssigned --> MechanicReceive
    MechanicReceive --> StartWork
    StartWork --> UpdateInProgress
    UpdateInProgress --> Work
    Work --> Complete
    Complete --> UpdateReady
    UpdateReady --> NotifyCustomer
    NotifyCustomer --> CustomerPickup
    CustomerPickup --> Pelunasan
    Pelunasan --> UpdatePaid
    UpdatePaid --> CalculateFee
    CalculateFee --> SaveFee
    SaveFee --> UpdateCompleted
    UpdateCompleted --> GenerateInvoice
    GenerateInvoice --> End
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class Input,CheckParts,InputEstimate,InputDP,SelectSlot,AssignMechanic,MechanicReceive,StartWork,Work,Complete,CustomerPickup,Pelunasan,CalculateFee,GenerateInvoice,SendEstimate,NotifyCustomer processStyle
    class Review,CustomerApprove,ScheduleCheck decisionStyle
    class SaveOrder,UpdateEstimated,Cancelled,UpdateConfirmed,UpdateScheduled,UpdateAssigned,UpdateInProgress,UpdateReady,UpdatePaid,SaveFee,UpdateCompleted dataStyle
    class Start,End,EndCancelled startEndStyle`,

    flowPayment: `flowchart TD
    Start([Mulai:<br/>Permintaan Bayar])
    
    %% Determine Payment Type
    PaymentType{Jenis<br/>Pembayaran?}
    
    %% ORDER PAYMENT BRANCH
    OrderPayment[Pembayaran Order]
    GetOrder[(Ambil Data Order)]
    CheckOrderStatus{Status Order<br/>Valid?}
    ErrorOrder[Error:<br/>Order tidak valid]
    
    InputOrderAmount[Input Jumlah<br/>Pembayaran]
    CalcOrderRemaining[Hitung:<br/>Sisa = Total - Terbayar]
    
    ValidateAmount{Jumlah ><br/>Sisa?}
    ErrorAmount[Error:<br/>Jumlah melebihi sisa]
    
    CreateOrderPayment[(Buat Payment<br/>- orderId<br/>- jumlah<br/>- tanggal<br/>- catatan)]
    
    UpdateOrderPaid[(Update Order:<br/>Terbayar += jumlah)]
    
    CheckOrderFull{Terbayar ==<br/>Total?}
    SetOrderPaid[(Set Order:<br/>Status = LUNAS)]
    SetOrderPartial[(Set Order:<br/>Status = PARSIAL)]
    
    CreateOrderJournal[Buat Jurnal Entry:<br/>Dr. Kas<br/>Cr. Pendapatan]
    
    GenerateOrderReceipt[Buat Bukti<br/>Pembayaran]
    
    %% PAYROLL PAYMENT BRANCH
    PayrollPayment[Pembayaran Gaji]
    GetPayroll[(Ambil Data Payroll)]
    CheckPayrollStatus{Payroll<br/>Valid?}
    ErrorPayroll[Error:<br/>Payroll tidak valid]
    
    InputPayrollAmount[Input Jumlah<br/>Pembayaran]
    CalcPayrollRemaining[Hitung:<br/>Sisa = Total Gaji - Terbayar]
    
    ValidatePayrollAmount{Jumlah ><br/>Sisa?}
    ErrorPayrollAmount[Error:<br/>Jumlah melebihi sisa]
    
    CreatePayrollPayment[(Buat Payment<br/>- payrollId<br/>- jumlah<br/>- tanggal<br/>- catatan)]
    
    UpdatePayrollPaid[(Update Payroll:<br/>Terbayar += jumlah)]
    
    CheckPayrollFull{Terbayar ==<br/>Total Gaji?}
    SetPayrollPaid[(Set Payroll:<br/>Status = LUNAS)]
    SetPayrollPartial[(Set Payroll:<br/>Status = PARSIAL)]
    
    CreatePayrollJournal[Buat Jurnal Entry:<br/>Dr. Beban Gaji<br/>Cr. Kas]
    
    GeneratePayrollReceipt[Buat Slip<br/>Pembayaran Gaji]
    
    %% Mark OrderFees as Paid (if exists)
    CheckOrderFees{Ada Komisi<br/>Terkait?}
    MarkFeesPaid[(Tandai Komisi:<br/>Sudah Dibayar)]
    
    %% Common End
    LogActivity[(Catat Aktivitas)]
    SendNotification[Kirim Notifikasi]
    
    Success([Sukses:<br/>Pembayaran Berhasil])
    Failed([Gagal:<br/>Pembayaran Gagal])
    
    %% Main Flow
    Start --> PaymentType
    
    %% ORDER PATH
    PaymentType -->|Order| OrderPayment
    OrderPayment --> GetOrder
    GetOrder --> CheckOrderStatus
    CheckOrderStatus -->|Tidak Valid| ErrorOrder
    ErrorOrder --> Failed
    
    CheckOrderStatus -->|Valid| InputOrderAmount
    InputOrderAmount --> CalcOrderRemaining
    CalcOrderRemaining --> ValidateAmount
    
    ValidateAmount -->|Melebihi| ErrorAmount
    ErrorAmount --> Failed
    
    ValidateAmount -->|OK| CreateOrderPayment
    CreateOrderPayment --> UpdateOrderPaid
    UpdateOrderPaid --> CheckOrderFull
    
    CheckOrderFull -->|Lunas| SetOrderPaid
    CheckOrderFull -->|Parsial| SetOrderPartial
    
    SetOrderPaid --> CreateOrderJournal
    SetOrderPartial --> CreateOrderJournal
    
    CreateOrderJournal --> GenerateOrderReceipt
    GenerateOrderReceipt --> LogActivity
    
    %% PAYROLL PATH
    PaymentType -->|Gaji| PayrollPayment
    PayrollPayment --> GetPayroll
    GetPayroll --> CheckPayrollStatus
    CheckPayrollStatus -->|Tidak Valid| ErrorPayroll
    ErrorPayroll --> Failed
    
    CheckPayrollStatus -->|Valid| InputPayrollAmount
    InputPayrollAmount --> CalcPayrollRemaining
    CalcPayrollRemaining --> ValidatePayrollAmount
    
    ValidatePayrollAmount -->|Melebihi| ErrorPayrollAmount
    ErrorPayrollAmount --> Failed
    
    ValidatePayrollAmount -->|OK| CreatePayrollPayment
    CreatePayrollPayment --> UpdatePayrollPaid
    UpdatePayrollPaid --> CheckPayrollFull
    
    CheckPayrollFull -->|Lunas| SetPayrollPaid
    CheckPayrollFull -->|Parsial| SetPayrollPartial
    
    SetPayrollPaid --> CheckOrderFees
    SetPayrollPartial --> CheckOrderFees
    
    CheckOrderFees -->|Ya| MarkFeesPaid
    CheckOrderFees -->|Tidak| CreatePayrollJournal
    MarkFeesPaid --> CreatePayrollJournal
    
    CreatePayrollJournal --> GeneratePayrollReceipt
    GeneratePayrollReceipt --> LogActivity
    
    %% Common End Flow
    LogActivity --> SendNotification
    SendNotification --> Success
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class OrderPayment,PayrollPayment,InputOrderAmount,CalcOrderRemaining,InputPayrollAmount,CalcPayrollRemaining,CreateOrderJournal,CreatePayrollJournal,GenerateOrderReceipt,GeneratePayrollReceipt,SendNotification processStyle
    class PaymentType,CheckOrderStatus,ValidateAmount,CheckOrderFull,CheckPayrollStatus,ValidatePayrollAmount,CheckPayrollFull,CheckOrderFees decisionStyle
    class GetOrder,CreateOrderPayment,UpdateOrderPaid,SetOrderPaid,SetOrderPartial,GetPayroll,CreatePayrollPayment,UpdatePayrollPaid,SetPayrollPaid,SetPayrollPartial,MarkFeesPaid,LogActivity dataStyle
    class ErrorOrder,ErrorAmount,ErrorPayroll,ErrorPayrollAmount errorStyle
    class Start,Success,Failed startEndStyle`,

    flowPayroll: `flowchart TD
    Start([Mulai:<br/>Generate Payroll])
    
    %% Input Period
    InputPeriod[Input Periode:<br/>- Tanggal Mulai<br/>- Tanggal Akhir]
    GetEmployees[(Ambil Semua<br/>Karyawan Aktif)]
    
    LoopStart{Ada Karyawan<br/>Lagi?}
    EndLoop([Selesai:<br/>Semua Payroll Dibuat])
    
    %% Get Employee
    GetEmployee[(Ambil Data<br/>Karyawan)]
    CheckSalaryType{Tipe<br/>Gaji?}
    
    %% DAILY SALARY CALCULATION
    DailyCalc[Perhitungan HARIAN]
    CountDays[Hitung Hari Kerja<br/>dalam Periode]
    GetDailyRate[(Ambil Rate Harian)]
    CalcDailyBase[Gaji Pokok =<br/>Hari Kerja x Rate]
    
    CheckDailyBonus{Ada Bonus/<br/>Insentif?}
    InputDailyBonus[Input Bonus]
    SetDailyBonus[Bonus = Jumlah]
    SetDailyNoBonus[Bonus = 0]
    
    CalcDailyTotal[Total Pendapatan =<br/>Gaji Pokok + Bonus]
    
    %% COMMISSION SALARY CALCULATION
    CommissionCalc[Perhitungan KOMISI]
    GetOrderFees[(Ambil OrderFee<br/>dalam Periode)]
    
    SumFees[Jumlahkan Semua<br/>OrderFee]
    CalcCommissionBase[Gaji Pokok =<br/>Total Fee]
    
    CheckCommissionBonus{Ada Bonus/<br/>Insentif?}
    InputCommissionBonus[Input Bonus]
    SetCommissionBonus[Bonus = Jumlah]
    SetCommissionNoBonus[Bonus = 0]
    
    CalcCommissionTotal[Total Pendapatan =<br/>Gaji Pokok + Bonus]
    
    %% Common Process
    PrepareDetails[Siapkan Detail JSON:<br/>- Hari Kerja/Jumlah Motor<br/>- Catatan Bonus]
    
    CreatePayroll[(Buat Payroll:<br/>- Employee ID<br/>- Periode<br/>- Gaji Pokok, Bonus<br/>- Total<br/>- Status: UNPAID)]
    
    GenerateSlip[Buat Slip Gaji]
    SendNotification[Kirim Notifikasi<br/>ke Karyawan]
    
    LogActivity[(Catat Aktivitas)]
    
    NextEmployee[Karyawan Selanjutnya]
    
    %% Review Process
    AllGenerated{Semua Payroll<br/>Sudah Dibuat?}
    
    ReviewByOwner[Owner Review<br/>Semua Payroll]
    ApprovalCheck{Owner<br/>Setuju?}
    
    RejectPayrolls[Tolak & Hapus<br/>Payroll]
    EndReject([Selesai:<br/>Payroll Ditolak])
    
    ApprovePayrolls[Setujui Payroll]
    NotifyFinance[Notifikasi ke<br/>Keuangan untuk Bayar]
    
    Success([Sukses:<br/>Payroll Siap])
    
    %% Main Flow
    Start --> InputPeriod
    InputPeriod --> GetEmployees
    GetEmployees --> LoopStart
    
    LoopStart -->|Ya| GetEmployee
    LoopStart -->|Tidak| AllGenerated
    
    GetEmployee --> CheckSalaryType
    
    %% DAILY BRANCH
    CheckSalaryType -->|HARIAN| DailyCalc
    DailyCalc --> CountDays
    CountDays --> GetDailyRate
    GetDailyRate --> CalcDailyBase
    CalcDailyBase --> CheckDailyBonus
    
    CheckDailyBonus -->|Ya| InputDailyBonus
    InputDailyBonus --> SetDailyBonus
    CheckDailyBonus -->|Tidak| SetDailyNoBonus
    
    SetDailyBonus --> CalcDailyTotal
    SetDailyNoBonus --> CalcDailyTotal
    
    CalcDailyTotal --> PrepareDetails
    
    %% COMMISSION BRANCH
    CheckSalaryType -->|KOMISI| CommissionCalc
    CommissionCalc --> GetOrderFees
    GetOrderFees --> SumFees
    SumFees --> CalcCommissionBase
    CalcCommissionBase --> CheckCommissionBonus
    
    CheckCommissionBonus -->|Ya| InputCommissionBonus
    InputCommissionBonus --> SetCommissionBonus
    CheckCommissionBonus -->|Tidak| SetCommissionNoBonus
    
    SetCommissionBonus --> CalcCommissionTotal
    SetCommissionNoBonus --> CalcCommissionTotal
    
    CalcCommissionTotal --> PrepareDetails
    
    %% Common Flow
    PrepareDetails --> CreatePayroll
    CreatePayroll --> GenerateSlip
    GenerateSlip --> SendNotification
    SendNotification --> LogActivity
    LogActivity --> NextEmployee
    NextEmployee --> LoopStart
    
    %% Review Flow
    AllGenerated -->|Ya| ReviewByOwner
    ReviewByOwner --> ApprovalCheck
    
    ApprovalCheck -->|Tolak| RejectPayrolls
    RejectPayrolls --> EndReject
    
    ApprovalCheck -->|Setuju| ApprovePayrolls
    ApprovePayrolls --> NotifyFinance
    NotifyFinance --> Success
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef calcStyle fill:#b3e5fc,stroke:#0277bd,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputPeriod,DailyCalc,CommissionCalc,InputDailyBonus,InputCommissionBonus,GenerateSlip,SendNotification,NextEmployee,ReviewByOwner,ApprovePayrolls,RejectPayrolls,NotifyFinance processStyle
    class LoopStart,CheckSalaryType,CheckDailyBonus,CheckCommissionBonus,AllGenerated,ApprovalCheck decisionStyle
    class GetEmployees,GetEmployee,GetDailyRate,GetOrderFees,CreatePayroll,LogActivity dataStyle
    class CountDays,CalcDailyBase,SetDailyBonus,SetDailyNoBonus,CalcDailyTotal,SumFees,CalcCommissionBase,SetCommissionBonus,SetCommissionNoBonus,CalcCommissionTotal,PrepareDetails calcStyle
    class Start,EndLoop,EndReject,Success startEndStyle`,
    
    flowAuthLogin: `flowchart TD
    Start([Mulai: Login User])
    
    InputCredentials[Input:<br/>- Email<br/>- Password]
    
    FindUser[(Cari User<br/>berdasarkan Email)]
    
    UserExists{User<br/>Ditemukan?}
    ErrorNotFound[Error:<br/>Email tidak terdaftar]
    
    CheckActive{User<br/>Aktif?}
    ErrorInactive[Error:<br/>Akun tidak aktif]
    
    VerifyPassword[Verifikasi Password<br/>menggunakan bcrypt]
    
    PasswordMatch{Password<br/>Cocok?}
    ErrorPassword[Error:<br/>Password salah]
    
    GetUserRole[(Ambil Role User:<br/>OWNER/ADMIN/EMPLOYEE)]
    
    CheckEmployee{Role ==<br/>EMPLOYEE?}
    GetEmployeeData[(Ambil Data Karyawan)]
    
    GenerateToken["Generate JWT Token:<br/>- userId, email<br/>- role, employeeId"]
    
    CreateSession[(Buat Sesi Login)]
    LogLoginActivity[(Catat Aktivitas:<br/>LOGIN_SUCCESS)]
    
    SendTokenSuccess["Kirim Respon:<br/>- Token<br/>- User Data"]
    
    EndLoginSuccess([Sukses:<br/>Login Berhasil])
    
    LoginFailed([Gagal:<br/>Login Gagal])
    
    %% Login Flow
    Start --> InputCredentials
    InputCredentials --> FindUser
    FindUser --> UserExists
    
    UserExists -->|Tidak| ErrorNotFound
    ErrorNotFound --> LoginFailed
    
    UserExists -->|Ya| CheckActive
    
    CheckActive -->|Tidak| ErrorInactive
    ErrorInactive --> LoginFailed
    
    CheckActive -->|Ya| VerifyPassword
    VerifyPassword --> PasswordMatch
    
    PasswordMatch -->|Tidak| ErrorPassword
    ErrorPassword --> LoginFailed
    
    PasswordMatch -->|Ya| GetUserRole
    GetUserRole --> CheckEmployee
    
    CheckEmployee -->|Ya| GetEmployeeData
    CheckEmployee -->|Tidak| GenerateToken
    GetEmployeeData --> GenerateToken
    
    GenerateToken --> CreateSession
    CreateSession --> LogLoginActivity
    LogLoginActivity --> SendTokenSuccess
    SendTokenSuccess --> EndLoginSuccess
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputCredentials,VerifyPassword,GenerateToken,SendTokenSuccess processStyle
    class UserExists,CheckActive,PasswordMatch,CheckEmployee decisionStyle
    class FindUser,CreateSession,LogLoginActivity,GetUserRole,GetEmployeeData dataStyle
    class ErrorNotFound,ErrorInactive,ErrorPassword errorStyle
    class Start,EndLoginSuccess,LoginFailed startEndStyle`,

    flowAuthForgot: `flowchart TD
    Start([Mulai: Lupa Password])
    
    InputEmail[Input Email]
    
    FindUserForgot[(Cari User<br/>berdasarkan Email)]
    
    UserExistsForgot{User<br/>Ditemukan?}
    ErrorNotFoundForgot[Error:<br/>Email tidak terdaftar]
    
    CheckRole{Role User?}
    
    %% Owner/Admin Path - Can Reset Directly
    GenerateResetToken["Generate<br/>Token Reset<br/>Kedaluwarsa 24 jam"]
    
    SaveResetToken[(Simpan:<br/>- resetToken<br/>- Expiry)]
    
    SendResetEmail[Kirim Email:<br/>Link Reset + Token]
    
    SuccessEmailSent([Sukses:<br/>Email Reset Dikirim])
    
    %% Employee Path - Request to Owner
    CreateForgotRequest[(Buat Request<br/>Lupa Password<br/>Status: PENDING)]
    
    NotifyOwner[Notifikasi ke Owner<br/>untuk Persetujuan]
    
    SuccessRequestCreated([Sukses:<br/>Request Dibuat])
    
    FailedForgot([Gagal])
    
    %% Forgot Flow
    Start --> InputEmail
    InputEmail --> FindUserForgot
    FindUserForgot --> UserExistsForgot
    
    UserExistsForgot -->|Tidak| ErrorNotFoundForgot
    ErrorNotFoundForgot --> FailedForgot
    
    UserExistsForgot -->|Ya| CheckRole
    
    CheckRole -->|OWNER/ADMIN| GenerateResetToken
    GenerateResetToken --> SaveResetToken
    SaveResetToken --> SendResetEmail
    SendResetEmail --> SuccessEmailSent
    
    CheckRole -->|EMPLOYEE| CreateForgotRequest
    CreateForgotRequest --> NotifyOwner
    NotifyOwner --> SuccessRequestCreated
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputEmail,SendResetEmail,NotifyOwner processStyle
    class UserExistsForgot,CheckRole decisionStyle
    class FindUserForgot,GenerateResetToken,SaveResetToken,CreateForgotRequest dataStyle
    class ErrorNotFoundForgot errorStyle
    class Start,SuccessEmailSent,SuccessRequestCreated,FailedForgot startEndStyle`,

    flowAuthReset: `flowchart TD
    Start([Mulai: Reset Password])
    
    InputToken[Input:<br/>- Token Reset<br/>- Password Baru]
    
    FindUserByToken[(Cari User<br/>via Token)]
    
    TokenValid{Token<br/>Valid?}
    ErrorInvalidToken[Error:<br/>Token tidak valid]
    
    CheckExpiry{Token<br/>Expired?}
    ErrorExpiredToken[Error:<br/>Token sudah expired]
    
    HashNewPassword[Hash Password Baru]
    
    UpdatePassword[(Update User:<br/>- Password Baru<br/>- Hapus Token)]
    
    LogResetActivity[(Catat Aktivitas:<br/>PASSWORD_RESET)]
    
    SendConfirmEmail[Kirim Email:<br/>Password Berhasil Direset]
    
    SuccessReset([Sukses:<br/>Password Berhasil Direset])
    
    FailedReset([Gagal])
    
    %% Reset Flow
    Start --> InputToken
    InputToken --> FindUserByToken
    FindUserByToken --> TokenValid
    
    TokenValid -->|Tidak| ErrorInvalidToken
    ErrorInvalidToken --> FailedReset
    
    TokenValid -->|Ya| CheckExpiry
    
    CheckExpiry -->|Ya| ErrorExpiredToken
    ErrorExpiredToken --> FailedReset
    
    CheckExpiry -->|Tidak| HashNewPassword
    HashNewPassword --> UpdatePassword
    UpdatePassword --> LogResetActivity
    LogResetActivity --> SendConfirmEmail
    SendConfirmEmail --> SuccessReset
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputToken,HashNewPassword,SendConfirmEmail processStyle
    class TokenValid,CheckExpiry decisionStyle
    class FindUserByToken,UpdatePassword,LogResetActivity dataStyle
    class ErrorInvalidToken,ErrorExpiredToken errorStyle
    class Start,SuccessReset,FailedReset startEndStyle`,

    flowAuthResolve: `flowchart TD
    Start([Mulai: Review Admin])
    
    GetPendingRequests[(Ambil Request<br/>Pending)]
    
    OwnerAction{Aksi<br/>Owner?}
    
    %% Approve Path
    GenerateEmployeeToken[Generate<br/>Token Reset<br/>untuk Employee]
    
    SaveEmployeeToken[(Simpan Token<br/>ke User)]
    
    MarkResolved[(Update Request:<br/>- Status: RESOLVED<br/>- Oleh: Owner)]
    
    SendEmployeeEmail[Kirim Email:<br/>Link Reset ke Employee]
    
    SuccessApprove([Sukses:<br/>Request Disetujui])
    
    %% Reject Path
    MarkRejected[(Update Request:<br/>- Status: REJECTED<br/>- Oleh: Owner)]
    
    NotifyEmployeeReject[Notif Employee:<br/>Request Ditolak]
    
    SuccessReject([Sukses:<br/>Request Ditolak])
    
    %% Resolve Flow
    Start --> GetPendingRequests
    GetPendingRequests --> OwnerAction
    
    OwnerAction -->|Setuju| GenerateEmployeeToken
    GenerateEmployeeToken --> SaveEmployeeToken
    SaveEmployeeToken --> MarkResolved
    MarkResolved --> SendEmployeeEmail
    SendEmployeeEmail --> SuccessApprove
    
    OwnerAction -->|Tolak| MarkRejected
    MarkRejected --> NotifyEmployeeReject
    NotifyEmployeeReject --> SuccessReject
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class GenerateEmployeeToken,SendEmployeeEmail,NotifyEmployeeReject processStyle
    class OwnerAction decisionStyle
    class GetPendingRequests,SaveEmployeeToken,MarkResolved,MarkRejected dataStyle
    class Start,SuccessApprove,SuccessReject startEndStyle`,

    useCase: `flowchart LR
    subgraph Actors["👥 AKTOR SISTEM"]
        Customer(["👤 Pelanggan"])
        Mechanic(["🔧 Mekanik"])
        Admin(["💼 Admin"])
        Owner(["👔 Owner"])
    end

    subgraph PublicFeatures["🌐 FITUR PUBLIK"]
        UC1["Booking Servis"]
        UC2["Cek Status Order"]
        UC3["Lihat Antrian Publik"]
    end

    subgraph AdminFeatures["⚙️ FITUR ADMIN"]
        UC4["Input Order"]
        UC5["Kelola Inventory"]
        UC6["Proses Pembayaran"]
    end

    subgraph MechanicFeatures["🔨 FITUR MEKANIK"]
        UC7["Kerjakan Servis"]
        UC8["Lihat Slip Gaji"]
    end

    subgraph OwnerFeatures["📊 FITUR OWNER"]
        UC9["Lihat Laporan Keuangan"]
        UC10["Approval Gaji"]
        UC11["Kelola User dan Akses"]
    end

    %% Customer Connections
    Customer -.-> UC1
    Customer -.-> UC2
    Customer -.-> UC3

    %% Admin Connections
    Admin -.-> UC4
    Admin -.-> UC5
    Admin -.-> UC6
    Admin -.-> UC2

    %% Mechanic Connections
    Mechanic -.-> UC7
    Mechanic -.-> UC8
    Mechanic -.-> UC3

    %% Owner Connections
    Owner -.-> UC9
    Owner -.-> UC10
    Owner -.-> UC11
    Owner -.-> UC5

    %% Styling
    classDef actorStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#000
    classDef publicStyle fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef adminStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef mechanicStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef ownerStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class Customer,Mechanic,Admin,Owner actorStyle
    class UC1,UC2,UC3 publicStyle
    class UC4,UC5,UC6 adminStyle
    class UC7,UC8 mechanicStyle
    class UC9,UC10,UC11 ownerStyle`,

    seqAuth: `sequenceDiagram
    participant User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database

    User->>FE: Input Email & Password
    FE->>API: POST /api/auth/login
    API->>DB: Cari User by Email
    
    alt User Tidak Ditemukan
        DB-->>API: null
        API-->>FE: Error (Email salah)
        FE-->>User: Tampilkan Error
    else User Ditemukan
        DB-->>API: Data User (Hash Password)
        API->>API: Validasi Password (Bcrypt)
        
        alt Password Salah
            API-->>FE: Error (Password salah)
            FE-->>User: Tampilkan Error
        else Password Valid
            API->>DB: Get Role & Employee Data
            DB-->>API: Role Access
            API->>API: Generate JWT Token
            API-->>FE: Return Session Data + Token
            FE->>FE: Simpan Session
            FE-->>User: Redirect ke Dashboard
        end
    end`,

    seqOrder: `sequenceDiagram
    participant Cust as Customer
    participant Admin
    participant Sys as Sistem
    participant Mech as Mekanik

    Cust->>Admin: Datang bawa motor
    Admin->>Sys: Input Data Order (Pending)
    Sys->>Sys: Generate Order ID
    
    Admin->>Sys: Cek Kerusakan
    Sys-->>Admin: Data Sparepart & Jasa
    Admin->>Sys: Input Estimasi Biaya
    Sys->>Cust: Kirim Estimasi (via WA/App)
    
    Cust->>Admin: Konfirmasi Setuju
    Admin->>Sys: Update Status -> Confirmed
    
    Admin->>Sys: Assign Mekanik
    Sys->>Mech: Notifikasi Order Baru
    
    Mech->>Sys: Start Pengerjaan
    Sys->>Sys: Kurangi Stok Sparepart
    
    Mech->>Sys: Selesai Pengerjaan
    Sys->>Cust: Notifikasi Unit Ready
    
    Cust->>Admin: Bayar
    Admin->>Sys: Input Payment
    Sys->>Sys: Create Jurnal Akuntansi
    Sys->>Sys: Update Status -> Completed`,

    dfdHighLevel: `graph TD
    %% Entities
    Customer((Customer/Pengunjung))
    Admin((Admin Terotorisasi))
    Mechanic((Mekanik))
    SystemDB[(Sistem Database)]

    %% Flow 1: Booking
    Customer -- "1. Melakukan Booking (Form Web)" --> S1[Aksi: Buat Booking]
    S1 -->|"Simpan (PENDING)"| SystemDB
    SystemDB -->|"Notifikasi Order Baru"| Admin

    %% Flow 2: Estimation
    Admin -- "2. Review & Estimasi (Input Servis/Part)" --> S2[Aksi: Update Estimasi]
    S2 -->|"Update Status (ESTIMATED)"| SystemDB
    
    %% Flow 3: Confirmation
    Customer -- "3. Setuju Estimasi" --> S3[Aksi: Konfirmasi Order]
    S3 -->|"Update Status (CONFIRMED)"| SystemDB
    S3 -->|"Masuk Antrian (QUEUE)"| Mechanic

    %% Flow 4: Processing
    Mechanic -- "4. Mengerjakan Servis" --> S4[Aksi: Proses Order]
    S4 -->|"Update Status (IN_PROGRESS)"| SystemDB
    S4 -->|"Kurangi Stok Sparepart"| SystemDB
    S4 -->|"Catat Log Keamanan"| SystemDB

    %% Flow 5: Completion
    Mechanic -- "5. Selesai Pengerjaan" --> S5[Aksi: Selesai Order]
    S5 -->|"Update Status (READY)"| SystemDB
    SystemDB -->|"Notifikasi Unit Siap"| Customer

    %% Flow 6: Payment & Closing
    Customer -- "6. Pembayaran" --> Admin
    Admin -- "7. Input Pembayaran" --> S6[Aksi: Proses Pembayaran]
    S6 -->|"Update Status (COMPLETED)"| SystemDB
    S6 -->|"Catat Jurnal Keuangan (Akuntansi)"| SystemDB`,

    seqFinance: `sequenceDiagram
    participant Admin as Admin/Kasir
    participant BO as Sistem Order
    participant INV as Sistem Inventory
    participant ACC as Sistem Akuntansi
    participant BNK as Rekening Bank/Kas

    Note over Admin, BNK: Skenario 1: Penggunaan Sparepart (HPP)
    Admin->>BO: Proses Order (Pasang Sparepart)
    BO->>INV: Cek & Kurangi Stok
    INV->>ACC: Buat Jurnal Entry (HPP)
    ACC->>ACC: Debit: HPP (Beban)<br/>Kredit: Persediaan (Aset)

    Note over Admin, BNK: Skenario 2: Pembayaran Customer
    Admin->>BO: Input Pembayaran (Terima Uang)
    BO->>ACC: Buat Jurnal Entry (Pendapatan)
    ACC->>ACC: Debit: Kas/Bank (Aset)<br/>Kredit: Pendapatan Jasa (Income)
    BO->>BNK: Update Saldo Rekening`,

    flowLanding: `flowchart TD
    Start([Mulai: Kunjungan User])
    
    %% Main Sections
    Hero[Lihat Hero Section]
    Services[Lihat Layanan]
    Socials[Lihat Media Sosial]
    
    %% Actions
    ActionCheck{Aksi User?}
    
    %% Booking Path
    PathBooking[Booking Servis]
    FormBooking[Isi Form Booking:<br/>- Nama, HP<br/>- Detail Kendaraan<br/>- Keluhan]
    Validation{Valid?}
    ErrorValid[Tampilkan Error]
    SubmitBooking[Kirim Order]
    SaveDB[(Buat Order PENDING)]
    SuccessBooking[Tampilkan Sukses &<br/>ID Referensi]
    
    %% Tracking Path
    PathTrack[Lacak Order]
    InputTrack[Input Plat No / HP]
    SearchDB[(Cari Order)]
    Found{Ditemukan?}
    ShowStatus["Tampilkan Status Order<br/>(Antrian/Proses/Selesai)"]
    ShowNotFound["Tampilkan 'Tidak Ditemukan'"]
    
    %% Kanban Path
    PathKanban[Kanban Publik]
    LoadKanban[(Ambil Order Publik)]
    DisplayBoard[Tampilkan Papan Antrian]
    
    %% Flow
    Start --> Hero
    Hero --> Services
    Services --> Socials
    Socials --> ActionCheck
    
    ActionCheck -->|Book Sekarang| PathBooking
    PathBooking --> FormBooking
    FormBooking --> Validation
    
    Validation -->|Tidak| ErrorValid
    ErrorValid --> FormBooking
    
    Validation -->|Ya| SubmitBooking
    SubmitBooking --> SaveDB
    SaveDB --> SuccessBooking
    
    ActionCheck -->|Cek Status| PathTrack
    PathTrack --> InputTrack
    InputTrack --> SearchDB
    SearchDB --> Found
    
    Found -->|Ya| ShowStatus
    Found -->|Tidak| ShowNotFound
    
    ActionCheck -->|Lihat Antrian| PathKanban
    PathKanban --> LoadKanban
    LoadKanban --> DisplayBoard
    
    %% Styling
    classDef action fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px;
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px;
    
    class ActionCheck,Validation,Found action;
    class SuccessBooking,ShowStatus success;
    class ErrorValid,ShowNotFound error;`,

    flowCMS: `flowchart TD
    Start([Mulai: Admin CMS])
    
    %% Navigation
    Dashboard[Dashboard Admin]
    TabContent[Tab Konten & Media]
    
    %% Selection
    SelectFeature{Kelola Apa?}
    
    %% 1. Media Gallery
    FlowMedia[Galeri Media]
    ActionMedia{Aksi?}
    
    UploadImg[Upload Gambar]
    SaveStorage[(Simpan ke /public/uploads)]
    CreateRecord[(Buat Data Media)]
    
    ToggleMedia[Ubah Visibilitas]
    UpdateStatus[(Update Status Aktif)]
    
    DeleteMedia[Hapus Gambar]
    RemoveFile[(Hapus File & Data)]
    
    %% 2. Social Embeds
    FlowSocial[Embed Sosial Media]
    InputUrl[Input URL TikTok/IG]
    DetectPlatform[Deteksi Platform]
    SaveEmbed[(Simpan SocialEmbed)]
    
    %% 3. Text Content
    FlowText[Bagian Teks]
    SelectSection[Pilih Bagian:<br/>Hero/About/Contact]
    EditContent[Edit Judul/Isi]
    SaveContent[(Update ContentSection)]
    
    %% Public Update
    Revalidate[Revalidasi Cache Next.js]
    UpdatePublic[Landing Page Terupdate]
    
    %% Connections
    Start --> Dashboard
    Dashboard --> TabContent
    TabContent --> SelectFeature
    
    %% Media Branch
    SelectFeature -->|Media| FlowMedia
    FlowMedia --> ActionMedia
    
    ActionMedia -->|Upload| UploadImg
    UploadImg --> SaveStorage
    SaveStorage --> CreateRecord
    CreateRecord --> Revalidate
    
    ActionMedia -->|Ubah| ToggleMedia
    ToggleMedia --> UpdateStatus
    UpdateStatus --> Revalidate
    
    ActionMedia -->|Hapus| DeleteMedia
    DeleteMedia --> RemoveFile
    RemoveFile --> Revalidate
    
    %% Social Branch
    SelectFeature -->|Sosial| FlowSocial
    FlowSocial --> InputUrl
    InputUrl --> DetectPlatform
    DetectPlatform --> SaveEmbed
    SaveEmbed --> Revalidate
    
    %% Text Branch
    SelectFeature -->|Teks| FlowText
    FlowText --> SelectSection
    SelectSection --> EditContent
    EditContent --> SaveContent
    SaveContent --> Revalidate
    
    Revalidate --> UpdatePublic`
  };

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background p-4 md:p-8">
        {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">
             Technical Documentation
          </h1>
          <p className="text-muted-foreground">NopzGarage Management System v2.1.0</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalTables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Relations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalRelationships}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Enums</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalEnums}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalComponents}+</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalPages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalServerActions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="accounts">COA</TabsTrigger>
          <TabsTrigger value="diagrams">Diagrams</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  **NopzGarage Management System** adalah sistem manajemen bengkel motor berbasis web yang komprehensif,
                  dirancang untuk mendigitalkan seluruh operasional bengkel motor. Sistem ini mencakup manajemen order,
                  inventori, payroll, akuntansi double-entry, pelaporan keuangan, dan portal publik untuk pelanggan.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Tech Stack</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Badge variant="secondary">Next.js 14</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                  <Badge variant="secondary">Prisma ORM</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                  <Badge variant="secondary">Shadcn/UI</Badge>
                  <Badge variant="secondary">NextAuth.js</Badge>
                  <Badge variant="secondary">Recharts</Badge>
                  <Badge variant="secondary">Mermaid.js</Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Architecture</h3>
                <Badge variant="outline" className="mr-2">App Router</Badge>
                <Badge variant="outline" className="mr-2">Server Components</Badge>
                <Badge variant="outline" className="mr-2">Server Actions</Badge>
                <Badge variant="outline">Type-Safe</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Schema ({tables.length} Tables)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{table.name}</div>
                      <div className="text-sm text-muted-foreground">{table.purpose}</div>
                    </div>
                    <Badge variant="outline">{table.columns} columns</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart of Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Chart of Accounts ({accounts.length} Accounts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.code}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">{account.code}</Badge>
                      <div className="font-medium">{account.name}</div>
                    </div>
                    <Badge
                      variant={
                        account.type === "ASSET"
                          ? "default"
                          : account.type === "REVENUE"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {account.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagrams Tab - UPDATED */}
        <TabsContent value="diagrams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                System Diagrams (Updated v2.1.0)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                
                {/* DFD Level 0 (Context) */}
                <AccordionItem value="dfd0">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-slate-500" />
                    DFD Level 0 - Context Diagram
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfd0} />
                  </AccordionContent>
                </AccordionItem>

                {/* High Level Flow */}
                <AccordionItem value="dfdHighLevel">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-500" />
                    High-Level Order Flow (Overview)
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfdHighLevel} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Diagram ini memberikan gambaran ringkas bagaimana user berinteraksi dengan sistem dari pemesanan hingga penyelesaian.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Use Case */}
                <AccordionItem value="useCase">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-purple-500" />
                    Use Case Diagram
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.useCase} />
                  </AccordionContent>
                </AccordionItem>

                 {/* Sequence: Auth */}
                <AccordionItem value="seqAuth">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-500" />
                    Sequence Diagram: Authentication
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.seqAuth} />
                    <p className="mt-2 text-sm text-muted-foreground">
                       Alur detil proses login user, validasi password, dan pembuatan sesi.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Sequence: Order */}
                <AccordionItem value="seqOrder">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Sequence Diagram: Order Processing
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.seqOrder} />
                    <p className="mt-2 text-sm text-muted-foreground">
                       Interaksi antar entitas sistem saat memproses order servismotor.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Finance Sequence */}
                <AccordionItem value="seqFinance">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Financial & Accounting Sequence (Auto-Journal)
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.seqFinance} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Diagram sequence ini menjelaskan bagaimana transaksi operasional (seperti pemakaian sparepart dan pembayaran) 
                      secara otomatis memicu pencatatan akuntansi (Jurnal HPP, Jurnal Pendapatan) secara real-time.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* ERD */}
                <AccordionItem value="erd">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5 text-cyan-500" />
                    Entity Relationship Diagram (ERD)
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.erd} />
                  </AccordionContent>
                </AccordionItem>

                {/* DFD Level 1 */}
                <AccordionItem value="dfd1">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Network className="h-5 w-5 text-blue-500" />
                    DFD Level 1 - Main Processes
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfd1} />
                  </AccordionContent>
                </AccordionItem>

                 {/* DFD Level 2 User Management */}
                 <AccordionItem value="dfd2user">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    DFD Level 2 - 1.0 Manajemen Pengguna
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfd2user} />
                  </AccordionContent>
                </AccordionItem>

                 {/* DFD Level 2 Service Management */}
                 <AccordionItem value="dfd2service">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-sky-500" />
                    DFD Level 2 - 2.0 Manajemen Pelayanan (Antrian & Servis)
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfd2service} />
                  </AccordionContent>
                </AccordionItem>

                 {/* DFD Level 2 Inventory Management */}
                 <AccordionItem value="dfd2inventory">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-500" />
                    DFD Level 2 - 3.0 Manajemen Inventory (Stok Barang)
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfd2inventory} />
                  </AccordionContent>
                </AccordionItem>

                {/* DFD Level 2 Transaction & Payment */}
                <AccordionItem value="dfd2transaction">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                    DFD Level 2 - 4.0 Transaksi & Pembayaran
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfd2transaction} />
                  </AccordionContent>
                </AccordionItem>

                {/* DFD Level 2 Report & Finance */}
                <AccordionItem value="dfd2report">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    DFD Level 2 - 5.0 Laporan & Keuangan
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.dfd2report} />
                  </AccordionContent>
                </AccordionItem>
                
                 {/* Flowchart: Order Process */}
                 <AccordionItem value="flowOrder">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-blue-500" />
                    Flowchart 1: Order Processing Logic
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowOrder} />
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: Payment Process */}
                 <AccordionItem value="flowPayment">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Flowchart 2: Payment & Journal Logic
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowPayment} />
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: Payroll Calculation */}
                 <AccordionItem value="flowPayroll">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <WalletCards className="h-5 w-5 text-teal-600" />
                    Flowchart 3: Payroll Calculation Logic
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowPayroll} />
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: Authentication - Login */}
                 <AccordionItem value="flowAuthLogin">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Flowchart 4A: Login Process
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowAuthLogin} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Alur lengkap proses login dari input kredensial hingga pembuatan sesi.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: Authentication - Forgot Password */}
                 <AccordionItem value="flowAuthForgot">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-orange-600" />
                    Flowchart 4B: Forgot Password Process
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowAuthForgot} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Alur permintaan reset password untuk Owner/Admin dan Employee.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: Authentication - Reset Password */}
                 <AccordionItem value="flowAuthReset">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    Flowchart 4C: Reset Password Process
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowAuthReset} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Alur reset password menggunakan token yang dikirim via email.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: Authentication - Resolve Request */}
                 <AccordionItem value="flowAuthResolve">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                    Flowchart 4D: Owner Approval Process
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowAuthResolve} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Alur persetujuan atau penolakan request reset password dari Employee.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Flowchart: Landing Page */}
                 <AccordionItem value="flowLanding">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-pink-500" />
                    Flowchart 5: Landing Page & User Journey
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowLanding} />
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: CMS */}
                 <AccordionItem value="flowCMS">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Image className="h-5 w-5 text-orange-500" />
                    Flowchart 6: CMS & Content Management
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowCMS} />
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Key Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {components.map((comp) => (
                  <div key={comp.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{comp.name}</div>
                      <Badge variant="secondary">{comp.type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Used in: {comp.used}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="flex items-center gap-3 p-4 border rounded-lg">
                      <Icon className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <div className="font-semibold">{feature.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">
                            {feature.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Folder Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                 {/* Root */}
                 <div>
                   <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                     <Folder className="h-4 w-4 text-blue-500" /> Root Directory
                   </h3>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">app/</span>: Core logic, routing, server actions</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">components/</span>: Reusable UI components</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">prisma/</span>: Database schema & seeds</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">lib/</span>: Utilities, auth, helpers</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">public/</span>: Static assets</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">types/</span>: TypeScript definitions</li>
                   </ul>
                 </div>

                 {/* app/ Details */}
                 <div>
                   <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                     <FolderOpen className="h-4 w-4 text-orange-500" /> app/ (App Router)
                   </h3>
                   <div className="space-y-2 text-sm pl-4 border-l-2 border-muted">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <p className="font-mono font-bold text-primary">actions/</p>
                         <p className="text-muted-foreground">Server Actions (Backend Logic)</p>
                       </div>
                       <div>
                         <p className="font-mono font-bold text-primary">admin/</p>
                         <p className="text-muted-foreground">Protected Admin Dashboard Routes</p>
                       </div>
                       <div>
                         <p className="font-mono font-bold text-primary">employee/</p>
                         <p className="text-muted-foreground">Employee Dashboard Routes</p>
                       </div>
                       <div>
                         <p className="font-mono font-bold text-primary">api/</p>
                         <p className="text-muted-foreground">REST API Endpoints</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Architecture Section */}
                 <div className="mt-8 pt-6 border-t">
                    <h3 className="font-bold text-xl mb-4">System Architecture Modules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <Wrench className="h-4 w-4" /> Operational
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">Core Service & Order Processing</p>
                        <div className="text-xs bg-muted p-2 rounded font-mono">
                          Order -{'>'} OrderItem -{'>'} SparePart
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" /> Finance & Accounting
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">Double-Entry Bookkeeping</p>
                        <div className="text-xs bg-muted p-2 rounded font-mono">
                          Payment -{'>'} JournalEntry -{'>'} Account
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4" /> Inventory
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">Stock Management</p>
                        <div className="text-xs bg-muted p-2 rounded font-mono">
                          SparePart (Stock, Buy/Sell Price)
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" /> HR & Payroll
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">Employee Compensation</p>
                        <div className="text-xs bg-muted p-2 rounded font-mono">
                          Employee -{'>'} OrderFee -{'>'} Payroll
                        </div>
                      </div>

                    </div>
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Installation Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Prerequisites</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Node.js 18+</li>
                  <li>PostgreSQL 15+</li>
                  <li>npm or yarn</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Setup Steps</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
                  <div># 1. Install dependencies</div>
                  <div>npm install</div>
                  <div className="mt-2"># 2. Setup environment</div>
                  <div>cp .env.example .env</div>
                  <div className="mt-2"># 3. Push database schema</div>
                  <div>npx prisma db push</div>
                  <div className="mt-2"># 4. Generate Prisma Client</div>
                  <div>npx prisma generate</div>
                  <div className="mt-2"># 5. Run development server</div>
                  <div>npm run dev</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Links */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Additional Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "README.md",
              "ACCOUNTING_FIX_SUMMARY.md",
              "BANK_INTEGRATION_GUIDE.md",
              "TECHNICAL_DOCUMENTATION.md",
              "UPDATE-LOG.md"
            ].map((file) => (
              <div key={file} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-mono text-sm">{file}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  );
}
