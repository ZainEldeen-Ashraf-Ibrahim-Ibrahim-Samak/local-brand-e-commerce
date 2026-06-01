import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { BuyerNav } from "@/components/buyer/BuyerNav";

export const dynamic = "force-dynamic";

/**
 * Buyer (seller) route-group shell. Authorization enforced here server-side AND
 * re-checked in every /api/buyer handler (defense in depth, Principle III/IV).
 */
export default async function SellerLayout({
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
  if (session.user.role !== "buyer") redirect(`/${locale}`);

  return (
    <div className="flex min-h-screen flex-col">
      <BuyerNav userName={session.user.name ?? session.user.email ?? "Seller"} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
