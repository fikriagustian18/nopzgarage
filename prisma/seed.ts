// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

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

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📝 Summary:');
  console.log(`   - ${accounts.length} Chart of Accounts`);
  console.log('   - 3 Employees (1 Owner, 2 Mechanics)');
  console.log(`   - ${spareParts.length} Spare Parts`);
  console.log('   - 3 System Settings');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });