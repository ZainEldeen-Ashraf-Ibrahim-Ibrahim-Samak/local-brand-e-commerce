"use client";

import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";

/** Buyer (seller) top navigation + sign out (Principle I). */
export function BuyerNav({ userName }: { userName: string }) {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/seller" className="font-semibold text-fg">
            Seller
          </Link>
          <Link href="/seller/products" className="text-fg hover:text-primary">
            My products
          </Link>
          <Link href="/seller/orders" className="text-fg hover:text-primary">
            My orders
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-fg">{userName}</span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
