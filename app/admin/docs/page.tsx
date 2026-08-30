// app/admin/docs/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  KeyRound,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { MermaidDiagram } from "@/components/shared/MermaidDiagram";

export default function Page() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const stats = {
    totalTables: 8,
    totalRelationships: 8,
    totalEnums: 4,
    totalComponents: 56,
    totalPages: 26,
    totalServerActions: 90,
  };

  const tables = [
    { name: "User", columns: 11, purpose: "Akun login pengguna sistem (Owner/Admin/Employee) & token reset password" },
    { name: "Employee", columns: 12, purpose: "Profil karyawan, jabatan, serta rate gaji harian, bulanan, atau komisi" },
    { name: "Order", columns: 16, purpose: "Transaksi servis motor, booking, status antrian & total bayar" },
    { name: "OrderItem", columns: 11, purpose: "Detail rincian item (jasa & sparepart) yang dipasang per order" },
    { name: "SparePart", columns: 12, purpose: "Master data suku cadang (stok, min stock, harga beli & harga jual)" },
    { name: "Account", columns: 11, purpose: "Bagan Akun (Chart of Accounts) & Rekening Bank bengkel (Kas/Bank/Piutang/Hutang)" },
    { name: "Payment", columns: 11, purpose: "Transaksi kas aktual untuk order, payroll, inventory, dan operasional" },
    { name: "Payroll", columns: 13, purpose: "Snapshot hak gaji per karyawan dan periode, terpisah dari transaksi pembayaran" },
    { name: "SystemConfig", columns: 14, purpose: "Konsolidasi konfigurasi sistem, CMS landing page, embed, log, dan setting" },
  ];

  const accounts = [
    // ASSETS
    { code: "101", name: "Kas Utama", type: "ASSET" },
    { code: "102", name: "Bank BCA", type: "ASSET" },
    { code: "103", name: "Bank Mandiri", type: "ASSET" },
    { code: "104", name: "Piutang Usaha", type: "ASSET" },
    { code: "111", name: "Persediaan Sparepart", type: "ASSET" },
    { code: "121", name: "Peralatan Bengkel", type: "ASSET" },
    // LIABILITIES
    { code: "201", name: "Hutang Usaha", type: "LIABILITY" },
    { code: "202", name: "Hutang Gaji", type: "LIABILITY" },
    // EQUITY
    { code: "301", name: "Modal Pemilik", type: "EQUITY" },
    { code: "302", name: "Prive", type: "EQUITY" },
    // REVENUE
    { code: "401", name: "Pendapatan Jasa Servis", type: "REVENUE" },
    { code: "402", name: "Pendapatan Penjualan Sparepart", type: "REVENUE" },
    // EXPENSES
    { code: "501", name: "Beban Gaji Karyawan", type: "EXPENSE" },
    { code: "502", name: "Beban Operasional", type: "EXPENSE" },
    { code: "511", name: "Harga Pokok Penjualan (HPP)", type: "EXPENSE" },
  ];

  const components = [
    { name: "BookingWizard", type: "Wizard", used: "Public Booking System" },
    { name: "ProcessOrderDialog", type: "Dialog", used: "Admin Order Processing & Estimation" },
    { name: "PaymentDialog", type: "Dialog", used: "Cashier Payment & Settlement" },
    { name: "EmployeeDetailDialog", type: "Dialog", used: "Employee Management" },
    { name: "SparepartDialog", type: "Dialog", used: "Inventory Management" },
    { name: "ExportPreviewDialog", type: "Dialog", used: "Financial & Operational Reports Export" },
    { name: "DashboardOverview", type: "Component", used: "Admin Executive Dashboard" },
    { name: "KanbanBoard", type: "Component", used: "Interactive Service Order Tracking" },
    { name: "BankAccountsManager", type: "Component", used: "Bank & Cash Accounts Management" },
    { name: "WebsiteContentTab", type: "Component", used: "CMS Landing Page Settings" },
    { name: "PublicKanban", type: "Component", used: "Public Customer Queue Board" },
    { name: "LiveQueueList", type: "Component", used: "Real-time Queue Status Display" },
    { name: "NotificationPanel", type: "Component", used: "System Alerts & Notifications" },
    { name: "RoleGuard", type: "Security", used: "RBAC Authorization Access Control" },
    { name: "authCheck", type: "Security Helper", used: "Role Normalization (normalizeRole & isRoleAllowed)" },
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

  // Mermaid definitions based on the 9 active Prisma models.
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
        json forgotRequests
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    Employee {
        string id PK
        string name
        string role
        string phone
        string jabatan
        enum salaryType
        decimal dailyRate
        decimal monthlyRate
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
        enum serviceType
        enum status
        datetime scheduledAt
        json items
        decimal totalPrice
        decimal totalPaid
        enum paymentStatus
        string mechanicId FK
        datetime createdAt
        datetime updatedAt
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
        string employeeId FK
        boolean isPaid
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
    Account {
        string id PK
        string code UK
        string name
        string type
        string category
        string bankCode
        string accountNumber
        string accountName
        decimal currentBalance
        boolean isActive
        datetime createdAt
    }
    Payment {
        string id PK
        datetime date
        decimal amount
        string type
        string note
        string orderId FK
        string employeeId FK
        string payrollId FK
        string bankAccountId FK
        string paymentMethod
        datetime createdAt
    }
    Payroll {
        string id PK
        string employeeId FK
        datetime startDate
        datetime endDate
        enum salaryType
        decimal baseSalary
        decimal bonus
        decimal totalEarned
        decimal totalPaid
        enum status
        string details
        datetime createdAt
        datetime updatedAt
    }
    SystemConfig {
        string id PK
        string category
        string key UK
        string title
        string subtitle
        json content
        string embedUrl
        string platform
        string userId
        string userName
        boolean isVisible
        int displayOrder
        datetime createdAt
        datetime updatedAt
    }

    Employee o|--o| User : "optional account"
    Employee o|--o{ Order : "optional mechanic"
    Employee o|--o{ OrderItem : "optional fee owner"
    Employee o|--o{ Payment : "optional payee"
    Employee ||--o{ Payroll : "payroll slips"
    Order ||--o{ OrderItem : "order items"
    Order o|--o{ Payment : "optional order payment"
    SparePart o|--o{ OrderItem : "optional stock item"
    Account o|--o{ Payment : "optional bank account"
    Payroll o|--o{ Payment : "optional payroll payment"`,

    dfd0: `flowchart LR
    Customer["CUSTOMER<br />Pelanggan / Pemilik Motor"]
    Owner["OWNER<br />Pemilik Bengkel"]
    Admin["ADMIN<br />Staff Admin"]
    Mechanic["MECHANIC<br />Mekanik"]
    
    System(["0<br />SISTEM MANAJEMEN<br />NOPZGARAGE (9 Active Models)"])
    
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

    P1(["1.0<br />Manajemen Pengguna & Karyawan"])
    P2(["2.0<br />Manajemen Pelayanan<br />(Booking & Servis)"])
    P3(["3.0<br />Manajemen Inventory (Sparepart)"])
    P4(["4.0<br />Transaksi & Keuangan (Payment & Kas/Bank)"])
    P5(["5.0<br />Laporan & Konfigurasi CMS/Sistem"])

    DS1[("DS1 User & Employee")]
    DS2[("DS2 Order & OrderItem")]
    DS3[("DS3 SparePart")]
    DS4[("DS4 Account & Payment")]
    DS5[("DS5 SystemConfig")]

    P1 <-->|"Data Pengguna & Karyawan"| DS1
    P1 --> P2

    Pelanggan -->|"Data Booking Servis & Keluhan"| P2
    P2 -->|"Nomor Antrian, Estimasi, Status & Kwitansi"| Pelanggan
    Admin -->|"Input & Update Order"| P2
    P2 <-->|"Data Order & Items"| DS2
    P2 --> P3

    Admin -->|"Kelola Sparepart & Stok"| P3
    P3 -->|"Lihat Stok & Progress (Read-only)"| Mekanik
    P3 <-->|"Data Sparepart"| DS3
    P3 --> P4

    Admin -->|"Pencatatan Pembayaran"| P4
    Owner -->|"Approval & Proses Pembayaran Gaji"| P4
    P4 <-->|"Data Account & Payment"| DS4
    P4 --> P5

    Owner -->|"Lihat Laporan & Web Settings"| P5
    P5 <-->|"Data SystemConfig & Dynamic Reports"| DS5`,

    dfd2user: `flowchart TB
    Admin["ADMIN (Staff Admin)"]
    Mekanik["MEKANIK (Mekanik)"]
    Owner["OWNER (Pemilik Bengkel)"]

    P11(["1.1<br />Login & Autentikasi"])
    P12(["1.2<br />Kelola Akun User"])
    P13(["1.3<br />Kelola Data Karyawan"])
    P14(["1.4<br />Request Reset Password"])

    DS1_User[("DS1 User")]
    DS1_Employee[("DS1 Employee")]

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
    P14 <-->|"Update forgotRequests (JSON)"| DS1_User
    Owner -->|"Approve / Reset Password"| P14`,

    dfd2service: `flowchart TB
    Pelanggan["PELANGGAN"]
    Admin["ADMIN / OWNER"]
    Mekanik["MEKANIK"]

    P21(["2.1<br />Registrasi Booking<br />(Status: PENDING)"])
    P22(["2.2<br />Estimasi & Konfirmasi<br />(Status: CONFIRMED/QUEUE)"])
    P23(["2.3<br />Penugasan Mekanik"])
    P24(["2.4<br />Pengerjaan Servis<br />(Status: IN_PROGRESS)"])
    P25(["2.5<br />Penyelesaian Order<br />(Status: READY/COMPLETED)"])

    DS2_Order[("DS2 Order")]
    DS2_OrderItem[("DS2 OrderItem")]
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
    P25 -->|"Record OrderItem Komisi"| DS2_OrderItem`,

    dfd2inventory: `flowchart TB
    Admin["ADMIN / OWNER"]

    P31(["3.1<br />Tambah Produk Baru"])
    P32(["3.2<br />Update Info Produk"])
    P33(["3.3<br />Input Stok Masuk"])
    P34(["3.4<br />Input Stok Keluar"])

    DS3_SparePart[("DS3 SparePart")]

    Admin -->|"Input Data Sparepart Baru"| P31
    P31 -->|"Simpan Sparepart"| DS3_SparePart

    Admin -->|"Edit Info Sparepart"| P32
    P32 <-->|"Update Data Sparepart"| DS3_SparePart

    Admin -->|"Input Stok Masuk"| P33
    P33 -->|"Increment Stock"| DS3_SparePart

    Admin -->|"Input Stok Keluar & Keperluan"| P34
    P34 -->|"Decrement Stock"| DS3_SparePart`,

    dfd2transaction: `flowchart TB
    Pelanggan["PELANGGAN"]
    Admin["ADMIN / OWNER"]
    Owner["OWNER"]

    P41(["4.1<br />Pencatatan Pembayaran Order<br />(Kasir)"])
    P42(["4.2<br />Update Saldo Kas/Bank<br />(Account Balance)"])
    P43(["4.3<br />Proses & Pembayaran Gaji<br />(Payment Gaji Karyawan)"])

    DS2_Order[("DS2 Order")]
    DS4_Payment[("DS4 Payment")]
    DS4_Account[("DS4 Account")]

    Pelanggan -->|"Bayar DP / Pelunasan"| P41
    Admin -->|"Input Pembayaran Kasir"| P41
    P41 -->|"Simpan Payment (type: ORDER_PAYMENT)"| DS4_Payment
    P41 -->|"Update totalPaid & paymentStatus"| DS2_Order

    P41 -->|"Trigger Saldo Rekening"| P42
    P42 -->|"Tambah currentBalance pada Account"| DS4_Account

    Owner -->|"Bayar Gaji Karyawan"| P43
    P43 <-->|"Simpan Payment (type: SALARY) & Potong Account Balance"| DS4_Payment
    P43 -->|"Kurangi currentBalance Kas/Bank"| DS4_Account`,

    dfd2report: `flowchart TB
    Owner["OWNER (Pemilik Bengkel)"]
    Admin["ADMIN (Staff Admin)"]

    P51(["5.1<br />Laporan Keuangan Real-Time<br />(Laba Rugi, Cashflow, Neraca)"])
    P52(["5.2<br />Laporan Stok & Persediaan<br />(Mutasi & Nilai Sparepart)"])
    P53(["5.3<br />Laporan Analisis Operasional<br />(Kinerja Mekanik & Servis)"])
    P54(["5.4<br />Laporan Penggajian Karyawan"])
    P55(["5.5<br />Dashboard Overview & CMS Config"])

    DS4_Account_Payment[("DS4 Account & Payment")]
    DS3_SparePart[("DS3 SparePart")]
    DS2_Order[("DS2 Order")]
    DS5_SystemConfig[("DS5 SystemConfig")]

    Owner -->|"Request Laporan Keuangan"| P51
    P51 <-->|"Kalkulasi Real-Time Payment & Account"| DS4_Account_Payment
    P51 -->|"Laporan Laba Rugi & Cashflow"| Owner

    Admin -->|"Monitor Stok & Reorder Point"| P52
    P52 <-->|"Ambil Data Sparepart"| DS3_SparePart
    P52 -->|"Laporan Nilai Persediaan"| Admin

    Admin -->|"Request Laporan Servis"| P53
    P53 <-->|"Ambil Data Order & Items"| DS2_Order
    P53 -->|"Laporan Kinerja Mekanik"| Admin

    Owner -->|"Review Histori Gaji Karyawan"| P54
    P54 <-->|"Ambil Payment (type: SALARY)"| DS4_Account_Payment
    P54 -->|"Laporan Gaji"| Owner

    Owner -->|"View Dashboard Summary & CMS"| P55
    Admin -->|"View Dashboard Summary & CMS"| P55
    P55 <--|"Summary Stats Order"| DS2_Order
    P55 <--|"Summary Kas/Bank"| DS4_Account_Payment
    P55 <--|"Dynamic Content & CMS"| DS5_SystemConfig`,

    flowOrder: `flowchart TD
    Start([Mulai: Pelanggan Booking])
    
    Input[Admin/Pelanggan Buat Order<br />Status: PENDING]
    SaveOrder[(Simpan Order)]
    
    InputEstimate[Input Estimasi:<br />- Jasa & Sparepart<br />- Total Estimasi Biaya]
    UpdateEstimated[(Set Status: ESTIMATED)]
    
    CustomerApprove{Pelanggan<br />Setuju?}
    Cancelled[(Set Status: CANCELLED)]
    EndCancelled([Selesai:<br />Order Dibatalkan])
    
    UpdateConfirmed[(Set Status: CONFIRMED / QUEUE)]
    
    AssignMechanic[Tugaskan Mekanik<br />Set mechanicId]
    
    StartWork[Mulai Kerja]
    UpdateInProgress[(Set Status: IN_PROGRESS)]
    ReduceStock[Kurangi Stok Sparepart]
    
    Work[Proses Servis / Modifikasi]
    Complete[Pekerjaan Selesai]
    UpdateReady[(Set Status: READY)]
    NotifyCustomer[Notif Pelanggan:<br />Unit Siap Diambil]
    
    Payment[Pembayaran & Kasir]
    CloseOrder[(Set Status: COMPLETED)]
    GenerateInvoice[Cetak Invoice]
    
    End([Selesai:<br />Motor Diambil])
    
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
    ReduceStock --> Work
    Work --> Complete
    Complete --> UpdateReady
    UpdateReady --> NotifyCustomer
    NotifyCustomer --> Payment
    Payment --> CloseOrder
    CloseOrder --> GenerateInvoice
    GenerateInvoice --> End
    
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class Input,InputEstimate,AssignMechanic,StartWork,Work,Complete,Payment,GenerateInvoice,NotifyCustomer processStyle
    class CustomerApprove decisionStyle
    class SaveOrder,UpdateEstimated,Cancelled,UpdateConfirmed,UpdateInProgress,ReduceStock,UpdateReady,CloseOrder dataStyle
    class Start,End,EndCancelled startEndStyle`,

    flowPayment: `flowchart TD
    Start([Mulai:<br />Pencatatan Pembayaran])
    
    PaymentType{Jenis<br />Pembayaran?}
    
    OrderPayment[Pembayaran Order]
    GetOrder[(Ambil Data Order)]
    
    InputOrderAmount[Input Jumlah Bayar]
    CheckOrderFull{Jumlah Bayar +<br />Terbayar >= Total?}
    
    SetOrderPaid[(Set Order:<br />paymentStatus = PAID)]
    SetOrderPartial[(Set Order:<br />paymentStatus = PARTIAL)]
    
    CreateOrderPayment[(Buat Payment:<br />type = ORDER_PAYMENT)]
    UpdateAccountBalance[(Update Account:<br />currentBalance += Amount)]
    
    SalaryPayment[Pembayaran Gaji Karyawan]
    GetEmployee[(Ambil Data Karyawan)]
    
    InputSalaryAmount[Input Gaji & Komisi]
    CreateSalaryPayment[(Buat Payment:<br />type = SALARY)]
    DeductAccountBalance[(Update Account:<br />currentBalance -= Amount)]
    
    LogActivity[(Catat Log Aktivitas)]
    Success([Sukses])
    
    Start --> PaymentType
    
    PaymentType -->|Order| OrderPayment
    OrderPayment --> GetOrder
    GetOrder --> InputOrderAmount
    InputOrderAmount --> CheckOrderFull
    
    CheckOrderFull -->|Ya: Lunas| SetOrderPaid
    CheckOrderFull -->|Tidak: Parsial| SetOrderPartial
    
    SetOrderPaid --> CreateOrderPayment
    SetOrderPartial --> CreateOrderPayment
    
    CreateOrderPayment --> UpdateAccountBalance
    UpdateAccountBalance --> LogActivity
    
    PaymentType -->|Gaji| SalaryPayment
    SalaryPayment --> GetEmployee
    GetEmployee --> InputSalaryAmount
    InputSalaryAmount --> CreateSalaryPayment
    CreateSalaryPayment --> DeductAccountBalance
    DeductAccountBalance --> LogActivity
    
    LogActivity --> Success
    
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class OrderPayment,InputOrderAmount,SalaryPayment,InputSalaryAmount processStyle
    class PaymentType,CheckOrderFull decisionStyle
    class GetOrder,SetOrderPaid,SetOrderPartial,CreateOrderPayment,UpdateAccountBalance,GetEmployee,CreateSalaryPayment,DeductAccountBalance,LogActivity dataStyle
    class Start,Success startEndStyle`,
    
    flowPayroll: `flowchart TD
    Start([Mulai: Hitung Gaji & Komisi Karyawan])
    
    InputPeriod[Input Periode:<br />Tanggal Mulai & Akhir]
    GetEmployees[(Ambil Data Karyawan)]
    
    CheckSalaryType{Skema Gaji<br />(salaryType)?}
    
    DailyCalc[Gaji Pokok Harian]
    CountDays[Hitung Hari Kerja]
    CalcDailyBase[Gaji Pokok =<br />Hari Kerja x dailyRate]
    
    CommissionCalc[Hitung Komisi Servis]
    CountMotors[Hitung Motor Selesai Ditangani<br />dalam Periode]
    CalcCommissionBase[Komisi =<br />Motor x commissionRate]
    
    InputBonus[Input Bonus / Potongan]
    CalcTotal[Total Diterima =<br />Gaji Pokok + Komisi + Bonus]
    
    RecordPayment[(Buat Record Payment:<br />type = SALARY)]
    
    End([Selesai])
    
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
    
    CheckSalaryType -->|MONTHLY| CalcDailyBase
    
    InputBonus --> CalcTotal
    CalcTotal --> RecordPayment
    RecordPayment --> End
    
    classDef processStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef decisionStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef startEndStyle fill:#ffccbc,stroke:#bf360c,stroke-width:3px
    
    class InputPeriod,DailyCalc,CommissionCalc,InputBonus processStyle
    class CheckSalaryType decisionStyle
    class GetEmployees,CountDays,CalcDailyBase,CountMotors,CalcCommissionBase,CalcTotal,RecordPayment dataStyle
    class Start,End startEndStyle`,
    
    flowAuthLogin: `flowchart TD
    Start([Mulai: Login User])
    
    InputCredentials[Input Email & Password]
    FindUser[(Cari User by Email)]
    
    UserExists{User Ada?}
    ErrorNotFound[Error: Email tidak terdaftar]
    
    CheckActive{User Aktif?}
    ErrorInactive[Error: Akun dinonaktifkan]
    
    VerifyPassword[Verifikasi Password<br />menggunakan bcrypt]
    PasswordMatch{Password Cocok?}
    ErrorPassword[Error: Password salah]
    
    CreateSession[NextAuth:<br />Buat Sesi Login]
    LogActivity[(Log: LOGIN_SUCCESS)]
    
    Success([Sukses: Masuk Dashboard])
    Failed([Gagal])
    
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
    ShowMessage[Tampilkan Pesan:<br />Permintaan dikirim ke admin]
    
    CreateRequest[(Update User.forgotRequests JSON<br />status = PENDING)]
    LogActivity[(Catat Log Aktivitas)]
    
    End([Selesai])
    
    Start --> InputEmail
    InputEmail --> FindUser
    FindUser --> UserExists
    
    UserExists -->|Tidak| ShowMessage
    UserExists -->|Ya| CreateRequest
    CreateRequest --> LogActivity
    LogActivity --> ShowMessage
    ShowMessage --> End
    
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
    
    GetRequests[(Ambil Request PENDING dari User)]
    OwnerInput[Owner Input Password Baru]
    
    HashPassword[Hash Password Baru dengan bcrypt]
    
    UpdateUserAndPassword[(Update User:<br />- password = Hash Baru<br />- resetToken & forgotRequests updated)]
    
    LogActivity[(Catat Log Aktivitas)]
    
    Success([Sukses: Password Berhasil Direset])
    
    Start --> GetRequests
    GetRequests --> OwnerInput
    OwnerInput --> HashPassword
    HashPassword --> UpdateUserAndPassword
    UpdateUserAndPassword --> LogActivity
    LogActivity --> Success
    
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
        UC9["Laporan Keuangan & Kas/Bank"]
        UC10["Proses & Bayar Gaji Karyawan"]
        UC11["Kelola Akun Pengguna & Profil"]
    end

    Customer -.-> UC1
    Customer -.-> UC2

    Admin -.-> UC4
    Admin -.-> UC5
    Admin -.-> UC6
    Admin -.-> UC2

    Mechanic -.-> UC7
    Mechanic -.-> UC2

    Owner -.-> UC9
    Owner -.-> UC10
    Owner -.-> UC11
    Owner -.-> UC5

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
    Sys-->>Admin: Simpan OrderItem (Status: ESTIMATED)
    
    Cust->>Admin: Setujui Estimasi
    Admin->>Sys: Konfirmasi Order (Status: CONFIRMED/QUEUE)
    
    Admin->>Sys: Tugaskan Mekanik (Set mechanicId)
    Sys->>Mech: Notifikasi Pekerjaan Baru
    
    Mech->>Sys: Mulai Kerja (Status: IN_PROGRESS)
    Sys->>Sys: Kurangi Stok Sparepart
    
    Mech->>Sys: Selesai Pengerjaan (Status: READY)
    Sys-->>Cust: Notifikasi Unit Siap Diambil
    
    Cust->>Admin: Melakukan Pembayaran (Kasir)
    Admin->>Sys: Input Pembayaran (CASH/TRANSFER)
    Sys->>Sys: Update totalPaid & paymentStatus (PAID)
    Sys->>Sys: Update Saldo Account Kas/Bank
    
    Admin->>Sys: Tutup Order (Status: COMPLETED)
    Sys-->>Admin: Cetak Kwitansi/Invoice`,

    dfdHighLevel: `graph TD
    Customer((Customer/Pengunjung))
    Admin((Admin Terotorisasi))
    Mechanic((Mekanik))
    SystemDB[(Sistem Database)]

    Customer -- "1. Melakukan Booking (Form Web)" --> S1[Aksi: Buat Booking]
    S1 -->|"Simpan (PENDING)"| SystemDB
    SystemDB -->|"Notifikasi Order Baru"| Admin

    Admin -- "2. Review & Estimasi (Input Servis/Part)" --> S2[Aksi: Update Estimasi]
    S2 -->|"Update Status (ESTIMATED)"| SystemDB
    
    Customer -- "3. Setuju Estimasi" --> S3[Aksi: Konfirmasi Order]
    S3 -->|"Update Status (CONFIRMED)"| SystemDB
    S3 -->|"Masuk Antrian (QUEUE)"| Mechanic

    Mechanic -- "4. Mengerjakan Servis" --> S4[Aksi: Proses Order]
    S4 -->|"Update Status (IN_PROGRESS)"| SystemDB
    S4 -->|"Kurangi Stok Sparepart"| SystemDB

    Mechanic -- "5. Selesai Pengerjaan" --> S5[Aksi: Selesai Order]
    S5 -->|"Update Status (READY)"| SystemDB
    SystemDB -->|"Notifikasi Unit Siap"| Customer

    Customer -- "6. Pembayaran" --> Admin
    Admin -- "7. Input Pembayaran" --> S6[Aksi: Proses Pembayaran]
    S6 -->|"Update Status (COMPLETED) & Simpan Payment"| SystemDB
    S6 -->|"Update Saldo Account Kas/Bank"| SystemDB`,

    seqFinance: `sequenceDiagram
    participant Admin as Admin/Kasir
    participant BO as Sistem Order
    participant INV as Sistem Inventory
    participant ACC as Kas & Bank (Account)
    participant PAY as Sistem Payment

    Note over Admin, PAY: Skenario 1: Penggunaan Sparepart saat Servis
    Admin->>BO: Mulai Kerja (Status: IN_PROGRESS)
    BO->>INV: Kurangi Stok Sparepart (stock -= quantity)

    Note over Admin, PAY: Skenario 2: Pembayaran Order oleh Pelanggan
    Admin->>BO: Catat Pembayaran Order (DP / Lunas)
    BO->>PAY: Buat Record Payment (type: ORDER_PAYMENT)
    PAY->>ACC: Tambah currentBalance pada Account Kas/Bank
    BO->>BO: Update totalPaid & paymentStatus (PAID/PARTIAL)

    Note over Admin, PAY: Skenario 3: Pembayaran Gaji Karyawan oleh Owner
    Admin->>PAY: Catat Payout Gaji (type: SALARY)
    PAY->>ACC: Potong currentBalance pada Account Kas/Bank`,

    flowLanding: `flowchart TD
    Start([Mulai: Kunjungan User])
    
    Hero[Lihat Hero Section]
    Services[Lihat Layanan]
    Socials[Lihat Media Sosial]
    
    ActionCheck{Aksi User?}
    
    PathBooking[Booking Servis]
    FormBooking[Isi Form Booking:<br />- Nama, HP, Motor, Keluhan<br />- Pilih Tipe Servis & Tanggal]
    Validation{Valid?}
    ErrorValid[Tampilkan Error]
    SubmitBooking[Kirim Order]
    SaveDB[(Buat Order PENDING)]
    SuccessBooking[Tampilkan Sukses &<br />Nomor Antrian]
    
    PathTrack[Lacak Order]
    InputTrack[Input No HP atau Plat No]
    SearchDB[(Cari Order)]
    Found{Ditemukan?}
    ShowStatus["Tampilkan Status Order<br />(Antrian/Proses/Selesai)"]
    ShowNotFound["Tampilkan 'Tidak Ditemukan'"]
    
    PathKanban[Kanban Publik]
    LoadKanban[(Ambil Order Publik)]
    DisplayBoard[Tampilkan Papan Antrian]
    
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
    
    classDef action fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
    classDef success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px;
    classDef error fill:#ffcdd2,stroke:#c62828,stroke-width:2px;
    
    class ActionCheck,Validation,Found action;
    class SuccessBooking,ShowStatus success;
    class ErrorValid,ShowNotFound error;`,

    flowCMS: `flowchart TD
    Start([Mulai: Admin CMS])
    
    Dashboard[Dashboard Admin]
    TabContent[Tab Konten & Media]
    
    SelectFeature{Kelola Apa?}
    
    FlowMedia[Galeri Media]
    ActionMedia{Aksi?}
    
    UploadImg[Upload Gambar]
    SaveStorage[(Simpan ke /public/uploads)]
    CreateRecord[(Buat SystemConfig category: MEDIA_GALLERY)]
    
    ToggleMedia[Ubah Visibilitas]
    UpdateStatus[(Update isVisible)]
    
    DeleteMedia[Hapus Gambar]
    RemoveFile[(Hapus File & SystemConfig)]
    
    FlowSocial[Embed Sosial Media]
    InputUrl[Input URL TikTok/IG]
    SaveEmbed[(Simpan SystemConfig category: SOCIAL_EMBED)]
    
    FlowText[Bagian Teks]
    SelectSection[Pilih Section Key:<br />HERO / ABOUT / CONTACT]
    EditContent[Edit Judul/Isi/Media]
    SaveContent[(Update SystemConfig category: CONTENT)]
    
    Revalidate[Revalidasi Cache Next.js]
    UpdatePublic[Landing Page Terupdate]
    
    Start --> Dashboard
    Dashboard --> TabContent
    TabContent --> SelectFeature
    
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
    
    SelectFeature -->|Sosial| FlowSocial
    FlowSocial --> InputUrl
    InputUrl --> SaveEmbed
    SaveEmbed --> Revalidate
    
    SelectFeature -->|Teks| FlowText
    FlowText --> SelectSection
    SelectSection --> EditContent
    EditContent --> SaveContent
    SaveContent --> Revalidate
    
    Revalidate --> UpdatePublic`,

    hierarchy: `graph TD
    System[Sistem Manajemen NopzGarage]
    
    OwnerAccess[1. Owner - Full Control]
    AdminAccess[2. Admin - Operations & Cashier]
    EmployeeAccess[3. Employee / Mechanic - Read-only Queue]
    PublicAccess[4. Public / Guest - Customer Services]
    
    System --> OwnerAccess
    System --> AdminAccess
    System --> EmployeeAccess
    System --> PublicAccess
    
    OwnerAccess --> OwnerU[Manajemen Pengguna & Karyawan]
    OwnerAccess --> OwnerPay[Penggajian & Gaji Karyawan]
    OwnerAccess --> OwnerFin[Laporan Keuangan & Kas/Bank]
    OwnerAccess --> OwnerSet[Konfigurasi Sistem]
    
    AdminAccess --> AdminOrd[Input & Estimasi Order]
    AdminAccess --> AdminPay[Kasir & Rekonsiliasi Bank]
    AdminAccess --> AdminInv[Manajemen Stok & Penyesuaian]
    AdminAccess --> AdminCMS[Kelola Konten CMS Landing Page]
    
    EmployeeAccess --> EmpTask[Daftar Antrian Kerja]
    EmployeeAccess --> EmpWork[Lihat Progress Kerja]
    EmployeeAccess --> EmpSlip[Lihat Slip & Histori Gaji]
    
    PublicAccess --> PubBook[Form Booking Online]
    PublicAccess --> PubTrack[Lacak Status Order]
    PublicAccess --> PubKanban[Papan Antrian Publik]
    
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">
             Technical Documentation
          </h1>
          <p className="text-muted-foreground">NopzGarage Management System v2.3.2</p>
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="accounts">COA</TabsTrigger>
          <TabsTrigger value="diagrams">Diagrams</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
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
                Entity Relationship Diagram (ERD - 9 Active Models)
              </CardTitle>
              <CardDescription>
                Struktur relasi dan kardinalitas antar entitas database PostgreSQL (Prisma ORM)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-card border rounded-xl overflow-x-auto">
                <MermaidDiagram chart={diagrams.erd} />
              </div>

              {/* ERD Notation Legend */}
              <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3 text-xs">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Panduan Notasi & Simbol Kardinalitas ERD (Crow&apos;s Foot)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                  <div className="p-2.5 bg-background border rounded-lg">
                    <span className="font-mono font-bold text-primary block">||--||</span>
                    <span className="font-semibold text-foreground">One to Exactly One</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Wajib tepat satu entitas.</p>
                  </div>
                  <div className="p-2.5 bg-background border rounded-lg">
                    <span className="font-mono font-bold text-primary block">||--o|</span>
                    <span className="font-semibold text-foreground">One to Optional One</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Satu ke nol atau satu (1 : 0..1).</p>
                  </div>
                  <div className="p-2.5 bg-background border rounded-lg">
                    <span className="font-mono font-bold text-primary block">||--|{`{`}</span>
                    <span className="font-semibold text-foreground">One to Mandatory Many</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Satu ke satu atau lebih (1 : 1..*).</p>
                  </div>
                  <div className="p-2.5 bg-background border rounded-lg">
                    <span className="font-mono font-bold text-primary block">||--o{`{`}</span>
                    <span className="font-semibold text-foreground">One to Optional Many</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Satu ke nol atau lebih (1 : 0..*).</p>
                  </div>
                  <div className="p-2.5 bg-background border rounded-lg">
                    <span className="font-mono font-bold text-primary block">o|--o{`{`}</span>
                    <span className="font-semibold text-foreground">Optional to Optional Many</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Foreign key induk opsional; induk memiliki nol atau banyak anak.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pt-2 border-t text-[11px] text-muted-foreground">
                  <span><strong className="text-foreground font-mono">PK</strong> = Primary Key</span>
                  <span><strong className="text-foreground font-mono">FK</strong> = Foreign Key</span>
                  <span><strong className="text-foreground font-mono">UK</strong> = Unique Key Constraint</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Schema Tables ({tables.length} Tables)
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
                System Diagrams (Updated v2.3.2)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion
                type="single"
                collapsible
                className="w-full"
              >
                
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
                    Financial & Cash Mutation Sequence
                  </AccordionTrigger>
                  <AccordionContent>
                    <MermaidDiagram chart={diagrams.seqFinance} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Diagram sequence ini menjelaskan bagaimana transaksi operasional (seperti pemakaian sparepart, penerimaan pembayaran order, dan pembayaran gaji) 
                      secara otomatis memicu pembaruan saldo rekening kas/bank (Account) secara real-time.
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
                    Flowchart 2: Payment & Account Balance Logic
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
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">app/</span>: Page routes, layouts, and API endpoints</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">lib/actions/</span>: Server Actions (core backend logic)</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">components/</span>: Reusable UI & dialog components</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">prisma/</span>: Database schema & seeds</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">lib/</span>: Utilities, RBAC auth helpers (authCheck.ts) & export helpers</li>
                     <li className="p-2 border rounded bg-muted/20"><span className="font-mono font-bold">public/</span>: Static assets & uploaded images</li>
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
                         <p className="font-mono font-bold text-primary">admin/</p>
                         <p className="text-muted-foreground">Protected Admin & Owner Dashboard Routes</p>
                       </div>
                       <div>
                         <p className="font-mono font-bold text-primary">employee/</p>
                         <p className="text-muted-foreground">Employee Portal & Order Tracking</p>
                       </div>
                       <div>
                         <p className="font-mono font-bold text-primary">kanban/ & status/</p>
                         <p className="text-muted-foreground">Public Queue Board & Order Status Tracking</p>
                       </div>
                       <div>
                         <p className="font-mono font-bold text-primary">api/</p>
                         <p className="text-muted-foreground">REST API & NextAuth Endpoints</p>
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
                          <DollarSign className="h-4 w-4" /> Finance & Cashflow
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">Payment & Bank Reconciliation</p>
                        <div className="text-xs bg-muted p-2 rounded font-mono">
                          Order -{'>'} Payment -{'>'} Account (Kas/Bank)
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
                          Employee -{'>'} OrderItem (Komisi) -{'>'} Payment (Gaji)
                        </div>
                      </div>

                    </div>
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                Standard Coding Guidelines & Project Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                
                {/* 1. Prinsip Umum */}
                <AccordionItem value="g1">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    1. Prinsip Umum (General Principles)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong className="text-foreground">App Router sebagai Standar:</strong> Gunakan App Router (<code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">app/</code>) sebagai arsitektur routing utama. Pages Router hanya untuk legacy.</li>
                      <li><strong className="text-foreground">TypeScript Wajib:</strong> Seluruh kode proyek wajib menggunakan TypeScript (<code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">.ts</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">.tsx</code>). JavaScript murni dilarang kecuali config root (seperti <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">next.config.mjs</code>).</li>
                      <li><strong className="text-foreground">Fitur Modern ES6+:</strong> Gunakan <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">const/let</code>, arrow functions, template literals, destructuring, optional chaining (<code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">?.</code>), dan nullish coalescing (<code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">??</code>).</li>
                      <li><strong className="text-foreground">React Server Components (RSC) Default:</strong> Komponen di <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">app/</code> secara default adalah Server Component. Hanya tambahkan direktif <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-bold">&quot;use client&quot;</code> di baris pertama jika membutuhkan interaktivitas klien (useState, useEffect, event handler).</li>
                      <li><strong className="text-foreground">Format Kode Otomatis:</strong> Menggunakan Prettier sebagai instrumen format kode standar tim.</li>
                      <li><strong className="text-foreground">Sistem Tipe Struktural:</strong> Gunakan <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-bold">interface</code> daripada <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">type</code> alias saat memodelkan struktur objek.</li>
                      <li><strong className="text-foreground">Eksport Modul:</strong> Gunakan <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">named exports</code> (<code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">export function Page() &#123;&#125;</code>). Dilarang default export kecuali file konvensi Next.js (<code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">page.tsx</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">layout.tsx</code>, dll).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. File & Folder Naming */}
                <AccordionItem value="g2">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Folder className="h-5 w-5 text-amber-500" />
                    2. Konvensi Penamaan File & Folder
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 border rounded bg-muted/20">
                        <span className="font-semibold text-foreground">Folder Route / Fitur:</span>
                        <p className="font-mono text-xs text-primary mt-1">kebab-case (contoh: user-profile/, dashboard/)</p>
                      </div>
                      <div className="p-3 border rounded bg-muted/20">
                        <span className="font-semibold text-foreground">File Konvensi Next.js:</span>
                        <p className="font-mono text-xs text-primary mt-1">lowercase (contoh: page.tsx, layout.tsx, loading.tsx)</p>
                      </div>
                      <div className="p-3 border rounded bg-muted/20">
                        <span className="font-semibold text-foreground">Komponen React (File):</span>
                        <p className="font-mono text-xs text-primary mt-1">PascalCase (contoh: UserCard.tsx, InvoiceTable.tsx)</p>
                      </div>
                      <div className="p-3 border rounded bg-muted/20">
                        <span className="font-semibold text-foreground">Utilitas / Helper:</span>
                        <p className="font-mono text-xs text-primary mt-1">camelCase (contoh: formatDate.ts, fetchRevenue.ts)</p>
                      </div>
                      <div className="p-3 border rounded bg-muted/20">
                        <span className="font-semibold text-foreground">Konfigurasi Root:</span>
                        <p className="font-mono text-xs text-primary mt-1">Standar ekosistem (contoh: next.config.mjs, tailwind.config.ts)</p>
                      </div>
                      <div className="p-3 border rounded bg-muted/20">
                        <span className="font-semibold text-foreground">Dokumentasi:</span>
                        <p className="font-mono text-xs text-primary mt-1">UPPERCASE / kebab-case (contoh: README.md, CHANGELOG.md)</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Aturan Kode & Identifiers */}
                <AccordionItem value="g3">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-500" />
                    3. Standar Kode & Identifiers
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1.5">
                      <li><strong className="text-foreground">Variabel, Fungsi & Metode:</strong> <code className="font-mono bg-muted px-1 rounded">camelCase</code> (contoh: <code className="font-mono text-foreground">getUserName()</code>, <code className="font-mono text-foreground">isActive</code>)</li>
                      <li><strong className="text-foreground">Komponen React & Types:</strong> <code className="font-mono bg-muted px-1 rounded">PascalCase</code> (contoh: <code className="font-mono text-foreground">&lt;UserProfile /&gt;</code>, <code className="font-mono text-foreground">InvoiceStatus</code>)</li>
                      <li><strong className="text-foreground">Konstanta Statis Modul:</strong> <code className="font-mono bg-muted px-1 rounded">CONSTANT_CASE</code> (contoh: <code className="font-mono text-foreground">MAX_TIMEOUT</code>, <code className="font-mono text-foreground">API_BASE_URL</code>)</li>
                      <li><strong className="text-foreground">Props Component & DOM:</strong> <code className="font-mono bg-muted px-1 rounded">camelCase</code> (contoh: <code className="font-mono text-foreground">userId</code>, <code className="font-mono text-foreground">className</code>, <code className="font-mono text-foreground">htmlFor</code>)</li>
                      <li><strong className="text-foreground">Event Handlers (Props):</strong> Awalan <code className="font-mono bg-muted px-1 rounded font-bold">on</code> (contoh: <code className="font-mono text-foreground">onClick</code>, <code className="font-mono text-foreground">onValueChange</code>)</li>
                      <li><strong className="text-foreground">Event Handlers (Internal):</strong> Awalan <code className="font-mono bg-muted px-1 rounded font-bold">handle</code> (contoh: <code className="font-mono text-foreground">handleClick</code>, <code className="font-mono text-foreground">handleSubmit</code>)</li>
                      <li><strong className="text-foreground">Array / Koleksi:</strong> Format Plural tanpa suffix tipe (contoh: <code className="font-mono text-foreground">users</code>, <code className="font-mono text-foreground">invoices</code> — bukan <code className="font-mono text-destructive">userList</code>)</li>
                      <li><strong className="text-foreground">Larangan:</strong> Dilarang menggunakan Notasi Hungarian (misal: <code className="font-mono text-destructive">sName</code>) dan awalan/akhiran underscore (<code className="font-mono text-destructive">_name</code>).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* 4. Structure Directives */}
                <AccordionItem value="g4">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-indigo-500" />
                    4. Arsitektur Struktur Direktori
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-xs font-mono bg-muted p-4 rounded-lg">
                    <div>project-root/</div>
                    <div>├── app/              # Root layouts, route segments, server components & API route handlers</div>
                    <div>├── components/       # Reusable UI primitives (ui/), layout (layout/) & feature components</div>
                    <div>├── lib/              # Business logic, server actions (actions.ts), Prisma & data helpers</div>
                    <div>├── public/           # Static assets (images/, fonts/, uploads/)</div>
                    <div>├── middleware.ts      # Next.js edge request middleware</div>
                    <div>└── next.config.mjs   # Root Next.js configuration</div>
                  </AccordionContent>
                </AccordionItem>

                {/* 5. Component Writing Order */}
                <AccordionItem value="g5">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-500" />
                    5. Urutan Penulisan File Komponen
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                      <li><strong className="text-foreground">Direktif:</strong> <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">&quot;use client&quot;;</code> (jika diperlukan)</li>
                      <li><strong className="text-foreground">Import Statements:</strong> External libraries → Internal components → Utilities/Helpers → Types</li>
                      <li><strong className="text-foreground">Interface/Type Props:</strong> Definisi tipe props komponen (<code className="font-mono bg-muted px-1 rounded">interface UserCardProps &#123; ... &#125;</code>)</li>
                      <li><strong className="text-foreground">Deklarasi Komponen:</strong> Fungsi utama komponen (<code className="font-mono bg-muted px-1 rounded">export default function UserCard() &#123; ... &#125;</code>)</li>
                      <li><strong className="text-foreground">Fungsi Helper Internal:</strong> Utility internal lokal file (jika ada)</li>
                      <li><strong className="text-foreground">Export Statements:</strong> Default / named export</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* 6 & 7. Functions, Control Flow & Loops */}
                <AccordionItem value="g6">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-cyan-500" />
                    6 & 7. Deklarasi Fungsi, Control Flow & Perulangan
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong className="text-foreground">Function Declaration:</strong> Gunakan <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">function calculate() &#123;&#125;</code> untuk komponen & fungsi utama. Arrow function <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">() =&gt; &#123;&#125;</code> khusus callback inline.</li>
                      <li><strong className="text-foreground">Wajib Kurung Kurawal:</strong> Blok statement <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">&#123; ... &#125;</code> wajib ditulis meskipun 1 baris.</li>
                      <li><strong className="text-foreground">Guard Pattern / Early Return:</strong> Terapkan early return, hilangkan blok <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">else</code> jika cabang <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">if</code> mengembalikan nilai (<code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">return</code>).</li>
                      <li><strong className="text-foreground">Array Iteration:</strong> Dilarang perulangan primitif (<code className="font-mono text-destructive">for (let i = 0; ...)</code>). Gunakan <code className="font-mono text-primary font-bold">.map()</code>, <code className="font-mono text-primary font-bold">.filter()</code>, <code className="font-mono text-primary font-bold">.find()</code>, <code className="font-mono text-primary font-bold">.forEach()</code>, <code className="font-mono text-primary font-bold">.every()</code>.</li>
                      <li><strong className="text-foreground">Switch Case:</strong> Wajib meletakkan <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">default</code> paling bawah dan jangan menambah <code className="font-mono text-destructive">break</code> di bawah statement <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">return</code>.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* 8. Next.js Routing Conventions */}
                <AccordionItem value="g8">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-rose-500" />
                    8. Konvensi Ekspor File Khusus Next.js (App Router)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                      <div className="p-2 border rounded bg-muted/20">
                        <span className="font-bold text-foreground">layout.tsx:</span>
                        <p className="text-primary mt-0.5">export default function Layout()</p>
                      </div>
                      <div className="p-2 border rounded bg-muted/20">
                        <span className="font-bold text-foreground">page.tsx:</span>
                        <p className="text-primary mt-0.5">export default function Page()</p>
                      </div>
                      <div className="p-2 border rounded bg-muted/20">
                        <span className="font-bold text-foreground">loading.tsx:</span>
                        <p className="text-primary mt-0.5">export default function Loading()</p>
                      </div>
                      <div className="p-2 border rounded bg-muted/20">
                        <span className="font-bold text-foreground">error.tsx:</span>
                        <p className="text-primary mt-0.5">export default function Error()</p>
                      </div>
                      <div className="p-2 border rounded bg-muted/20">
                        <span className="font-bold text-foreground">not-found.tsx:</span>
                        <p className="text-primary mt-0.5">export default function NotFound()</p>
                      </div>
                      <div className="p-2 border rounded bg-muted/20">
                        <span className="font-bold text-foreground">route.ts:</span>
                        <p className="text-primary mt-0.5">export async function GET() / POST()</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 9, 10, 11, 12. Formatting, Comments, CSS & JSON */}
                <AccordionItem value="g9">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-teal-500" />
                    9-12. Formatting, JSX, Comments, CSS & JSON Rules
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                    <div>
                      <h4 className="font-bold text-foreground mb-1">TypeScript / JSX Rules</h4>
                      <p>Indentasi 2 spasi (dilarang Tab), 1 baris 1 deklarasi variabel. Atribut JSX &gt; 2 wajib ditulis multi-baris. Gunakan kutip ganda (<code className="font-mono text-foreground">&quot;...&quot;</code>) untuk string literal & self-closing tag (<code className="font-mono text-foreground">&lt;Input /&gt;</code>) dengan spasi sebelum closing.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Komentar Code</h4>
                      <p>Komentar menggunakan Bahasa Inggris. Di luar JSX gunakan <code className="font-mono text-foreground">//</code> (max 60-80 karakter/baris). Di dalam JSX gunakan <code className="font-mono text-foreground">&#123;/* komentar */&#125;</code>. Gunakan JSDoc (<code className="font-mono text-foreground">/** ... */</code>) untuk fungsi/komponen yang di-export.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Standar CSS & Styling</h4>
                      <p>Selector lowercase, class selector kebab-case (<code className="font-mono text-foreground">.card-header</code>). Utamakan class selector (hindari ID selector). Mobile-First responsive. Warna dengan format modern <code className="font-mono text-foreground">rgb(31 41 59 / 0.26)</code>. Media query modern (<code className="font-mono text-foreground font-bold">@media (width &gt;= 480px)</code>). Dilarang keras memakai <code className="font-mono text-destructive">!important</code>.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Standar File JSON</h4>
                      <p>Indentasi 2 spasi, kutip ganda (<code className="font-mono text-foreground">&quot;...&quot;</code>) untuk key & string value, key camelCase, dilarang trailing comma, dan format tanggal ISO 8601 UTC (<code className="font-mono text-foreground">&quot;2026-07-15T01:30:54Z&quot;</code>).</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
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
              "CHANGELOG.md",
              "TECHNICAL_DOCUMENTATION.md",
              "prisma/schema.prisma"
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
