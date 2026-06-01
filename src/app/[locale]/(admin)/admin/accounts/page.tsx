import { requireRole } from "@/lib/auth/guards";
import { AccountManager } from "@/components/admin/accounts/AccountManager";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const adminUser = await requireRole("admin");
  return <AccountManager currentUserId={adminUser.id} />;
}
