"use client";

import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/theme", label: "Theme" },
  { href: "/admin/tax-shipping", label: "Tax & Shipping" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/customers", label: "Customers" },
];

/** Admin top navigation + sign out (Principle I — reuses the Button primitive). */
export function AdminNav({ userName }: { userName: string }) {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-fg hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <LanguageSwitcher />
          <span className="text-muted-fg">{userName}</span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
