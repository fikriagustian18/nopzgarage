// lib/actions/payroll.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PaymentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { serializeData } from '@/lib/utils';

// ==================== Interfaces ====================
export interface GeneratePayrollInput {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  bonusAmount?: number;
  bonusNote?: string;
}

export interface PayrollDetail {
  workDays?: number;
  motorCount?: number;
  bonusNote?: string;
}

// ==================== Helper: Serialize Decimal ====================
function serializeEmployee(emp: any) {
  if (!emp) {
    return null;
  }
  return serializeData(emp);
}

function serializePayroll(payroll: any) {
  if (!payroll) {
    return null;
  }
  return serializeData(payroll);
}

// ==================== Generate Payroll (Pay Slip) ====================
/**
 * Generates a Payroll (Pay Slip) for a period.
 * 
 * Supports two salary schemes:
 * 1. DAILY: Salary = Work Days x Daily Rate.
 * 2. COMMISSION: Salary = Completed Vehicles x Commission Rate.
 * 
 * Features:
 * - Adds manual bonus.
 * - Prevents duplicate payroll generation for the same period.
 * 
 * @param {GeneratePayrollInput} data - Input payroll data.
 * @returns {Object} Generated payroll result.
 */
export async function generatePayroll(data: GeneratePayrollInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can generate payroll.' };
    }
    // 1. Fetch employee data
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    // 2. Calculate salary based on scheme
    let baseSalary = 0;
    let details: PayrollDetail = {};

    if (employee.salaryType === 'DAILY') {
      // Calculate work days in the period
      const workDays = calculateWorkDays(data.startDate, data.endDate);
      baseSalary = workDays * Number(employee.dailyRate);
      details.workDays = workDays;
    } else if (employee.salaryType === 'COMMISSION') {
      // Count completed vehicles
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

    // 3. Add bonus if provided
    const bonusAmount = data.bonusAmount || 0;
    if (bonusAmount > 0 && data.bonusNote) {
      details.bonusNote = data.bonusNote;
    }

    const totalEarned = baseSalary + bonusAmount;

    // 4. Check duplicate payroll for the same period
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
        error: 'Payroll for this period already exists' 
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
    // Skip Sunday (0)
    if (current.getDay() !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// ==================== Get All Payrolls ====================
/**
 * Fetch all payroll records with optional filters.
 * 
 * @param {Object} filters - Search filters (employeeId, status, date bounds).
 * @returns {Object} List of payroll records.
 */
export async function getPayrolls(filters?: {
  employeeId?: string;
  status?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Access denied: Only Owner and Admin can access payroll list.' };
    }
    const isOwner = session.user?.role === 'OWNER';
    const finalEmployeeId = isOwner ? filters?.employeeId : session.user?.employeeId;
    if (!isOwner && !finalEmployeeId) {
      return { success: true, payrolls: [] };
    }
    const payrolls = await prisma.payroll.findMany({
      where: {
        ...(finalEmployeeId && { employeeId: finalEmployeeId }),
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
    const parsedPayrolls = payrolls.map((p) => {
      let detailsParsed = null;
      if (p.details) {
        try {
          detailsParsed = JSON.parse(p.details);
        } catch (e) {
          detailsParsed = { bonusNote: p.details };
        }
      }
      return {
        ...p,
        detailsParsed,
      };
    });

    return { success: true, payrolls: parsedPayrolls.map(serializePayroll) };
  } catch (error) {
    console.error('Get payrolls error:', error);
    return { success: false, error: 'Failed to load payroll list' };
  }
}

// ==================== Get Payroll Detail ====================
/**
 * Fetch detail for a single payroll along with its payment history.
 * 
 * @param {string} payrollId - Payroll ID.
 * @returns {Object} Payroll details.
 */
export async function getPayrollDetail(payrollId: string) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Access denied: Only Owner and Admin can view payroll details.' };
    }
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
      return { success: false, error: 'Payroll not found' };
    }
    const isOwner = session.user?.role === 'OWNER';
    if (!isOwner && payroll.employeeId !== session.user?.employeeId) {
      return { success: false, error: 'Access denied: You can only view your own payroll details.' };
    }

    // Parse details
    let detailsParsed = null;
    if (payroll.details) {
      try {
        detailsParsed = JSON.parse(payroll.details);
      } catch (e) {
        detailsParsed = { bonusNote: payroll.details };
      }
    }

    return { 
      success: true, 
      payroll: serializePayroll({
        ...payroll,
        detailsParsed,
      }),
    };
  } catch (error) {
    console.error('Get payroll detail error:', error);
    return { success: false, error: 'Failed to load payroll details' };
  }
}

// ==================== Update Payroll (Edit Bonus, etc.) ====================
/**
 * Updates payroll data (e.g. bonus correction or notes).
 * Recalculates Total Earned.
 * 
 * @param {string} payrollId - Payroll ID.
 * @param {Object} updates - Update payload.
 * @returns {Object} Updated payroll object.
 */
export async function updatePayroll(
  payrollId: string,
  updates: {
    bonusAmount?: number;
    bonusNote?: string;
  }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can update payroll.' };
    }
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      return { success: false, error: 'Payroll not found' };
    }

    // Parse existing details
    let details: PayrollDetail = {};
    if (payroll.details) {
      try {
        details = JSON.parse(payroll.details) as PayrollDetail;
      } catch (e) {
        details = { bonusNote: payroll.details };
      }
    }

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
    return { success: false, error: 'Failed to update payroll' };
  }
}

// ==================== Delete Payroll ====================
/**
 * Deletes a payroll that has no payment records.
 * If payments exist, deletion is prevented to maintain data integrity.
 * 
 * @param {string} payrollId - Payroll ID.
 * @returns {Object} Success status.
 */
export async function deletePayroll(payrollId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can delete payroll.' };
    }
    // Check if payment exists
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        payments: true,
      },
    });

    if (!payroll) {
      return { success: false, error: 'Payroll not found' };
    }

    if (payroll.payments.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete payroll that has existing payments' 
      };
    }

    await prisma.payroll.delete({
      where: { id: payrollId },
    });

    revalidatePath('/admin/payroll');
    
    return { success: true };
  } catch (error) {
    console.error('Delete payroll error:', error);
    return { success: false, error: 'Failed to delete payroll' };
  }
}

// ==================== Get Employee Summary ====================
/**
 * Fetch employee performance summary.
 * Includes total completed orders and total salary received.
 * 
 * @param {string} employeeId - Employee ID.
 * @returns {Object} Employee stats.
 */
export async function getEmployeeSummary(employeeId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can access employee summary.' };
    }
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
      return { success: false, error: 'Employee not found' };
    }

    // Calculate stats
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
        totalEarned: totalPaidPayrolls._sum.totalEarned ? Number(totalPaidPayrolls._sum.totalEarned) : 0,
      },
    };
  } catch (error) {
    console.error('Get employee summary error:', error);
    return { success: false, error: 'Failed to load employee summary' };
  }
}

// ==================== Bulk Generate Payroll (All Employees) ====================
/**
 * Generates bulk payroll for ALL active employees (except Owner).
 * Useful for monthly closing.
 * 
 * @param {Date} startDate - Period start date.
 * @param {Date} endDate - Period end date.
 * @returns {Object} Results list per employee.
 */
export async function bulkGeneratePayroll(
  startDate: Date,
  endDate: Date
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can perform bulk payroll generation.' };
    }
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
    return { success: false, error: 'Failed bulk payroll generation' };
  }
}