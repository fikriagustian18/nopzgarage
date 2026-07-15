// app/actions/auth.ts - Authentication Server Actions
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';

// ==================== Types ====================
export type CreateUserInput = {
  email: string;
  password: string;
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE';
  employeeId?: string | null;
  name?: string;
  phone?: string;
  isActive?: boolean;
};

export type UpdateUserInput = {
  id: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  name?: string;
  phone?: string;
};

// ==================== Get All Users ====================
/**
 * Mengambil semua data pengguna (user) dari database.
 * 
 * Fungsi ini akan:
 * 1. Mengambil data user beserta relasi employee (karyawan).
 * 2. Mengurutkan berdasarkan waktu pembuatan (terbaru).
 * 3. Menghapus password dari hasil return untuk keamanan.
 * 
 * @returns {Object} Object berisi status success dan data users yang sudah disanitasi.
 */
export async function getUsers() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengakses data user.' };
    }
    const users = await prisma.user.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password from response
    const sanitizedUsers = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    });

    return { success: true, users: sanitizedUsers };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, error: 'Gagal load data user' };
  }
}

// ==================== Create User ====================
/**
 * Membuat user baru dalam sistem.
 * 
 * Fungsi ini akan:
 * 1. Mengecek apakah email sudah terdaftar.
 * 2. Melakukan hashing pada password.
 * 3. Membuat record user baru dan menghubungkan dengan employee jika ada.
 * 4. Mencatat aktivitas ke dalam log sistem.
 * 
 * @param {CreateUserInput} data - Data user baru (email, password, role, employeeId).
 * @returns {Object} Status success dan data user baru atau error jika gagal.
 */
export async function createUser(data: CreateUserInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat membuat user.' };
    }
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { success: false, error: 'Email sudah terdaftar' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Link/create employee if name is provided
    let employeeId = data.employeeId || null;
    if (data.name && !employeeId) {
      const emp = await prisma.employee.create({
        data: {
          name: data.name,
          role: data.role === 'OWNER' ? 'Owner' : data.role === 'ADMIN' ? 'Administrator' : 'Karyawan',
          phone: data.phone || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        }
      });
      employeeId = emp.id;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        employeeId,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        employee: true
      }
    });

    revalidatePath('/admin/settings');
    
    await createLog({
      action: "CREATE_USER",
      title: "User Created",
      details: `User ${data.email} (${data.role}) created`,
      metadata: { userId: user.id },
      userName: "Admin",
      role: "ADMIN"
    });

    const { password, ...sanitizedUser } = user;
    return { 
      success: true, 
      user: {
        ...sanitizedUser,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Gagal membuat user' };
  }
}

// ==================== Update User ====================
/**
 * Memperbarui data user yang sudah ada.
 * 
 * Fungsi ini akan:
 * 1. Memilah data update (id, password, dll).
 * 2. Jika password diupdate, lakukan hashing ulang.
 * 3. Mengupdate data user di database.
 * 4. Mencatat aktivitas ke log sistem.
 * 
 * @param {UpdateUserInput} data - Data update user.
 * @returns {Object} Status success dan data user yang diperbarui.
 */
export async function updateUser(data: UpdateUserInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengupdate user.' };
    }
    const { id, password, name, phone, ...updateData } = data;
    
    let finalUpdateData: any = { ...updateData };

    // If password is being updated, hash it
    if (password) {
      finalUpdateData.password = await bcrypt.hash(password, 10);
    }

    // Find the user first to see if they have a linked employee
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (currentUser) {
      if (currentUser.employeeId) {
        // Update existing employee name and phone if passed
        await prisma.employee.update({
          where: { id: currentUser.employeeId },
          data: {
            ...(name && { name }),
            ...(phone !== undefined && { phone }),
          }
        });
      } else if (name) {
        // Create new employee if user didn't have one and name is provided
        const emp = await prisma.employee.create({
          data: {
            name,
            role: currentUser.role === 'OWNER' ? 'Owner' : currentUser.role === 'ADMIN' ? 'Administrator' : 'Karyawan',
            phone: phone || null,
          }
        });
        finalUpdateData.employeeId = emp.id;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: finalUpdateData,
      include: {
        employee: true
      }
    });

    revalidatePath('/admin/settings');
    
    await createLog({
      action: "UPDATE_USER",
      title: "User Updated",
      details: `User ${user.email} updated`,
      metadata: { userId: user.id },
      userName: "Admin",
      role: "ADMIN"
    });

    const { password: _, ...sanitizedUser } = user;
    return { 
      success: true, 
      user: {
        ...sanitizedUser,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: 'Gagal update user' };
  }
}

// ==================== Reset Password ====================
/**
 * Mereset password user secara langsung oleh admin.
 * 
 * @param {string} userId - ID user yang akan direset passwordnya.
 * @param {string} newPassword - Password baru yang diinginkan.
 * @returns {Object} Status success message.
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mereset password.' };
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    revalidatePath('/admin/settings');
    
    await createLog({
      action: "RESET_PASSWORD",
      title: "Password Reset",
      details: `Password reset for user ${user.email}`,
      metadata: { userId: user.id },
      userName: "Admin",
      role: "ADMIN"
    });

    return { success: true, message: 'Password berhasil direset' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Gagal reset password' };
  }
}

// ==================== Forgot Password Request ====================
/**
 * Membuat permintaan reset password (Lupa Password).
 * 
 * Digunakan oleh user yang lupa password. Sistem tidak akan memberitahu
 * jika email tidak ditemukan untuk alasan keamanan.
 * 
 * @param {string} email - Email user yang lupa password.
 * @returns {Object} Pesan sukses bahwa permintaan telah dikirim (jika email valid).
 */
export async function createForgotPasswordRequest(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true, message: 'Jika email terdaftar, permintaan telah dikirim ke admin' };
    }

    // Create forgot password request
    await prisma.forgotPasswordRequest.create({
      data: {
        userId: user.id,
        status: 'PENDING'
      }
    });

    await createLog({
      action: "FORGOT_PASSWORD_REQUEST",
      title: "Forgot Password Request",
      details: `${user.employee?.name || user.email} requested password reset`,
      metadata: { userId: user.id },
      userName: user.employee?.name || user.email,
      role: user.role
    });

    return { success: true, message: 'Permintaan reset password telah dikirim ke admin' };
  } catch (error) {
    console.error('Forgot password request error:', error);
    return { success: false, error: 'Gagal mengirim permintaan' };
  }
}

// ==================== Get Forgot Password Requests ====================
/**
 * Mengambil semua permintaan reset password yang statusnya 'PENDING'.
 * Biasanya digunakan di halaman dashboard admin untuk melihat request masuk.
 * 
 * @returns {Object} Daftar request reset password.
 */
export async function getForgotPasswordRequests() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengambil permintaan lupa password.' };
    }
    const requests = await prisma.forgotPasswordRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedRequests = requests.map(req => ({
      ...req,
      createdAt: req.createdAt.toISOString(),

      user: {
        ...req.user,
        createdAt: req.user.createdAt.toISOString(),
        updatedAt: req.user.updatedAt.toISOString(),
      }
    }));

    return { success: true, requests: serializedRequests };
  } catch (error) {
    console.error('Get forgot password requests error:', error);
    return { success: false, error: 'Gagal load permintaan' };
  }
}

// ==================== Resolve Forgot Password Request ====================
/**
 * Menyelesaikan permintaan reset password (Admin melakukan reset).
 * 
 * @param {string} requestId - ID request reset password.
 * @param {string} newPassword - Password baru yang ditetapkan admin.
 * @param {string} resolvedBy - Nama/ID admin yang memproses.
 * @returns {Object} Status keberhasilan reset password.
 */
export async function resolveForgotPasswordRequest(
  requestId: string, 
  newPassword: string,
  resolvedBy: string
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menyetujui permintaan lupa password.' };
    }
    const request = await prisma.forgotPasswordRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      return { success: false, error: 'Permintaan tidak ditemukan' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and mark request as resolved
    await prisma.$transaction([
      prisma.user.update({
        where: { id: request.userId },
        data: { password: hashedPassword }
      }),
      prisma.forgotPasswordRequest.update({
        where: { id: requestId },
        data: {
          status: 'RESOLVED',
          resolvedBy,
          resolvedAt: new Date()
        }
      })
    ]);

    await createLog({
      action: "RESOLVE_FORGOT_PASSWORD",
      title: "Password Reset Resolved",
      details: `Password reset for ${request.user.email} by ${resolvedBy}`,
      metadata: { userId: request.userId, requestId },
      userName: resolvedBy,
      role: "ADMIN"
    });

    revalidatePath('/admin/settings');
    return { success: true, message: 'Password berhasil direset' };
  } catch (error) {
    console.error('Resolve forgot password error:', error);
    return { success: false, error: 'Gagal resolve permintaan' };
  }
}

// ==================== Delete User ====================
/**
 * Menghapus user dari sistem (Hard Delete).
 * 
 * @param {string} userId - ID user yang akan dihapus.
 * @returns {Object} Pesan sukses.
 */
export async function deleteUser(userId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menghapus user.' };
    }
    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath('/admin/settings');
    
    await createLog({
      action: "DELETE_USER",
      title: "User Deleted",
      details: `User deleted`,
      metadata: { userId },
      userName: "Admin",
      role: "ADMIN"
    });

    return { success: true, message: 'User berhasil dihapus' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: 'Gagal hapus user' };
  }
}
