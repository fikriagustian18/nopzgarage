# NopzGarage Management System

## 📋 Deskripsi Proyek

**NopzGarage Management System** adalah sistem manajemen bengkel motor berbasis web yang komprehensif dan terintegrasi. Aplikasi ini dirancang untuk mendigitalkan seluruh operasional bengkel motor "NopzGarage", mencakup manajemen order servis, inventori suku cadang, pengelolaan karyawan dan penggajian (payroll), pencatatan keuangan dengan sistem jurnal akuntansi, serta portal publik untuk pelanggan melacak status servis kendaraan mereka secara real-time.

Sistem ini dibangun menggunakan arsitektur modern dengan Next.js 14 App Router, memanfaatkan React Server Components dan Server Actions untuk performa optimal dan type-safety end-to-end. Database PostgreSQL dengan Prisma ORM memastikan integritas data dan kemudahan dalam pengembangan. Antarmuka pengguna dibangun dengan Tailwind CSS dan komponen Shadcn/UI yang memberikan pengalaman visual yang modern, responsif, dan profesional.

### 🛠️ Tech Stack
| Kategori | Teknologi |
|----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS & Shadcn/UI |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js |
| State Management | React Server Components & Server Actions |
| Charts | Recharts |
| Validation | Zod |

---

## 🎯 Fitur Utama (Feature Overview)

### 1. Dashboard Admin (`/admin`)

Dashboard Admin merupakan pusat kontrol utama sistem yang menyajikan ringkasan komprehensif mengenai performa bisnis bengkel. Halaman ini menampilkan empat kartu metrik utama yang dilengkapi dengan mini-chart interaktif: Total Revenue (pendapatan keseluruhan dengan tren bulanan), Total Expenses (pengeluaran operasional), Net Profit (keuntungan bersih), dan Active Orders (order yang sedang dalam proses). Setiap kartu menampilkan persentase perubahan dibandingkan periode sebelumnya.

Di bawah kartu metrik, terdapat grafik area yang menunjukkan tren revenue dan expenses dalam 7 hari terakhir, memberikan insight visual tentang arus kas harian. Terdapat juga pie chart distribusi status order yang membantu admin memahami komposisi workload antara order pending, in-progress, dan completed. Panel aktivitas terbaru menampilkan log real-time dari seluruh aktivitas sistem termasuk pembuatan order baru, update status, pembayaran, dan perubahan inventori. Dashboard ini sepenuhnya responsif dan optimal untuk diakses dari desktop maupun perangkat mobile.

### 2. Manajemen Order (`/admin/orders`)

Modul Manajemen Order adalah inti dari operasional bengkel yang menangani seluruh siklus hidup servis kendaraan. Halaman ini menampilkan daftar semua order dalam format tabel yang dapat difilter berdasarkan status (Pending, Estimated, Confirmed, Queue, In Progress, Ready, Completed, Cancelled) dan dapat dicari berdasarkan nama pelanggan, nomor plat, atau keluhan.

Proses pembuatan order baru dimulai dengan pengisian form yang mencakup data pelanggan (nama, nomor telepon), data kendaraan (jenis motor, nomor plat), jenis servis (Light Service atau Modification), dan deskripsi keluhan. Sistem kemudian memproses order melalui dialog estimasi dimana admin dapat menambahkan item jasa dan sparepart, memilih mekanik yang bertugas, dan menghitung total biaya secara otomatis. Sparepart yang dipilih akan otomatis mengurangi stok inventori.

Setiap order memiliki tracking pembayaran terintegrasi yang mendukung pembayaran parsial, memungkinkan pelanggan membayar secara bertahap. Status pembayaran (Unpaid, Partial, Paid) ditampilkan dengan badge visual yang jelas. Sistem juga mencatat fee mekanik secara otomatis berdasarkan commission rate yang telah dikonfigurasi untuk setiap karyawan.

### 3. Kanban Board (`/admin/orders/kanban` & `/kanban`)

Tampilan Kanban Board menyajikan visualisasi status order dalam format drag-and-drop yang intuitif. Order dikelompokkan dalam kolom berdasarkan status: Antrian (Queue), Dikerjakan (In Progress), Selesai (Ready), dan Diambil (Completed). Admin dapat dengan mudah memindahkan order antar status dengan drag-and-drop, yang akan secara otomatis memperbarui database.

Terdapat juga Kanban Board publik (`/kanban`) yang dapat diakses oleh pelanggan tanpa perlu login. Board ini menampilkan daftar antrian servis dengan informasi nomor plat yang disamarkan sebagian (privasi), jenis kendaraan, dan status terkini. Data diperbarui secara otomatis setiap 20 detik (auto-refresh), memungkinkan pelanggan di ruang tunggu untuk memantau posisi kendaraan mereka dalam antrian melalui TV display.

### 4. Manajemen Inventori (`/admin/inventory`)

Modul Inventori mengelola seluruh katalog suku cadang dan parts bengkel. Setiap item memiliki data lengkap mencakup kode part, nama produk, stok saat ini, minimum stok (reorder point), satuan, harga beli, dan harga jual. Sistem menampilkan indikator visual (badge merah) untuk item yang stoknya telah mencapai atau di bawah minimum stok, memudahkan admin untuk segera melakukan restocking.

Fitur pencarian memungkinkan admin menemukan part dengan cepat berdasarkan kode atau nama. Penambahan part baru dan editing data part yang ada dilakukan melalui dialog form yang tervalidasi. Sistem juga menghitung margin keuntungan per item (selisih harga jual dan harga beli) dan menampilkan total nilai inventori. Ketika order diproses dan sparepart digunakan, stok akan otomatis berkurang berdasarkan quantity yang digunakan.

### 5. Manajemen Karyawan (`/admin/employees`)

Modul Karyawan mengelola data seluruh staff bengkel termasuk mekanik, helper, kasir, dan admin. Tampilan utama didesain dalam bentuk **Card Grid** interaktif dan memiliki **Pagination** di sudut kanan bawah. Setiap kartu karyawan menampilkan nama, inisial avatar, ID unik, status keaktifan (`"Aktif"` atau `"Non"`), nomor telepon, skema gaji, dan nominal/persentase rate gaji. 

Sistem mengintegrasikan master data jabatan melalui tabel **D14 Jabatan** (`/admin/employees/jabatan`) yang otomatis di-seeding saat pertama kali diakses. Pada dialog tambah/ubah karyawan, input text posisi diganti dengan dropdown pilihan dinamis dari tabel Jabatan untuk menjamin konsistensi data. Penonaktifan dan reaktivasi karyawan dilakukan dengan alur konfirmasi terstruktur yang membatasi tugas aktif namun tetap menjaga histori data keuangannya.

### 6. Payroll & Penggajian (`/admin/payroll`)

Sistem Payroll terintegrasi dalam modul karyawan dengan perhitungan otomatis berdasarkan data order. Halaman **Gaji & Payroll** menampilkan history slip gaji dan mendukung bulk generation bagi Owner untuk menghitung gaji seluruh staff dalam rentang periode tertentu. Untuk karyawan bertipe komisi, sistem mengagregasi seluruh *OrderFee* yang belum dibayar (`isPaid: false`) dikali dengan **Rate Komisi % / Nominal (IDR)** karyawan.

Proses pencairan gaji mendukung pembayaran via Cash atau Bank Transfer (terhubung ke buku besar kas & bank). Ketika pembayaran dikonfirmasi, sistem secara otomatis: (1) membuat record Payroll baru dengan status `PAID`, (2) mengubah status `isPaid` pada semua transaksi *OrderFee* mekanik menjadi `true`, (3) membuat record pengeluaran kas (Money Out), dan (4) memposting JournalEntry dengan double-entry bookkeeping (Debit: Beban Gaji, Credit: Kas/Bank). Slip gaji yang digenerate dapat dicetak dalam format slip fisik terstruktur.

### 7. Pencatatan Pemasukan (`/admin/income`)

Halaman Income mencatat seluruh pemasukan non-order seperti penjualan aksesori, donasi, atau pendapatan lain-lain. Form input mencakup tanggal transaksi, kategori pemasukan (dari daftar kategori yang dapat dikonfigurasi), jumlah, dan catatan/deskripsi. Setiap pencatatan income akan otomatis membuat JournalEntry yang sesuai dengan prinsip double-entry bookkeeping.

Daftar pemasukan ditampilkan dalam tabel dengan fitur pencarian dan filter berdasarkan tanggal. Admin dapat melihat detail setiap transaksi dan menghapus transaksi jika terjadi kesalahan input. Summary card di bagian atas menampilkan total pemasukan periode berjalan.

### 8. Pencatatan Pengeluaran (`/admin/expenses`)

Halaman Expenses mengelola seluruh pengeluaran operasional bengkel seperti pembelian stok, biaya listrik, sewa tempat, pembelian tools, dan pengeluaran rutin lainnya. Sama seperti income, form mencakup tanggal, kategori pengeluaran, jumlah, dan deskripsi. Sistem menyediakan kategori pengeluaran yang dapat dikustomisasi sesuai kebutuhan bengkel.

Setiap expense yang dicatat akan otomatis menghasilkan JournalEntry dengan posting yang benar (Debit: Akun Beban sesuai kategori, Credit: Kas). Tabel pengeluaran menampilkan histori lengkap dengan kemampuan search dan delete. Dashboard expense menampilkan total pengeluaran dan breakdown per kategori.

### 9. Laporan Keuangan (`/admin/reports`)

Modul Laporan Keuangan menyajikan insight keuangan komprehensif untuk pengambilan keputusan bisnis, menampilkan summary arus kas dengan card untuk total pemasukan, total pengeluaran, dan profit/loss, serta manajemen rekening bank.

Halaman Laporan Keuangan menyajikan laporan detail termasuk: (1) Laporan Laba Rugi yang menampilkan pendapatan, beban, dan net income; (2) Neraca Saldo yang menunjukkan posisi saldo setiap akun; (3) Laporan Arus Kas yang meringkas cash in dan cash out. Setiap laporan dapat difilter berdasarkan rentang tanggal dan dapat di-export untuk keperluan arsip.

### 10. Settings & Konfigurasi (`/admin/settings`)

Halaman Settings adalah pusat konfigurasi seluruh aspek sistem yang dibagi dalam beberapa tab:

**General Settings**: Konfigurasi nama bengkel, alamat, nomor telepon, jam operasional, dan informasi umum lainnya yang ditampilkan di landing page dan dokumen.

**Holiday Settings**: Pengaturan hari libur bengkel dan jam operasional khusus untuk hari tertentu.

**User Management**: Pengelolaan akun pengguna sistem termasuk pembuatan user baru, assignment role (admin, employee), linking ke data employee, reset password, dan aktivasi/deaktivasi akun.

**Bank Accounts**: Konfigurasi rekening bank untuk pembayaran transfer, mencakup nama bank, nomor rekening, dan nama pemilik.

**Forgot Password Requests**: Dashboard untuk admin menangani permintaan reset password dari user yang lupa password, dengan approval/reject workflow.

**Website Content**: Editor konten untuk mengkustomisasi tampilan landing page publik termasuk hero section, statistik, layanan yang ditawarkan, dan section "Why Choose Us".

**Activity Logs**: Audit trail yang mencatat seluruh aktivitas pengguna dalam sistem untuk keperluan monitoring dan investigasi.

### 11. Portal Publik & Tracking Status (`/` & `/status`)

Landing page publik (`/`) menampilkan profil bengkel dengan design modern yang mencakup: hero section dengan tagline dan CTA booking, statistik pencapaian (jumlah pelanggan, order selesai), daftar layanan yang ditawarkan, dan form booking untuk pelanggan baru. Content landing page dapat dikustomisasi melalui admin settings.

Halaman Status (`/status`) memungkinkan pelanggan melacak status servis kendaraan mereka dengan memasukkan nomor plat. Sistem akan mencari order aktif terakhir dengan plat tersebut dan menampilkan: status terkini (Pending, Dikerjakan, Selesai, dll), estimasi biaya, histori pembayaran, dan sisa yang harus dibayar. Informasi ditampilkan dengan visual yang jelas dan mudah dipahami.

### 12. Dashboard Karyawan (`/employee`)

Portal khusus untuk karyawan (mekanik/helper) yang login dengan akun employee role. Dashboard ini menampilkan: daftar order yang di-assign ke karyawan tersebut, status order terkini, summary komisi bulan ini, dan komisi yang belum dibayar. Karyawan dapat memperbarui status order yang mereka kerjakan dan melihat detail order tanpa akses ke fitur admin seperti keuangan atau konfigurasi.

---

## 📊 Alur Sistem & Prosedur (System Flow & Procedures)

### Flow 1: Siklus Order Servis (Order Lifecycle)

```
CUSTOMER                    ADMIN/KASIR                 MEKANIK                     SISTEM
    │                            │                          │                          │
    │  [1] Request Servis        │                          │                          │
    │ ─────────────────────────► │                          │                          │
    │                            │                          │                          │
    │                            │ [2] Create Order         │                          │
    │                            │ ────────────────────────────────────────────────────►│
    │                            │                          │                          │
    │                            │ [3] Order Created        │                          │
    │                            │ (Status: PENDING)        │                          │
    │                            │ ◄────────────────────────────────────────────────────│
    │                            │                          │                          │
    │                            │ [4] Process Order        │                          │
    │                            │ - Add Items/Services     │                          │
    │                            │ - Select Mechanic        │                          │
    │                            │ - Calculate Price        │                          │
    │                            │ ────────────────────────────────────────────────────►│
    │                            │                          │                          │
    │                            │                          │       [5] Transaction:   │
    │                            │                          │       - Update Status    │
    │                            │                          │       - Reduce Stock     │
    │                            │                          │       - Create OrderFee  │
    │                            │                          │ ◄────────────────────────│
    │                            │                          │                          │
    │                            │ [6] Status: QUEUE        │                          │
    │                            │ ◄────────────────────────────────────────────────────│
    │                            │                          │                          │
    │                            │ [7] Assign to Queue      │                          │
    │                            │ ─────────────────────────►                          │
    │                            │                          │                          │
    │  [8] Check Status          │                          │ [9] Start Work           │
    │  (via /status page)        │                          │ Status: IN_PROGRESS      │
    │ ──────────────────────────────────────────────────────────────────────────────────►
    │                            │                          │                          │
    │  [10] Status Update        │                          │ [11] Complete Work       │
    │ ◄──────────────────────────────────────────────────────────────────────────────────
    │                            │                          │ Status: READY            │
    │                            │                          │ ─────────────────────────►│
    │                            │                          │                          │
    │  [12] Pick Up Vehicle      │                          │                          │
    │ ─────────────────────────► │                          │                          │
    │                            │                          │                          │
    │                            │ [13] Process Payment     │                          │
    │                            │ ────────────────────────────────────────────────────►│
    │                            │                          │                          │
    │                            │                          │    [14] Transaction:     │
    │                            │                          │    - Create Payment      │
    │                            │                          │    - Create JournalEntry │
    │                            │                          │    - Update PaymentStatus│
    │                            │                          │ ◄────────────────────────│
    │                            │                          │                          │
    │                            │ [15] Complete Order      │                          │
    │                            │ Status: COMPLETED        │                          │
    │                            │ ────────────────────────────────────────────────────►│
    │                            │                          │                          │
    │  [16] Receive Invoice      │                          │                          │
    │ ◄───────────────────────── │                          │                          │
    │                            │                          │                          │
```

### Flow 2: Proses Pembayaran Order

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT PROCESSING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Order Ready  │
    │ (READY)      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────────┐
    │ Admin Opens Payment Dialog               │
    │ - View Total Price                       │
    │ - View Previous Payments                 │
    │ - View Remaining Balance                 │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ Input Payment Details                    │
    │ - Amount (Full/Partial)                  │
    │ - Payment Method (Cash/Transfer)         │
    │ - Bank Account (if Transfer)             │
    │ - Notes                                  │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │ Amount == Remaining?  │
           └───────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌───────────┐            ┌───────────────┐
    │ FULL PAID │            │ PARTIAL PAID  │
    │           │            │               │
    │ Status:   │            │ Status:       │
    │ PAID      │            │ PARTIAL       │
    └─────┬─────┘            └───────┬───────┘
          │                          │
          └────────────┬─────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │           DATABASE TRANSACTION           │
    │                                          │
    │ 1. Create Payment Record                 │
    │    - id, date, amount, orderId           │
    │    - paymentMethod, bankAccountId        │
    │                                          │
    │ 2. Update Order                          │
    │    - totalPaid += amount                 │
    │    - paymentStatus (PAID/PARTIAL)        │
    │                                          │
    │ 3. Create JournalEntry                   │
    │    - Description: "Payment Order #xxx"   │
    │                                          │
    │ 4. Create JournalItems                   │
    │    - DEBIT: Cash/Bank Account            │
    │    - CREDIT: Service Revenue             │
    │                                          │
    │ 5. Log Activity                          │
    │    - action: PAYMENT_RECEIVED            │
    │    - userId, timestamp                   │
    └──────────────────────────────────────────┘
```

### Flow 3: Proses Payroll Karyawan

```
                    ┌─────────────────────────────┐
                    │      PAYROLL PROCESS        │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │ Admin Opens Employee Detail │
                    │ - View Unpaid Commissions   │
                    │ - View Order History        │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    CALCULATION ENGINE                        │
    │                                                              │
    │  For COMMISSION-based employees:                             │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │ SELECT SUM(amount) FROM OrderFee                       │  │
    │  │ WHERE employeeId = ? AND isPaid = false                │  │
    │  └────────────────────────────────────────────────────────┘  │
    │                                                              │
    │  + Base Salary (if any)                                      │
    │  + Bonus (if any)                                            │
    │  ─────────────────────────                                   │
    │  = TOTAL PAYABLE                                             │
    │                                                              │
    └──────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │   Confirm Payment Dialog    │
                    │   - Period (Start-End)      │
                    │   - Total Amount            │
                    │   - Payment Method          │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    DATABASE TRANSACTION                       │
    │                                                              │
    │  1. Create Payroll Record                                    │
    │     - employeeId, startDate, endDate                         │
    │     - baseSalary, bonus, totalEarned                         │
    │     - status: PAID                                           │
    │                                                              │
    │  2. Update OrderFees                                         │
    │     - SET isPaid = true, paidAt = NOW()                      │
    │     - WHERE employeeId = ? AND isPaid = false                │
    │                                                              │
    │  3. Create Payment Record                                    │
    │     - payrollId, amount, paymentMethod                       │
    │                                                              │
    │  4. Create JournalEntry                                      │
    │     - DEBIT: Salary Expense Account                          │
    │     - CREDIT: Cash/Bank Account                              │
    │                                                              │
    │  5. Log Activity                                             │
    │     - action: PAYROLL_PAID                                   │
    │                                                              │
    └──────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ERD - NOPZGARAGE                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Employee     │       │     Order       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │       │ PK id           │
│    email        │◄──────│ FK employeeId   │◄──────│    custName     │
│    password     │  1:1  │    name         │  1:N  │    custPhone    │
│    role         │       │    role         │       │    vehicle      │
│ FK employeeId   │       │    phone        │       │    plateNumber  │
│    isActive     │       │    salaryType   │       │    complaint    │
│    resetToken   │       │    dailyRate    │       │    serviceType  │
└────────┬────────┘       │    commission   │       │    status       │
         │                │    isActive     │       │    totalPrice   │
         │                └────────┬────────┘       │    totalPaid    │
         │                         │                │    paymentStatus│
         ▼                         │                │ FK mechanicId   │
┌─────────────────┐               │                └────────┬────────┘
│ForgotPassword   │               │                         │
│   Request       │               │                         │
├─────────────────┤               │                         │
│ PK id           │               │                         │
│ FK userId       │               │                         │
│    status       │               ▼                         │
│    resolvedBy   │       ┌─────────────────┐              │
│    resolvedAt   │       │    OrderFee     │              │
└─────────────────┘       ├─────────────────┤              │
                          │ PK id           │              │
                          │ FK orderId      │◄─────────────┤
                          │ FK employeeId   │              │
                          │    amount       │              │
                          │    description  │              │
                          │    isPaid       │              │
                          │    paidAt       │              │
                          └─────────────────┘              │
                                                           │
         ┌─────────────────────────────────────────────────┤
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐                               ┌─────────────────┐
│   OrderItem     │                               │    Payment      │
├─────────────────┤                               ├─────────────────┤
│ PK id           │                               │ PK id           │
│ FK orderId      │                               │    date         │
│ FK sparePartId  │                               │    amount       │
│    itemType     │                               │    note         │
│    itemName     │                               │ FK orderId      │
│    quantity     │                               │ FK payrollId    │
│    unitPrice    │                               │ FK bankAccountId│
│    totalPrice   │                               │    paymentMethod│
└────────┬────────┘                               └────────┬────────┘
         │                                                 │
         ▼                                                 │
┌─────────────────┐       ┌─────────────────┐             │
│   SparePart     │       │   BankAccount   │◄────────────┘
├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │
│    code         │       │    bankName     │
│    name         │       │    accountNumber│
│    stock        │       │    accountName  │
│    minStock     │       │    isActive     │
│    unit         │       └─────────────────┘
│    buyPrice     │
│    sellPrice    │
│    isActive     │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Payroll      │       │  JournalEntry   │       │   JournalItem   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │◄──────│ PK id           │
│    startDate    │       │    date         │  1:N  │ FK journalEntry │
│    endDate      │       │    description  │       │ FK accountId    │
│ FK employeeId   │       │    reference    │       │    debit        │
│    baseSalary   │       │ FK paymentId    │       │    credit       │
│    bonus        │       └─────────────────┘       └────────┬────────┘
│    totalEarned  │                                          │
│    status       │                                          ▼
└─────────────────┘                                 ┌─────────────────┐
                                                    │    Account      │
┌─────────────────┐       ┌─────────────────┐       ├─────────────────┤
│  ActivityLog    │       │  SystemSetting  │       │ PK id           │
├─────────────────┤       ├─────────────────┤       │    code         │
│ PK id           │       │ PK id           │       │    name         │
│    action       │       │    key          │       │    type         │
│    title        │       │    value        │       │    category     │
│    details      │       │    updatedAt    │       │    isActive     │
│    metadata     │       └─────────────────┘       └─────────────────┘
│    userId       │
│    userName     │       ┌─────────────────┐
│    role         │       │ ContentSection  │
│    createdAt    │       ├─────────────────┤
└─────────────────┘       │ PK id           │
                          │    sectionKey   │
                          │    title        │
                          │    subtitle     │
                          │    content      │
                          │    imageUrl     │
                          │    isVisible    │
                          └─────────────────┘
```

---

## 📈 Data Flow Diagram (DFD)

### DFD Level 0 (Context Diagram)

```
                                    ┌─────────────┐
                                    │   Admin     │
                                    └──────┬──────┘
                                           │
                    Order Management       │        Financial Reports
                    Employee Data          │        Inventory Data
                    Settings               ▼        Activity Logs
                          ┌────────────────────────────────┐
    ┌──────────┐          │                                │         ┌──────────┐
    │ Customer │◄────────►│     NOPZGARAGE MANAGEMENT      │◄───────►│ Employee │
    └──────────┘          │           SYSTEM               │         └──────────┘
         │                │                                │              │
         │                └────────────────────────────────┘              │
         │                               ▲                                │
    Booking Request                      │                          View Orders
    Status Tracking              ┌───────┴───────┐                  Update Status
         │                       │   Database    │                  View Payroll
         │                       │  PostgreSQL   │                        │
         ▼                       └───────────────┘                        ▼
```

### DFD Level 1

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                               DFD LEVEL 1                                          │
└────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │     ADMIN       │
                              └────────┬────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│   1.0 Order     │          │  2.0 Employee   │          │  3.0 Inventory  │
│   Management    │          │   Management    │          │   Management    │
├─────────────────┤          ├─────────────────┤          ├─────────────────┤
│ - Create Order  │          │ - CRUD Employee │          │ - CRUD SparePart│
│ - Process Order │          │ - View Payroll  │          │ - Stock Tracking│
│ - Update Status │          │ - Pay Commission│          │ - Stock Opname  │
│ - Record Payment│          │ - Link to User  │          │ - Low Stock Alert
└────────┬────────┘          └────────┬────────┘          └────────┬────────┘
         │                            │                            │
         │         ┌──────────────────┼──────────────────┐         │
         │         │                  │                  │         │
         ▼         ▼                  ▼                  ▼         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              D1: DATABASE                                  │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   │  Order  │ │Employee │ │SparePart│ │ Payment │ │ Payroll │ │ Journal │  │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
         ▲                            ▲                            ▲
         │                            │                            │
┌────────┴────────┐          ┌────────┴────────┐          ┌────────┴────────┐
│   4.0 Finance   │          │   5.0 Reports   │          │   6.0 Auth &    │
│   Management    │          │   Generation    │          │   Settings      │
├─────────────────┤          ├─────────────────┤          ├─────────────────┤
│ - Record Income │          │ - Revenue Report│          │ - Login/Logout  │
│ - Record Expense│          │ - Expense Report│          │ - User Mgmt     │
│ - Journal Entry │          │ - Profit/Loss   │          │ - System Config │
│ - General Ledger│          │ - Cash Flow     │          │ - Activity Log  │
└─────────────────┘          └─────────────────┘          └─────────────────┘
         ▲                            │                            ▲
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
                              ┌─────────────────┐
                              │   CUSTOMER      │
                              │ (Public Access) │
                              ├─────────────────┤
                              │ - View Landing  │
                              │ - Submit Booking│
                              │ - Track Status  │
                              │ - View Kanban   │
                              └─────────────────┘
```

---

## 🔄 Sequence Diagram

### Sequence: Create & Process Order

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Admin   │     │Orders Page│    │ Server   │     │ Database │     │  Prisma  │
│  (UI)    │     │Component │     │ Action   │     │PostgreSQL│     │  Client  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ Click "New     │                │                │                │
     │ Order" Button  │                │                │                │
     │───────────────►│                │                │                │
     │                │                │                │                │
     │                │ Open Dialog    │                │                │
     │◄───────────────│                │                │                │
     │                │                │                │                │
     │ Fill Form &    │                │                │                │
     │ Submit         │                │                │                │
     │───────────────►│                │                │                │
     │                │                │                │                │
     │                │ createOrder()  │                │                │
     │                │───────────────►│                │                │
     │                │                │                │                │
     │                │                │ Validate with  │                │
     │                │                │ Zod Schema     │                │
     │                │                │───────┐        │                │
     │                │                │       │        │                │
     │                │                │◄──────┘        │                │
     │                │                │                │                │
     │                │                │ prisma.order   │                │
     │                │                │ .create()      │                │
     │                │                │───────────────────────────────► │
     │                │                │                │                │
     │                │                │                │ INSERT INTO    │
     │                │                │                │ "Order"        │
     │                │                │                │◄───────────────│
     │                │                │                │                │
     │                │                │      Created Order              │
     │                │                │◄───────────────────────────────-│
     │                │                │                │                │
     │                │                │ Log Activity   │                │
     │                │                │───────────────────────────────► │
     │                │                │                │                │
     │                │ { success,     │                │                │
     │                │   order }      │                │                │
     │                │◄───────────────│                │                │
     │                │                │                │                │
     │ Show Toast     │                │                │                │
     │ "Order Created"│                │                │                │
     │◄───────────────│                │                │                │
     │                │                │                │                │
     │ Refresh List   │                │                │                │
     │◄───────────────│                │                │                │
     │                │                │                │                │
```

### Sequence: Process Payment

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Admin   │     │ Payment  │     │ Server   │     │ Database │
│  (UI)    │     │ Dialog   │     │ Action   │     │PostgreSQL│
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Open Payment   │                │                │
     │───────────────►│                │                │
     │                │                │                │
     │                │ Fetch Order    │                │
     │                │ Details        │                │
     │                │───────────────►│                │
     │                │                │                │
     │                │                │ SELECT order   │
     │                │                │───────────────►│
     │                │                │                │
     │                │                │ Order + Payments
     │                │                │◄───────────────│
     │                │                │                │
     │                │ Display:       │                │
     │                │ - Total: Rp X  │                │
     │                │ - Paid: Rp Y   │                │
     │                │ - Due: Rp Z    │                │
     │◄───────────────│                │                │
     │                │                │                │
     │ Input Amount   │                │                │
     │ Select Method  │                │                │
     │───────────────►│                │                │
     │                │                │                │
     │                │ createPayment()│                │
     │                │───────────────►│                │
     │                │                │                │
     │                │                │ BEGIN          │
     │                │                │ TRANSACTION    │
     │                │                │───────────────►│
     │                │                │                │
     │                │                │ 1. INSERT      │
     │                │                │    Payment     │
     │                │                │───────────────►│
     │                │                │                │
     │                │                │ 2. UPDATE      │
     │                │                │    Order       │
     │                │                │───────────────►│
     │                │                │                │
     │                │                │ 3. INSERT      │
     │                │                │    JournalEntry│
     │                │                │───────────────►│
     │                │                │                │
     │                │                │ 4. INSERT      │
     │                │                │    JournalItems│
     │                │                │───────────────►│
     │                │                │                │
     │                │                │ COMMIT         │
     │                │                │───────────────►│
     │                │                │                │
     │                │ { success }    │                │
     │                │◄───────────────│                │
     │                │                │                │
     │ Toast: Payment │                │                │
     │ Recorded       │                │                │
     │◄───────────────│                │                │
     │                │                │                │
```

---

## 🏗️ Class Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                 CLASS DIAGRAM                                       │
└────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐          ┌─────────────────────────────┐
│          <<Entity>>         │          │          <<Entity>>         │
│           Order             │          │          Employee           │
├─────────────────────────────┤          ├─────────────────────────────┤
│ - id: string                │          │ - id: string                │
│ - custName: string          │          │ - name: string              │
│ - custPhone: string         │          │ - role: string              │
│ - vehicle: string           │   N:1    │ - phone: string?            │
│ - plateNumber: string?      │◄─────────│ - salaryType: SalaryType    │
│ - complaint: string         │          │ - dailyRate: Decimal        │
│ - serviceType: ServiceType  │          │ - commissionRate: Decimal   │
│ - status: OrderStatus       │          │ - isActive: boolean         │
│ - totalPrice: Decimal       │          ├─────────────────────────────┤
│ - totalPaid: Decimal        │          │ + getOrders(): Order[]      │
│ - paymentStatus: PaymentSt  │          │ + getUnpaidFees(): OrderFee[]
│ - mechanicId: string?       │          │ + calculatePayroll(): Decimal
├─────────────────────────────┤          └─────────────────────────────┘
│ + calculateTotal(): Decimal │                        ▲
│ + updateStatus(): void      │                        │
│ + addPayment(): Payment     │                        │
│ + getRemainingBalance(): Dec│          ┌─────────────────────────────┐
└──────────────┬──────────────┘          │          <<Entity>>         │
               │                         │           User              │
               │                         ├─────────────────────────────┤
    ┌──────────┼──────────┐              │ - id: string                │
    │          │          │              │ - email: string             │
    ▼          ▼          ▼              │ - password: string          │
┌─────────┐ ┌──────────┐ ┌─────────┐    │ - role: string              │
│OrderItem│ │ OrderFee │ │ Payment │    │ - employeeId: string?       │
├─────────┤ ├──────────┤ ├─────────┤    │ - isActive: boolean         │
│-id      │ │-id       │ │-id      │    ├─────────────────────────────┤
│-orderId │ │-orderId  │ │-date    │    │ + login(): Session          │
│-itemType│ │-employeeId│ │-amount  │    │ + logout(): void            │
│-itemName│ │-amount   │ │-orderId │    │ + resetPassword(): void     │
│-quantity│ │-isPaid   │ │-payrollId│   └─────────────────────────────┘
│-unitPrice│ │-paidAt   │ │-bankAccId│
│-totalPrice│└──────────┘ │-payMethod│
│-sparePartId│             └────┬─────┘
└─────┬─────┘                   │
      │                         │
      ▼                         ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│          <<Entity>>         │ │          <<Entity>>         │
│          SparePart          │ │        JournalEntry         │
├─────────────────────────────┤ ├─────────────────────────────┤
│ - id: string                │ │ - id: string                │
│ - code: string              │ │ - date: DateTime            │
│ - name: string              │ │ - description: string       │
│ - stock: int                │ │ - reference: string?        │
│ - minStock: int             │ │ - paymentId: string?        │
│ - unit: string              │ ├─────────────────────────────┤
│ - buyPrice: Decimal         │ │ + addItem(): JournalItem    │
│ - sellPrice: Decimal        │ │ + validate(): boolean       │
│ - isActive: boolean         │ └──────────────┬──────────────┘
├─────────────────────────────┤                │
│ + reduceStock(qty): void    │                ▼
│ + isLowStock(): boolean     │ ┌─────────────────────────────┐
│ + getMargin(): Decimal      │ │          <<Entity>>         │
└─────────────────────────────┘ │         JournalItem         │
                                ├─────────────────────────────┤
┌─────────────────────────────┐ │ - id: string                │
│          <<Entity>>         │ │ - journalEntryId: string    │
│          Payroll            │ │ - accountId: string         │
├─────────────────────────────┤ │ - debit: Decimal            │
│ - id: string                │ │ - credit: Decimal           │
│ - startDate: DateTime       │ └─────────────┬───────────────┘
│ - endDate: DateTime         │               │
│ - employeeId: string        │               ▼
│ - baseSalary: Decimal       │ ┌─────────────────────────────┐
│ - bonus: Decimal            │ │          <<Entity>>         │
│ - totalEarned: Decimal      │ │          Account            │
│ - status: PaymentStatus     │ ├─────────────────────────────┤
├─────────────────────────────┤ │ - id: string                │
│ + process(): void           │ │ - code: string              │
│ + markPaid(): void          │ │ - name: string              │
└─────────────────────────────┘ │ - type: string              │
                                │ - category: string?         │
                                │ - isActive: boolean         │
                                ├─────────────────────────────┤
                                │ + getBalance(): Decimal     │
                                │ + getTransactions(): []     │
                                └─────────────────────────────┘

<<enumeration>>                 <<enumeration>>
┌──────────────────┐           ┌──────────────────┐
│   OrderStatus    │           │  PaymentStatus   │
├──────────────────┤           ├──────────────────┤
│ PENDING          │           │ UNPAID           │
│ ESTIMATED        │           │ PARTIAL          │
│ CONFIRMED        │           │ PAID             │
│ QUEUE            │           └──────────────────┘
│ IN_PROGRESS      │
│ READY            │           <<enumeration>>
│ COMPLETED        │           ┌──────────────────┐
│ CANCELLED        │           │   SalaryType     │
└──────────────────┘           ├──────────────────┤
                               │ DAILY            │
<<enumeration>>                │ COMMISSION       │
┌──────────────────┐           └──────────────────┘
│   ServiceType    │
├──────────────────┤
│ LIGHT_SERVICE    │
│ MODIFICATION     │
└──────────────────┘
```

---

## 📋 Use Case Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              USE CASE DIAGRAM                                       │
└────────────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────────────────────────────┐
                            │           NOPZGARAGE SYSTEM             │
                            │                                         │
    ┌─────────┐             │  ┌─────────────────────────────────┐   │
    │         │             │  │       Order Management          │   │
    │  Admin  │─────────────┼──►  ○ Create Order                 │   │
    │         │             │  │  ○ Process Order (Estimation)   │   │
    └────┬────┘             │  │  ○ Update Order Status          │   │
         │                  │  │  ○ Record Payment               │   │
         │                  │  │  ○ Delete Order                 │   │
         │                  │  │  ○ View Kanban Board            │   │
         │                  │  └─────────────────────────────────┘   │
         │                  │                                         │
         │                  │  ┌─────────────────────────────────┐   │
         │                  │  │     Employee Management          │   │
         ├──────────────────┼──►  ○ Create Employee               │   │
         │                  │  │  ○ Edit Employee                 │   │
         │                  │  │  ○ Deactivate Employee           │   │
         │                  │  │  ○ View Employee Details         │   │
         │                  │  │  ○ Process Payroll               │   │
         │                  │  └─────────────────────────────────┘   │
         │                  │                                         │
         │                  │  ┌─────────────────────────────────┐   │
         │                  │  │     Inventory Management         │   │
         ├──────────────────┼──►  ○ Add Spare Part                │   │
         │                  │  │  ○ Edit Spare Part               │   │
         │                  │  │  ○ Update Stock                  │   │
         │                  │  │  ○ Delete Spare Part             │   │
         │                  │  │  ○ View Low Stock Alert          │   │
         │                  │  └─────────────────────────────────┘   │
         │                  │                                         │
         │                  │  ┌─────────────────────────────────┐   │
         │                  │  │     Financial Management         │   │
         ├──────────────────┼──►  ○ Record Income                 │   │
         │                  │  │  ○ Record Expense                │   │
         │                  │  │  ○ View Journal Entries          │   │
         │                  │  │  ○ Generate Reports              │   │
         │                  │  │  ○ View Dashboard Stats          │   │
         │                  │  └─────────────────────────────────┘   │
         │                  │                                         │
         │                  │  ┌─────────────────────────────────┐   │
         │                  │  │     System Administration        │   │
         └──────────────────┼──►  ○ Manage Users                  │   │
                            │  │  ○ Configure Settings            │   │
                            │  │  ○ Manage Bank Accounts          │   │
                            │  │  ○ Edit Website Content          │   │
                            │  │  ○ View Activity Logs            │   │
                            │  │  ○ Handle Password Requests      │   │
                            │  └─────────────────────────────────┘   │
                            │                                         │
    ┌─────────┐             │  ┌─────────────────────────────────┐   │
    │         │             │  │       Employee Portal            │   │
    │Employee │─────────────┼──►  ○ View Assigned Orders          │   │
    │(Mechanic│             │  │  ○ Update Order Status           │   │
    │         │             │  │  ○ View Commission Summary       │   │
    └─────────┘             │  │  ○ View Payroll History          │   │
                            │  └─────────────────────────────────┘   │
                            │                                         │
    ┌─────────┐             │  ┌─────────────────────────────────┐   │
    │         │             │  │       Public Portal              │   │
    │Customer │─────────────┼──►  ○ View Landing Page             │   │
    │         │             │  │  ○ Submit Booking Request        │   │
    └────┬────┘             │  │  ○ Track Order Status            │   │
         │                  │  │  ○ View Public Kanban            │   │
         │                  │  └─────────────────────────────────┘   │
         │                  │                                         │
         │                  └─────────────────────────────────────────┘
         │
         │                  ┌─────────────────────────────────────────┐
         │                  │        External Interactions            │
         └──────────────────►  ○ Receive Status Notifications         │
                            │  ○ View Real-time Queue                 │
                            └─────────────────────────────────────────┘
```

---

## 🚀 Cara Menjalankan Proyek

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

### Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd nopzgarage

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env dan isi DATABASE_URL

# 4. Setup database
npx prisma db push
npx prisma generate

# 5. Seed data awal (opsional)
npx prisma db seed

# 6. Jalankan development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nopzgarage_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📁 Struktur Direktori

```
nopzgarage/
├── app/
│   ├── actions/           # Server Actions (Business Logic)
│   ├── admin/             # Admin Dashboard Pages
│   │   ├── employees/     # Employee Management
│   │   ├── expenses/      # Expense Recording
│   │   ├── finance/       # Financial Overview
│   │   ├── income/        # Income Recording
│   │   ├── inventory/     # Inventory Management
│   │   ├── orders/        # Order Management
│   │   ├── reports/       # Financial Reports
│   │   └── settings/      # System Settings
│   ├── employee/          # Employee Portal
│   ├── kanban/            # Public Kanban
│   ├── login/             # Authentication
│   └── status/            # Order Status Tracking
├── components/            # Reusable UI Components
├── hooks/                 # Custom React Hooks
├── lib/                   # Utilities & Auth Config
├── prisma/                # Database Schema & Migrations
└── public/                # Static Assets
```

---

## 📄 Lisensi

Copyright © 2024 NopzGarage. All rights reserved.
