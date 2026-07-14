// types/next-auth.d.ts - Extend NextAuth types
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: string;
    employeeId: string | null;
    employeeName: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      employeeId: string | null;
      employeeName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    employeeId: string | null;
    employeeName: string | null;
  }
}
