"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isRoleAllowed } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { createLog } from "./logs";
import type { SalaryType } from "@prisma/client";

// ==================== Types ====================
export interface CreateEmployeeInput {
  name: string;
  role: string;
  phone?: string;
  salaryType: SalaryType;
  dailyRate?: number;
  monthlyRate?: number;
  commissionRate?: number;
}

export interface UpdateEmployeeInput {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  salaryType?: SalaryType;
  dailyRate?: number;
  monthlyRate?: number;
  commissionRate?: number;
  isActive?: boolean;
}

// Infer TransactionClient strictly
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function validateSalaryRates(data: {
  dailyRate?: number;
  monthlyRate?: number;
  commissionRate?: number;
}): string | null {
  for (const [label, value] of [
    ["Rate harian", data.dailyRate],
    ["Rate bulanan", data.monthlyRate],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      return `${label} harus berupa angka non-negatif.`;
    }
  }

  if (
    data.commissionRate !== undefined &&
    (!Number.isFinite(Number(data.commissionRate)) ||
      Number(data.commissionRate) < 0 ||
      Number(data.commissionRate) > 100)
  ) {
    return "Rate komisi harus berada pada rentang 0-100%.";
  }

  return null;
}

function isPendingPayrollMigration(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }
  return error.code === "P2021" || error.code === "P2022";
}

async function loadEmployeePayrolls(employee: {
  id: string;
  salaryType: SalaryType;
  dailyRate: unknown;
}) {
  try {
    const [rate, payrolls] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: employee.id },
        select: { monthlyRate: true },
      }),
      prisma.payroll.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          employeeId: true,
          startDate: true,
          endDate: true,
          salaryType: true,
          baseSalary: true,
          bonus: true,
          totalEarned: true,
          totalPaid: true,
          status: true,
          details: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      monthlyRate: Number(rate?.monthlyRate ?? 0),
      payrolls,
    };
  } catch (error) {
    if (!isPendingPayrollMigration(error)) {
      throw error;
    }

    // Transitional read path: keep the employee dashboard available while the
    // additive payroll migration is waiting for a controlled database deploy.
    const legacyPayments = await prisma.payment.findMany({
      where: { employeeId: employee.id, type: "PAYROLL" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        employeeId: true,
        date: true,
        amount: true,
        note: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    const monthlyRate = employee.salaryType === "MONTHLY" ? Number(employee.dailyRate) : 0;
    const payrolls = legacyPayments.map((payment) => {
      let details: Record<string, unknown> = {};
      if (payment.note) {
        try {
          const parsed: unknown = JSON.parse(payment.note);
          if (parsed && typeof parsed === "object") {
            details = parsed as Record<string, unknown>;
          }
        } catch {
          details = { bonusNote: payment.note };
        }
      }

      const paidAmount = Number(payment.amount);
      const parsedBonus = Number(details.bonus ?? 0);
      const bonus = Number.isFinite(parsedBonus) && parsedBonus >= 0 ? parsedBonus : 0;
      const parsedBase = Number(details.baseSalary);
      const reconstructedMonthlyBase =
        employee.salaryType === "MONTHLY" && paidAmount === 0 ? monthlyRate : paidAmount;
      const baseSalary = Number.isFinite(parsedBase) && parsedBase > 0
        ? parsedBase
        : reconstructedMonthlyBase;
      const parsedTotal = Number(details.totalEarned);
      const totalEarned = Number.isFinite(parsedTotal) && parsedTotal > 0
        ? parsedTotal
        : baseSalary + bonus;

      return {
        id: payment.id,
        employeeId: employee.id,
        startDate: details.startDate || payment.date,
        endDate: details.endDate || payment.date,
        salaryType: employee.salaryType,
        baseSalary,
        bonus,
        totalEarned,
        totalPaid: paidAmount,
        status: paidAmount <= 0 ? "UNPAID" : paidAmount >= totalEarned ? "PAID" : "PARTIAL",
        details: payment.note,
        createdAt: payment.createdAt,
        updatedAt: payment.createdAt,
      };
    });

    return { monthlyRate, payrolls };
  }
}

// Function to pay all pending commissions for an employee
/**
 * Pay ALL pending commissions for a single employee.
 * 
 * Process:
 * 1. Calculate total unpaid commissions.
 * 2. Mark all related fees as 'PAID'.
 * 3. Create Payment record (PAYROLL / Money Out).
 * 
 * @param {string} employeeId - Employee ID.
 * @param {'CASH' | 'TRANSFER'} paymentMethod - Payment method.
 * @param {string} note - Additional notes.
 * @returns {Object} Payment result (count, total amount).
 */
export async function payAllCommissions(employeeId: string, paymentMethod: "CASH" | "TRANSFER" = "CASH", note?: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can pay commissions." };
    }
    console.log(`[PAY_COMMISSION] Starting payment for employee ${employeeId}`);

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get Employee
      const employee = await tx.employee.findUnique({
        where: { id: employeeId }
      });
      if (!employee) {
        throw new Error("Employee not found");
      }

      // 2. Get Unpaid Fees
      const unpaidFees = await tx.orderItem.findMany({
        where: { 
          employeeId: employeeId,
          itemType: 'FEE',
          isPaid: false,
          order: { status: 'COMPLETED', paymentStatus: 'PAID' },
        },
        include: { order: true }
      });

      if (unpaidFees.length === 0) {
        return { success: false, error: "Tidak ada komisi yang perlu dibayar." };
      }

      const totalAmount = unpaidFees.reduce((sum: number, fee) => sum + Number(fee.totalPrice), 0);

      console.log(`[PAY_COMMISSION] Total commission to pay: ${totalAmount}`);

      // 3. Mark Fees as Paid
      await tx.orderItem.updateMany({
        where: { 
          id: { in: unpaidFees.map((f) => f.id) }
        },
        data: {
          isPaid: true
        }
      });

      // 4. Create Payment Record (consolidated — replaces Payroll + JournalEntry)
      const payment = await tx.payment.create({
        data: {
          type: 'PAYROLL',
          amount: totalAmount,
          employeeId: employeeId,
          paymentMethod: paymentMethod,
          note: note || `Pencairan Komisi ${employee.name} (${unpaidFees.length} order)`,
        }
      });

      return { success: true, count: unpaidFees.length, amount: totalAmount };
    }, {
      maxWait: 5000,
      timeout: 15000,
    });

    revalidatePath('/admin/employees');
    revalidatePath('/admin/reports');
    
    return result;

  } catch (error: unknown) {
    console.error("[PAY_COMMISSION] Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses komisi";
    return { success: false, error: message };
  }
}

// Function to pay specific commission (single item)
/**
 * Pay a specific single commission item.
 * Similar to payAllCommissions but targets a single fee ID.
 * 
 * @param {string} feeId - OrderFee ID to pay.
 * @param {'CASH' | 'TRANSFER'} paymentMethod - Payment method.
 * @param {string} note - Notes.
 * @returns {Object} Paid fee record.
 */
export async function payCommission(feeId: string, paymentMethod: "CASH" | "TRANSFER" = "CASH", note?: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can pay commissions." };
    }
    console.log(`[PAY_ONE_COMMISSION] Starting payment for fee ${feeId}`);

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get Fee
      const fee = await tx.orderItem.findUnique({
        where: { id: feeId },
        include: { 
          order: true,
          employee: true 
        }
      });

      if (!fee) {
        throw new Error("Komisi tidak ditemukan");
      }
      if (fee.isPaid) {
        throw new Error("Komisi sudah dibayar");
      }
      if (fee.order?.status !== 'COMPLETED' || fee.order?.paymentStatus !== 'PAID') {
        throw new Error("Komisi hanya dapat dibayar setelah order selesai dan lunas");
      }

      const amount = Number(fee.totalPrice);

      // 2. Mark Fee as Paid
      await tx.orderItem.update({
        where: { id: feeId },
        data: {
          isPaid: true
        }
      });

      // 3. Create Payment Record (consolidated — replaces Payroll + JournalEntry)
      const payment = await tx.payment.create({
        data: {
          type: 'PAYROLL',
          amount: amount,
          employeeId: fee.employeeId,
          paymentMethod: paymentMethod,
          note: note || `Pencairan Komisi Order #${fee.order?.vehicle || feeId}`,
        }
      });

      return { success: true, fee: serializeData(fee) };
    }, {
      maxWait: 5000,
      timeout: 15000,
    });

    revalidatePath('/admin/employees');
    revalidatePath('/admin/reports');
    
    return result;

  } catch (error: unknown) {
    console.error("[PAY_ONE_COMMISSION] Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses komisi";
    return { success: false, error: message };
  }
}

// ==================== Helper: Serialize Employee ====================
function serializeEmployee(employee: unknown): any {
  if (!employee) {
    return null;
  }
  return serializeData(employee);
}

// ==================== Get All Employees ====================
/**
 * Fetch all employees list.
 * Includes count of orders, unpaid commissions, etc.
 * 
 * @param {boolean} activeOnly - If true, only fetches active employees.
 * @returns {Object} List of employees.
 */
export async function getEmployees(activeOnly: boolean = false) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin have access.' };
    }
    const employees = await prisma.employee.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        salaryType: true,
        dailyRate: true,
        commissionRate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            orderItems: true
          },
        },
        orderItems: {
          where: { isPaid: false, itemType: 'FEE' },
          select: { totalPrice: true }
        }
      },
    });

    let monthlyRateByEmployee = new Map<string, number>();
    try {
      const monthlyRates = await prisma.employee.findMany({
        where: { id: { in: employees.map((employee) => employee.id) } },
        select: { id: true, monthlyRate: true },
      });
      monthlyRateByEmployee = new Map(
        monthlyRates.map((employee) => [employee.id, Number(employee.monthlyRate)])
      );
    } catch (error) {
      if (!isPendingPayrollMigration(error)) {
        throw error;
      }
    }

    const employeesWithUnpaid = employees.map((emp) => {
      const unpaidAmount = emp.orderItems.reduce((sum: number, fee) => sum + Number(fee.totalPrice), 0);
      const { orderItems, ...rest } = emp;
      return {
        ...rest,
        monthlyRate: monthlyRateByEmployee.get(emp.id) ??
          (emp.salaryType === "MONTHLY" ? Number(emp.dailyRate) : 0),
        unpaidAmount
      };
    });

    const employeesWithNumber = employeesWithUnpaid.map(serializeEmployee);

    return { success: true, employees: employeesWithNumber };
  } catch (error) {
    console.error('Get employees error:', error);
    return { success: false, error: 'Gagal load data karyawan' };
  }
}

// ==================== Get Mechanics Only ====================
/**
 * Fetch employees working specifically as Mechanics.
 * Used for mechanic selection dropdown in Order creation.
 * 
 * @returns {Object} List of mechanics.
 */
export async function getMechanics() {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin have access.' };
    }
    const mechanics = await prisma.employee.findMany({
      where: { 
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        commissionRate: true,
      },
      orderBy: { name: 'asc' },
    });

    const mechanicsWithNumber = mechanics.map((m) => serializeData(m));

    return { success: true, mechanics: mechanicsWithNumber };
  } catch (error) {
    console.error('Get mechanics error:', error);
    return { success: false, error: 'Gagal load data karyawan' };
  }
}

// ==================== Get Employee Dashboard Stats ====================
/**
 * Summary stats for Employee Dashboard.
 * Calculates total pending commissions, working vs standby mechanics.
 * 
 * @returns {Object} Employee statistics.
 */
export async function getEmployeeStats() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner has access.' };
    }
    const [fees, activeOrders, totalMechanics] = await Promise.all([
      prisma.orderItem.aggregate({
        where: { itemType: 'FEE', isPaid: false },
        _sum: { totalPrice: true },
        _count: { id: true }
      }),
      prisma.order.findMany({
        where: { status: 'IN_PROGRESS' },
        select: { mechanicId: true },
        distinct: ['mechanicId']
      }),
      prisma.employee.count({
        where: { 
          isActive: true,
          role: { in: ['Mekanik', 'MEKANIK', 'Mechanic', 'Karyawan'] }
        }
      })
    ]);

    const workingCount = activeOrders.filter((o) => o.mechanicId).length;
    const standbyCount = Math.max(0, totalMechanics - workingCount);
    
    return {
      success: true,
      stats: {
        totalUnpaid: fees._sum.totalPrice ? Number(fees._sum.totalPrice) : 0,
        unpaidCount: fees._count.id,
        workingMechanics: workingCount,
        standbyMechanics: standbyCount,
        totalMechanics
      }
    };
  } catch (error) {
    console.error('Get stats error:', error);
    return { success: false, error: 'Gagal load statistik' };
  }
}

export async function getEmployeeDetail(id: string) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Invalid session.' };
    }
    const hasAdminAccess = isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN']);
    const isSelf = session.user?.employeeId === id;
    if (!hasAdminAccess && !isSelf) {
      return { success: false, error: 'Access denied: You do not have authorization to view this employee data.' };
    }
    const [employee, stats, unpaidStats] = await Promise.all([
      prisma.employee.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          role: true,
          phone: true,
          salaryType: true,
          dailyRate: true,
          commissionRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          orderItems: {
            where: { itemType: 'FEE' },
            include: {
              order: {
                select: {
                  id: true,
                  custName: true,
                  vehicle: true,
                  plateNumber: true,
                  status: true,
                  createdAt: true,
                  items: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        },
      }),
      prisma.orderItem.aggregate({
        where: { employeeId: id, itemType: 'FEE' },
        _sum: { totalPrice: true },
        _count: { id: true }
      }),
      prisma.orderItem.aggregate({
        where: { employeeId: id, itemType: 'FEE', isPaid: false },
        _sum: { totalPrice: true },
        _count: { id: true }
      })
    ]);

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    const payrollData = await loadEmployeePayrolls(employee);

    const [activeOrder, queueOrders] = await Promise.all([
      prisma.order.findFirst({
        where: {
          OR: [
            { mechanicId: id },
            { orderItems: { some: { employeeId: id } } }
          ],
          status: { in: ['IN_PROGRESS', 'READY'] } 
        },
        select: {
          id: true,
          custName: true,
          vehicle: true,
          plateNumber: true,
          items: true,
          createdAt: true,
          status: true
        }
      }),
      prisma.order.findMany({
        where: {
          mechanicId: id,
          status: { in: ['PENDING', 'QUEUE', 'CONFIRMED', 'ESTIMATED'] } // Catch all pre-work statuses
        },
        orderBy: { createdAt: 'asc' }, // FIFO queue
        select: {
          id: true,
          custName: true,
          vehicle: true,
          plateNumber: true,
          items: true,
          createdAt: true,
          status: true
        }
      })
    ]);

    console.log(`[DEBUG] Employee ${id}: Found active=${activeOrder?.id} (${activeOrder?.status}), queue=${queueOrders.length}`);

    const totalEarned = stats._sum.totalPrice ? Number(stats._sum.totalPrice) : 0;
    const totalUnpaid = unpaidStats._sum.totalPrice ? Number(unpaidStats._sum.totalPrice) : 0;
    const totalPaid = totalEarned - totalUnpaid;

    const serializedEmployee = serializeData({
      ...employee,
      monthlyRate: payrollData.monthlyRate,
      payrolls: payrollData.payrolls,
    });
    const serialized = {
      ...serializedEmployee,
      // Keep the dashboard contract explicit instead of relying on a Prisma
      // relation name that differs from the UI terminology.
      orderFees: serializedEmployee.orderItems.map((fee) => ({
        ...fee,
        amount: fee.totalPrice,
      })),
      stats: {
        totalEarned,
        totalPaid,
        totalUnpaid,
        taskCount: stats._count.id
      },
      activeOrder: serializeData(activeOrder),
      queueOrders: serializeData(queueOrders),
    };

    return { success: true, employee: serialized };
  } catch (error) {
    console.error('Get employee detail error:', error);
    return { success: false, error: 'Gagal load detail karyawan' };
  }
}

// ==================== Create Employee ====================
/**
 * Create a new employee record.
 * 
 * @param {CreateEmployeeInput} data - New employee data.
 * @returns {Object} Created employee record.
 */
export async function createEmployee(data: CreateEmployeeInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can add employees.' };
    }
    const validationError = validateSalaryRates(data);
    if (validationError) {
      return { success: false, error: validationError };
    }
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        role: data.role,
        phone: data.phone,
        salaryType: data.salaryType,
        dailyRate: data.dailyRate || 0,
        monthlyRate: data.monthlyRate || 0,
        commissionRate: data.commissionRate || 0,
        isActive: true,
      },
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "CREATE_EMPLOYEE",
        title: "Employee Added",
        details: `Employee ${data.name} (${data.role}) added to system`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Create employee error:', error);
    return { success: false, error: 'Gagal tambah karyawan' };
  }
}

// ==================== Update Employee ====================
/**
 * Update employee record details.
 * 
 * @param {UpdateEmployeeInput} data - Update data payload.
 * @returns {Object} Updated employee record.
 */
export async function updateEmployee(data: UpdateEmployeeInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can update employee data.' };
    }
    const validationError = validateSalaryRates(data);
    if (validationError) {
      return { success: false, error: validationError };
    }
    const { id, salaryType, dailyRate, monthlyRate, commissionRate, ...rest } = data;
    
    const updateData: Record<string, unknown> = { ...rest };
    if (salaryType) {
      updateData.salaryType = salaryType;
    }
    if (dailyRate !== undefined) {
      updateData.dailyRate = dailyRate;
    }
    if (monthlyRate !== undefined) {
      updateData.monthlyRate = monthlyRate;
    }
    if (commissionRate !== undefined) {
      updateData.commissionRate = commissionRate;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "UPDATE_EMPLOYEE",
        title: "Employee Updated",
        details: `Employee details updated for ${employee.name}`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Update employee error:', error);
    return { success: false, error: 'Gagal update karyawan' };
  }
}

// ==================== Delete/Deactivate Employee ====================
/**
 * Deactivate an employee (Soft Delete).
 * Employee will not appear in selection dropdowns, but history is retained.
 * 
 * @param {string} id - Employee ID.
 * @returns {Object} Success response.
 */
export async function deactivateEmployee(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can deactivate employees.' };
    }
    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "DEACTIVATE_EMPLOYEE",
        title: "Employee Deactivated",
        details: `Employee ${employee.name} deactivated`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Deactivate employee error:', error);
    return { success: false, error: 'Gagal nonaktifkan karyawan' };
  }
}

// ==================== Reactivate Employee ====================
/**
 * Reactivate a deactivated employee.
 * 
 * @param {string} id - Employee ID.
 * @returns {Object} Success response.
 */
export async function reactivateEmployee(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can reactivate employees.' };
    }
    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "REACTIVATE_EMPLOYEE",
        title: "Employee Reactivated",
        details: `Employee ${employee.name} reactivated`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Reactivate employee error:', error);
    return { success: false, error: 'Gagal aktifkan karyawan' };
  }
}
