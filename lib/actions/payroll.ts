"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

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

function serializePayroll(payroll: any) {
  if (!payroll) {
    return null;
  }
  return serializeData(payroll);
}

function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (current.getDay() !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Generates a payroll record for an individual employee.
 * 
 * @param data - Payroll generation payload.
 * @returns Created payroll record.
 */
export async function generatePayroll(data: GeneratePayrollInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can generate payroll." };
    }
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    let baseSalary = 0;
    const details: PayrollDetail = {};

    if (employee.salaryType === "DAILY") {
      const workDays = calculateWorkDays(data.startDate, data.endDate);
      baseSalary = workDays * Number(employee.dailyRate);
      details.workDays = workDays;
    } else if (employee.salaryType === "COMMISSION") {
      const motorCount = await prisma.order.count({
        where: {
          mechanicId: employee.id,
          status: "COMPLETED",
          updatedAt: {
            gte: data.startDate,
            lte: data.endDate,
          },
        },
      });
      baseSalary = motorCount * Number(employee.commissionRate);
      details.motorCount = motorCount;
    }

    const bonusAmount = data.bonusAmount || 0;
    if (bonusAmount > 0 && data.bonusNote) {
      details.bonusNote = data.bonusNote;
    }

    const totalEarned = baseSalary + bonusAmount;

    const noteString = JSON.stringify({
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      baseSalary,
      bonus: bonusAmount,
      totalEarned,
      ...details,
    });

    const payment = await prisma.payment.create({
      data: {
        type: "PAYROLL",
        employeeId: data.employeeId,
        amount: totalEarned,
        note: noteString,
        date: new Date(),
        paymentMethod: "CASH",
      },
      include: {
        employee: true,
      },
    });

    revalidatePath("/admin/payroll");
    
    return { success: true, payroll: serializePayroll(payment) };
  } catch (error) {
    console.error("Generate payroll error:", error);
    return { success: false, error: "Failed to generate payroll" };
  }
}

/**
 * Fetches payroll records with optional filters.
 * 
 * @param filters - Optional filters by employeeId, status, and date range.
 * @returns List of payroll records.
 */
export async function getPayrolls(filters?: {
  employeeId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return { success: false, error: "Access denied: Only Owner and Admin can access payroll list." };
    }
    const isOwner = session.user?.role === "OWNER";
    const finalEmployeeId = isOwner ? filters?.employeeId : session.user?.employeeId;
    if (!isOwner && !finalEmployeeId) {
      return { success: true, payrolls: [] };
    }

    const payments = await prisma.payment.findMany({
      where: {
        type: "PAYROLL",
        ...(finalEmployeeId && { employeeId: finalEmployeeId }),
        ...(filters?.dateFrom && {
          date: { gte: filters.dateFrom },
        }),
        ...(filters?.dateTo && {
          date: { lte: filters.dateTo },
        }),
      },
      include: {
        employee: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const payrolls = payments.map((p) => {
      let detailsParsed = null;
      let startDate = p.createdAt;
      let endDate = p.createdAt;
      let baseSalary = Number(p.amount);
      let bonus = 0;

      if (p.note) {
        try {
          const parsed = JSON.parse(p.note);
          detailsParsed = parsed;
          if (parsed.startDate) {
            startDate = new Date(parsed.startDate);
          }
          if (parsed.endDate) {
            endDate = new Date(parsed.endDate);
          }
          if (parsed.baseSalary !== undefined) {
            baseSalary = parsed.baseSalary;
          }
          if (parsed.bonus !== undefined) {
            bonus = parsed.bonus;
          }
        } catch (e) {
          detailsParsed = { bonusNote: p.note };
        }
      }

      return {
        id: p.id,
        employeeId: p.employeeId,
        employee: p.employee,
        startDate,
        endDate,
        baseSalary,
        bonus,
        totalEarned: Number(p.amount),
        totalPaid: Number(p.amount),
        status: "PAID",
        details: p.note,
        detailsParsed,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
        payments: [p],
      };
    });

    return { success: true, payrolls: payrolls.map(serializePayroll) };
  } catch (error) {
    console.error("Get payrolls error:", error);
    return { success: false, error: "Failed to load payroll list" };
  }
}

/**
 * Fetches detailed info for a single payroll record.
 * 
 * @param payrollId - Payroll ID.
 * @returns Payroll detail payload.
 */
export async function getPayrollDetail(payrollId: string) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return { success: false, error: "Access denied: Only Owner and Admin can view payroll details." };
    }
    const payment = await prisma.payment.findUnique({
      where: { id: payrollId },
      include: {
        employee: true,
      },
    });

    if (!payment || payment.type !== "PAYROLL") {
      return { success: false, error: "Payroll not found" };
    }
    const isOwner = session.user?.role === "OWNER";
    if (!isOwner && payment.employeeId !== session.user?.employeeId) {
      return { success: false, error: "Access denied: You can only view your own payroll details." };
    }

    let detailsParsed = null;
    let startDate = payment.createdAt;
    let endDate = payment.createdAt;
    let baseSalary = Number(payment.amount);
    let bonus = 0;

    if (payment.note) {
      try {
        const parsed = JSON.parse(payment.note);
        detailsParsed = parsed;
        if (parsed.startDate) {
          startDate = new Date(parsed.startDate);
        }
        if (parsed.endDate) {
          endDate = new Date(parsed.endDate);
        }
        if (parsed.baseSalary !== undefined) {
          baseSalary = parsed.baseSalary;
        }
        if (parsed.bonus !== undefined) {
          bonus = parsed.bonus;
        }
      } catch (e) {
        detailsParsed = { bonusNote: payment.note };
      }
    }

    const payrollObj = {
      id: payment.id,
      employeeId: payment.employeeId,
      employee: payment.employee,
      startDate,
      endDate,
      baseSalary,
      bonus,
      totalEarned: Number(payment.amount),
      totalPaid: Number(payment.amount),
      status: "PAID",
      details: payment.note,
      detailsParsed,
      createdAt: payment.createdAt,
      updatedAt: payment.createdAt,
      payments: [payment],
    };

    return { 
      success: true, 
      payroll: serializePayroll(payrollObj),
    };
  } catch (error) {
    console.error("Get payroll detail error:", error);
    return { success: false, error: "Failed to load payroll details" };
  }
}

/**
 * Updates a payroll bonus amount and note.
 * 
 * @param payrollId - Payroll ID.
 * @param updates - Bonus amount and note updates.
 * @returns Updated payroll object.
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
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can update payroll." };
    }
    const payment = await prisma.payment.findUnique({
      where: { id: payrollId },
    });

    if (!payment) {
      return { success: false, error: "Payroll not found" };
    }

    let detailsParsed: any = {};
    if (payment.note) {
      try {
        detailsParsed = JSON.parse(payment.note);
      } catch (e) {
        detailsParsed = { bonusNote: payment.note };
      }
    }

    const newBonus = updates.bonusAmount ?? (detailsParsed.bonus || 0);
    if (updates.bonusNote) {
      detailsParsed.bonusNote = updates.bonusNote;
    }
    detailsParsed.bonus = newBonus;

    const baseSalary = detailsParsed.baseSalary || Number(payment.amount);
    const newTotal = baseSalary + newBonus;
    detailsParsed.totalEarned = newTotal;

    const updated = await prisma.payment.update({
      where: { id: payrollId },
      data: {
        amount: newTotal,
        note: JSON.stringify(detailsParsed),
      },
      include: {
        employee: true,
      },
    });

    revalidatePath("/admin/payroll");
    
    return { success: true, payroll: serializePayroll(updated) };
  } catch (error) {
    console.error("Update payroll error:", error);
    return { success: false, error: "Failed to update payroll" };
  }
}

/**
 * Deletes a payroll record by ID.
 * 
 * @param payrollId - Payroll ID.
 * @returns Success response.
 */
export async function deletePayroll(payrollId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can delete payroll." };
    }

    await prisma.payment.delete({
      where: { id: payrollId },
    });

    revalidatePath("/admin/payroll");
    
    return { success: true };
  } catch (error) {
    console.error("Delete payroll error:", error);
    return { success: false, error: "Failed to delete payroll" };
  }
}

/**
 * Retrieves an employee summary including completed orders and payroll earnings.
 * 
 * @param employeeId - Employee ID.
 * @returns Summary stats payload.
 */
export async function getEmployeeSummary(employeeId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can access employee summary." };
    }
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        orders: {
          where: {
            status: "COMPLETED",
          },
          select: {
            id: true,
            vehicle: true,
            totalPrice: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const totalCompleted = await prisma.order.count({
      where: {
        mechanicId: employeeId,
        status: "COMPLETED",
      },
    });

    const totalPaidPayrolls = await prisma.payment.aggregate({
      where: {
        employeeId,
        type: "PAYROLL",
      },
      _sum: {
        amount: true,
      },
    });

    return { 
      success: true, 
      employee: serializeData(employee),
      stats: {
        totalCompleted,
        totalEarned: totalPaidPayrolls._sum.amount ? Number(totalPaidPayrolls._sum.amount) : 0,
      },
    };
  } catch (error) {
    console.error("Get employee summary error:", error);
    return { success: false, error: "Failed to load employee summary" };
  }
}

/**
 * Generates bulk payroll for all active non-owner employees over a date period.
 * 
 * @param startDate - Start date of the period.
 * @param endDate - End date of the period.
 * @returns Bulk generation results array.
 */
export async function bulkGeneratePayroll(
  startDate: Date,
  endDate: Date
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can perform bulk payroll generation." };
    }
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        role: {
          not: "Owner",
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

    revalidatePath("/admin/payroll");
    
    return { success: true, results };
  } catch (error) {
    console.error("Bulk generate payroll error:", error);
    return { success: false, error: "Failed bulk payroll generation" };
  }
}