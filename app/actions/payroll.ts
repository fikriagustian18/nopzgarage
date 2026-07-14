// app/actions/payroll.ts
'use server';

import { prisma } from '@/lib/prisma';
import { SalaryType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ==================== Types ====================
export type GeneratePayrollInput = {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  bonusAmount?: number;
  bonusNote?: string;
};

export type PayrollDetail = {
  workDays?: number;
  motorCount?: number;
  bonusNote?: string;
};

// ==================== Helper: Serialize Decimal ====================
function toNumber(val: any) {
  if (typeof val === 'number') return val;
  if (val && typeof val.toNumber === 'function') return val.toNumber();
  return 0;
}

function serializeJournalItem(item: any) {
  if (!item) return null;
  return {
    ...item,
    debit: toNumber(item.debit),
    credit: toNumber(item.credit),
  };
}

function serializeJournalEntry(entry: any) {
  if (!entry) return null;
  return {
    ...entry,
    items: entry.items?.map(serializeJournalItem) ?? [],
  };
}

function serializePayment(payment:any) {
  if (!payment) return null;
  const p = {
    ...payment,
    amount: toNumber(payment.amount),
    date: payment.date instanceof Date ? payment.date.toISOString() : payment.date,
    createdAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
  };
  if (p.journal) {
    p.journal = serializeJournalEntry(p.journal);
  }
  return p;
}

function serializeEmployee(emp: any) {
  if (!emp) return null;
  const e = {
    ...emp,
    dailyRate: toNumber(emp.dailyRate),
    commissionRate: toNumber(emp.commissionRate),
    createdAt: emp.createdAt instanceof Date ? emp.createdAt.toISOString() : emp.createdAt,
    updatedAt: emp.updatedAt instanceof Date ? emp.updatedAt.toISOString() : emp.updatedAt,
  };
  
  if (e.orders) {
    e.orders = e.orders.map((o: any) => ({
      ...o,
      totalPrice: toNumber(o.totalPrice),
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
    }));
  }
  return e;
}

function serializePayroll(payroll: any) {
  if (!payroll) return null;
  const p = {
    ...payroll,
    baseSalary: toNumber(payroll.baseSalary),
    bonus: toNumber(payroll.bonus),
    totalEarned: toNumber(payroll.totalEarned),
    totalPaid: toNumber(payroll.totalPaid),
    startDate: payroll.startDate instanceof Date ? payroll.startDate.toISOString() : payroll.startDate,
    endDate: payroll.endDate instanceof Date ? payroll.endDate.toISOString() : payroll.endDate,
    createdAt: payroll.createdAt instanceof Date ? payroll.createdAt.toISOString() : payroll.createdAt,
    updatedAt: payroll.updatedAt instanceof Date ? payroll.updatedAt.toISOString() : payroll.updatedAt,
  };

  if (p.employee) {
    p.employee = serializeEmployee(p.employee);
  }

  if (p.payments) {
    p.payments = p.payments.map(serializePayment);
  }

  return p;
}

// ==================== Generate Payroll (Slip Gaji) ====================
/**
 * Membuat Slip Gaji (Payroll) untuk satu periode.
 * 
 * Mendukung dua tipe gaji:
 * 1. DAILY (Harian): Gaji = Hari Kerja x Rate Harian.
 * 2. COMMISSION (Komisi/Borongan): Gaji = Jumlah Motor Selesai x Rate Komisi.
 * 
 * Fitur:
 * - Menambahkan bonus manual.
 * - Mencegah duplikasi payroll di periode yang sama.
 * 
 * @param {GeneratePayrollInput} data - Data input payroll.
 * @returns {Object} Data payroll yang dibuat.
 */
export async function generatePayroll(data: GeneratePayrollInput) {
  try {
    // 1. Ambil data employee
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      return { success: false, error: 'Karyawan tidak ditemukan' };
    }

    // 2. Hitung gaji berdasarkan skema
    let baseSalary = 0;
    let details: PayrollDetail = {};

    if (employee.salaryType === 'DAILY') {
      // Hitung hari kerja dalam periode
      const workDays = calculateWorkDays(data.startDate, data.endDate);
      baseSalary = workDays * Number(employee.dailyRate);
      details.workDays = workDays;
    } else if (employee.salaryType === 'COMMISSION') {
      // Hitung jumlah motor yang dikerjakan
      const motorCount = await prisma.order.count({
        where: {
          mechanicId: employee.id,
          status: 'COMPLETED',
          updatedAt: {
            gte: data.startDate,
            lte: data.endDate,
          },
        },
      });
      baseSalary = motorCount * Number(employee.commissionRate);
      details.motorCount = motorCount;
    }

    // 3. Tambahkan bonus jika ada
    const bonusAmount = data.bonusAmount || 0;
    if (bonusAmount > 0 && data.bonusNote) {
      details.bonusNote = data.bonusNote;
    }

    const totalEarned = baseSalary + bonusAmount;

    // 4. Cek duplikasi payroll untuk periode yang sama
    const existing = await prisma.payroll.findFirst({
      where: {
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    if (existing) {
      return { 
        success: false, 
        error: 'Payroll untuk periode ini sudah ada' 
      };
    }

    // 5. Buat payroll record
    const payroll = await prisma.payroll.create({
      data: {
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
        baseSalary,
        bonus: bonusAmount,
        totalEarned,
        details: JSON.stringify(details),
        status: 'UNPAID',
        totalPaid: 0,
      },
      include: {
        employee: true,
      },
    });

    revalidatePath('/admin/payroll');
    
    return { success: true, payroll: serializePayroll(payroll) };
  } catch (error) {
    console.error('Generate payroll error:', error);
    return { success: false, error: 'Gagal generate payroll' };
  }
}

// ==================== Helper: Calculate Work Days ====================
function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Skip Minggu (0)
    if (current.getDay() !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// ==================== Get All Payrolls ====================
/**
 * Mengambil daftar payroll dengan filter.
 * 
 * @param {Object} filters - Filter pencarian (employeeId, status, tanggal).
 * @returns {Object} Daftar payroll.
 */
export async function getPayrolls(filters?: {
  employeeId?: string;
  status?: 'UNPAID' | 'PARTIAL' | 'PAID';
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const payrolls = await prisma.payroll.findMany({
      where: {
        ...(filters?.employeeId && { employeeId: filters.employeeId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.dateFrom && {
          startDate: { gte: filters.dateFrom },
        }),
        ...(filters?.dateTo && {
          endDate: { lte: filters.dateTo },
        }),
      },
      include: {
        employee: true,
        payments: {
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse details JSON
    const parsedPayrolls = payrolls.map((p) => ({
      ...p,
      detailsParsed: p.details ? JSON.parse(p.details) : null,
    }));

    return { success: true, payrolls: parsedPayrolls.map(serializePayroll) };
  } catch (error) {
    console.error('Get payrolls error:', error);
    return { success: false, error: 'Gagal load payroll' };
  }
}

// ==================== Get Payroll Detail ====================
// ==================== Get Payroll Detail ====================
/**
 * Mengambil detail satu payroll beserta riwayat pembayarannya.
 * 
 * @param {string} payrollId - ID Payroll.
 * @returns {Object} Detail payroll.
 */
export async function getPayrollDetail(payrollId: string) {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        employee: true,
        payments: {
          orderBy: {
            date: 'desc',
          },
          include: {
            journal: {
              include: {
                items: {
                  include: {
                    account: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payroll) {
      return { success: false, error: 'Payroll tidak ditemukan' };
    }

    // Parse details
    const detailsParsed = payroll.details 
      ? JSON.parse(payroll.details) 
      : null;

    return { 
      success: true, 
      payroll: serializePayroll({
        ...payroll,
        detailsParsed,
      }),
    };
  } catch (error) {
    console.error('Get payroll detail error:', error);
    return { success: false, error: 'Gagal load detail payroll' };
  }
}

// ==================== Update Payroll (Edit Bonus, dll) ====================
/**
 * Mengupdate data payroll (biasanya untuk koreksi bonus atau catatan).
 * Akan menghitung ulang Total Earned.
 * 
 * @param {string} payrollId - ID Payroll.
 * @param {Object} updates - Data yang diupdate.
 * @returns {Object} Payroll updated.
 */
export async function updatePayroll(
  payrollId: string,
  updates: {
    bonusAmount?: number;
    bonusNote?: string;
  }
) {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      return { success: false, error: 'Payroll tidak ditemukan' };
    }

    // Parse existing details
    const details: PayrollDetail = payroll.details 
      ? JSON.parse(payroll.details) 
      : {};

    // Update bonus
    const newBonus = updates.bonusAmount ?? Number(payroll.bonus);
    if (updates.bonusNote) {
      details.bonusNote = updates.bonusNote;
    }

    // Recalculate total
    const newTotal = Number(payroll.baseSalary) + newBonus;

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        bonus: newBonus,
        totalEarned: newTotal,
        details: JSON.stringify(details),
      },
      include: {
        employee: true,
      },
    });

    revalidatePath('/admin/payroll');
    
    return { success: true, payroll: serializePayroll(updated) };
  } catch (error) {
    console.error('Update payroll error:', error);
    return { success: false, error: 'Gagal update payroll' };
  }
}

// ==================== Delete Payroll ====================
// ==================== Delete Payroll ====================
/**
 * Menghapus payroll yang belum ada pembayarannya.
 * Jika sudah ada pembayaran, tidak bisa dihapus demi integritas data.
 * 
 * @param {string} payrollId - ID Payroll.
 * @returns {Object} Status sukses.
 */
export async function deletePayroll(payrollId: string) {
  try {
    // Cek apakah sudah ada pembayaran
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        payments: true,
      },
    });

    if (!payroll) {
      return { success: false, error: 'Payroll tidak ditemukan' };
    }

    if (payroll.payments.length > 0) {
      return { 
        success: false, 
        error: 'Tidak bisa hapus payroll yang sudah ada pembayaran' 
      };
    }

    await prisma.payroll.delete({
      where: { id: payrollId },
    });

    revalidatePath('/admin/payroll');
    
    return { success: true };
  } catch (error) {
    console.error('Delete payroll error:', error);
    return { success: false, error: 'Gagal hapus payroll' };
  }
}

// ==================== Get Employee Summary ====================
// ==================== Get Employee Summary ====================
/**
 * Mengambil ringkasan kinerja karyawan.
 * Termasuk jumlah order yang diselesaikan dan total gaji yang sudah diterima.
 * 
 * @param {string} employeeId - ID Karyawan.
 * @returns {Object} Statistik karyawan.
 */
export async function getEmployeeSummary(employeeId: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        orders: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            id: true,
            vehicle: true,
            totalPrice: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        },
        payrolls: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!employee) {
      return { success: false, error: 'Karyawan tidak ditemukan' };
    }

    // Hitung statistik
    const totalCompleted = await prisma.order.count({
      where: {
        mechanicId: employeeId,
        status: 'COMPLETED',
      },
    });

    const totalPaidPayrolls = await prisma.payroll.aggregate({
      where: {
        employeeId,
        status: 'PAID',
      },
      _sum: {
        totalEarned: true,
      },
    });

    return { 
      success: true, 
      employee: serializeEmployee(employee),
      stats: {
        totalCompleted,
        totalEarned: totalPaidPayrolls._sum.totalEarned?.toNumber ? totalPaidPayrolls._sum.totalEarned.toNumber() : 0,
      },
    };
  } catch (error) {
    console.error('Get employee summary error:', error);
    return { success: false, error: 'Gagal load summary karyawan' };
  }
}

// ==================== Bulk Generate Payroll (All Employees) ====================
// ==================== Bulk Generate Payroll (All Employees) ====================
/**
 * Membuat payroll masal untuk SEMUA karyawan aktif (kecuali Owner).
 * Berguna saat tutup buku akhir bulan untuk membuatkan slip gaji semua staff sekaligus.
 * 
 * @param {Date} startDate - Tanggal mulai periode.
 * @param {Date} endDate - Tanggal akhir periode.
 * @returns {Object} Hasil generate per karyawan.
 */
export async function bulkGeneratePayroll(
  startDate: Date,
  endDate: Date
) {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        role: {
          not: 'Owner',
        },
      },
    });

    const results = [];
    
    for (const employee of employees) {
      const result = await generatePayroll({
        employeeId: employee.id,
        startDate,
        endDate,
      });
      
      results.push({
        employeeName: employee.name,
        ...serializePayroll(result.payroll),
      });
    }

    revalidatePath('/admin/payroll');
    
    return { success: true, results };
  } catch (error) {
    console.error('Bulk generate payroll error:', error);
    return { success: false, error: 'Gagal generate bulk payroll' };
  }
}