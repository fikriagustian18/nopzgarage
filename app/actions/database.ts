// app/actions/database.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Utility to serialize complex database types (Date, Decimal, BigInt)
 * so they can be safely passed from Server Actions to Client Components.
 */
function serializeResult(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  
  if (typeof obj === "object") {
    // Check for Decimal (Prisma uses decimal.js)
    if (obj.constructor && (obj.constructor.name === "Decimal" || typeof obj.toFixed === "function")) {
      return obj.toString();
    }
    
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(serializeResult);
    }
    
    const serialized: any = {};
    for (const key of Object.keys(obj)) {
      serialized[key] = serializeResult(obj[key]);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Asserts that the current user has OWNER privileges.
 */
async function assertOwner() {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    throw new Error("Unauthorized: Akses ditolak. Hanya Owner yang diizinkan mengakses konsol database.");
  }
  return session;
}

/**
 * Dynamic Prisma query executor.
 */
export async function executePrismaQuery(modelName: string, operation: string, argsString: string) {
  try {
    await assertOwner();

    const model = (prisma as any)[modelName];
    if (!model) {
      return { success: false, error: `Model '${modelName}' tidak ditemukan.` };
    }

    const operationFn = model[operation];
    if (!operationFn || typeof operationFn !== "function") {
      return { success: false, error: `Operasi '${operation}' tidak valid untuk model '${modelName}'.` };
    }

    let parsedArgs = {};
    if (argsString.trim()) {
      try {
        parsedArgs = JSON.parse(argsString);
      } catch (err: any) {
        return { success: false, error: `Format JSON tidak valid: ${err.message}` };
      }
    }

    const startTime = Date.now();
    const rawResult = await operationFn(parsedArgs);
    const duration = Date.now() - startTime;

    const result = serializeResult(rawResult);
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);

    return {
      success: true,
      result,
      duration,
      count,
    };
  } catch (error: any) {
    console.error("executePrismaQuery Error:", error);
    return { success: false, error: error.message || "Gagal mengeksekusi kueri Prisma." };
  }
}

/**
 * Raw SQL query executor.
 */
export async function executeRawSql(sql: string) {
  try {
    await assertOwner();

    if (!sql.trim()) {
      return { success: false, error: "Kueri SQL tidak boleh kosong." };
    }

    const startTime = Date.now();
    const rawResult = await prisma.$queryRawUnsafe(sql);
    const duration = Date.now() - startTime;

    const result = serializeResult(rawResult);
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);

    return {
      success: true,
      result,
      duration,
      count,
    };
  } catch (error: any) {
    console.error("executeRawSql Error:", error);
    return { success: false, error: error.message || "Gagal mengeksekusi raw SQL." };
  }
}

/**
 * Dynamic Javascript Prisma code playground executor.
 */
export async function executePrismaCode(code: string) {
  try {
    await assertOwner();

    if (!code.trim()) {
      return { success: false, error: "Kode Javascript tidak boleh kosong." };
    }

    const startTime = Date.now();
    
    // Evaluate the code using a dynamic async wrapper
    // We bind 'prisma' as context parameter
    const run = new Function("prisma", "bcrypt", `
      return (async () => {
        ${code}
      })();
    `);

    const rawResult = await run(prisma, bcrypt);
    const duration = Date.now() - startTime;

    const result = serializeResult(rawResult);
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);

    return {
      success: true,
      result,
      duration,
      count,
    };
  } catch (error: any) {
    console.error("executePrismaCode Error:", error);
    return { success: false, error: error.message || "Gagal mengeksekusi kode Javascript." };
  }
}
