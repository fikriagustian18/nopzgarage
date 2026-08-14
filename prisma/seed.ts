import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding 8 consolidated database tables...");

  // ==================== 1. Chart of Accounts & Bank Accounts (Account) ====================
  const accounts = [
    // ASSETS
    { code: "101", name: "Kas Utama", type: "ASSET", category: "CURRENT_ASSET", bankCode: "CASH", currentBalance: 5000000 },
    { code: "102", name: "Bank BCA", type: "BANK", category: "CURRENT_ASSET", bankCode: "BCA", accountNumber: "1234567890", accountName: "NOPZ GARAGE", currentBalance: 25000000 },
    { code: "103", name: "Bank Mandiri", type: "BANK", category: "CURRENT_ASSET", bankCode: "MANDIRI", accountNumber: "0987654321", accountName: "NOPZ GARAGE", currentBalance: 15000000 },
    { code: "104", name: "Piutang Usaha", type: "ASSET", category: "CURRENT_ASSET" },
    { code: "111", name: "Persediaan Sparepart", type: "ASSET", category: "CURRENT_ASSET" },
    { code: "121", name: "Peralatan Bengkel", type: "ASSET", category: "FIXED_ASSET" },

    // LIABILITIES
    { code: "201", name: "Hutang Usaha", type: "LIABILITY", category: "CURRENT_LIABILITY" },
    { code: "202", name: "Hutang Gaji", type: "LIABILITY", category: "CURRENT_LIABILITY" },

    // EQUITY
    { code: "301", name: "Modal Pemilik", type: "EQUITY", category: "CAPITAL" },
    { code: "302", name: "Prive", type: "EQUITY", category: "WITHDRAWAL" },

    // REVENUE
    { code: "401", name: "Pendapatan Jasa Servis", type: "REVENUE", category: "OPERATING_REVENUE" },
    { code: "402", name: "Pendapatan Penjualan Sparepart", type: "REVENUE", category: "OPERATING_REVENUE" },

    // EXPENSES
    { code: "501", name: "Beban Gaji Karyawan", type: "EXPENSE", category: "OPERATING_EXPENSE" },
    { code: "502", name: "Beban Operasional", type: "EXPENSE", category: "OPERATING_EXPENSE" },
    { code: "511", name: "Harga Pokok Penjualan", type: "EXPENSE", category: "COST_OF_GOODS_SOLD" },
  ];

  console.log("📊 Creating Accounts...");
  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: account,
      create: account,
    });
  }

  // ==================== 2. Employees (Employee) ====================
  console.log("👷 Creating Employees...");


  const ownerEmp = await prisma.employee.upsert({
    where: { id: 'emp-owner-001' },
    update: {},
    create: {
      id: 'emp-owner-001',
      name: 'Budi Santoso',
      role: 'Owner',
      phone: '081234567890',
      jabatan: 'Pemilik Bengkel',
      salaryType: 'DAILY',
      dailyRate: 0,
    },
  });

  const adminEmp = await prisma.employee.upsert({
    where: { id: 'emp-admin-001' },
    update: {},
    create: {
      id: 'emp-admin-001',
      name: 'Agus Pratama',
      role: 'Admin',
      phone: '081234567891',
      jabatan: 'Admin Kasir',
      salaryType: 'MONTHLY',
      dailyRate: 100000,
    },
  });

  const mechanicEmp = await prisma.employee.upsert({
    where: { id: 'emp-mech-001' },
    update: {},
    create: {
      id: 'emp-mech-001',
      name: 'Dedi Kurniawan',
      role: 'Mekanik',
      phone: '081234567892',
      jabatan: 'Mekanik Senior',
      salaryType: 'COMMISSION',
      commissionRate: 50000,
    },
  });

  // ==================== 3. Users (User) ====================
  console.log('👤 Creating Users...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'owner@nopzgarage.com' },
    update: {},
    create: {
      email: 'owner@nopzgarage.com',
      password: hashedPassword,
      role: 'Owner',
      employeeId: ownerEmp.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@nopzgarage.com' },
    update: {},
    create: {
      email: 'admin@nopzgarage.com',
      password: hashedPassword,
      role: 'Admin',
      employeeId: adminEmp.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'mekanik@nopzgarage.com' },
    update: {},
    create: {
      email: 'mekanik@nopzgarage.com',
      password: hashedPassword,
      role: 'Mekanik',
      employeeId: mechanicEmp.id,
      isActive: true,
    },
  });

  // ==================== 4. Spare Parts (SparePart) ====================
  console.log('🔧 Creating Spare Parts...');
  const spareParts = [
    { code: 'OLI-001', name: 'Oli Mesin Matic 0.8L', category: 'Oli', stock: 25, minStock: 5, unit: 'botol', buyPrice: 35000, sellPrice: 50000 },
    { code: 'OLI-002', name: 'Oli Mesin Manual 1L', category: 'Oli', stock: 15, minStock: 5, unit: 'botol', buyPrice: 40000, sellPrice: 60000 },
    { code: 'FIL-001', name: 'Filter Udara Beat', category: 'Sparepart', stock: 20, minStock: 5, unit: 'pcs', buyPrice: 20000, sellPrice: 35000 },
    { code: 'BRK-001', name: 'Kampas Rem Depan', category: 'Sparepart', stock: 12, minStock: 5, unit: 'set', buyPrice: 45000, sellPrice: 75000 },
    { code: 'BRK-002', name: 'Kampas Rem Belakang', category: 'Sparepart', stock: 10, minStock: 5, unit: 'set', buyPrice: 40000, sellPrice: 70000 },
  ];

  for (const part of spareParts) {
    await prisma.sparePart.upsert({
      where: { code: part.code },
      update: part,
      create: part,
    });
  }

  // ==================== 5. Orders & 6. OrderItems ====================
  console.log('📋 Creating Sample Orders & OrderItems...');

  const oliPart = await prisma.sparePart.findUnique({ where: { code: 'OLI-001' } });
  const kampasPart = await prisma.sparePart.findUnique({ where: { code: 'BRK-001' } });

  const sampleOrder = await prisma.order.upsert({
    where: { id: 'order-sample-001' },
    update: {},
    create: {
      id: 'order-sample-001',
      custName: 'Rudi Hermawan',
      custPhone: '08122334455',
      vehicle: 'Honda Beat 2021',
      plateNumber: 'B 1234 ABC',
      complaint: 'Ganti oli rutin dan cek rem depan',
      serviceType: 'LIGHT_SERVICE',
      status: 'COMPLETED',
      totalPrice: 150000,
      totalPaid: 150000,
      paymentStatus: 'PAID',
      mechanicId: mechanicEmp.id,
      feedback: 'Servis sangat cepat dan memuaskan',
      rating: 5,
    },
  });

  if (oliPart) {
    await prisma.orderItem.create({
      data: {
        orderId: sampleOrder.id,
        itemType: 'SPAREPART',
        itemName: oliPart.name,
        quantity: 1,
        unitPrice: oliPart.sellPrice,
        totalPrice: oliPart.sellPrice,
        sparePartId: oliPart.id,
      },
    });
  }

  if (kampasPart) {
    await prisma.orderItem.create({
      data: {
        orderId: sampleOrder.id,
        itemType: 'SPAREPART',
        itemName: kampasPart.name,
        quantity: 1,
        unitPrice: kampasPart.sellPrice,
        totalPrice: kampasPart.sellPrice,
        sparePartId: kampasPart.id,
      },
    });
  }

  await prisma.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      itemType: 'SERVICE',
      itemName: 'Jasa Servis Ringan',
      quantity: 1,
      unitPrice: 25000,
      totalPrice: 25000,
      employeeId: mechanicEmp.id,
    },
  });

  // ==================== 7. Payments ====================
  console.log('💳 Creating Payments...');
  const cashAccount = await prisma.account.findUnique({ where: { code: '101' } });

  await prisma.payment.create({
    data: {
      amount: 150000,
      type: 'ORDER_PAYMENT',
      note: 'Pembayaran Order Rudi Hermawan',
      orderId: sampleOrder.id,
      bankAccountId: cashAccount?.id,
      paymentMethod: 'CASH',
    },
  });

  // ==================== 8. SystemConfig ====================
  console.log('⚙️ Creating SystemConfigs...');
  const configs = [
    { key: 'max_booking_per_hour', category: 'SETTING', title: 'Max Booking Per Jam', content: { value: '3' } },
    { key: 'business_hours', category: 'SETTING', title: 'Jam Operasional', content: { open: '08:00', close: '17:00', daysOff: [0] } },
    { key: 'hero_section', category: 'CONTENT', title: 'NOPZ GARAGE', subtitle: 'Spesialis Servis & Modifikasi Motor', content: { description: 'Pelayanan profesional dengan garansi hasil terbaik.' } },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: cfg,
      create: cfg,
    });
  }

  console.log('');
  console.log('🎉 Seeding 8 consolidated tables completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });