"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { createLog } from "./logs";

export interface CreateJabatanInput {
  name: string;
  description?: string;
}

export interface UpdateJabatanInput {
  id: string;
  name: string;
  description?: string;
}

/**
 * Fetches all defined job positions (jabatans) with active employee counts.
 * 
 * @returns List of job positions.
 */
export async function getJabatans() {

  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role ?? '')) {
      return { success: false, error: 'Access denied: Only Owner and Admin have access.' };
    }

    let jabatans = await prisma.systemConfig.findMany({
      where: { category: 'JABATAN' },
      orderBy: { title: 'asc' },
    });

    if (jabatans.length === 0) {
      const defaults = [
        { name: 'Owner', description: 'Pemilik bengkel dengan akses penuh ke keuangan dan manajemen staff.' },
        { name: 'Admin', description: 'Staff administrasi untuk pencatatan transaksi harian dan slip gaji.' },
        { name: 'Mekanik', description: 'Tenaga teknis yang menangani servis kendaraan dan menerima komisi.' },
      ];
      
      for (const d of defaults) {
        await prisma.systemConfig.upsert({
          where: { key: `jabatan_${d.name.toLowerCase()}` },
          update: {},
          create: {
            category: 'JABATAN',
            key: `jabatan_${d.name.toLowerCase()}`,
            title: d.name,
            subtitle: d.description,
          },
        });
      }

      jabatans = await prisma.systemConfig.findMany({
        where: { category: 'JABATAN' },
        orderBy: { title: 'asc' },
      });
    }

    const employeeGroups = await prisma.employee.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    employeeGroups.forEach((group) => {
      if (group.role) {
        countMap.set(group.role.toLowerCase(), group._count.id);
      }
    });

    const jabatansWithCount = jabatans.map((j) => {
      const activeEmployeeCount = countMap.get((j.title || '').toLowerCase()) ?? 0;
      return {
        id: j.id,
        name: j.title || '',
        description: j.subtitle || '',
        activeEmployeeCount,
      };
    });

    return { success: true, jabatans: serializeData(jabatansWithCount) };
  } catch (error) {
    console.error('Get jabatans error:', error);
    return { success: false, error: `Gagal memuat data jabatan: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function createJabatan(data: CreateJabatanInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can create positions.' };
    }

    if (!data.name) {
      return { success: false, error: 'Nama jabatan wajib diisi' };
    }

    const key = `jabatan_${data.name.toLowerCase().replace(/\s+/g, '_')}`;
    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (existing) {
      return { success: false, error: 'Nama jabatan sudah terdaftar' };
    }

    const newJabatan = await prisma.systemConfig.create({
      data: {
        category: 'JABATAN',
        key,
        title: data.name,
        subtitle: data.description ?? null,
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

    return { success: true, jabatan: serializeData({ id: newJabatan.id, name: newJabatan.title, description: newJabatan.subtitle }) };
  } catch (error) {
    console.error('Create jabatan error:', error);
    return { success: false, error: `Gagal menambahkan jabatan baru: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateJabatan(data: UpdateJabatanInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can update position data.' };
    }

    if (!data.id || !data.name) {
      return { success: false, error: 'ID dan nama jabatan wajib diisi' };
    }

    const current = await prisma.systemConfig.findUnique({
      where: { id: data.id },
    });

    if (!current) {
      return { success: false, error: 'Jabatan tidak ditemukan' };
    }

    const updated = await prisma.systemConfig.update({
      where: { id: data.id },
      data: {
        title: data.name,
        subtitle: data.description ?? null,
      },
    });

    if (current.title !== data.name && current.title) {
      await prisma.employee.updateMany({
        where: { role: current.title },
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
      details: `Jabatan ${current.title} updated to ${data.name}`,
      metadata: { positionId: updated.id },
      userName,
      role: userRole as any,
    });

    return { success: true, jabatan: serializeData({ id: updated.id, name: updated.title, description: updated.subtitle }) };
  } catch (error) {
    console.error('Update jabatan error:', error);
    return { success: false, error: `Gagal memperbarui jabatan: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteJabatan(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can delete positions.' };
    }

    const position = await prisma.systemConfig.findUnique({
      where: { id },
    });

    if (!position || !position.title) {
      return { success: false, error: 'Jabatan tidak ditemukan' };
    }

    const activeStaffCount = await prisma.employee.count({
      where: {
        role: position.title,
        isActive: true,
      },
    });

    if (activeStaffCount > 0) {
      return {
        success: false,
        error: `Gagal menghapus: Masih ada ${activeStaffCount} karyawan aktif dengan jabatan ini. Ubah jabatan mereka terlebih dahulu.`,
      };
    }

    await prisma.systemConfig.delete({
      where: { id },
    });

    revalidatePath('/admin/employees/jabatan');
    revalidatePath('/admin/employees');

    const userName = session.user?.employeeName ?? session.user?.email ?? "Owner";
    const userRole = session.user?.role ?? "OWNER";

    await createLog({
      action: "DELETE_JABATAN",
      title: "Jabatan Deleted",
      details: `Jabatan ${position.title} deleted from database`,
      metadata: { positionName: position.title },
      userName,
      role: userRole as any,
    });

    return { success: true };
  } catch (error) {
    console.error('Delete jabatan error:', error);
    return { success: false, error: `Gagal menghapus jabatan: ${error instanceof Error ? error.message : String(error)}` };
  }
}
