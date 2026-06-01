"use client";

import { useState, type FormEvent } from "react";
import { Link } from "@/i18n/navigation";
import { Button, Input, Card, CardBody } from "@/components/ui";

export function AcceptInviteForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      setBusy(false);

      if (!res.ok) {
        setError(data.error?.message || "Failed to accept invitation.");
        return;
      }

      setSuccess(true);
    } catch {
      setBusy(false);
      setError("An unexpected error occurred. Please try again.");
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardBody className="text-center space-y-4 py-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success text-xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-fg">Account Activated!</h2>
          <p className="text-sm text-muted-fg px-4">
            Your password has been successfully set. You can now log in to the dashboard.
          </p>
          <div className="pt-2 px-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-token font-medium transition bg-primary text-primary-fg hover:opacity-90 h-10 px-4 text-sm w-full"
            >
              Go to Login
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-fg">Setup Your Account</h1>
          <p className="text-sm text-muted-fg">Choose a password for your staff account</p>
        </div>

        {error && (
          <div className="rounded-token bg-danger-subtle p-3 text-sm text-danger border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-fg">New Password</span>
            <Input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-fg">Confirm Password</span>
            <Input
              required
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Activating..." : "Activate Account"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
