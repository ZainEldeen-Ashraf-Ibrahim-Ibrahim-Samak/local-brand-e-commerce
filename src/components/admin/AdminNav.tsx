"use client";

import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";

/** Admin top navigation + sign out (Principle I — reuses the Button primitive). */
export function AdminNav({ userName }: { userName: string }) {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="font-semibold text-fg">
            Admin
          </Link>
          <Link href="/admin/products" className="text-fg hover:text-primary">
            Products
          </Link>
          <Link href="/admin/categories" className="text-fg hover:text-primary">
            Categories
          </Link>
          <Link href="/admin/orders" className="text-fg hover:text-primary">
            Orders
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
