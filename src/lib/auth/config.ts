import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { getEnv } from "@/lib/config/env";
import { User } from "@/models/User";
import type { Role } from "@/lib/shared/types";

/**
 * Auth.js (NextAuth v5) credentials auth for admin + buyer (research R11).
 * Sessions are JWT-backed; role is read from the session server-side and never
 * trusted from the client. No public registration (admin-only provisioning).
 */
declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getEnv().AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        await connectDB();
        const user = await User.findOne({ email: parsed.data.email, isActive: true, status: "active" }).select("+passwordHash");
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: String(user._id), email: user.email, name: user.name, role: user.role as Role };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});
