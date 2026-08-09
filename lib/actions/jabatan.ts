// lib/actions/jabatan.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { serializeData } from '@/lib/utils';
import { createLog } from './logs';

export interface CreateJabatanInput {
  name: string;
  description?: string;
}

export interface UpdateJabatanInput {
  id: string;
  name: string;
  description?: string;
}

// ==================== Fetch All Positions ====================
/**
 * Fetch all job positions (Jabatan) from the database.
 * Includes calculating the count of employees currently assigned to this position.
 */
export async function getJabatans() {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role ?? '')) {
      return { success: false, error: 'Access denied: Only Owner and Admin have access.' };
    }

    // 1. Fetch positions
    let jabatans = await prisma.jabatan.findMany({
      orderBy: { name: 'asc' },
    });

    // Auto-seed default positions if empty
    if (jabatans.length === 0) {
      const defaults = [
        { name: 'Owner', description: 'Pemilik bengkel dengan akses penuh ke keuangan dan manajemen staff.' },
        { name: 'Admin', description: 'Staff administrasi untuk pencatatan transaksi harian dan slip gaji.' },
        { name: 'Mekanik', description: 'Tenaga teknis yang menangani servis kendaraan dan menerima komisi.' },
      ];
      
      await prisma.jabatan.createMany({
        data: defaults,
        skipDuplicates: true,
      });

      jabatans = await prisma.jabatan.findMany({
        orderBy: { name: 'asc' },
      });
    }

    // 2. Fetch employee counts grouped by role
    const employeeGroups = await prisma.employee.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: {
        id: true,
      },
    });

    const countMap = new Map<string, number>();
    employeeGroups.forEach((group) => {
      if (group.role) {
        countMap.set(group.role.toLowerCase(), group._count.id);
      }
    });

    // 3. Merge count into jabatan objects
    const jabatansWithCount = jabatans.map((j) => {
      const activeEmployeeCount = countMap.get(j.name.toLowerCase()) ?? 0;
      return {
        ...j,
        activeEmployeeCount,
      };
    });

    return { success: true, jabatans: serializeData(jabatansWithCount) };
  } catch (error) {
    console.error('Get jabatans error:', error);
    return { success: false, error: `Gagal memuat data jabatan: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// ==================== Create Position ====================
/**
 * Create a new job position (Jabatan).
 */
export async function createJabatan(data: CreateJabatanInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can create positions.' };
    }

    if (!data.name) {
      return { success: false, error: 'Nama jabatan wajib diisi' };
    }

    // Check duplicate
    const existing = await prisma.jabatan.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return { success: false, error: 'Nama jabatan sudah terdaftar' };
    }

    const newJabatan = await prisma.jabatan.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
    });

    revalidatePath('/admin/employees/jabatan');
    revalidatePath('/admin/employees');

    const userName = session.user?.employeeName ?? session.user?.email ?? "Owner";
    const userRole = session.user?.role ?? "OWNER";

    await createLog({
      action: "CREATE_JABATAN",
      title: "Jabatan Added",
      details: `Jabatan ${data.name} added to database`,
      metadata: { positionId: newJabatan.id },
      userName,
      role: userRole as any,
    });

    return { success: true, jabatan: serializeData(newJabatan) };
  } catch (error) {
    console.error('Create jabatan error:', error);
    return { success: false, error: `Gagal menambahkan jabatan baru: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// ==================== Update Position ====================
/**
 * Update an existing position (Jabatan).
 */
export async function updateJabatan(data: UpdateJabatanInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can update position data.' };
    }

    if (!data.id || !data.name) {
      return { success: false, error: 'ID dan nama jabatan wajib diisi' };
    }

    // Check duplicate name excluding current record
    const existing = await prisma.jabatan.findFirst({
      where: {
        name: data.name,
        NOT: { id: data.id },
      },
    });

    if (existing) {
      return { success: false, error: 'Nama jabatan sudah digunakan oleh record lain' };
    }

    // Capture old name for updating employee role values if they match
    const current = await prisma.jabatan.findUnique({
      where: { id: data.id },
    });

    if (!current) {
      return { success: false, error: 'Jabatan tidak ditemukan' };
    }

    const updated = await prisma.jabatan.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
    });

    // Update Employee role strings to match the new position name
    if (current.name !== data.name) {
      await prisma.employee.updateMany({
        where: { role: current.name },
        data: { role: data.name },
      });
    }

    revalidatePath('/admin/employees/jabatan');
    revalidatePath('/admin/employees');

    const userName = session.user?.employeeName ?? session.user?.email ?? "Owner";
    const userRole = session.user?.role ?? "OWNER";

    await createLog({
      action: "UPDATE_JABATAN",
      title: "Jabatan Updated",
      details: `Jabatan ${current.name} updated to ${data.name}`,
      metadata: { positionId: updated.id },
      userName,
      role: userRole as any,
    });

    return { success: true, jabatan: serializeData(updated) };
  } catch (error) {
    console.error('Update jabatan error:', error);
    return { success: false, error: `Gagal memperbarui jabatan: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// ==================== Delete Position ====================
/**
 * Delete a position (Jabatan).
 */
export async function deleteJabatan(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can delete positions.' };
    }

    const position = await prisma.jabatan.findUnique({
      where: { id },
    });

    if (!position) {
      return { success: false, error: 'Jabatan tidak ditemukan' };
    }

    // Check if any employees are using this role
    const activeStaffCount = await prisma.employee.count({
      where: {
        role: position.name,
        isActive: true,
      },
    });

    if (activeStaffCount > 0) {
      return {
        success: false,
        error: `Gagal menghapus: Masih ada ${activeStaffCount} karyawan aktif dengan jabatan ini. Ubah jabatan mereka terlebih dahulu.`,
      };
    }

    await prisma.jabatan.delete({
      where: { id },
    });

    revalidatePath('/admin/employees/jabatan');
    revalidatePath('/admin/employees');

    const userName = session.user?.employeeName ?? session.user?.email ?? "Owner";
    const userRole = session.user?.role ?? "OWNER";

    await createLog({
      action: "DELETE_JABATAN",
      title: "Jabatan Deleted",
      details: `Jabatan ${position.name} deleted from database`,
      metadata: { positionName: position.name },
      userName,
      role: userRole as any,
    });

    return { success: true };
  } catch (error) {
    console.error('Delete jabatan error:', error);
    return { success: false, error: `Gagal menghapus jabatan: ${error instanceof Error ? error.message : String(error)}` };
  }
}
