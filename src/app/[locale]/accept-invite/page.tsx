import { Link } from "@/i18n/navigation";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-fg">Missing Invitation Token</h1>
        <p className="mt-2 text-muted-fg">
          This link appears to be invalid or incomplete. Please check your invitation email.
        </p>
        <Link href="/" className="mt-4 text-sm text-primary hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <AcceptInviteForm token={token} />
    </div>
  );
}
