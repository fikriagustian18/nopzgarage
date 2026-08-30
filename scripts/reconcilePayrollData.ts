import { PrismaClient, PayrollStatus, SalaryType } from '@prisma/client';

const prisma = new PrismaClient();

function tryParseJson(note: string | null): any {
  if (!note) return null;
  try {
    return JSON.parse(note);
  } catch {
    return null;
  }
}

async function main() {
  console.log('🔄 Starting data reconciliation...');

  // 1. Migrate monthly employees with monthlyRate = 0 from dailyRate
  const monthlyEmployees = await prisma.employee.findMany({
    where: {
      salaryType: SalaryType.MONTHLY,
      monthlyRate: 0,
    },
  });

  console.log(`Found ${monthlyEmployees.length} monthly employees to update.`);
  for (const emp of monthlyEmployees) {
    if (Number(emp.dailyRate) > 0) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { monthlyRate: emp.dailyRate },
      });
      console.log(`  Updated employee ${emp.name} (${emp.id}) monthlyRate to ${emp.dailyRate}`);
    }
  }

  // 2. Fetch all legacy PAYROLL payments without payrollId
  const legacyPayments = await prisma.payment.findMany({
    where: {
      type: 'PAYROLL',
      payrollId: null,
      employeeId: { not: null },
    },
    include: {
      employee: true,
    },
  });

  console.log(`Found ${legacyPayments.length} unlinked PAYROLL payments.`);

  for (const payment of legacyPayments) {
    if (!payment.employeeId || !payment.employee) continue;

    const parsedNote = tryParseJson(payment.note);
    const startDate = parsedNote?.startDate ? new Date(parsedNote.startDate) : payment.date;
    const endDate = parsedNote?.endDate ? new Date(parsedNote.endDate) : payment.date;
    const bonus = parsedNote?.bonus ? Number(parsedNote.bonus) : 0;
    const amount = Number(payment.amount);
    const employeeSalaryType = payment.employee.salaryType;

    let baseSalary = amount;
    if (amount === 0 && employeeSalaryType === SalaryType.MONTHLY) {
      baseSalary = Number(payment.employee.monthlyRate);
    }

    let totalEarned = amount;
    if (amount === 0 && employeeSalaryType === SalaryType.MONTHLY) {
      totalEarned = baseSalary + bonus;
    }

    const status: PayrollStatus = amount > 0 ? PayrollStatus.PAID : PayrollStatus.UNPAID;

    // Create or find payroll
    const payroll = await prisma.payroll.upsert({
      where: { id: payment.id },
      create: {
        id: payment.id,
        employeeId: payment.employeeId,
        startDate,
        endDate,
        salaryType: employeeSalaryType,
        baseSalary,
        bonus,
        totalEarned,
        totalPaid: amount,
        status,
        details: payment.note,
        createdAt: payment.createdAt,
        updatedAt: payment.createdAt,
      },
      update: {},
    });

    // Link payment to payroll
    await prisma.payment.update({
      where: { id: payment.id },
      data: { payrollId: payroll.id },
    });

    console.log(`  Linked payment ${payment.id} to payroll record.`);
  }

  console.log('✅ Data reconciliation completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Reconciliation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
