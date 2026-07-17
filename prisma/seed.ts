// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== Chart of Accounts ====================
  const accounts = [
    // ASSETS (1xx)
    { code: '101', name: 'Kas', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '102', name: 'Bank', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '103', name: 'Piutang Usaha', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '111', name: 'Persediaan Sparepart', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '121', name: 'Peralatan Bengkel', type: 'ASSET', category: 'FIXED_ASSET' },
    { code: '122', name: 'Akumulasi Penyusutan Peralatan', type: 'ASSET', category: 'FIXED_ASSET' },

    // LIABILITIES (2xx)
    { code: '201', name: 'Hutang Usaha', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '202', name: 'Hutang Gaji', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },

    // EQUITY (3xx)
    { code: '301', name: 'Modal Pemilik', type: 'EQUITY', category: 'CAPITAL' },
    { code: '302', name: 'Prive', type: 'EQUITY', category: 'WITHDRAWAL' },
    { code: '303', name: 'Laba Ditahan', type: 'EQUITY', category: 'RETAINED_EARNINGS' },

    // REVENUE (4xx)
    { code: '401', name: 'Pendapatan Jasa Servis', type: 'REVENUE', category: 'OPERATING_REVENUE' },
    { code: '402', name: 'Pendapatan Penjualan Sparepart', type: 'REVENUE', category: 'OPERATING_REVENUE' },
    { code: '403', name: 'Pendapatan Modifikasi', type: 'REVENUE', category: 'OPERATING_REVENUE' },

    // EXPENSES (5xx)
    { code: '501', name: 'Beban Gaji Karyawan', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '502', name: 'Beban Listrik', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '503', name: 'Beban Air', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '504', name: 'Beban Sewa Tempat', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '505', name: 'Beban Supplies', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '511', name: 'Harga Pokok Penjualan', type: 'EXPENSE', category: 'COST_OF_GOODS_SOLD' },
  ];

  console.log('📊 Creating Chart of Accounts...');
  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    });
  }
  console.log(`✅ Created ${accounts.length} accounts`);

  // ==================== Sample Employees ====================
  console.log('👷 Creating sample employees...');
  
  const owner = await prisma.employee.upsert({
    where: { id: 'owner-001' },
    update: {},
    create: {
      id: 'owner-001',
      name: 'Budi Santoso',
      role: 'Owner',
      phone: '081234567890',
      salaryType: 'DAILY',
      dailyRate: 0,
    },
  });

  const mechanic1 = await prisma.employee.upsert({
    where: { id: 'mech-001' },
    update: {},
    create: {
      id: 'mech-001',
      name: 'Agus Prasetyo',
      role: 'Mekanik Senior',
      phone: '081234567891',
      salaryType: 'DAILY',
      dailyRate: 150000,
    },
  });

  const mechanic2 = await prisma.employee.upsert({
    where: { id: 'mech-002' },
    update: {},
    create: {
      id: 'mech-002',
      name: 'Dedi Kurniawan',
      role: 'Mekanik',
      phone: '081234567892',
      salaryType: 'COMMISSION',
      commissionRate: 50000,
    },
  });

  console.log('✅ Created 3 employees');

  // ==================== Sample Spare Parts ====================
  console.log('🔧 Creating sample spare parts...');
  
  const spareParts = [
    { code: 'OLI-001', name: 'Oli Mesin Matic 0.8L', stock: 20, minStock: 5, unit: 'botol', buyPrice: 35000, sellPrice: 50000 },
    { code: 'OLI-002', name: 'Oli Mesin Manual 1L', stock: 15, minStock: 5, unit: 'botol', buyPrice: 40000, sellPrice: 60000 },
    { code: 'FIL-001', name: 'Filter Oli', stock: 30, minStock: 10, unit: 'pcs', buyPrice: 15000, sellPrice: 25000 },
    { code: 'BRK-001', name: 'Kampas Rem Depan', stock: 10, minStock: 5, unit: 'set', buyPrice: 45000, sellPrice: 75000 },
    { code: 'BRK-002', name: 'Kampas Rem Belakang', stock: 8, minStock: 5, unit: 'set', buyPrice: 40000, sellPrice: 70000 },
  ];

  for (const part of spareParts) {
    await prisma.sparePart.upsert({
      where: { code: part.code },
      update: {},
      create: part,
    });
  }
  console.log(`✅ Created ${spareParts.length} spare parts`);

  // ==================== System Settings ====================
  console.log('⚙️  Creating system settings...');
  
  await prisma.systemSetting.upsert({
    where: { key: 'max_booking_per_hour' },
    update: {},
    create: {
      key: 'max_booking_per_hour',
      value: '3', // Max 3 motor per jam
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'whatsapp_api_key' },
    update: {},
    create: {
      key: 'whatsapp_api_key',
      value: '', // Kosongkan, diisi manual
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'business_hours' },
    update: {},
    create: {
      key: 'business_hours',
      value: JSON.stringify({
        open: '08:00',
        close: '17:00',
        daysOff: [0], // 0 = Minggu
      }),
    },
  });

  console.log('✅ Created system settings');

  // ==================== Seed new ERD Tables ====================
  await seedERDTables();

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📝 Summary:');
  console.log(`   - ${accounts.length} Chart of Accounts`);
  console.log('   - 3 Employees (1 Owner, 2 Mechanics)');
  console.log(`   - ${spareParts.length} Spare Parts`);
  console.log('   - 3 System Settings');
  console.log('   - 14 ERD Tables populated with sample records');
}

async function seedERDTables() {
  console.log('🔄 Seeding ERD Tables...');

  // 1. USERS
  const hashedPassword = await bcrypt.hash('123456', 10);
  const userOwner = await prisma.uSERS.upsert({
    where: { username: 'owner_erd' },
    update: {},
    create: {
      nama: 'Budi Santoso ERD',
      username: 'owner_erd',
      password: hashedPassword,
      role: 'Owner',
      no_telp: '081234567890',
      alamat: 'Jl. Pemuda No. 12',
      status: true,
    },
  });

  const userAdmin = await prisma.uSERS.upsert({
    where: { username: 'admin_erd' },
    update: {},
    create: {
      nama: 'Agus Admin ERD',
      username: 'admin_erd',
      password: hashedPassword,
      role: 'Admin',
      no_telp: '081234567891',
      alamat: 'Jl. Merdeka No. 45',
      status: true,
    },
  });

  const userMekanik = await prisma.uSERS.upsert({
    where: { username: 'mekanik_erd' },
    update: {},
    create: {
      nama: 'Dedi Mekanik ERD',
      username: 'mekanik_erd',
      password: hashedPassword,
      role: 'Mekanik',
      no_telp: '081234567892',
      alamat: 'Jl. Sudirman No. 89',
      status: true,
    },
  });

  // 2. KENDARAAN
  let kendaraanBeat = await prisma.kENDARAAN.findFirst({ where: { no_polisi: 'B 1234 ABC' } });
  if (!kendaraanBeat) {
    kendaraanBeat = await prisma.kENDARAAN.create({
      data: {
        no_polisi: 'B 1234 ABC',
        merek: 'Honda',
        tipe: 'Beat',
        tahun: 2020,
        warna: 'Hitam',
        no_rangka: 'MHK123456789',
        no_mesin: 'E123456789',
      },
    });
  }

  // 3. LAYANAN_SERVIS
  let layananServisRingan = await prisma.lAYANAN_SERVIS.findFirst({ where: { nama_layanan: 'Servis Ringan ERD' } });
  if (!layananServisRingan) {
    layananServisRingan = await prisma.lAYANAN_SERVIS.create({
      data: {
        nama_layanan: 'Servis Ringan ERD',
        kategori: 'Regular',
        deskripsi: 'Servis rutin berkala motor matic/manual',
        harga_jasa: 75000,
        status: true,
      },
    });
  }

  // 4. BOOKING_SERVIS
  let booking = await prisma.bOOKING_SERVIS.findFirst({ where: { nama_pelanggan: 'Rudi Hermawan ERD' } });
  if (!booking) {
    booking = await prisma.bOOKING_SERVIS.create({
      data: {
        nama_pelanggan: 'Rudi Hermawan ERD',
        no_telp: '08122334455',
        alamat: 'Jl. Melati No. 5',
        id_kendaraan: kendaraanBeat.id_kendaraan,
        id_layanan: layananServisRingan.id_layanan,
        keluhan: 'Tarikan gas agak berat dan rem belakang kurang pakem',
        tanggal_booking: new Date(),
        jam_booking: '10:00',
        status_booking: 'Konfirmasi',
      },
    });
  }

  // 5. ORDER_SERVIS
  let order = await prisma.oRDER_SERVIS.findFirst({ where: { no_order: 'ORD-ERD-001' } });
  if (!order) {
    order = await prisma.oRDER_SERVIS.create({
      data: {
        id_booking: booking.id_booking,
        id_user: userMekanik.id_user,
        no_order: 'ORD-ERD-001',
        tanggal_order: new Date(),
        status_order: 'Proses',
        estimasi_selesai: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 jam dari sekarang
        catatan: 'Minta cek kampas rem belakang sekalian',
      },
    });
  }

  // 6. DETAIL_SERVIS
  let detailServis = await prisma.dETAIL_SERVIS.findFirst({ where: { id_order: order.id_order } });
  if (!detailServis) {
    detailServis = await prisma.dETAIL_SERVIS.create({
      data: {
        id_order: order.id_order,
        id_layanan: layananServisRingan.id_layanan,
        keterangan: 'Servis Ringan rutin',
        biaya_jasa: 75000,
      },
    });
  }

  // 7. INVENTORY (BARANG)
  let inventoryOli = await prisma.iNVENTORY.findUnique({ where: { kode_barang: 'OLI-ERD-001' } });
  if (!inventoryOli) {
    inventoryOli = await prisma.iNVENTORY.create({
      data: {
        kode_barang: 'OLI-ERD-001',
        nama_barang: 'Oli Matic Castrol 0.8L',
        kategori: 'Pelumas',
        satuan: 'botol',
        harga_beli: 35000,
        harga_jual: 50000,
        stok_akhir: 20,
        lokasi: 'Rak A-1',
        status: true,
      },
    });
  }

  // 8. DETAIL_ORDER_SUKUCADANG
  let detailSc = await prisma.dETAIL_ORDER_SUKUCADANG.findFirst({
    where: {
      id_order: order.id_order,
      id_barang: inventoryOli.id_barang,
    },
  });
  if (!detailSc) {
    detailSc = await prisma.dETAIL_ORDER_SUKUCADANG.create({
      data: {
        id_order: order.id_order,
        id_barang: inventoryOli.id_barang,
        jumlah: 1,
        harga_satuan: 50000,
        subtotal: 50000,
      },
    });
  }

  // 9. TRANSAKSI
  let transaksi = await prisma.tRANSAKSI.findUnique({ where: { id_order: order.id_order } });
  if (!transaksi) {
    transaksi = await prisma.tRANSAKSI.create({
      data: {
        id_order: order.id_order,
        tanggal_transaksi: new Date(),
        total_tagihan: 125000, // 75000 jasa + 50000 oli
        diskon: 0,
        total_bayar: 125000,
        metode_bayar: 'Tunai',
        jumlah_bayar: 150000,
        kembalian: 25000,
        status_pembayaran: 'Lunas',
      },
    });
  }

  // 10. DETAIL_TRANSAKSI
  let detailTransaksiJasa = await prisma.dETAIL_TRANSAKSI.findFirst({
    where: {
      id_transaksi: transaksi.id_transaksi,
      tipe_item: 'Jasa',
    },
  });
  if (!detailTransaksiJasa) {
    await prisma.dETAIL_TRANSAKSI.create({
      data: {
        id_transaksi: transaksi.id_transaksi,
        tipe_item: 'Jasa',
        id_referensi: detailServis.id_detail_servis,
        nama_item: 'Servis Ringan ERD',
        jumlah: 1,
        harga_satuan: 75000,
        subtotal: 75000,
      },
    });
  }

  let detailTransaksiPart = await prisma.dETAIL_TRANSAKSI.findFirst({
    where: {
      id_transaksi: transaksi.id_transaksi,
      tipe_item: 'Suku Cadang',
    },
  });
  if (!detailTransaksiPart) {
    await prisma.dETAIL_TRANSAKSI.create({
      data: {
        id_transaksi: transaksi.id_transaksi,
        tipe_item: 'Suku Cadang',
        id_referensi: detailSc.id_detail_sc,
        nama_item: 'Oli Matic Castrol 0.8L',
        jumlah: 1,
        harga_satuan: 50000,
        subtotal: 50000,
      },
    });
  }

  // 11. RIWAYAT_PEMBAYARAN
  let riwayatPembayaran = await prisma.rIWAYAT_PEMBAYARAN.findFirst({
    where: { id_transaksi: transaksi.id_transaksi },
  });
  if (!riwayatPembayaran) {
    riwayatPembayaran = await prisma.rIWAYAT_PEMBAYARAN.create({
      data: {
        id_transaksi: transaksi.id_transaksi,
        tanggal: new Date(),
        keterangan: 'Pembayaran Lunas via Kasir',
        nominal: 125000,
      },
    });
  }

  // 12. RIWAYAT_ORDER
  let riwayatOrder = await prisma.rIWAYAT_ORDER.findFirst({
    where: { id_order: order.id_order },
  });
  if (!riwayatOrder) {
    await prisma.rIWAYAT_ORDER.createMany({
      data: [
        {
          id_order: order.id_order,
          tanggal: new Date(Date.now() - 30 * 60 * 1000), // 30 menit lalu
          status_order: 'Menunggu Servis',
          keterangan: 'Booking dikonfirmasi menjadi antrian order',
        },
        {
          id_order: order.id_order,
          tanggal: new Date(),
          status_order: 'Proses',
          keterangan: 'Pekerjaan dimulai oleh Mekanik Dedi',
        },
      ],
    });
  }

  // 13. STOK_MASUK
  let stokMasuk = await prisma.sTOK_MASUK.findFirst({
    where: { id_barang: inventoryOli.id_barang },
  });
  if (!stokMasuk) {
    stokMasuk = await prisma.sTOK_MASUK.create({
      data: {
        id_barang: inventoryOli.id_barang,
        tanggal: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 hari lalu
        supplier: 'Castrol Indonesia Distributor',
        jumlah: 21, // 20 sisa + 1 yang dipakai
        harga_beli: 35000,
        total: 21 * 35000,
        keterangan: 'Stock masuk awal untuk testing ERD',
      },
    });
  }

  // 14. STOK_KELUAR
  let stokKeluar = await prisma.sTOK_KELUAR.findFirst({
    where: { id_barang: inventoryOli.id_barang },
  });
  if (!stokKeluar) {
    stokKeluar = await prisma.sTOK_KELUAR.create({
      data: {
        id_barang: inventoryOli.id_barang,
        tanggal: new Date(),
        referensi: 'Order',
        jumlah: 1,
        keterangan: 'Digunakan pada order no ORD-ERD-001',
      },
    });
  }

  console.log('✅ Seeding ERD Tables completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });