// app/actions/database.ts
"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { isRoleAllowed } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";

/**
 * Utility to serialize complex database types (Date, Decimal, BigInt)
 * so they can be safely passed from Server Actions to Client Components.
 */
function serializeResult(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  
  if (typeof obj === "object") {
    // Check for Decimal (Prisma uses decimal.js)
    const objWithConstructor = obj as { constructor?: { name?: string }; toFixed?: () => string };
    if (
      objWithConstructor.constructor?.name === "Decimal" ||
      typeof objWithConstructor.toFixed === "function"
    ) {
      return (obj as { toString(): string }).toString();
    }
    
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(serializeResult);
    }
    
    const record = obj as Record<string, unknown>;
    const serialized: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      serialized[key] = serializeResult(record[key]);
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
  if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
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

    const model = (prisma as unknown as Record<string, Record<string, (args?: unknown) => Promise<unknown>>>)[modelName];
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Format JSON tidak valid";
        return { success: false, error: `Format JSON tidak valid: ${message}` };
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
  } catch (error: unknown) {
    console.error("executePrismaQuery Error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengeksekusi kueri Prisma.";
    return { success: false, error: message };
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
  } catch (error: unknown) {
    console.error("executeRawSql Error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengeksekusi raw SQL.";
    return { success: false, error: message };
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
  } catch (error: unknown) {
    console.error("executePrismaCode Error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengeksekusi kode Javascript.";
    return { success: false, error: message };
  }
}
