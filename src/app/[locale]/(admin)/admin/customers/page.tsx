import { requireRole } from "@/lib/auth/guards";
import { CustomerTable } from "@/components/admin/customers/CustomerTable";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireRole("admin");
  return <CustomerTable />;
}
