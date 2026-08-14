import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const inputEmail = (credentials.email as string).trim();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: inputEmail, mode: "insensitive" } },
              { email: { equals: `${inputEmail}@nopzgarage.com`, mode: "insensitive" } }
            ]
          },
          include: {
            employee: true
          }
        });

        if (!user) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("Your account is inactive. Please contact administrator.");
        }


        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          employeeName: user.employee?.name || null,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.employeeName = user.employeeName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.employeeId = token.employeeId as string | null;
        session.user.employeeName = token.employeeName as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  logger: {
    error(error) {
      // Suppress noisy server console stack traces for expected failed login attempts
      const errName = error.name || "";
      const errCode = (error as any).code || "";
      if (
        errName === "CredentialsSignin" ||
        errName === "CallbackRouteError" ||
        errCode === "credentials"
      ) {
        return;
      }
      console.error(error);
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
