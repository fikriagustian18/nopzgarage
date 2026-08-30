import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [invalidCommissionRates, emptyMonthlyRates, unlinkedPayrollPayments, imageColumn] =
    await Promise.all([
      prisma.employee.findMany({
        where: { OR: [{ commissionRate: { lt: 0 } }, { commissionRate: { gt: 100 } }] },
        select: { id: true, name: true, commissionRate: true },
      }),
      prisma.employee.findMany({
        where: { salaryType: "MONTHLY", monthlyRate: { lte: 0 } },
        select: { id: true, name: true, monthlyRate: true, dailyRate: true },
      }),
      prisma.payment.count({ where: { type: "PAYROLL", payrollId: null } }),
      prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'SystemConfig'
            AND column_name = 'imageUrl'
        ) AS "exists"
      `,
    ]);

  const report = {
    mode: "dry-run",
    invalidCommissionRates: invalidCommissionRates.map((employee) => ({
      ...employee,
      commissionRate: Number(employee.commissionRate),
    })),
    monthlyEmployeesWithoutRate: emptyMonthlyRates.map((employee) => ({
      ...employee,
      monthlyRate: Number(employee.monthlyRate),
      legacyDailyRate: Number(employee.dailyRate),
    })),
    unlinkedLegacyPayrollPayments: unlinkedPayrollPayments,
    systemConfigImageUrlStillExists: imageColumn[0]?.exists ?? false,
  };

  console.log(JSON.stringify(report, null, 2));

  if (
    report.invalidCommissionRates.length > 0 ||
    report.monthlyEmployeesWithoutRate.length > 0 ||
    report.unlinkedLegacyPayrollPayments > 0 ||
    report.systemConfigImageUrlStillExists
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Audit failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
