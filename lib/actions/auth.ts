// lib/actions/auth.ts - Authentication Server Actions
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';
import { serializeData } from '@/lib/utils';
import type { SalaryType } from '@prisma/client';


// ==================== Interfaces ====================
export interface CreateUserInput {
  email: string;
  password: string;
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE';
  employeeId?: string | null;
  name?: string;
  phone?: string;
  isActive?: boolean;
  salaryType?: SalaryType;
  dailyRate?: number;
  commissionRate?: number;
}

export interface UpdateUserInput {
  id: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  name?: string;
  phone?: string;
  salaryType?: SalaryType;
  dailyRate?: number;
  commissionRate?: number;
}

// ==================== Get All Users ====================
/**
 * Fetch all users from the database.
 * 
 * Process:
 * 1. Fetch user records including employee relations.
 * 2. Order by creation date descending.
 * 3. Sanitize passwords from response.
 * 
 * @returns {Object} Success status and sanitized users list.
 */
export async function getUsers() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can access user data.' };
    }
    const users = await prisma.user.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true,
            phone: true,
            salaryType: true,
            dailyRate: true,
            commissionRate: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password from response and serialize all fields
    const sanitizedUsers = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return serializeData({
        ...userWithoutPassword,
        employee: user.employee,
      });
    });

    return { success: true, users: sanitizedUsers };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, error: 'Gagal load data user' };
  }
}

// ==================== Create User ====================
/**
 * Create a new user in the system.
 * 
 * Process:
 * 1. Check if email already exists.
 * 2. Hash password.
 * 3. Create user record and link to employee.
 * 4. Log activity.
 * 
 * @param {CreateUserInput} data - New user input data.
 * @returns {Object} Success status and new user object.
 */
export async function createUser(data: CreateUserInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can create users.' };
    }
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Link/create employee if name is provided
    let employeeId = data.employeeId || null;
    if (data.name && !employeeId) {
      const emp = await prisma.employee.create({
        data: {
          name: data.name,
          role: data.role === 'OWNER' ? 'Owner' : data.role === 'ADMIN' ? 'Administrator' : 'Mekanik',
          phone: data.phone || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          salaryType: data.salaryType || 'COMMISSION',
          dailyRate: data.dailyRate !== undefined ? Number(data.dailyRate) : 0,
          commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : 0,
        }
      });
      employeeId = emp.id;
    } else if (employeeId && (data.salaryType || data.dailyRate !== undefined || data.commissionRate !== undefined)) {
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          ...(data.salaryType && { salaryType: data.salaryType }),
          ...(data.dailyRate !== undefined && { dailyRate: Number(data.dailyRate) }),
          ...(data.commissionRate !== undefined && { commissionRate: Number(data.commissionRate) }),
        }
      });
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
    revalidatePath('/admin/users');
    
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
      user: serializeData({
        ...sanitizedUser,
        employee: user.employee,
      })
    };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Gagal membuat user' };
  }
}

// ==================== Update User ====================
/**
 * Update an existing user.
 * 
 * @param {UpdateUserInput} data - User update payload.
 * @returns {Object} Success status and updated user object.
 */
export async function updateUser(data: UpdateUserInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can update users.' };
    }
    const { id, password, name, phone, salaryType, dailyRate, commissionRate, ...updateData } = data;
    
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
        // Update existing employee name, phone, salaryType, dailyRate, commissionRate if passed
        await prisma.employee.update({
          where: { id: currentUser.employeeId },
          data: {
            ...(name && { name }),
            ...(phone !== undefined && { phone }),
            ...(salaryType && { salaryType }),
            ...(dailyRate !== undefined && { dailyRate: Number(dailyRate) }),
            ...(commissionRate !== undefined && { commissionRate: Number(commissionRate) }),
          }
        });
      } else if (name) {
        // Create new employee if user didn't have one and name is provided
        const emp = await prisma.employee.create({
          data: {
            name,
            role: currentUser.role === 'OWNER' ? 'Owner' : currentUser.role === 'ADMIN' ? 'Administrator' : 'Mekanik',
            phone: phone || null,
            salaryType: salaryType || 'COMMISSION',
            dailyRate: dailyRate !== undefined ? Number(dailyRate) : 0,
            commissionRate: commissionRate !== undefined ? Number(commissionRate) : 0,
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
    revalidatePath('/admin/users');
    
    await createLog({
      action: "UPDATE_USER",
      title: "User Updated",
      details: `User ${user.email} updated`,
      metadata: { userId: user.id },
      userName: "Admin",
      role: "ADMIN"
    });

    const { password: unusedPassword, ...sanitizedUser } = user;
    return { 
      success: true, 
      user: serializeData({
        ...sanitizedUser,
        employee: user.employee,
      })
    };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: 'Gagal update user' };
  }
}

// ==================== Reset Password ====================
/**
 * Resets user password directly by admin.
 * 
 * @param {string} userId - ID of the user whose password will be reset.
 * @param {string} newPassword - New desired password.
 * @returns {Object} Success message status.
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can reset passwords.' };
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
 * Creates a password reset request (Forgot Password).
 * 
 * Used by users who forgot their password. System will not disclose
 * if an email does not exist for security reasons.
 * 
 * @param {string} email - Email of user requesting reset.
 * @returns {Object} Success message status.
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
 * Retrieves all password reset requests with 'PENDING' status.
 * Used on the admin dashboard to review incoming requests.
 * 
 * @returns {Object} List of password reset requests.
 */
export async function getForgotPasswordRequests() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can view forgot password requests.' };
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

    return { success: true, requests: serializeData(requests) };
  } catch (error) {
    console.error('Get forgot password requests error:', error);
    return { success: false, error: 'Gagal load permintaan' };
  }
}

// ==================== Resolve Forgot Password Request ====================
/**
 * Resolves a password reset request (Admin executes reset).
 * 
 * @param {string} requestId - Password reset request ID.
 * @param {string} newPassword - New password set by admin.
 * @param {string} resolvedBy - Admin name/ID resolving the request.
 * @returns {Object} Resolution success status.
 */
export async function resolveForgotPasswordRequest(
  requestId: string, 
  newPassword: string,
  resolvedBy: string
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can resolve forgot password requests.' };
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
 * Deletes a user from the system (Hard Delete).
 * 
 * @param {string} userId - User ID to delete.
 * @returns {Object} Success message.
 */
export async function deleteUser(userId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can delete users.' };
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

// ==================== Get Current User Profile ====================
export async function getCurrentProfile() {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return { success: false, error: 'Not logged in' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get user activities from ActivityLog
    const activities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { userId: user.id },
          { userName: user.employee?.name || undefined },
          { details: { contains: user.email } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const serializedActivities = activities.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    }));

    return {
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        employee: user.employee ? {
          id: user.employee.id,
          name: user.employee.name,
          role: user.employee.role,
          phone: user.employee.phone,
        } : null,
      },
      activities: serializedActivities,
    };
  } catch (error) {
    console.error('Get current profile error:', error);
    return { success: false, error: 'Gagal memuat profil' };
  }
}

// ==================== Update Current User Profile ====================
export async function updateCurrentProfile(data: { name: string; phone: string; email: string }) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return { success: false, error: 'Not logged in' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check email availability if changing email
    if (data.email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email }
      });
      if (emailExists) {
        return { success: false, error: 'Email sudah digunakan oleh akun lain' };
      }
    }

    // Update User table
    await prisma.user.update({
      where: { id: user.id },
      data: { email: data.email }
    });

    // Update or Create Employee table for full name storage
    if (user.employeeId) {
      await prisma.employee.update({
        where: { id: user.employeeId },
        data: {
          name: data.name,
          phone: data.phone || null,
        }
      });
    } else if (data.name) {
      const newEmp = await prisma.employee.create({
        data: {
          name: data.name,
          role: user.role === 'OWNER' ? 'Owner' : user.role === 'ADMIN' ? 'Administrator' : 'Mekanik',
          phone: data.phone || null,
        }
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { employeeId: newEmp.id }
      });
    }

    // Log the update
    await createLog({
      action: "UPDATE_PROFILE",
      title: "Profil Diperbarui",
      details: `Memperbarui informasi profil untuk ${data.email}`,
      metadata: { userId: user.id },
      userName: data.name || user.employee?.name || "User",
      role: user.role
    });

    revalidatePath('/admin/profile');
    revalidatePath('/admin/users');

    return { success: true, message: 'Profil berhasil diperbarui' };
  } catch (error) {
    console.error('Update current profile error:', error);
    return { success: false, error: 'Gagal memperbarui profil' };
  }
}

// ==================== Change Current User Password ====================
export async function changeCurrentPassword(data: { currentPassword: string; newPassword: string }) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return { success: false, error: 'Not logged in' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    // Log password change
    await createLog({
      action: "CHANGE_PASSWORD",
      title: "Password Diubah",
      details: `Password akun berhasil diubah untuk ${user.email}`,
      metadata: { userId: user.id },
      userName: user.employee?.name || "User",
      role: user.role
    });

    return { success: true, message: 'Password berhasil diubah' };
  } catch (error) {
    console.error('Change current password error:', error);
    return { success: false, error: 'Gagal mengubah password' };
  }
}
