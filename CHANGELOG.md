# Changelog

Semua perubahan penting pada proyek **NopzGarage Management System** akan dicatat dalam dokumen ini.

Format dokumen ini mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.6.0] - 2026-09-12

### 🛡️ Safe Bank Account Deletion & Foreign Key Integrity
- **Penerapan Pola Hapus Jika Aman (*Safe Deletion*)**:
  - Memperbarui relasi `Payment.bankAccount` pada [`prisma/schema.prisma`](prisma/schema.prisma) menjadi `onDelete: Restrict` dan menambahkan migrasi [`20260912120000_restrict_bank_account_delete`](prisma/migrations/20260912120000_restrict_bank_account_delete/migration.sql) untuk mengganti foreign key lama (`SET NULL`) menjadi `RESTRICT`, mencegah *cascade delete* yang dapat merusak integritas data finansial.
  - Menghadirkan modul aturan bisnis murni [`lib/bank/rules.ts`](lib/bank/rules.ts) untuk mengevaluasi kelayakan penghapusan rekening secara deterministik.
  - Memperbarui Server Action `deleteBankAccount()` pada [`lib/actions/bank.ts`](lib/actions/bank.ts) khusus role `OWNER` yang berjalan dalam `prisma.$transaction`. Penghapusan permanen hanya diizinkan jika rekening telah nonaktif (`isActive: false`), saldo tepat Rp0, dan tidak pernah memiliki riwayat transaksi (`transactionCount: 0`).
  - Mengembalikan kode kegagalan terstruktur (`ACCOUNT_ACTIVE`, `NON_ZERO_BALANCE`, `ACCOUNT_IN_USE`) dan mencatat audit log `DELETE_BANK_ACCOUNT`.
  - Memperluas query `getAllBankAccounts()` dan `getAccountDeletionInfo()` dengan metadata `canDeletePermanently`, `transactionCount`, `usageByType`, dan `reasons`.
  - Memperbarui UI pada [`BankAccountsManager.tsx`](components/admin/BankAccountsManager.tsx) dan [`BankAccountsTab.tsx`](components/admin/BankAccountsTab.tsx) dengan badge hijau **Siap dihapus** untuk rekening bersih, dialog konfirmasi hapus permanen, serta dialog rincian pemakaian (*audit archive info*) untuk rekening yang diproteksi karena memiliki riwayat transaksi.

### 💰 Mandatory Expense Fund Source & Atomic Balance Management
- **Integrasi Sumber Dana Pengeluaran Operasional & Penyesuaian Saldo Otomatis**:
  - Mewajibkan pemilihan `accountId` pada skema validasi pengeluaran [`lib/validations/expense.ts`](lib/validations/expense.ts).
  - Menambahkan Server Action `getExpenseFundSources()` pada [`lib/actions/expenses.ts`](lib/actions/expenses.ts) untuk mengambil Kas Utama (101) dan seluruh rekening bank aktif.
  - Menjalankan `createExpense()` secara atomik dalam transaksi database: memvalidasi keaktifan rekening & kecukupan saldo, mendebit `currentBalance` akun sumber, dan membuat record `Payment` dengan relasi `bankAccountId`.
  - Menjalankan `deleteExpense()` dengan pemulihan saldo otomatis ke rekening sumber dana sebelum record `Payment` dihapus.
  - Memperbarui UI form pencatatan pengeluaran pada [`app/admin/expenses/page.tsx`](app/admin/expenses/page.tsx) dengan dropdown wajib **Sumber Dana** yang menampilkan sisa saldo kas/bank secara *real-time*, serta menambahkan kolom sumber dana pada tabel riwayat pengeluaran.

### 🔒 Payment Operational Safeguards & Cash Balance Reconciliation
- **Proteksi Transaksi Operasional & Rekonsiliasi Saldo Dashboard**:
  - Menambahkan validasi server-side pada `createPayment()` dan `createPayrollPayment()` ([`lib/actions/payments.ts`](lib/actions/payments.ts)) yang menolak penggunaan rekening berstatus nonaktif.
  - Memperbarui kalkulasi `cashBalance` pada [`lib/actions/dashboard.ts`](lib/actions/dashboard.ts) agar menyertakan saldo dari seluruh akun kas dan bank (termasuk rekening nonaktif yang masih memiliki saldo tersisa) demi akurasi total aset kas/bank bengkel.

---

## [2.5.0] - 2026-09-11

### 🏦 Bank Account Status & Management Improvement
- **Pemisahan Query Pengelolaan dan Operasional Rekening Bank**:
  - Menambahkan Server Action `getAllBankAccounts()` pada [`lib/actions/bank.ts`](lib/actions/bank.ts) khusus role `OWNER` untuk menampilkan seluruh rekening (aktif maupun nonaktif) pada halaman Pengaturan.
  - Mempertahankan `getBankAccounts()` tetap memfilter `isActive: true` untuk transaksi operasional kasir ([`PaymentDialog.tsx`](components/dialogs/PaymentDialog.tsx), transaksi, dan payroll) agar rekening nonaktif tidak dapat dipilih secara tidak sengaja.
  - Memperbarui `deleteBankAccount()` menjadi `deactivateBankAccount()` yang melakukan soft deactivation, validasi eksistensi, dan pencatatan audit log `DEACTIVATE_BANK_ACCOUNT`.
  - Memperbarui `toggleBankAccount()` dengan validasi tipe bank dan audit logging `ACTIVATE_BANK_ACCOUNT` / `DEACTIVATE_BANK_ACCOUNT`.
  - Memperbarui UI pada [`BankAccountsTab.tsx`](components/admin/BankAccountsTab.tsx) dan [`BankAccountsManager.tsx`](components/admin/BankAccountsManager.tsx) dengan visual cue badge **Nonaktif**, styling border putus-putus, opsi aktifkan kembali, serta penggantian terminologi dari "Hapus" ke "Nonaktifkan".

### 🏖️ Holiday Mode End-to-End System Protection
- **Proteksi Menyeluruh Sistem Saat Mode Libur Aktif**:
  - Menambahkan guard server-side pada `createBooking()` ([`lib/actions/orders.ts`](lib/actions/orders.ts)) yang menolak pembuatan pesanan publik dengan kode `GARAGE_CLOSED` saat `holiday.isHoliday === true`. Pembuatan order manual internal oleh Owner/Admin tetap berjalan normal.
  - Menambahkan helper `getHolidaySettings()` dan invalidasi cache otomatis `revalidatePath("/booking")` dan `revalidatePath("/")` pada [`lib/actions/settings.ts`](lib/actions/settings.ts) saat pengaturan libur diubah.
  - Membuat komponen baru [`BookingClosedState.tsx`](components/booking/BookingClosedState.tsx) yang otomatis muncul pada halaman [`/booking`](app/booking/page.tsx) saat bengkel libur, lengkap dengan alasan libur, tanggal estimasi buka kembali, info jadwal reguler, dan tombol kontak WhatsApp.
  - Menonaktifkan seluruh CTA booking pada landing page ([`app/page.tsx`](app/page.tsx)) saat libur dan menambahkan badge status tutup pada footer.
  - Menambahkan penanganan status `GARAGE_CLOSED` pada wizard dan form booking ([`BookingWizard.tsx`](components/booking/BookingWizard.tsx) & [`BookingForm.tsx`](components/booking/BookingForm.tsx)) dengan feedback notifikasi yang ramah.

### 🧭 Navigation Cleanup for Owner Role
- **Penyembunyian Menu Non-Inti dari Sidebar Navigasi**:
  - Menyembunyikan menu **Documentation** (`/admin/docs`), **Konten Website** (`/admin/content`), **Media Gallery** (`/admin/media`), dan **Database Console** (`/query`) dari navigasi desktop ([`AdminSidebar.tsx`](components/layout/AdminSidebar.tsx)) dan mobile ([`MobileSidebar.tsx`](components/layout/MobileSidebar.tsx)).
  - Membersihkan icon import lucide yang tidak digunakan (`Book`, `Globe`, `ImagePlus`, `Database`).
  - Halaman, API, Server Actions, dan proteksi RoleGuard untuk menu-menu tersebut tetap dipertahankan untuk akses URL langsung yang sah.

---

## [2.4.0] - 2026-09-04

### 🗄️ Database Normalization (8 Core Tables)
- **Normalisasi dan Penggabungan Entitas `OrderItem` ke dalam `Order.items` (JSON)**:
  - Mengeliminasi tabel `OrderItem` dan relasinya (`Employee`, `Order`, `SparePart`) pada [`prisma/schema.prisma`](prisma/schema.prisma) untuk mencapai struktur ringkas tepat 8 tabel inti: `User`, `Employee`, `Order`, `SparePart`, `Account`, `Payment`, `Payroll`, `SystemConfig`.
  - Menambahkan migration [`20260904000000_embed_order_items_in_orders`](prisma/migrations/20260904000000_embed_order_items_in_orders/migration.sql) untuk memindahkan seluruh item pesanan yang ada ke field `items` (JSON), memverifikasi jumlah item per order, lalu melepas tabel lama hanya jika verifikasi berhasil.
  - Memperbarui Server Actions ([`lib/actions/orders.ts`](lib/actions/orders.ts), [`lib/actions/employees.ts`](lib/actions/employees.ts), [`lib/actions/inventory.ts`](lib/actions/inventory.ts), [`lib/actions/payroll.ts`](lib/actions/payroll.ts), [`lib/actions/payments.ts`](lib/actions/payments.ts), [`lib/actions/finance.ts`](lib/actions/finance.ts)) agar sepenuhnya beroperasi berbasis `Order.items` JSON dengan backward compatibility penuh bagi antarmuka frontend dan generator invoice.
  - Memperbarui data seed pada [`prisma/seed.ts`](prisma/seed.ts).

### 🐛 Financial Reports Bugfix & Dynamic Reconciliation
- **Perbaikan Saldo Rp 0 pada Laporan Keuangan (Income Statement)**:
  - Mengatasi inkonsistensi di mana baris akun pendapatan (401, 402) dan akun beban (501, 502, 511) menampilkan saldo Rp 0 padahal total pendapatan dan beban memiliki nilai transaksi.
  - Mengimplementasikan rekonsiliasi dinamis pada `getFinancialReports` ([`lib/actions/finance.ts`](lib/actions/finance.ts)) untuk menghitung saldo nominal per periode dari rincian item order dan transaksi kas masuk/keluar (`Payment`).

### 🏢 Letterhead & Workshop Info Export Integration
- **Integrasi Informasi Bengkel pada Ekspor Arus Kas & Laporan Keuangan**:
  - Mengintegrasikan pengambilan data profil bengkel (nama bengkel, alamat lengkap, nomor telepon, dan email) dari `SystemConfig` (kategori General Settings) pada halaman [`app/admin/reports/page.tsx`](app/admin/reports/page.tsx).
  - Menambahkan field `letterhead` pada tipe `CashFlowData` dan `CombinedFinancialExportData` ([`lib/export/types.ts`](lib/export/types.ts)).
  - Mengupdate modul generator ekspor ([`lib/export/reports/financialExport.ts`](lib/export/reports/financialExport.ts), [`lib/export/pdfGenerator.ts`](lib/export/pdfGenerator.ts), [`lib/export/excelGenerator.ts`](lib/export/excelGenerator.ts)) agar kop surat resmi pada file PDF dan Excel menampilkan alamat dan nomor kontak riil bengkel secara otomatis tanpa teks placeholder template.

### 📚 Documentation Synchronization
- **Pembaruan Menyeluruh `README.md` & `/admin/docs`**:
  - Menyelaraskan seluruh diagram ERD Mermaid, DFD Level 0/1/2, Sequence Diagram, dan diagram ASCII arsitektur sistem ke struktur 8 tabel database konsolidasi (7 relasi aktif).

---

## [2.3.2] - 2026-08-15

### 🗄️ Database Schema Cleanup & Documentation Sync
- **Pembersihan Kolom Database Tidak Terpakai pada Model `Order`**:
  - Menghapus kolom `rating` (`Int?`) dan `feedback` (`String?`) pada [`prisma/schema.prisma`](prisma/schema.prisma) yang tidak diproses oleh logika backend maupun ditampilkan pada antarmuka pengguna.
  - Memperbarui data seeding pada [`prisma/seed.ts`](prisma/seed.ts).
  - Menyinkronkan perubahan skema ke PostgreSQL database (`prisma db push`) serta membuat ulang Prisma Client (`prisma generate`).
  - Memperbarui dokumentasi internal sistem pada [`app/admin/docs/page.tsx`](app/admin/docs/page.tsx) serta dokumentasi proyek pada [`README.md`](README.md).
  - Menyelaraskan label versi dokumentasi teknis sistem menjadi `v2.3.2` pada [`app/admin/docs/page.tsx`](app/admin/docs/page.tsx).
  - Mengoptimalkan otorisasi RBAC menggunakan `isRoleAllowed()` serta pengetikan tipe aman (*type-safe error handling*) pada [`lib/actions/database.ts`](lib/actions/database.ts).

---

## [2.3.1] - 2026-08-15

### 🧹 Code Standards Audit & Rule Compliance Refactoring
- **Sinkronisasi & Pemenuhan 12 Aturan Pengodean Proyek (14 File)**:
  - Memastikan pengikatan blok kurung kurawal `{}` secara eksplisit pada seluruh percabangan `if` di [`lib/authCheck.ts`](lib/authCheck.ts) dan [`components/shared/RoleGuard.tsx`](components/shared/RoleGuard.tsx).
  - Merestrukturisasi pola guard / early return tanpa klausa `else` / `else if` setelah ekspresi `return` atau `redirect()`.
  - Mengeliminasi tipe longgar `any` pada Server Actions ([`lib/actions/employees.ts`](lib/actions/employees.ts) dan [`lib/actions/orders.ts`](lib/actions/orders.ts)) dan menggantinya dengan pengetikan ketat TypeScript (`unknown`, Prisma types).
  - Merapikan variabel penangkap error `catch (error)` pada [`components/shared/StatusPageClient.tsx`](components/shared/StatusPageClient.tsx).
  - Memformat seluruh atribut JSX multi-baris (lebih dari 2 atribut) pada elemen `<Image ... />` di seluruh komponen UI ([`app/page.tsx`](app/page.tsx), [`app/login/page.tsx`](app/login/page.tsx), [`components/booking/BookingWizard.tsx`](components/booking/BookingWizard.tsx), [`AdminSidebar.tsx`](components/layout/AdminSidebar.tsx), [`MobileSidebar.tsx`](components/layout/MobileSidebar.tsx)).
  - Membersihkan import tak terpakai (`useState` di `AdminSidebar.tsx`) serta menyelaraskan indentasi 2-space pada [`app/employee/page.tsx`](app/employee/page.tsx).

---

## [2.3.0] - 2026-08-15

### 🐛 Fixed & Role Authorization Normalization (RBAC Optimization)
- **Perbaikan Infinite Loop Redirect Login Mekanik & Otorisasi RBAC Terpusat**:
  - Mengatasi kendala perulangan redirect tak terhingga (*infinite loop*) saat pengguna dengan peran mekanik (`role: "Mekanik"`) melakukan autentikasi login.
  - Mengoptimalkan [`lib/authCheck.ts`](lib/authCheck.ts) dengan tipe `AppRole`, algoritma pencocokan peran performan tanpa alokasi array ganda, serta fungsi `normalizeRole()` dan `isRoleAllowed()`.
  - Menyelaraskan seluruh sinonim dan variasi penulisan nama peran (`"Mekanik"`, `"MECHANIC"`, `"EMPLOYEE"`, `"Teknisi"`, `"Admin"`, `"Administrator"`, `"Owner"`) sehingga evaluasi hak akses berjalan konsisten.
  - Mengoptimalkan [`RoleGuard.tsx`](components/shared/RoleGuard.tsx) dengan memoized access evaluation (`useMemo`) untuk menghindari re-render/re-effect berlebih.
  - Memperbarui proteksi server-side pada [`app/employee/page.tsx`](app/employee/page.tsx) dan [`app/employee/layout.tsx`](app/employee/layout.tsx) menggunakan `requireRole(["EMPLOYEE"])`.
  - Menyelaraskan tautan dashboard navbar publik ([`app/page.tsx`](app/page.tsx), [`components/shared/StatusPageClient.tsx`](components/shared/StatusPageClient.tsx), [`components/booking/BookingWizard.tsx`](components/booking/BookingWizard.tsx)) dan filter menu admin sidebar ([`AdminSidebar.tsx`](components/layout/AdminSidebar.tsx), [`MobileSidebar.tsx`](components/layout/MobileSidebar.tsx), [`AdminHeader.tsx`](components/layout/AdminHeader.tsx)) menggunakan `normalizeRole()`.
  - Menyelaraskan pemeriksaan hak akses Server Actions pada [`lib/actions/orders.ts`](lib/actions/orders.ts) dan [`lib/actions/employees.ts`](lib/actions/employees.ts) menggunakan `isRoleAllowed()`.

---

## [2.2.0] - 2026-08-15

### 📚 Documentation & Technical Specs Synchronization
- **Sinkronisasi Technical Documentation (`/admin/docs`)**:
  - Menyelaraskan seluruh metrik statistik (`8` Tables, `8` Relations, `4` Enums, `56` Components, `26` Pages, `90` Server Actions).
  - Memperbarui daftar 8 model database konsolidasi (`User`, `Employee`, `Order`, `SparePart`, `Account`, `Payment`, `Payroll`, `SystemConfig`) beserta jumlah kolom dan deskripsi fungsinya.
  - Menyelaraskan Chart of Accounts (COA) dengan data seed aktif dan memperbarui daftar komponen UI/Dialog utama.
  - Merestrukturisasi diagram Mermaid ERD, DFD Context/Level 1/Level 2, seluruh Flowchart proses order, kasir, penggajian, reset password JSON, dan CMS.
  - Menyelaraskan modul arsitektur sistem (Operational, Finance & Cashflow, Inventory, HR & Payroll) dan struktur direktori `lib/actions/`.
  - Menambahkan tab **Guidelines** interaktif yang mendokumentasikan 12 standar pengodean proyek (Prinsip Umum, Naming Rules, Identifier Standards, App Router structure, Component order, Functions & Control flow, Next.js special files, Formatting/JSX, Comments, CSS & JSON).
- **Pembaruan Menyeluruh `README.md`**:
  - Menyelaraskan seluruh diagram ASCII (8-Table ERD, DFD Level 0, DFD Level 1, Class Diagram, Use Case Diagram, dan Sequence Diagrams).
  - Mengupdate seluruh alur proses bisnis (Siklus Order Servis, Alur Pembayaran Kasir, dan Penggajian Karyawan) agar sepenuhnya berbasis pada 8 tabel konsolidasi.
  - Memperbarui dokumentasi struktur direktori proyek ke struktur Next.js App Router dan `lib/actions/` yang akurat.
  - Menambahkan seksi resmi **Standar & Panduan Pengodean (Coding Guidelines)**.

---

## [2.1.0] - 2026-08-15

### ✨ New Features & UI Redesign
- **Redesain Laporan Keuangan Single-Page (`/admin/reports`)**:
  - Mengubah tampilan laporan keuangan dari sistem tab menjadi **1 halaman terpadu (single-page report)** dengan 4 bagian analisis berurutan: Ikhtisar Laba Rugi, Laporan Pendapatan, Laporan Pengeluaran, dan Laporan Arus Kas & Rekening Bank.
- **Ekspor Laporan Keuangan Gabungan (All-in-One Export)**:
  - Menambahkan fungsi `exportCombinedFinancialReport` di `lib/export/reports/financialExport.ts` dan tipe `CombinedFinancialExportData` di `lib/export/types.ts`.
  - Memungkinkan pengunduhan seluruh rincian transaksi pendapatan dan pengeluaran bengkel dalam **1 file sekaligus** (tersedia format PDF resmi ber-kop surat dan Excel multi-sheet).
- **Penataan Tombol Ekspor Header**:
  - Menyusun tombol `Unduh Arus Kas` dan `Unduh Laporan Keuangan` dengan ukuran presisi sejajar dan label ringkas.
- **Pembersihan Kolom Unused `journalItems` & Optimasi Kueri**:
  - Menghapus kolom `journalItems` (JSON) dari tabel `Payment` di [`schema.prisma`](prisma/schema.prisma) dan membersihkan fungsi `getJournalEntries` serta parameter `journalItems` di seluruh server actions.
  - Mengeliminasi kueri `prisma.account.upsert` yang redundan pada mutasi stok barang (`createSparePart`, `updateSparePart`, `addStock`) di `lib/actions/inventory.ts`.
  - Mempertahankan penulisan & parsing referensi nota/invoice pada pencatatan pengeluaran (`lib/actions/expenses.ts`).

---

## [2.0.0] - 2026-08-15

### 🚀 Major Architectural Changes
- **Konsolidasi Skema Database (33 Tabel -> 8 Tabel Inti)**:
  - Menggabungkan dan menyederhanakan tabel database menjadi **8 tabel inti yang clean dan efisien**:
    1. `User`: Pengguna, autentikasi, role, token reset, dan forgot password.
    2. `Employee`: Karyawan, mekanik, skema gaji, dan komisi.
    3. `Order`: Servis kendaraan, pelanggan, status pengerjaan, rincian items (JSON), dan pembayaran.
    4. `SparePart`: Master inventaris suku cadang, stok, HPP, dan harga jual.
    5. `Account`: Akun keuangan (Chart of Accounts) & rekening bank.
    6. `Payment`: Transaksi pembayaran order, pengeluaran, pemasukan, payroll, dan kas.
    7. `Payroll`: Snapshot hak gaji per karyawan dan periode.
    8. `SystemConfig`: Konfigurasi sistem, CMS website, galeri media, info bengkel, dan log aktivitas.

### 🛠 Refactored & Updated
- **Server Actions & API Layer**:
  - Mengode ulang seluruh fungsi query di `lib/actions/` (`auth.ts`, `dashboard.ts`, `payroll.ts`, `expenses.ts`, `finance.ts`, `payments.ts`, `reports.ts`, `inventory.ts`, `settings.ts`, `socialEmbeds.ts`, `logs.ts`, `employees.ts`, `bank.ts`, `jabatan.ts`) agar sepenuhnya selaras dengan 8 tabel inti.
- **Perbaikan Logger & Auth.js**:
  - Menambahkan kustomisasi `logger.error` pada NextAuth / Auth.js v5 di `lib/auth.ts` untuk menekan log *stack trace* berisik `CredentialsSignin` / `CallbackRouteError` pada terminal server saat percobaan login gagal.
- **Serialisasi Data Next.js Server-to-Client**:
  - Menggunakan utilitas `serializeData(...)` di `lib/utils.ts` untuk mengonversi instance `Decimal` & `Date` dari Prisma menjadi *plain number* dan *ISO string*.

### ⚡ Performance Optimizations
- **Optimasi Grafik Dashboard 7 Hari**:
  - Mengubah 7 query `prisma.order.aggregate()` eksekusi paralel di `lib/actions/dashboard.ts` menjadi **1 query `findMany()`** untuk rentang 7 hari, menghilangkan peringatan `Error 1102: Worker exceeded resource limits` dari Cloudflare / Prisma Accelerate.
- **Optimasi Full-Table Scan Role**:
  - Mengganti pencarian mode regex `contains: 'Mekanik'` pada PostgreSQL di `lib/actions/employees.ts` dengan pencarian himpunan presisi (`role: { in: [...] }`).

### 🐛 Fixed
- Fix `TypeError: Cannot read properties of undefined` pada halaman `/admin/payroll`, `/admin`, `/admin/transactions`, dan `/admin/profile`.
- Fix Next.js Client Component serialization crash: `"Decimal objects are not supported"`.
- Fix `Unknown field 'payroll' for include statement on model 'Payment'` pada `getPaymentHistory` di `lib/actions/payments.ts`.

---

## [1.0.0] - 2026-08-09

### ✨ Initial Release
- Rilis perdana **NopzGarage Management System** berbasis Next.js 14 App Router, PostgreSQL, Prisma ORM, dan Tailwind CSS / Shadcn UI.
- Fitur Dashboard Admin, Manajemen Order & Servis, Kanban Board Publik & Internal, Inventori Suku Cadang, Penggajian & Payroll Karyawan, Pencatatan Keuangan & Laporan PDF/Excel, CMS Landing Page, dan Portal Tracking Status Pelanggan.
