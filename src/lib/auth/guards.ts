import { auth } from "@/lib/auth/config";
import { Errors } from "@/lib/http/errors";
import type { Role } from "@/lib/shared/types";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";

export type SessionUser = { id: string; role: Role; name?: string | null; email?: string | null };

/** Return the current authenticated user or throw 401 (server-side, defense in depth). */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw Errors.unauthorized();
  
  await connectDB();
  const dbUser = await User.findById(session.user.id);
  if (!dbUser || !dbUser.isActive || dbUser.status !== "active") {
    throw Errors.unauthorized();
  }
  
  return { id: session.user.id, role: session.user.role, name: session.user.name, email: session.user.email };
}

/** Require a specific role (e.g. admin) or throw 403. */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) throw Errors.forbidden();
  return user;
}

/** Admin OR buyer (any authenticated privileged account). */
export async function requireStaff(): Promise<SessionUser> {
  return requireUser();
}
