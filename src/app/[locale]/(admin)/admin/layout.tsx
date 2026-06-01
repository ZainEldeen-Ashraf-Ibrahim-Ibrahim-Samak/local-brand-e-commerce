import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Admin route-group shell. Authorization is enforced here server-side (requireRole
 * equivalent) AND re-checked in every /api/admin handler (defense in depth,
 * Constitution Principle III/IV).
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await headers(); // Force dynamic rendering — this subtree is per-request (auth-gated).
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== "admin") redirect(`/${locale}`);

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav userName={session.user.name ?? session.user.email ?? "Admin"} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
