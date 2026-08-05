// lib/actions/employees.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';
import { serializeData } from '@/lib/utils';

import type { SalaryType } from '@prisma/client';

// ==================== Types ====================
export interface CreateEmployeeInput {
  name: string;
  role: string;
  phone?: string;
  salaryType: SalaryType;
  dailyRate?: number;
  commissionRate?: number;
}

export interface UpdateEmployeeInput {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  salaryType?: SalaryType;
  dailyRate?: number;
  commissionRate?: number;
  isActive?: boolean;
}

// Infer TransactionClient strictly
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Helper to ensure accounts exist (same as in payments.ts)
async function ensureAccount(tx: TransactionClient, code: string, name: string, type: string, category: string) {
  const existing = await tx.account.findUnique({ where: { code } });
  if (!existing) {
    console.log(`Auto-creating account ${code} - ${name}`);
    await tx.account.create({
      data: { code, name, type, category }
    });
  }
}

// Function to pay all pending commissions for an employee
/**
 * Pay ALL pending commissions for a single employee.
 * 
 * Process:
 * 1. Calculate total unpaid commissions.
 * 2. Mark all related fees as 'PAID'.
 * 3. Create Payment record (Money Out).
 * 4. Create Payroll summary record.
 * 5. Create Accounting Journal entry (Debit Salary Payable, Credit Cash/Bank).
 * 
 * @param {string} employeeId - Employee ID.
 * @param {'CASH' | 'TRANSFER'} paymentMethod - Payment method.
 * @param {string} note - Additional notes.
 * @returns {Object} Payment result (count, total amount).
 */
export async function payAllCommissions(employeeId: string, paymentMethod: "CASH" | "TRANSFER" = "CASH", note?: string) {
  try {
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
      const unpaidFees = await tx.orderFee.findMany({
        where: { 
          employeeId: employeeId,
          isPaid: false 
        },
        include: { order: true }
      });

      if (unpaidFees.length === 0) {
        return { success: false, error: "Tidak ada komisi yang perlu dibayar." };
      }

      const totalAmount = unpaidFees.reduce((sum: number, fee: any) => sum + Number(fee.amount), 0);

      console.log(`[PAY_COMMISSION] Total commission to pay: ${totalAmount}`);

      // 3. Mark Fees as Paid
      await tx.orderFee.updateMany({
        where: { 
          id: { in: unpaidFees.map((f: any) => f.id) }
        },
        data: {
          isPaid: true,
          paidAt: new Date()
        }
      });

      // 4. Create Payment Record (Money Out)
      const payment = await tx.payment.create({
        data: {
          amount: totalAmount,
          paymentMethod: paymentMethod,
          note: note || `Pencairan Komisi ${employee.name} (${unpaidFees.length} order)`,
          payrollId: undefined, 
        }
      });

      // 4b. Create Payroll Wrapper 
      const payroll = await tx.payroll.create({
        data: {
          startDate: new Date(), 
          endDate: new Date(),
          employeeId: employeeId,
          baseSalary: 0,
          bonus: 0,
          totalEarned: totalAmount,
          totalPaid: totalAmount,
          status: 'PAID',
          details: `Pencairan Komisi Manual via Admin Panel (${unpaidFees.length} tasks)`,
        }
      });

      // Link payment to payroll
      await tx.payment.update({
        where: { id: payment.id },
        data: { payrollId: payroll.id }
      });

      // 5. Journaling
      await ensureAccount(tx, "101", "Kas Tunai", "ASSET", "CURRENT_ASSET");
      await ensureAccount(tx, "102", "Bank", "ASSET", "CURRENT_ASSET");
      await ensureAccount(tx, "202", "Utang Gaji & Komisi", "LIABILITY", "CURRENT_LIABILITY");

      const cashAccount = paymentMethod === "TRANSFER" ? "102" : "101";

      await tx.journalEntry.create({
        data: {
          description: `Pembayaran Komisi ${employee.name}`,
          reference: payroll.id,
          items: {
            create: [
              {
                account: { connect: { code: "202" } }, 
                debit: totalAmount
              },
              {
                account: { connect: { code: cashAccount } }, 
                credit: totalAmount
              }
            ]
          }
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

  } catch (error: any) {
    console.error("[PAY_COMMISSION] Error:", error);
    return { success: false, error: error.message };
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
    console.log(`[PAY_ONE_COMMISSION] Starting payment for fee ${feeId}`);

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get Fee
      const fee = await tx.orderFee.findUnique({
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

      const amount = Number(fee.amount);

      // 2. Mark Fee as Paid
      await tx.orderFee.update({
        where: { id: feeId },
        data: {
          isPaid: true,
          paidAt: new Date()
        }
      });

      // 3. Create Payment Record (Money Out)
      const payment = await tx.payment.create({
        data: {
          amount: amount,
          paymentMethod: paymentMethod,
          note: note || `Pencairan Komisi Order #${fee.order?.vehicle || feeId}`,
          payrollId: undefined, 
        }
      });

      // 3b. Create Single Payroll Record
      const payroll = await tx.payroll.create({
        data: {
          startDate: new Date(), 
          endDate: new Date(),
          employeeId: fee.employeeId,
          baseSalary: 0,
          bonus: 0,
          totalEarned: amount,
          totalPaid: amount,
          status: 'PAID',
          details: `Pencairan Komisi ${fee.order?.vehicle || ''} (${fee.order?.plateNumber || ''})`,
        }
      });

      // Link payment to payroll
      await tx.payment.update({
        where: { id: payment.id },
        data: { payrollId: payroll.id }
      });

      // 4. Journaling
      await ensureAccount(tx, "101", "Kas Tunai", "ASSET", "CURRENT_ASSET");
      await ensureAccount(tx, "102", "Bank", "ASSET", "CURRENT_ASSET");
      await ensureAccount(tx, "202", "Utang Gaji & Komisi", "LIABILITY", "CURRENT_LIABILITY");

      const cashAccount = paymentMethod === "TRANSFER" ? "102" : "101";

      await tx.journalEntry.create({
        data: {
          description: `Pembayaran Komisi ${fee.employee.name} - Order #${fee.order?.vehicle}`,
          reference: payroll.id,
          items: {
            create: [
              {
                account: { connect: { code: "202" } }, 
                debit: amount
              },
              {
                account: { connect: { code: cashAccount } }, 
                credit: amount
              }
            ]
          }
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

  } catch (error: any) {
    console.error("[PAY_ONE_COMMISSION] Error:", error);
    return { success: false, error: error.message };
  }
}

// ==================== Helper: Serialize Employee ====================
function serializeEmployee(employee: any) {
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
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Access denied: Only Owner and Admin have access.' };
    }
    const employees = await prisma.employee.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
            payrolls: true,
            orderFees: true // Include count of fees/tasks
          },
        },
        orderFees: {
            where: { isPaid: false },
            select: { amount: true }
        }
      },
    });

    const employeesWithUnpaid = employees.map((emp: any) => {
        const unpaidAmount = emp.orderFees.reduce((sum: number, fee: any) => sum + Number(fee.amount), 0);
        // Remove orderFees from object to prevent Decimal error,
        // as we only needed it for calculation
        const { orderFees, ...rest } = emp;
        return {
            ...rest,
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
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
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

    const mechanicsWithNumber = mechanics.map((m: any) => serializeData(m));

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
      prisma.orderFee.aggregate({
        where: { isPaid: false },
        _sum: { amount: true },
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
          role: { contains: 'Mekanik', mode: 'insensitive' }
        }
      })
    ]);

    const workingCount = activeOrders.filter((o: any) => o.mechanicId).length;
    const standbyCount = Math.max(0, totalMechanics - workingCount);
    
    return {
      success: true,
      stats: {
        totalUnpaid: fees._sum.amount ? Number(fees._sum.amount) : 0,
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

// ==================== Get Single Employee with Wage History ====================
// ==================== Get Single Employee with Wage History ====================
/**
 * Fetch detailed information for a single employee.
 * Includes commission history, earnings stats, active order, and queue.
 * 
 * @param {string} id - Employee ID.
 * @returns {Object} Complete employee details.
 */
export async function getEmployeeDetail(id: string) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Invalid session.' };
    }
    const isOwner = session.user?.role === 'OWNER';
    const isAdmin = session.user?.role === 'ADMIN';
    const isSelf = session.user?.employeeId === id;
    if (!isOwner && !isAdmin && !isSelf) {
      return { success: false, error: 'Access denied: You do not have authorization to view this employee data.' };
    }
    // 1. Fetch Basic Info & History in parallel with Stats
    const [employee, stats, unpaidStats] = await Promise.all([
        prisma.employee.findUnique({
            where: { id },
            include: {
                orderFees: {
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
                },
                payrolls: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            },
        }),
        prisma.orderFee.aggregate({
            where: { employeeId: id },
            _sum: { amount: true },
            _count: { id: true }
        }),
        prisma.orderFee.aggregate({
            where: { employeeId: id, isPaid: false },
            _sum: { amount: true },
            _count: { id: true }
        })
    ]);

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    // 2. Fetch Active Order & Queue
    // Modified: Widen the search to ensure nothing is hidden
    const [activeOrder, queueOrders] = await Promise.all([
        prisma.order.findFirst({
            where: {
                // Check if user is Lead Mechanic OR has a Fee/Commission
                // entry in this order (Helper)
                OR: [
                    { mechanicId: id },
                    { orderFees: { some: { employeeId: id } } }
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

    const totalEarned = stats._sum.amount ? Number(stats._sum.amount) : 0;
    const totalUnpaid = unpaidStats._sum.amount ? Number(unpaidStats._sum.amount) : 0;
    const totalPaid = totalEarned - totalUnpaid;

    const serialized = {
      ...serializeData(employee),
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
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        role: data.role,
        phone: data.phone,
        salaryType: data.salaryType,
        dailyRate: data.dailyRate || 0,
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
    const { id, salaryType, dailyRate, commissionRate, ...rest } = data;
    
    const updateData: Record<string, unknown> = { ...rest };
    if (salaryType) {
      updateData.salaryType = salaryType;
    }
    if (dailyRate !== undefined) {
      updateData.dailyRate = dailyRate;
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
