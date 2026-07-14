// app/api/auth/[...nextauth]/route.ts - NextAuth v5 API Route
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
