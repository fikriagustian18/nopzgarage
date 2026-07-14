// app/actions/employees.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';

export type SalaryType = "DAILY" | "COMMISSION";

// ==================== Types ====================
export type CreateEmployeeInput = {
  name: string;
  role: string;
  phone?: string;
  salaryType: SalaryType;
  dailyRate?: number;
  commissionRate?: number;
};

export type UpdateEmployeeInput = {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  salaryType?: SalaryType;
  dailyRate?: number;
  commissionRate?: number;
  isActive?: boolean;
};

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
 * Membayar SEMUA komisi yang belum dibayar untuk satu karyawan.
 * 
 * Proses:
 * 1. Menghitung total komisi yang belum dibayar.
 * 2. Menandai semua fee terkait sebagai 'PAID'.
 * 3. Membuat record Payment (Pengeluaran Uang).
 * 4. Membuat record Payroll (Rekap Gaji).
 * 5. Membuat Jurnal Akuntansi (Debit Utang Gaji, Kredit Kas/Bank).
 * 
 * @param {string} employeeId - ID karyawan.
 * @param {'CASH' | 'TRANSFER'} paymentMethod - Metode pembayaran.
 * @param {string} note - Catatan tambahan.
 * @returns {Object} Hasil pembayaran (jumlah, total).
 */
export async function payAllCommissions(employeeId: string, paymentMethod: "CASH" | "TRANSFER" = "CASH", note?: string) {
    try {
        console.log(`[PAY_COMMISSION] Starting payment for employee ${employeeId}`);

        const result = await prisma.$transaction(async (tx: TransactionClient) => {
            // 1. Get Employee
            const employee = await tx.employee.findUnique({
                where: { id: employeeId }
            });
            if (!employee) throw new Error("Employee not found");

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
        revalidatePath('/admin/finance');
        
        return result;

    } catch (error: any) {
        console.error("[PAY_COMMISSION] Error:", error);
        return { success: false, error: error.message };
    }
}

// Function to pay specific commission (single item)
/**
 * Membayar SATU item komisi spesifik.
 * Mirip dengan payAllCommissions tapi hanya untuk satu ID fee.
 * 
 * @param {string} feeId - ID OrderFee yang akan dibayar.
 * @param {'CASH' | 'TRANSFER'} paymentMethod - Metode pembayaran.
 * @param {string} note - Catatan.
 * @returns {Object} Data fee yang sudah dibayar.
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

            if (!fee) throw new Error("Komisi tidak ditemukan");
            if (fee.isPaid) throw new Error("Komisi sudah dibayar");

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

            const serializedFee = {
                ...fee,
                amount: Number(fee.amount),
                order: fee.order ? {
                    ...fee.order,
                    totalPrice: fee.order.totalPrice?.toNumber ? fee.order.totalPrice.toNumber() : 0,
                    totalPaid: fee.order.totalPaid?.toNumber ? fee.order.totalPaid.toNumber() : 0,
                } : null,
                employee: serializeEmployee(fee.employee)
            };

            const serializedFeeWithDates = {
                ...serializedFee,
                createdAt: fee.createdAt instanceof Date ? fee.createdAt.toISOString() : fee.createdAt,
                paidAt: fee.paidAt instanceof Date ? fee.paidAt.toISOString() : fee.paidAt,
            };

            return { success: true, fee: serializedFeeWithDates };
        }, {
            maxWait: 5000,
            timeout: 15000,
        });

        revalidatePath('/admin/employees');
        revalidatePath('/admin/finance');
        
        return result;

    } catch (error: any) {
        console.error("[PAY_ONE_COMMISSION] Error:", error);
        return { success: false, error: error.message };
    }
}

// ==================== Helper: Serialize Employee ====================
function serializeEmployee(employee: any) {
  return {
    ...employee,
    dailyRate: employee.dailyRate?.toNumber ? employee.dailyRate.toNumber() : 0,
    commissionRate: employee.commissionRate?.toNumber ? employee.commissionRate.toNumber() : 0,
    unpaidAmount: employee.unpaidAmount || 0,
    createdAt: employee.createdAt instanceof Date ? employee.createdAt.toISOString() : employee.createdAt,
    updatedAt: employee.updatedAt instanceof Date ? employee.updatedAt.toISOString() : employee.updatedAt,
  };
}

// ==================== Get All Employees ====================
/**
 * Mengambil daftar semua karyawan.
 * Termasuk perhitungan jumlah order, komisi yang belum dibayar, dll.
 * 
 * @param {boolean} activeOnly - Jika true, hanya ambil karyawan aktif (default false).
 * @returns {Object} List karyawan.
 */
export async function getEmployees(activeOnly: boolean = false) {
  try {
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
        // Remove orderFees from the object to prevent Decimal error, as we only needed it for calculation
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
 * Mengambil daftar karyawan yang khusus bekerja sebagai Mekanik.
 * Digunakan untuk dropdown pemilihan mekanik saat Order.
 * 
 * @returns {Object} List mekanik (id, nama, role, rate).
 */
export async function getMechanics() {
  try {
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

    const mechanicsWithNumber = mechanics.map((m: any) => ({
      ...m,
      commissionRate: m.commissionRate?.toNumber ? m.commissionRate.toNumber() : 0,
    }));

    return { success: true, mechanics: mechanicsWithNumber };
  } catch (error) {
    console.error('Get mechanics error:', error);
    return { success: false, error: 'Gagal load data karyawan' };
  }
}

// ==================== Get Employee Dashboard Stats ====================
/**
 * Statistik ringkas untuk Dashboard Karyawan (jika ada dashboard khusus).
 * Menghitung total komisi tertunggak, mekanik yang sedang bekerja vs standby.
 * 
 * @returns {Object} Statistik karyawan.
 */
export async function getEmployeeStats() {
    try {
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
                totalUnpaid: fees._sum.amount?.toNumber() || 0,
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
 * Mengambil detail lengkap satu karyawan.
 * Termasuk riwayat komisi, statistik pendapatan, order aktif yang sedang dikerjakan,
 * dan antrian order yang ditugaskan ke dia.
 * 
 * @param {string} id - ID Karyawan.
 * @returns {Object} Detail lengkap karyawan.
 */
export async function getEmployeeDetail(id: string) {
  try {
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
      return { success: false, error: 'Karyawan tidak ditemukan' };
    }

    // 2. Fetch Active Order & Queue
    // Modified: Widen the search to ensure nothing is hidden
    const [activeOrder, queueOrders] = await Promise.all([
        prisma.order.findFirst({
            where: {
                // Check if user is Lead Mechanic OR has a Fee/Commission entry in this order (Helper)
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

    const totalEarned = stats._sum.amount?.toNumber() || 0;
    const totalUnpaid = unpaidStats._sum.amount?.toNumber() || 0;
    const totalPaid = totalEarned - totalUnpaid;

    const serialized = {
      ...serializeEmployee(employee),
      orderFees: employee.orderFees.map((f: any) => ({
        ...f,
        amount: f.amount.toNumber(),
        createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
        paidAt: f.paidAt instanceof Date ? f.paidAt.toISOString() : f.paidAt,
      })),
      payrolls: employee.payrolls ? employee.payrolls.map((p: any) => ({
        ...p,
        baseSalary: p.baseSalary.toNumber ? p.baseSalary.toNumber() : Number(p.baseSalary),
        bonus: p.bonus.toNumber ? p.bonus.toNumber() : Number(p.bonus),
        totalEarned: p.totalEarned.toNumber ? p.totalEarned.toNumber() : Number(p.totalEarned),
        totalPaid: p.totalPaid.toNumber ? p.totalPaid.toNumber() : Number(p.totalPaid),
        startDate: p.startDate instanceof Date ? p.startDate.toISOString() : p.startDate,
        endDate: p.endDate instanceof Date ? p.endDate.toISOString() : p.endDate,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
      })) : [],
      stats: {
        totalEarned,
        totalPaid,
        totalUnpaid,
        taskCount: stats._count.id
      },
      activeOrder: activeOrder ? {
        ...activeOrder,
        createdAt: activeOrder.createdAt.toISOString()
      } : null,
      queueOrders: queueOrders ? queueOrders.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString()
      })) : []
    };

    return { success: true, employee: serialized };
  } catch (error) {
    console.error('Get employee detail error:', error);
    return { success: false, error: 'Gagal load detail karyawan' };
  }
}

// ==================== Create Employee ====================
/**
 * Menambahkan karyawan baru.
 * 
 * @param {CreateEmployeeInput} data - Data karyawan baru.
 * @returns {Object} Karyawan yang dibuat.
 */
export async function createEmployee(data: CreateEmployeeInput) {
  try {
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
 * Update data karyawan.
 * 
 * @param {UpdateEmployeeInput} data - Data update.
 * @returns {Object} Karyawan setelah update.
 */
export async function updateEmployee(data: UpdateEmployeeInput) {
  try {
    const { id, ...updateData } = data;
    
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
 * Nonaktifkan karyawan (Soft Delete).
 * Karyawan tidak akan muncul di opsi pilih mekanik, tapi data history tetap ada.
 * 
 * @param {string} id - ID Karyawan.
 * @returns {Object} Pesan sukses.
 */
export async function deactivateEmployee(id: string) {
  try {
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
 * Mengaktifkan kembali karyawan yang sudah dinonaktifkan.
 * 
 * @param {string} id - ID Karyawan.
 * @returns {Object} Pesan sukses.
 */
export async function reactivateEmployee(id: string) {
  try {
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
