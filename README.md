# NopzGarage Management System

## 📋 Deskripsi Proyek

**NopzGarage Management System** adalah sistem manajemen bengkel motor berbasis web yang komprehensif dan terintegrasi. Aplikasi ini dirancang untuk mendigitalkan seluruh operasional bengkel motor "NopzGarage", mencakup manajemen order servis, inventori suku cadang, pengelolaan karyawan dan penggajian (payroll), pencatatan keuangan kas & bank terintegrasi (kasir, pengeluaran operasional & penggajian), serta portal publik untuk pelanggan melacak status servis kendaraan mereka secara real-time.

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

Sistem mengintegrasikan master data jabatan melalui field `jabatan` pada profil karyawan untuk menjamin konsistensi data. Penonaktifan dan reaktivasi karyawan dilakukan dengan alur konfirmasi terstruktur yang membatasi tugas aktif namun tetap menjaga histori data keuangannya.

### 6. Payroll & Penggajian (`/admin/payroll`)

Sistem Payroll terintegrasi dalam modul karyawan dengan perhitungan otomatis berdasarkan data order. Halaman **Gaji & Payroll** menampilkan history pembayaran gaji dan mendukung bulk generation bagi Owner untuk menghitung gaji seluruh staff dalam rentang periode tertentu. Untuk karyawan bertipe komisi, sistem mengagregasi seluruh item jasa/komisi (`OrderItem` bertipe `FEE`) yang belum dibayar (`isPaid: false`) dikali dengan **Rate Komisi % / Nominal (IDR)** karyawan.

Proses pencairan gaji mendukung pembayaran via Cash atau Bank Transfer (terhubung ke akun kas & bank pada tabel `Account`). Ketika pembayaran dikonfirmasi, sistem secara otomatis: (1) membuat record `Payment` baru dengan status/type `SALARY`, (2) mengubah status `isPaid` pada semua transaksi item komisi mekanik menjadi `true`, dan (3) memotong saldo rekening Kas/Bank terkait secara otomatis (`Account.currentBalance`). Slip gaji yang digenerate dapat dicetak dalam format slip fisik terstruktur.

### 7. Pencatatan Pemasukan (`/admin/income`)

Halaman Income mencatat seluruh pemasukan non-order seperti penjualan aksesori, donasi, atau pendapatan lain-lain. Form input mencakup tanggal transaksi, kategori pemasukan (dari daftar kategori yang dapat dikonfigurasi), jumlah, rekening kas/bank penerima, dan catatan/deskripsi. Setiap pencatatan income akan otomatis menambah saldo akun Kas/Bank terkait (`Account.currentBalance`) dan mencatat mutasi pada tabel `Payment`.

Daftar pemasukan ditampilkan dalam tabel dengan fitur pencarian dan filter berdasarkan tanggal. Admin dapat melihat detail setiap transaksi dan menghapus transaksi jika terjadi kesalahan input. Summary card di bagian atas menampilkan total pemasukan periode berjalan.

### 8. Pencatatan Pengeluaran (`/admin/expenses`)

Halaman Expenses mengelola seluruh pengeluaran operasional bengkel seperti pembelian stok, biaya listrik, sewa tempat, pembelian tools, dan pengeluaran rutin lainnya. Sama seperti income, form mencakup tanggal, kategori pengeluaran, jumlah, akun kas/bank sumber, dan deskripsi/referensi nota. Sistem menyediakan kategori pengeluaran yang dapat dikustomisasi sesuai kebutuhan bengkel.

Setiap expense yang dicatat akan otomatis memotong saldo akun Kas/Bank terkait (`Account.currentBalance`) dan mencatat mutasi pada tabel `Payment`. Tabel pengeluaran menampilkan histori lengkap dengan kemampuan search dan delete. Dashboard expense menampilkan total pengeluaran dan breakdown per kategori.

### 9. Laporan Keuangan (`/admin/reports`)

Modul Laporan Keuangan menyajikan insight keuangan komprehensif berbasis periode (rentang tanggal) untuk mendukung pengawasan dan pengambilan keputusan bisnis pemilik (Owner).

Halaman ini didesain dalam format **1 halaman utuh (Single-Page Report)** yang menyajikan 4 bagian analisis secara berurutan:
1. **Ikhtisar Laba Rugi (Income Statement)**: Menyajikan tabel saldo seluruh akun pendapatan, akun beban operasional & HPP, serta kartu kalkulasi laba bersih (*profit/loss*).
2. **Laporan Pendapatan (Pemasukan)**: Menyajikan grafik donat persentase pendapatan per kategori (jasa servis dan sparepart) serta tabel riwayat seluruh transaksi pesanan/pemasukan pelanggan terperinci.
3. **Laporan Pengeluaran (Beban & Biaya)**: Menyajikan tabel rincian klasifikasi pengeluaran (pembelian sparepart, operasional, gaji karyawan/payroll) serta daftar transaksi pengeluaran kas rinci.
4. **Laporan Arus Kas (Cash Flow Statement) & Rekening**: Menyajikan kartu metrik saldo (saldo awal, kas masuk, kas keluar, saldo akhir), grafik garis arus kas harian, tabel mutasi kas kronologis, serta manajemen rekening kas/bank (`BankAccountsManager`).

Halaman ini dilengkapi fitur ekspor terpadu:
- **Unduh Laporan Keuangan**: Mengunduh seluruh rincian transaksi pendapatan dan pengeluaran beserta ringkasan laba rugi ke dalam **1 file sekaligus** (tersedia format PDF resmi ber-kop surat dan Excel multi-sheet).
- **Unduh Arus Kas**: Mengunduh dokumen laporan arus kas dan mutasi saldo kas/bank ke format PDF dan Excel.
- **Cetak PDF**: Fitur cetak langsung (*direct print*) via hidden iframe tanpa menyertakan elemen layout navigasi web.

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
    │                            │                          │       - Record OrderItem │
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
    │                            │                          │    - Update Cash/Bank    │
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
    │    - type: ORDER_PAYMENT                 │
    │                                          │
    │ 2. Update Order                          │
    │    - totalPaid += amount                 │
    │    - paymentStatus (PAID/PARTIAL)        │
    │                                          │
    │ 3. Update Account Balance                │
    │    - currentBalance += amount            │
    │                                          │
    │ 4. Log Activity                          │
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
    │  │ SELECT SUM(totalPrice) FROM OrderItem                  │  │
    │  │ WHERE employeeId = ? AND isPaid = false                │  │
    │  │ AND itemType = 'FEE'                                   │  │
    │  └────────────────────────────────────────────────────────┘  │
    │                                                              │
    │  + Base Salary (dailyRate x working days)                    │
    │  + Bonus / Extra (if any)                                    │
    │  ────────────────────────────────────────                    │
    │  = TOTAL PAYABLE                                             │
    │                                                              │
    └──────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │   Confirm Payment Dialog    │
                    │   - Period (Start-End)      │
                    │   - Total Amount            │
                    │   - Payment Method & Bank   │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    DATABASE TRANSACTION                       │
    │                                                              │
    │  1. Create Payment Record                                    │
    │     - employeeId, amount, type: "SALARY"                     │
    │     - bankAccountId, paymentMethod, date                     │
    │                                                              │
    │  2. Update OrderItems (Commission)                           │
    │     - SET isPaid = true                                      │
    │     - WHERE employeeId = ? AND isPaid = false                │
    │                                                              │
    │  3. Update Account Balance                                   │
    │     - currentBalance -= amount                               │
    │                                                              │
    │  4. Log Activity                                             │
    │     - action: PAYROLL_PAID                                   │
    │                                                              │
    └──────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           CONSOLIDATED 8-TABLE ERD - NOPZGARAGE                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Employee     │       │     Order       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │       │ PK id           │
│    email        │◄──────│ FK employeeId   │◄──────│    custName     │
│    password     │  1:1  │    name         │  1:N  │    custPhone    │
│    role         │       │    role         │       │    vehicle      │
│ FK employeeId   │       │    phone        │       │    plateNumber  │
│    resetToken   │       │    jabatan      │       │    complaint    │
│    resetExpiry  │       │    salaryType   │       │    serviceType  │
│    forgotReqs   │       │    dailyRate    │       │    status       │
│    isActive     │       │    commission   │       │    scheduledAt  │
└─────────────────┘       │    isActive     │       │    items (JSON) │
                          └────────┬────────┘       │    totalPrice   │
                                   │                │    totalPaid    │
                                   │                │    payStatus    │
                                   │                │ FK mechanicId   │
                                   │                └────────┬────────┘
                                   │                         │
         ┌─────────────────────────┼─────────────────────────┤
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    OrderItem    │       │     Payment     │       │  SystemConfig   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │       │ PK id           │
│ FK orderId      │       │    date         │       │    category     │
│ FK sparePartId  │       │    amount       │       │    key          │
│ FK employeeId   │       │    type         │       │    title        │
│    itemType     │       │    note         │       │    subtitle     │
│    itemName     │       │ FK orderId      │       │    content(JSON)│
│    quantity     │       │ FK employeeId   │       │    imageUrl     │
│    unitPrice    │       │ FK bankAccountId│       │    embedUrl     │
│    totalPrice   │       │    paymentMethod│       │    platform     │
│    isPaid       │       └────────┬────────┘       │    userId       │
└────────┬────────┘                │                │    userName     │
         │                         │                │    isVisible    │
         ▼                         ▼                │    displayOrder │
┌─────────────────┐       ┌─────────────────┐       └─────────────────┘
│   SparePart     │       │     Account     │
├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │
│    code         │       │    code         │
│    name         │       │    name         │
│    category     │       │    type         │
│    stock        │       │    category     │
│    minStock     │       │    bankCode     │
│    unit         │       │    accountNumber│
│    buyPrice     │       │    accountName  │
│    sellPrice    │       │    currBalance  │
│    isActive     │       │    isActive     │
└─────────────────┘       └─────────────────┘
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
         │                │  (8 Consolidated Tables)       │              │
         │                └────────────────────────────────┘              │
         │                               ▲                                │
    Booking Request                      │                          View Orders
    Status Tracking              ┌───────┴───────┐                  Update Status
         │                       │  PostgreSQL   │                  View Payroll
         │                       └───────────────┘                        │
         ▼                                                                ▼
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
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                            D1: CONSOLIDATED DATABASE (8 TABLES)                            │
│ ┌──────┐ ┌──────────┐ ┌───────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ ┌───────┐ ┌──────┐ │
│ │ User │ │ Employee │ │ Order │ │ OrderItem │ │ SparePart │ │ Account │ │Payment│ │Config│ │
│ └──────┘ └──────────┘ └───────┘ └───────────┘ └───────────┘ └─────────┘ └───────┘ └──────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────┘
         ▲                            ▲                            ▲
         │                            │                            │
┌────────┴────────┐          ┌────────┴────────┐          ┌────────┴────────┐
│   4.0 Finance   │          │   5.0 Reports   │          │   6.0 Auth &    │
│   Management    │          │   Generation    │          │   Settings      │
├─────────────────┤          ├─────────────────┤          ├─────────────────┤
│ - Record Income │          │ - Revenue Report│          │ - Login/Logout  │
│ - Record Expense│          │ - Expense Report│          │ - User Mgmt     │
│ - Account Balances         │ - Profit/Loss   │          │ - System Config │
│ - Payout Payroll│          │ - Cash Flow     │          │ - Activity Log  │
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
     │                │ 3. UPDATE      │
     │                │    Account     │
     │                │───────────────►│
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
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                     CLASS DIAGRAM                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐          ┌─────────────────────────────┐
│          <<Entity>>         │          │          <<Entity>>         │
│           Order             │          │          Employee           │
├─────────────────────────────┤          ├─────────────────────────────┤
│ - id: string                │          │ - id: string                │
│ - custName: string          │          │ - name: string              │
│ - custPhone: string         │          │ - role: string              │
│ - vehicle: string           │   N:1    │ - phone: string?            │
│ - plateNumber: string?      │◄─────────│ - jabatan: string?          │
│ - complaint: string         │          │ - salaryType: SalaryType    │
│ - serviceType: ServiceType  │          │ - dailyRate: Decimal        │
│ - status: OrderStatus       │          │ - commissionRate: Decimal   │
│ - scheduledAt: DateTime?    │          │ - isActive: boolean         │
│ - items: Json?              │          ├─────────────────────────────┤
│ - totalPrice: Decimal       │          │ + getOrders(): Order[]      │
│ - totalPaid: Decimal        │          │ + getUnpaidItems(): Item[]  │
│ - paymentStatus: PaymentSt  │          │ + calculateSalary(): Dec    │
│ - mechanicId: string?       │          └─────────────────────────────┘
├─────────────────────────────┤                        ▲
│ + calculateTotal(): Decimal │                        │
│ + updateStatus(): void      │                        │
│ + addPayment(): Payment     │          ┌─────────────────────────────┐
│ + getRemaining(): Decimal   │          │          <<Entity>>         │
└──────────────┬──────────────┘          │           User              │
               │                         │ - email: string             │
     ┌─────────┴─────────┐               │ - password: string          │
     │                   │               │ - role: string              │
     ▼                   ▼               │ - employeeId: string?       │
┌─────────────────┐ ┌─────────────────┐  │ - resetToken: string?       │
│    OrderItem    │ │     Payment     │  │ - forgotRequests: Json?     │
├─────────────────┤ ├─────────────────┤  │ - isActive: boolean         │
│ - id: string    │ │ - id: string    │  ├─────────────────────────────┤
│ - orderId: str  │ │ - date: DateTime│  │ + login(): Session          │
│ - itemType: str │ │ - amount: Dec   │  │ + logout(): void            │
│ - itemName: str │ │ - type: string  │  │ + requestReset(): void      │
│ - quantity: int │ │ - note: string? │  └─────────────────────────────┘
│ - unitPrice: Dec│ │ - orderId: str? │
│ - totalPrice:Dec│ │ - empId: string?│
│ - isPaid: bool  │ │ - bankAccId: str│
│ - sparePartId   │ │ - payMethod: str│
│ - employeeId    │ └────────┬────────┘
└────────┬────────┘          │
         │                   │
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐  ┌─────────────────────────────┐
│    SparePart    │ │     Account     │  │          <<Entity>>         │
├─────────────────┤ ├─────────────────┤  │        SystemConfig         │
├─────────────────┤ ├─────────────────┤  ├─────────────────────────────┤
│ - id: string    │ │ - id: string    │  │ - id: string                │
│ - code: string  │ │ - code: string  │  │ - category: string          │
│ - name: string  │ │ - name: string  │  │ - key: string?              │
│ - category: str │ │ - type: string  │  │ - title: string?            │
│ - stock: int    │ │ - category: str?│  │ - subtitle: string?         │
│ - minStock: int │ │ - bankCode: str?│  │ - content: Json?            │
│ - unit: string  │ │ - accNumber: str│  │ - isVisible: boolean        │
│ - buyPrice: Dec │ │ - accName: str? │  │ - displayOrder: int         │
│ - sellPrice: Dec│ │ - currBalance   │  ├─────────────────────────────┤
│ - isActive: bool│ │ - isActive: bool│  │ + getSettings(): Config     │
├─────────────────┤ ├─────────────────┤  │ + updateConfig(): void      │
│ + reduceStock() │ │ + updateBalance │  └─────────────────────────────┘
│ + isLowStock()  │ │ + getStatement()│
└─────────────────┘ └─────────────────┘

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
┌──────────────────┐           │ MONTHLY          │
│   ServiceType    │           └──────────────────┘
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
         │                  │  │  ○ View Cash Flow & Balances          │   │
         │                  │  │  ○ Generate Reports (PDF/Excel)              │   │
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
├── app/                   # App Router (Pages, Layouts & API)
│   ├── (admin)/admin/     # Protected Admin & Owner Dashboard
│   ├── (employee)/employee/# Employee Portal & Task Board
│   ├── api/               # API Routes & NextAuth Handler
│   ├── kanban/            # Public Kanban Queue Display
│   ├── login/             # Authentication & Reset Password
│   └── status/            # Public Order Status Tracking
├── components/            # Reusable UI & Dialog Components
│   ├── shared/            # Common UI (Mermaid, Guard, etc.)
│   └── ui/                # Base Components (Shadcn/UI)
├── hooks/                 # Custom React Hooks
├── lib/                   # Core Utilities & Backend Logic
│   ├── actions/           # Server Actions (Orders, Inventory, Payroll, etc.)
│   ├── export/            # Financial Export Helpers (PDF & Excel)
│   ├── auth.ts            # NextAuth Configuration
│   └── prisma.ts          # Prisma Client Instance
├── prisma/                # Database Schema & Seed Script
│   ├── schema.prisma      # 8 Consolidated PostgreSQL Models
│   └── seed.ts            # Initial Seed Data
└── public/                # Static Assets & Uploads
```

---

## 📜 Standar & Panduan Pengodean (Coding Guidelines)

Seluruh pengembang proyek NopzGarage wajib mematuhi 12 aturan dan standar pengodean berikut:

### 1. Prinsip Umum
- **App Router**: Gunakan App Router (`app/`) sebagai standar routing utama.
- **TypeScript**: Wajib menggunakan TypeScript (`.ts` / `.tsx`). Penggunaan JavaScript murni dilarang kecuali file konfigurasi root (`next.config.mjs`).
- **ES6+**: Maksimalkan `const`/`let`, arrow functions, template literals, destructuring, optional chaining (`?.`), dan nullish coalescing (`??`).
- **React Server Components (RSC)**: Komponen di `app/` secara default adalah Server Component. Direktif `"use client"` hanya ditambahkan jika membutuhkan interaktivitas klien (`useState`, `useEffect`, event handler).
- **Format Kode Otomatis**: Gunakan Prettier untuk konsistensi formatting.
- **Sistem Tipe**: Deklarasikan tipe secara eksplisit. Gunakan `interface` daripada `type` alias untuk struktur objek.
- **Eksport Modul**: Selalu gunakan named exports (`export function Component()`). Dilarang default export kecuali file konvensi Next.js (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).

### 2. Penamaan File & Folder
- **Route / Fitur**: Format `kebab-case` (contoh: `user-profile/`, `dashboard/`)
- **File Konvensi Next.js**: Format `lowercase` (contoh: `page.tsx`, `layout.tsx`, `route.ts`)
- **Komponen React**: Format `PascalCase` (contoh: `UserCard.tsx`, `InvoiceTable.tsx`)
- **Utilitas / Helper**: Format `camelCase` (contoh: `formatDate.ts`, `fetchRevenue.ts`)
- **Konfigurasi Root**: Mengikuti standar ekosistem (contoh: `next.config.mjs`, `tailwind.config.ts`)
- **Dokumentasi**: Format `UPPERCASE` / `kebab-case` (contoh: `README.md`, `CHANGELOG.md`)

### 3. Penulisan Kode & Identifier
- **Variabel, Fungsi & Metode**: `camelCase` (contoh: `getUserName()`, `isActive`)
- **Komponen & Tipe**: `PascalCase` (contoh: `<UserProfile />`, `InvoiceStatus`)
- **Konstanta Statis**: `CONSTANT_CASE` (contoh: `MAX_TIMEOUT`, `API_BASE_URL`)
- **Props Component & DOM**: `camelCase` (contoh: `userId`, `className`, `htmlFor`)
- **Event Handlers**: Awalan `on` untuk props (`onClick`, `onValueChange`) & awalan `handle` untuk fungsi internal (`handleClick`, `handleSubmit`)
- **Array / Koleksi**: Format Plural tanpa suffix tipe (`users`, `invoices` — bukan `userList`)
- **Larangan**: Notasi Hungarian (`sName`) dan prefix/suffix underscore (`_name`) dilarang.

### 4. Struktur Direktori Proyek
Mengikuti standar Next.js App Router dengan pemisahan komponen UI (`components/`), Server Actions (`lib/actions/`), utilities (`lib/`), static assets (`public/`), dan database schema (`prisma/`).

### 5. Urutan Penulisan File Komponen
1. Direktif `"use client";` (jika diperlukan)
2. Import statements (External → Internal Components → Utilities → Types)
3. Interface / Type definition untuk Props
4. Deklarasi fungsi utama komponen (`export default function Component()`)
5. Fungsi helper internal lokal
6. Export statement

### 6 & 7. Deklarasi Fungsi, Control Flow & Perulangan
- Gunakan `function` declaration untuk komponen dan fungsi utama. Arrow function `() => {}` khusus callback inline.
- Wajib menggunakan blok kurung kurawal `{ ... }` pada statement pengkondisian.
- Terapkan Guard Pattern / Early Return (hindari `else` jika cabang `if` mengembalikan nilai).
- Gunakan metode Array modern (`.map()`, `.filter()`, `.find()`, `.forEach()`, `.every()`) daripada `for` berindeks.
- Pada `switch`, letakkan `default` paling bawah dan tanpa `break` setelah `return`.

### 8. Konvensi File Khusus Next.js
- `layout.tsx` → `export default function Layout()`
- `page.tsx` → `export default function Page()`
- `loading.tsx` → `export default function Loading()`
- `error.tsx` → `export default function Error()`
- `not-found.tsx` → `export default function NotFound()`
- `route.ts` → `export async function GET() / POST()`
- `middleware.ts` → `export function middleware()`

### 9, 10, 11, 12. Format, Komentar, CSS & JSON
- **Formatting**: Indentasi 2 spasi (bukan Tab). 1 baris 1 deklarasi. Atribut JSX > 2 ditulis multi-baris. Self-closing tag dengan spasi `<Input />`.
- **Komentar**: Bahasa Inggris. `//` di luar JSX (max 60-80 char), `{/* */}` di dalam JSX, dan JSDoc `/** */` untuk exported function.
- **CSS**: Lowercase selectors & kebab-case class names (`.card-header`). Utamakan class selector (hindari ID). Mobile-first. Format warna modern `rgb(31 41 59 / 0.26)`. Media query modern `@media (width >= 480px)`. Dilarang menggunakan `!important`.
- **JSON**: Indentasi 2 spasi, double quotes `""`, camelCase keys, tanpa trailing comma, format tanggal ISO 8601 UTC.

---

## 📄 Lisensi

Copyright © 2024 NopzGarage. All rights reserved.

