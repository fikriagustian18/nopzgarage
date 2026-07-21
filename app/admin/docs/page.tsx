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
import { MermaidDiagram } from "@/components/MermaidDiagram";

export default function TechnicalDocsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const stats = {
    totalTables: 18,
    totalRelationships: 14,
    totalEnums: 6,
    totalComponents: 50,
    totalPages: 16,
    totalServerActions: 20,
  };

  const tables = [
    { name: "User", columns: 10, purpose: "Akun login pengguna sistem (Owner/Admin/Employee)" },
    { name: "ForgotPasswordRequest", columns: 6, purpose: "Pencatatan permintaan reset password karyawan" },
    { name: "Employee", columns: 11, purpose: "Profil data karyawan (mekanik/owner) & skema gaji" },
    { name: "Order", columns: 18, purpose: "Transaksi servis motor (status, total, feedback)" },
    { name: "OrderItem", columns: 9, purpose: "Detail item (jasa & sparepart) yang dipasang per order" },
    { name: "OrderFee", columns: 8, purpose: "Pencatatan komisi mekanik per order servis" },
    { name: "SparePart", columns: 12, purpose: "Master data persediaan suku cadang (stok & harga)" },
    { name: "Payroll", columns: 12, purpose: "Rekap gaji & komisi karyawan per periode" },
    { name: "BankAccount", columns: 9, purpose: "Master data rekening bank bengkel & saldo real-time" },
    { name: "Payment", columns: 10, purpose: "Pencatatan transaksi pembayaran (DP, pelunasan, gaji)" },
    { name: "ContentSection", columns: 8, purpose: "Manajemen teks dan media statis landing page" },
    { name: "Account", columns: 7, purpose: "Bagan Akun (Chart of Accounts) untuk pembukuan" },
    { name: "JournalEntry", columns: 6, purpose: "Header jurnal transaksi akuntansi double-entry" },
    { name: "JournalItem", columns: 5, purpose: "Baris detail debit/kredit per jurnal entry" },
    { name: "SystemSetting", columns: 4, purpose: "Konfigurasi parameter sistem (jam kerja, max booking)" },
    { name: "ActivityLog", columns: 9, purpose: "Audit trail / log aktivitas pengguna sistem" },
    { name: "MediaGallery", columns: 10, purpose: "Galeri foto & media promosi di landing page" },
    { name: "SocialEmbed", columns: 11, purpose: "Embed media sosial (Instagram/TikTok) di landing page" }
  ];

  const accounts = [
    // ASSETS
    { code: "101", name: "Kas Tunai", type: "ASSET" },
    { code: "102", name: "Bank", type: "ASSET" },
    { code: "103", name: "Piutang Usaha", type: "ASSET" },
    { code: "111", name: "Persediaan Sparepart", type: "ASSET" },
    { code: "121", name: "Peralatan Bengkel", type: "ASSET" },
    { code: "122", name: "Akumulasi Penyusutan Peralatan", type: "ASSET" },
    // LIABILITIES
    { code: "201", name: "Hutang Usaha", type: "LIABILITY" },
    { code: "202", name: "Utang Gaji & Komisi", type: "LIABILITY" },
    // EQUITY
    { code: "301", name: "Modal Pemilik", type: "EQUITY" },
    { code: "302", name: "Prive", type: "EQUITY" },
    { code: "303", name: "Laba Ditahan", type: "EQUITY" },
    // REVENUE
    { code: "401", name: "Pendapatan Jasa Servis", type: "REVENUE" },
    { code: "402", name: "Pendapatan Penjualan Sparepart", type: "REVENUE" },
    { code: "403", name: "Pendapatan Modifikasi", type: "REVENUE" },
    // EXPENSES
    { code: "501", name: "Beban Gaji & Komisi", type: "EXPENSE" },
    { code: "502", name: "Beban Listrik", type: "EXPENSE" },
    { code: "503", name: "Beban Air", type: "EXPENSE" },
    { code: "504", name: "Beban Sewa Tempat", type: "EXPENSE" },
    { code: "505", name: "Beban Supplies", type: "EXPENSE" },
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

  // Mermaid Definitions based on actual active system
  const diagrams = {
    erd: `erDiagram
    User {
        string id PK
        string email UK
        string password
        string role
        string employeeId FK
        string resetToken UK
        datetime resetTokenExpiry
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    ForgotPasswordRequest {
        string id PK
        string userId FK
        string status
        string resolvedBy
        datetime resolvedAt
        datetime createdAt
    }
    Employee {
        string id PK
        string name
        string role
        string phone
        string salaryType
        decimal dailyRate
        decimal commissionRate
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    Order {
        string id PK
        string custName
        string custPhone
        string vehicle
        string plateNumber
        string complaint
        string serviceType
        string status
        datetime scheduledAt
        json items
        decimal totalPrice
        decimal totalPaid
        string paymentStatus
        string mechanicId FK
        datetime createdAt
        datetime updatedAt
        string feedback
        int rating
    }
    OrderItem {
        string id PK
        string orderId FK
        string itemType
        string itemName
        int quantity
        decimal unitPrice
        decimal totalPrice
        string sparePartId FK
        datetime createdAt
    }
    OrderFee {
        string id PK
        string orderId FK
        string employeeId FK
        decimal amount
        string description
        boolean isPaid
        datetime paidAt
        datetime createdAt
    }
    SparePart {
        string id PK
        string code UK
        string name
        string category
        int stock
        int minStock
        string unit
        decimal buyPrice
        decimal sellPrice
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    Payroll {
        string id PK
        datetime startDate
        datetime endDate
        string employeeId FK
        decimal baseSalary
        decimal bonus
        decimal totalEarned
        string details
        decimal totalPaid
        string status
        datetime createdAt
        datetime updatedAt
    }
    BankAccount {
        string id PK
        string bankCode
        string bankName
        string accountNumber
        string accountName
        decimal currentBalance
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    Payment {
        string id PK
        datetime date
        decimal amount
        string note
        string orderId FK
        string payrollId FK
        string bankAccountId FK
        string paymentMethod
        datetime createdAt
    }
    ContentSection {
        string id PK
        string sectionKey UK
        string title
        string subtitle
        json content
        string imageUrl
        boolean isVisible
        datetime updatedAt
    }
    Account {
        string id PK
        string code UK
        string name
        string type
        string category
        boolean isActive
        datetime createdAt
    }
    JournalEntry {
        string id PK
        datetime date
        string description
        string reference
        string paymentId FK
        datetime createdAt
    }
    JournalItem {
        string id PK
        string journalEntryId FK
        string accountId FK
        decimal debit
        decimal credit
    }
    SystemSetting {
        string id PK
        string key UK
        string value
        datetime updatedAt
    }
    ActivityLog {
        string id PK
        string action
        string title
        string details
        json metadata
        string userId
        string userName
        string role
        datetime createdAt
    }
    MediaGallery {
        string id PK
        string title
        string description
        string imageUrl
        string type
        string category
        boolean isActive
        int displayOrder
        datetime createdAt
        datetime updatedAt
    }
    SocialEmbed {
        string id PK
        string platform
        string embedUrl
        string embedCode
        string title
        string description
        string thumbnail
        boolean isActive
        int displayOrder
        datetime createdAt
        datetime updatedAt
    }

    User ||--o{ ForgotPasswordRequest : "requests"
    Employee ||--o{ User : "has_account"
    Employee ||--o{ Order : "services"
    Employee ||--o{ OrderFee : "earns"
    Employee ||--o{ Payroll : "receives"
    Order ||--o{ OrderItem : "contains"
    Order ||--o{ OrderFee : "has_fees"
    Order ||--o{ Payment : "has_payments"
    SparePart ||--o{ OrderItem : "used_in"
    Payroll ||--o{ Payment : "paid_by"
    BankAccount ||--o{ Payment : "transacts"
    Payment ||--o| JournalEntry : "generates"
    JournalEntry ||--|{ JournalItem : "contains"
    Account ||--o{ JournalItem : "records_in"`,

    dfd0: `flowchart LR
    Customer["CUSTOMER<br/>Pelanggan / Pemilik Motor"]
    Owner["OWNER<br/>Pemilik Bengkel"]
    Admin["ADMIN<br/>Staff Admin"]
    Mechanic["MECHANIC<br/>Mekanik"]
    
    System(["0<br/>SISTEM MANAJEMEN<br/>NOPZGARAGE"])
    
    Customer -->|"Registrasi Booking & Keluhan"| System
    System -->|"Informasi Antrian & Status"| Customer
    Customer -->|"Pembayaran (DP/Pelunasan)"| System
    System -->|"Kwitansi Pembayaran"| Customer
    
    Owner -->|"Kelola Akun, Karyawan & Gaji"| System
    System -->|"Laporan Keuangan & Dashboard"| Owner
    
    Admin -->|"Input Order, Estimasi & Pembayaran"| System
    System -->|"Dashboard Notifikasi & Status"| Admin
    Admin -->|"Kelola Inventory & Stok"| System
    
    Mechanic -->|"Update Progress Pekerjaan"| System
    System -->|"Daftar Order Kerja"| Mechanic
    System -->|"Slip & Histori Gaji"| Mechanic`,

    dfd1: `flowchart TB
    Pelanggan["PELANGGAN (Tidak Login)"]
    Admin["ADMIN (Staff Admin)"]
    Mekanik["MEKANIK (Mekanik)"]
    Owner["OWNER (Pemilik Bengkel)"]

    P1(["1.0<br/>Manajemen Pengguna & Karyawan"])
    P2(["2.0<br/>Manajemen Pelayanan<br/>(Booking & Servis)"])
    P3(["3.0<br/>Manajemen Inventory (Sparepart)"])
    P4(["4.0<br/>Transaksi & Gaji (Payment/Payroll)"])
    P5(["5.0<br/>Laporan & Akuntansi Jurnal"])

    DS1[("DS1 User & Employee")]
    DS2[("DS2 Order & Fees")]
    DS3[("DS3 SparePart")]
    DS4[("DS4 Payment & Payroll")]
    DS5[("DS5 Accounting")]

    P1 <-->|"Data Pengguna & Karyawan"| DS1
    P1 --> P2

    Pelanggan -->|"Data Booking Servis & Keluhan"| P2
    P2 -->|"Nomor Antrian, Estimasi, Status & Kwitansi"| Pelanggan
    Admin -->|"Input & Update Order"| P2
    P2 <-->|"Data Order & Items"| DS2
    P2 --> P3

    Admin -->|"Kelola Sparepart & Stok"| P3
    Mekanik -->|"Request Part / Update Progress"| P3
    P3 <-->|"Data Sparepart"| DS3
    P3 --> P4

    Admin -->|"Pencatatan Pembayaran"| P4
    Owner -->|"Approval & Proses Payroll"| P4
    P4 <-->|"Data Pembayaran & Gaji"| DS4
    P4 --> P5

    Owner -->|"Lihat Laporan & Jurnal"| P5
    P5 <-->|"Data Jurnal & Akun"| DS5`,

    dfd2user: `flowchart TB
    Admin["ADMIN (Staff Admin)"]
    Mekanik["MEKANIK (Mekanik)"]
    Owner["OWNER (Pemilik Bengkel)"]

    P11(["1.1<br/>Login & Autentikasi"])
    P12(["1.2<br/>Kelola Akun User"])
    P13(["1.3<br/>Kelola Data Karyawan"])
    P14(["1.4<br/>Request Reset Password"])

    DS1_User[("DS1 User")]
    DS1_Employee[("DS1 Employee")]
    DS1_Forgot[("DS1 ForgotPasswordRequest")]

    Admin -->|"Kredensial Login"| P11
    Mekanik -->|"Kredensial Login"| P11
    Owner -->|"Kredensial Login"| P11
    P11 <-->|"Verifikasi Kredensial"| DS1_User
    P11 -->|"Get Employee Data"| DS1_Employee

    Owner -->|"Kelola Akun (Create/Toggle Active)"| P12
    P12 <-->|"Data User"| DS1_User

    Owner -->|"Kelola Profil & Rate Karyawan"| P13
    P13 <-->|"Data Employee"| DS1_Employee

    Mekanik -->|"Ajukan Reset Password"| P14
    P14 <-->|"Data Request"| DS1_Forgot
    Owner -->|"Approve / Reject Reset"| P14`,

    dfd2service: `flowchart TB
    Pelanggan["PELANGGAN"]
    Admin["ADMIN / OWNER"]
    Mekanik["MEKANIK"]

    P21(["2.1<br/>Registrasi Booking<br/>(Status: PENDING)"])
    P22(["2.2<br/>Estimasi & Konfirmasi<br/>(Status: CONFIRMED/QUEUE)"])
    P23(["2.3<br/>Penugasan Mekanik"])
    P24(["2.4<br/>Pengerjaan Servis<br/>(Status: IN_PROGRESS)"])
    P25(["2.5<br/>Penyelesaian Order<br/>(Status: READY/COMPLETED)"])

    DS2_Order[("DS2 Order")]
    DS2_OrderItem[("DS2 OrderItem")]
    DS2_OrderFee[("DS2 OrderFee")]
    DS3_SparePart[("DS3 SparePart")]
    DS1_Employee[("DS1 Employee")]

    Pelanggan -->|"Isi Form Booking"| P21
    P21 -->|"Simpan Order PENDING"| DS2_Order

    Admin -->|"Input Estimasi Items"| P22
    P22 <-->|"Simpan Items & Update Order"| DS2_OrderItem
    P22 -->|"Update Status (CONFIRMED/QUEUE)"| DS2_Order

    Admin -->|"Pilih Mekanik"| P23
    P23 -->|"Assign mechanicId"| DS2_Order
    P23 <--|"Ambil Data Mekanik"| DS1_Employee

    Mekanik -->|"Mulai Kerja & Pasang Part"| P24
    P24 -->|"Update Status (IN_PROGRESS)"| DS2_Order
    P24 <-->|"Kurangi Stok Part"| DS3_SparePart

    Mekanik -->|"Set Selesai"| P25
    P25 -->|"Update Status (READY)"| DS2_Order
    P25 -->|"Hitung & Simpan Komisi"| DS2_OrderFee`,

    dfd2inventory: `flowchart TB
    Admin["ADMIN / OWNER"]

    P31(["3.1<br/>Tambah Produk Baru"])
    P32(["3.2<br/>Update Info Produk"])
    P33(["3.3<br/>Input Stok Masuk"])
    P34(["3.4<br/>Input Stok Keluar"])

    DS3_SparePart[("DS3 SparePart")]
    DS5_Accounting[("DS5 Accounting")]

    Admin -->|"Input Data Sparepart Baru"| P31
    P31 -->|"Simpan Sparepart"| DS3_SparePart
    P31 -->|"Jurnal Persediaan Awal (jika ada stok)"| DS5_Accounting

    Admin -->|"Edit Info Sparepart"| P32
    P32 <-->|"Update Data Sparepart"| DS3_SparePart

    Admin -->|"Input Stok Masuk & Supplier"| P33
    P33 -->|"Increment Stock"| DS3_SparePart
    P33 -->|"Jurnal Pembelian Persediaan"| DS5_Accounting

    Admin -->|"Input Stok Keluar & Keperluan"| P34
    P34 -->|"Decrement Stock"| DS3_SparePart`,

    dfd2transaction: `flowchart TB
    Pelanggan["PELANGGAN"]
    Admin["ADMIN / OWNER"]
    Owner["OWNER"]

    P41(["4.1<br/>Pencatatan Pembayaran Order<br/>(Kasir)"])
    P42(["4.2<br/>Auto-Journal Pendapatan<br/>(Akuntansi Jurnal)"])
    P43(["4.3<br/>Proses Gaji & Komisi<br/>(Payroll & Payment)"])

    DS2_Order[("DS2 Order")]
    DS4_Payment_Payroll[("DS4 Payment & Payroll")]
    DS5_Accounting[("DS5 Accounting")]

    Pelanggan -->|"Bayar DP / Pelunasan"| P41
    Admin -->|"Input Pembayaran Kasir"| P41
    P41 -->|"Simpan Pembayaran & Sisa Bayar"| DS4_Payment_Payroll
    P41 -->|"Update totalPaid & paymentStatus"| DS2_Order

    P41 -->|"Trigger Auto-Journal"| P42
    P42 -->|"Buat Jurnal Debit Kas/Bank, Kredit Pendapatan/Piutang"| DS5_Accounting

    Owner -->|"Approval & Bayar Gaji"| P43
    P43 <-->|"Update Status Payroll & Buat Payment Gaji"| DS4_Payment_Payroll
    P43 -->|"Jurnal Debit Utang Gaji, Kredit Kas/Bank"| DS5_Accounting`,

    dfd2report: `flowchart TB
    Owner["OWNER (Pemilik Bengkel)"]
    Admin["ADMIN (Staff Admin)"]

    P51(["5.1<br/>Laporan Akuntansi & Jurnal<br/>(Laba Rugi, Buku Besar)"])
    P52(["5.2<br/>Laporan Stok & Persediaan<br/>(Mutasi & Nilai Sparepart)"])
    P53(["5.3<br/>Laporan Analisis Operasional<br/>(Kinerja Mekanik & Servis)"])
    P54(["5.4<br/>Laporan Penggajian Karyawan"])
    P55(["5.5<br/>Dashboard Overview & Grafik"])

    DS5_Accounting[("DS5 Accounting")]
    DS3_SparePart[("DS3 SparePart")]
    DS2_Order[("DS2 Order")]
    DS4_Payment_Payroll[("DS4 Payment & Payroll")]

    Owner -->|"Request Laporan Keuangan"| P51
    P51 <-->|"Ambil Jurnal & Akun"| DS5_Accounting
    P51 -->|"Laporan Laba Rugi & Neraca"| Owner

    Admin -->|"Monitor Stok & Reorder Point"| P52
    P52 <-->|"Ambil Data Sparepart"| DS3_SparePart
    P52 -->|"Laporan Nilai Persediaan"| Admin

    Admin -->|"Request Laporan Servis"| P53
    P53 <-->|"Ambil Data Order & Items"| DS2_Order
    P53 -->|"Laporan Kinerja Mekanik"| Admin

    Owner -->|"Review Payroll History"| P54
    P54 <-->|"Ambil Data Payroll"| DS4_Payment_Payroll
    P54 -->|"Laporan Gaji"| Owner

    Owner -->|"View Dashboard Summary"| P55
    Admin -->|"View Dashboard Summary"| P55
    P55 <--|"Summary Stats"| DS2_Order
    P55 <--|"Summary Cash/Bank"| DS4_Payment_Payroll
    P55 <--|"Summary Inventory Value"| DS3_SparePart`,

     flowOrder: `flowchart TD
    Start([Mulai: Pelanggan Booking])
    
    %% Input Order
    Input[Admin/Pelanggan Buat Order<br/>Status: PENDING]
    SaveOrder[(Simpan Order)]
    
    %% Estimasi
    InputEstimate[Input Estimasi:<br/>- Jasa & Sparepart<br/>- Total Estimasi Biaya]
    UpdateEstimated[(Set Status: ESTIMATED)]
    
    %% Konfirmasi
    CustomerApprove{Pelanggan<br/>Setuju?}
    Cancelled[(Set Status: CANCELLED)]
    EndCancelled([Selesai:<br/>Order Dibatalkan])
    
    %% Scheduling / Antrian
    UpdateConfirmed[(Set Status: CONFIRMED / QUEUE)]
    
    %% Penugasan
    AssignMechanic[Tugaskan Mekanik<br/>Set mechanicId]
    
    %% Pengerjaan
    StartWork[Mulai Kerja]
    UpdateInProgress[(Set Status: IN_PROGRESS)]
    ReduceStock[Kurangi Stok Sparepart]
    CreateHPPEntry[(Jurnal HPP:<br/>Dr. HPP 511<br/>Cr. Persediaan 111)]
    
    Work[Proses Servis / Modifikasi]
    Complete[Pekerjaan Selesai]
    UpdateReady[(Set Status: READY)]
    NotifyCustomer[Notif Pelanggan:<br/>Unit Siap Diambil]
    
    %% Pembayaran & Penutupan
    Payment[Pembayaran & Kasir]
    CloseOrder[(Set Status: COMPLETED)]
    GenerateInvoice[Cetak Invoice]
    
    End([Selesai:<br/>Motor Diambil])
    
    %% Flow
    Start --> Input
    Input --> SaveOrder
    SaveOrder --> InputEstimate
    InputEstimate --> UpdateEstimated
    UpdateEstimated --> CustomerApprove
    
    CustomerApprove -->|Tidak| Cancelled
    Cancelled --> EndCancelled
    
    CustomerApprove -->|Ya| UpdateConfirmed
    UpdateConfirmed --> AssignMechanic
    AssignMechanic --> StartWork
    StartWork --> UpdateInProgress
    UpdateInProgress --> ReduceStock
    ReduceStock --> CreateHPPEntry
    CreateHPPEntry --> Work
    Work --> Complete
    Complete --> UpdateReady
    UpdateReady --> NotifyCustomer
    NotifyCustomer --> Payment
    Payment --> CloseOrder
    CloseOrder --> GenerateInvoice
    GenerateInvoice --> End
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class Input,InputEstimate,AssignMechanic,StartWork,Work,Complete,Payment,GenerateInvoice,NotifyCustomer processStyle
    class CustomerApprove decisionStyle
    class SaveOrder,UpdateEstimated,Cancelled,UpdateConfirmed,UpdateInProgress,ReduceStock,CreateHPPEntry,UpdateReady,CloseOrder dataStyle
    class Start,End,EndCancelled startEndStyle`,

    flowPayment: `flowchart TD
    Start([Mulai:<br/>Pencatatan Pembayaran])
    
    %% Determine Payment Type
    PaymentType{Jenis<br/>Pembayaran?}
    
    %% ORDER PAYMENT BRANCH
    OrderPayment[Pembayaran Order]
    GetOrder[(Ambil Data Order)]
    
    InputOrderAmount[Input Jumlah Bayar]
    CheckOrderFull{Jumlah Bayar +<br/>Terbayar >= Total?}
    
    SetOrderPaid[(Set Order:<br/>paymentStatus = PAID)]
    SetOrderPartial[(Set Order:<br/>paymentStatus = PARTIAL)]
    
    CheckOrderFirst{Apakah ini<br/>Pembayaran Pertama?}
    
    %% Jurnal Order
    JournalDP[(Jurnal DP:<br/>Dr. Kas/Bank 101/102<br/>Cr. Piutang Usaha 103)]
    
    JournalLunasLangsung[(Jurnal Lunas:<br/>Dr. Kas/Bank 101/102<br/>Cr. Pendapatan Jasa 401<br/>& Pendapatan Part 402)]
    
    JournalPelunasan1[(Jurnal Pelunasan Kas:<br/>Dr. Kas/Bank 101/102<br/>Cr. Piutang Usaha 103)]
    JournalPelunasan2[(Jurnal Pengakuan Pendapatan:<br/>Dr. Piutang Usaha 103<br/>Cr. Pendapatan Jasa 401<br/>& Pendapatan Part 402)]
    
    %% PAYROLL PAYMENT BRANCH
    PayrollPayment[Pembayaran Gaji Karyawan]
    GetPayroll[(Ambil Data Payroll)]
    
    InputPayrollAmount[Input Jumlah Gaji]
    SetPayrollPaid[(Set Payroll:<br/>status = PAID)]
    
    JournalPayroll[(Jurnal Gaji:<br/>Dr. Utang Gaji & Komisi 202<br/>Cr. Kas/Bank 101/102)]
    
    %% Common End
    LogActivity[(Catat Aktivitas)]
    Success([Sukses])
    
    %% Main Flow
    Start --> PaymentType
    
    %% ORDER PATH
    PaymentType -->|Order| OrderPayment
    OrderPayment --> GetOrder
    GetOrder --> InputOrderAmount
    InputOrderAmount --> CheckOrderFull
    
    CheckOrderFull -->|Ya: Lunas| SetOrderPaid
    CheckOrderFull -->|Tidak: Parsial| SetOrderPartial
    
    SetOrderPaid --> CheckOrderFirst
    SetOrderPartial --> CheckOrderFirst
    
    CheckOrderFirst -->|Ya, Tapi Parsial DP| JournalDP
    CheckOrderFirst -->|Ya & Lunas| JournalLunasLangsung
    CheckOrderFirst -->|Tidak: Pelunasan| JournalPelunasan1
    JournalPelunasan1 --> JournalPelunasan2
    
    JournalDP --> LogActivity
    JournalLunasLangsung --> LogActivity
    JournalPelunasan2 --> LogActivity
    
    %% PAYROLL PATH
    PaymentType -->|Gaji| PayrollPayment
    PayrollPayment --> GetPayroll
    GetPayroll --> InputPayrollAmount
    InputPayrollAmount --> SetPayrollPaid
    SetPayrollPaid --> JournalPayroll
    JournalPayroll --> LogActivity
    
    LogActivity --> Success
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class OrderPayment,InputOrderAmount,PayrollPayment,InputPayrollAmount processStyle
    class PaymentType,CheckOrderFull,CheckOrderFirst decisionStyle
    class GetOrder,SetOrderPaid,SetOrderPartial,JournalDP,JournalLunasLangsung,JournalPelunasan1,JournalPelunasan2,GetPayroll,SetPayrollPaid,JournalPayroll,LogActivity dataStyle
    class Start,Success startEndStyle`,
    
    flowPayroll: `flowchart TD
    Start([Mulai: Hitung Payroll])
    
    InputPeriod[Input Periode:<br/>Tanggal Mulai & Akhir]
    GetEmployees[(Ambil Data Karyawan)]
    
    CheckSalaryType{Tipe Gaji?}
    
    %% DAILY
    DailyCalc[Gaji Pokok Harian]
    CountDays[Hitung Hari Kerja<br/>- Skip Hari Minggu]
    CalcDailyBase[Gaji Pokok =<br/>Hari Kerja x Rate Harian]
    
    %% COMMISSION
    CommissionCalc[Gaji Pokok Komisi]
    CountMotors[Hitung Jumlah Motor Selesai<br/>dalam Periode]
    CalcCommissionBase[Gaji Pokok =<br/>Motor x Rate Komisi]
    
    %% Common
    InputBonus[Input Bonus & Catatan]
    CalcTotal[Total Gaji =<br/>Gaji Pokok + Bonus]
    
    CreatePayroll[(Simpan Payroll:<br/>status = UNPAID)]
    
    End([Selesai])
    
    %% Flow
    Start --> InputPeriod
    InputPeriod --> GetEmployees
    GetEmployees --> CheckSalaryType
    
    CheckSalaryType -->|DAILY| DailyCalc
    DailyCalc --> CountDays
    CountDays --> CalcDailyBase
    CalcDailyBase --> InputBonus
    
    CheckSalaryType -->|COMMISSION| CommissionCalc
    CommissionCalc --> CountMotors
    CountMotors --> CalcCommissionBase
    CalcCommissionBase --> InputBonus
    
    InputBonus --> CalcTotal
    CalcTotal --> CreatePayroll
    CreatePayroll --> End
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputPeriod,DailyCalc,CommissionCalc,InputBonus processStyle
    class CheckSalaryType decisionStyle
    class GetEmployees,CountDays,CalcDailyBase,CountMotors,CalcCommissionBase,CalcTotal,CreatePayroll dataStyle
    class Start,End startEndStyle`,
    
    flowAuthLogin: `flowchart TD
    Start([Mulai: Login User])
    
    InputCredentials[Input Email & Password]
    FindUser[(Cari User by Email)]
    
    UserExists{User Ada?}
    ErrorNotFound[Error: Email tidak terdaftar]
    
    CheckActive{User Aktif?}
    ErrorInactive[Error: Akun dinonaktifkan]
    
    VerifyPassword[Verifikasi Password<br/>menggunakan bcrypt]
    PasswordMatch{Password Cocok?}
    ErrorPassword[Error: Password salah]
    
    CreateSession[NextAuth:<br/>Buat Sesi Login]
    LogActivity[(Log: LOGIN_SUCCESS)]
    
    Success([Sukses: Masuk Dashboard])
    Failed([Gagal])
    
    %% Login Flow
    Start --> InputCredentials
    InputCredentials --> FindUser
    FindUser --> UserExists
    
    UserExists -->|Tidak| ErrorNotFound
    ErrorNotFound --> Failed
    
    UserExists -->|Ya| CheckActive
    CheckActive -->|Tidak| ErrorInactive
    ErrorInactive --> Failed
    
    CheckActive -->|Ya| VerifyPassword
    VerifyPassword --> PasswordMatch
    
    PasswordMatch -->|Tidak| ErrorPassword
    ErrorPassword --> Failed
    
    PasswordMatch -->|Ya| CreateSession
    CreateSession --> LogActivity
    LogActivity --> Success
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef errorStyle fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputCredentials,VerifyPassword,CreateSession processStyle
    class UserExists,CheckActive,PasswordMatch decisionStyle
    class FindUser,LogActivity dataStyle
    class ErrorNotFound,ErrorInactive,ErrorPassword errorStyle
    class Start,Success,Failed startEndStyle`,

    flowAuthForgot: `flowchart TD
    Start([Mulai: Lupa Password])
    
    InputEmail[Input Email Pengguna]
    FindUser[(Cari User by Email)]
    
    UserExists{User Ada?}
    ShowMessage[Tampilkan Pesan:<br/>Permintaan dikirim ke admin]
    
    CreateRequest[(Buat ForgotPasswordRequest<br/>status = PENDING)]
    LogActivity[(Log: FORGOT_PASSWORD_REQUEST)]
    
    End([Selesai])
    
    %% Flow
    Start --> InputEmail
    InputEmail --> FindUser
    FindUser --> UserExists
    
    UserExists -->|Tidak| ShowMessage
    UserExists -->|Ya| CreateRequest
    CreateRequest --> LogActivity
    LogActivity --> ShowMessage
    ShowMessage --> End
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputEmail,ShowMessage processStyle
    class UserExists decisionStyle
    class FindUser,CreateRequest,LogActivity dataStyle
    class Start,End startEndStyle`,

    flowAuthResolve: `flowchart TD
    Start([Mulai: Resolusi Lupa Password])
    
    GetRequests[(Ambil Daftar Request PENDING)]
    OwnerInput[Owner Input Password Baru]
    
    HashPassword[Hash Password Baru]
    
    UpdateUserAndPassword[(Transaction:<br/>- Update User Password<br/>- Set Request status = RESOLVED)]
    
    LogActivity[(Log: RESOLVE_FORGOT_PASSWORD)]
    
    Success([Sukses: Password Berhasil Direset])
    
    %% Flow
    Start --> GetRequests
    GetRequests --> OwnerInput
    OwnerInput --> HashPassword
    HashPassword --> UpdateUserAndPassword
    UpdateUserAndPassword --> LogActivity
    LogActivity --> Success
    
    %% Styling
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class OwnerInput,HashPassword processStyle
    class GetRequests,UpdateUserAndPassword,LogActivity dataStyle
    class Start,Success startEndStyle`,

    useCase: `flowchart LR
    subgraph Actors["👥 AKTOR SISTEM"]
        Customer(["👤 Pelanggan"])
        Mechanic(["🔧 Mekanik"])
        Admin(["💼 Admin"])
        Owner(["👔 Owner"])
    end

    subgraph PublicFeatures["🌐 FITUR PUBLIK"]
        UC1["Booking Servis"]
        UC2["Lacak Status Order (Kanban Publik)"]
    end

    subgraph AdminFeatures["⚙️ FITUR ADMIN"]
        UC4["Input & Proses Order"]
        UC5["Kelola Inventory & Stok"]
        UC6["Pencatatan Pembayaran (Kasir)"]
    end

    subgraph MechanicFeatures["🔧 FITUR MEKANIK"]
        UC7["Kerjakan Servis (Update Progress)"]
    end

    subgraph OwnerFeatures["📊 FITUR OWNER"]
        UC9["Laporan Keuangan & Akuntansi"]
        UC10["Proses & Bayar Payroll Gaji"]
        UC11["Kelola Akun Pengguna & Profil"]
    end

    %% Customer Connections
    Customer -.-> UC1
    Customer -.-> UC2

    %% Admin Connections
    Admin -.-> UC4
    Admin -.-> UC5
    Admin -.-> UC6
    Admin -.-> UC2

    %% Mechanic Connections
    Mechanic -.-> UC7
    Mechanic -.-> UC2

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
    class UC1,UC2 publicStyle
    class UC4,UC5,UC6 adminStyle
    class UC7 mechanicStyle
    class UC9,UC10,UC11 ownerStyle`,

    seqAuth: `sequenceDiagram
    participant User
    participant FE as Frontend
    participant Auth as NextAuth.js
    participant DB as Database

    User->>FE: Input Email & Password
    FE->>Auth: signIn("credentials", { email, password })
    Auth->>DB: Cari User by Email
    
    alt User Tidak Ditemukan
        DB-->>Auth: null
        Auth-->>FE: Error (Email tidak terdaftar)
        FE-->>User: Tampilkan Error
    else User Ditemukan
        DB-->>Auth: Data User (Password Hash & Status Aktif)
        
        alt Akun Tidak Aktif
            Auth-->>FE: Error (Akun dinonaktifkan)
            FE-->>User: Tampilkan Error
        else Akun Aktif
            Auth->>Auth: Verifikasi Password (bcrypt)
            
            alt Password Salah
                Auth-->>FE: Error (Password salah)
                FE-->>User: Tampilkan Error
            else Password Valid
                Auth->>Auth: Buat Sesi & JWT Token
                Auth-->>FE: Status Sukses
                FE->>FE: Redirect ke Dashboard
                FE-->>User: Tampilkan Dashboard
            end
        end
    end`,

    seqOrder: `sequenceDiagram
    participant Cust as Customer
    participant Admin
    participant Sys as Sistem (Database)
    participant Mech as Mekanik

    Cust->>Admin: Datang bawa motor / Booking Online
    Admin->>Sys: Buat Order Baru (Status: PENDING)
    Sys-->>Admin: Simpan Order & Generate ID
    
    Admin->>Sys: Input Estimasi Biaya (Jasa & Parts)
    Sys-->>Admin: Simpan Items (Status: ESTIMATED)
    
    Cust->>Admin: Setujui Estimasi
    Admin->>Sys: Konfirmasi Order (Status: CONFIRMED/QUEUE)
    
    Admin->>Sys: Tugaskan Mekanik (Set mechanicId)
    Sys->>Mech: Notifikasi Pekerjaan Baru
    
    Mech->>Sys: Mulai Kerja (Status: IN_PROGRESS)
    Sys->>Sys: Kurangi Stok Sparepart
    Sys->>Sys: Buat Jurnal HPP (Dr. HPP, Cr. Persediaan)
    
    Mech->>Sys: Selesai Pengerjaan (Status: READY)
    Sys-->>Cust: Notifikasi Unit Siap Diambil
    
    Cust->>Admin: Melakukan Pembayaran (Kasir)
    Admin->>Sys: Input Pembayaran (CASH/TRANSFER)
    Sys->>Sys: Update totalPaid & paymentStatus (PAID)
    Sys->>Sys: Buat Jurnal Pendapatan (Kas vs Pendapatan)
    
    Admin->>Sys: Tutup Order (Status: COMPLETED)
    Sys-->>Admin: Cetak Kwitansi/Invoice`,

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
    S4 -->|"Buat Jurnal HPP & Accrual Komisi"| SystemDB

    %% Flow 5: Completion
    Mechanic -- "5. Selesai Pengerjaan" --> S5[Aksi: Selesai Order]
    S5 -->|"Update Status (READY)"| SystemDB
    SystemDB -->|"Notifikasi Unit Siap"| Customer

    %% Flow 6: Payment & Closing
    Customer -- "6. Pembayaran" --> Admin
    Admin -- "7. Input Pembayaran" --> S6[Aksi: Proses Pembayaran]
    S6 -->|"Update Status (COMPLETED) & Simpan Payment"| SystemDB
    S6 -->|"Catat Jurnal Keuangan (Kas/Pendapatan)"| SystemDB`,

    seqFinance: `sequenceDiagram
    participant Admin as Admin/Kasir
    participant BO as Sistem Order
    participant INV as Sistem Inventory
    participant ACC as Akuntansi Jurnal
    participant BNK as BankAccount / Kas

    Note over Admin, BNK: Skenario 1: Penggunaan Sparepart saat Servis (HPP)
    Admin->>BO: Mulai Kerja (Status: IN_PROGRESS)
    BO->>INV: Kurangi Stok Sparepart
    BO->>ACC: Trigger Penjurnal HPP
    ACC->>ACC: Debit: HPP (511)<br/>Kredit: Persediaan Sparepart (111)

    Note over Admin, BNK: Skenario 2: Komisi Mekanik Terakru (Accrual)
    Admin->>BO: Tugaskan Mekanik & Input Komisi
    BO->>ACC: Trigger Jurnal Accrual Komisi
    ACC->>ACC: Debit: Beban Gaji & Komisi (501)<br/>Kredit: Utang Gaji & Komisi (202)

    Note over Admin, BNK: Skenario 3: Pembayaran Order oleh Pelanggan
    Admin->>BO: Catat Pembayaran Order (DP / Lunas)
    BO->>ACC: Trigger Jurnal Pendapatan & Kas
    alt Pembayaran Lunas Langsung
        ACC->>ACC: Debit: Kas Tunai/Bank (101/102)<br/>Kredit: Pendapatan Jasa (401) & Pendapatan Part (402)
    else Pembayaran DP (Parsial)
        ACC->>ACC: Debit: Kas Tunai/Bank (101/102)<br/>Kredit: Piutang Usaha (103)
    end
    BO->>BNK: Update Saldo Rekening (jika transfer)`,

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
    FormBooking[Isi Form Booking:<br/>- Nama, HP, Motor, Keluhan<br/>- Pilih Tipe Servis & Tanggal]
    Validation{Valid?}
    ErrorValid[Tampilkan Error]
    SubmitBooking[Kirim Order]
    SaveDB[(Buat Order PENDING)]
    SuccessBooking[Tampilkan Sukses &<br/>Nomor Antrian]
    
    %% Tracking Path
    PathTrack[Lacak Order]
    InputTrack[Input No HP atau Plat No]
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
    CreateRecord[(Buat Data MediaGallery)]
    
    ToggleMedia[Ubah Visibilitas]
    UpdateStatus[(Update Status Aktif)]
    
    DeleteMedia[Hapus Gambar]
    RemoveFile[(Hapus File & Data)]
    
    %% 2. Social Embeds
    FlowSocial[Embed Sosial Media]
    InputUrl[Input URL TikTok/IG]
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
    InputUrl --> SaveEmbed
    SaveEmbed --> Revalidate
    
    %% Text Branch
    SelectFeature -->|Teks| FlowText
    FlowText --> SelectSection
    SelectSection --> EditContent
    EditContent --> SaveContent
    SaveContent --> Revalidate
    
    Revalidate --> UpdatePublic`,

    hierarchy: `graph TD
    System[Sistem Manajemen NopzGarage]
    
    %% Level 1: Roles / Access Levels
    OwnerAccess[1. Owner - Full Control]
    AdminAccess[2. Admin - Operations & Cashier]
    EmployeeAccess[3. Employee / Mechanic - Work Execution]
    PublicAccess[4. Public / Guest - Customer Services]
    
    System --> OwnerAccess
    System --> AdminAccess
    System --> EmployeeAccess
    System --> PublicAccess
    
    %% Owner Features
    OwnerAccess --> OwnerU[Manajemen Pengguna & Karyawan]
    OwnerAccess --> OwnerPay[Payroll & Gaji Karyawan]
    OwnerAccess --> OwnerFin[Laporan Keuangan & Akuntansi]
    OwnerAccess --> OwnerSet[Konfigurasi Sistem]
    
    %% Admin Features
    AdminAccess --> AdminOrd[Input & Estimasi Order]
    AdminAccess --> AdminPay[Kasir & Rekonsiliasi Bank]
    AdminAccess --> AdminInv[Manajemen Stok & Penyesuaian]
    AdminAccess --> AdminCMS[Kelola Konten CMS Landing Page]
    
    %% Employee Features
    EmployeeAccess --> EmpTask[Daftar Antrian Kerja]
    EmployeeAccess --> EmpWork[Update Progress Kerja]
    EmployeeAccess --> EmpSlip[Lihat Slip & Histori Gaji]
    
    %% Public Features
    PublicAccess --> PubBook[Form Booking Online]
    PublicAccess --> PubTrack[Lacak Status Order]
    PublicAccess --> PubKanban[Papan Antrian Publik]
    
    %% Styling
    classDef main fill:#3b82f6,stroke:#1d4ed8,stroke-width:3px,color:#fff;
    classDef owner fill:#fce4ec,stroke:#c2185b,stroke-width:2px;
    classDef admin fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef mechanic fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef public fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    
    class System main;
    class OwnerAccess,OwnerU,OwnerPay,OwnerFin,OwnerSet owner;
    class AdminAccess,AdminOrd,AdminPay,AdminInv,AdminCMS admin;
    class EmployeeAccess,EmpTask,EmpWork,EmpSlip mechanic;
    class PublicAccess,PubBook,PubTrack,PubKanban public;`
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
                
                {/* System Hierarchy Chart */}
                <AccordionItem value="hierarchy">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-blue-600" />
                    System Hierarchy & Functional Chart
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.hierarchy} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Diagram hirarki fungsional ini menggambarkan pembagian peran (Role) dan cakupan fitur operasional pada sistem NopzGarage.
                    </p>
                  </AccordionContent>
                </AccordionItem>

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

                 {/* Flowchart: Authentication - Forgot Password Request */}
                 <AccordionItem value="flowAuthForgot">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-orange-600" />
                    Flowchart 4B: Forgot Password Request (Pengajuan Lupa Password)
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowAuthForgot} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Alur pengajuan lupa password oleh pengguna dengan mencatat request berstatus PENDING ke database.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                 {/* Flowchart: Authentication - Resolve Request */}
                 <AccordionItem value="flowAuthResolve">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                    Flowchart 4C: Reset Password Resolution (Resolusi Lupa Password oleh Owner)
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.flowAuthResolve} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Alur persetujuan dan reset password baru secara manual oleh Owner dari dashboard admin.
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
