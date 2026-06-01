import { requireRole } from "@/lib/auth/guards";
import { SupportInbox } from "@/components/admin/support/SupportInbox";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await requireRole("admin");
  return <SupportInbox />;
}
