"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button, Input, Select, Card, CardBody, Badge } from "@/components/ui";

type UserType = {
  _id: string;
  email: string;
  name: string;
  role: "admin" | "buyer";
  isActive: boolean;
  status: "active" | "inactive" | "pending";
  createdAt: string;
};

export function AccountManager({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "buyer">("buyer");
  const [method, setMethod] = useState<"temp-password" | "invite">("temp-password");
  const [password, setPassword] = useState("");
  
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);

  // Load users
  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounts");
      if (res.ok) {
        setUsers(await res.json());
      } else {
        const data = await res.json();
        setError(data.error?.message || "Failed to load accounts");
      }
    } catch {
      setError("An error occurred loading accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    setInviteToken(null);
    setInviteEmail(null);

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          role,
          method,
          password: method === "temp-password" ? password : undefined,
          locale: "en", // Default invite email locale
        }),
      });

      const data = await res.json();
      setBusy(false);

      if (!res.ok) {
        setError(data.error?.message || "Failed to create account");
        return;
      }

      setSuccess("Staff account created successfully.");
      setEmail("");
      setName("");
      setPassword("");
      
      if (data.inviteToken) {
        setInviteToken(data.inviteToken);
        setInviteEmail(data.user.email);
      }

      loadUsers();
    } catch {
      setBusy(false);
      setError("An error occurred during account creation");
    }
  }

  async function handleToggleActive(user: UserType) {
    setError(null);
    setSuccess(null);
    const newActiveState = !user.isActive;

    try {
      const res = await fetch(`/api/admin/accounts/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActiveState }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to update account");
        return;
      }

      setSuccess(`Account status updated for ${user.name}`);
      loadUsers();
    } catch {
      setError("An error occurred updating the account");
    }
  }

  async function handleChangeRole(user: UserType, newRole: "admin" | "buyer") {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/accounts/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to change role");
        return;
      }

      setSuccess(`Role updated to ${newRole} for ${user.name}`);
      loadUsers();
    } catch {
      setError("An error occurred changing the account role");
    }
  }

  const getInviteLink = (token: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/accept-invite?token=${token}`;
    }
    return `/accept-invite?token=${token}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Staff Accounts</h1>
      </div>

      {error && (
        <div className="rounded-token bg-danger-subtle p-3 text-sm text-danger border border-danger/20">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-token bg-success-subtle p-3 text-sm text-success border border-success/20">
          {success}
        </div>
      )}

      {inviteToken && (
        <div className="rounded-token bg-info-subtle p-4 border border-primary/20 space-y-2">
          <p className="text-sm font-semibold text-fg">Invite Link Generated</p>
          <p className="text-xs text-muted-fg">
            Since this is a local development environment, send this link to the invited user ({inviteEmail}):
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={getInviteLink(inviteToken)}
              className="flex-1 rounded-token border border-border bg-bg px-3 py-1 text-xs text-fg focus-visible:outline-none"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(getInviteLink(inviteToken));
                alert("Copied to clipboard!");
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Provision Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-fg">Add Staff Account</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <label className="block space-y-1 text-sm">
                  <span className="text-fg">Full Name</span>
                  <Input
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="text-fg">Email Address</span>
                  <Input
                    required
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="text-fg">Role</span>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "admin" | "buyer")}
                  >
                    <option value="buyer">Buyer (Seller)</option>
                    <option value="admin">Administrator</option>
                  </Select>
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="text-fg">Method</span>
                  <Select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as "temp-password" | "invite")}
                  >
                    <option value="temp-password">Temporary Password</option>
                    <option value="invite">Email Invitation</option>
                  </Select>
                </label>

                {method === "temp-password" && (
                  <label className="block space-y-1 text-sm">
                    <span className="text-fg">Temporary Password</span>
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Staff Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody className="overflow-x-auto">
              <h2 className="text-lg font-semibold text-fg mb-4">Current Staff</h2>
              
              {loading ? (
                <div className="flex py-8 justify-center items-center">
                  <span className="text-sm text-muted-fg">Loading staff records...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="flex py-8 justify-center items-center">
                  <span className="text-sm text-muted-fg">No staff accounts found.</span>
                </div>
              ) : (
                <table className="w-full text-start text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-fg font-medium">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => {
                      const isSelf = u._id === currentUserId;
                      return (
                        <tr key={u._id} className="text-fg hover:bg-bg/50">
                          <td className="py-3 px-3 font-medium">{u.name} {isSelf && <span className="text-xs text-primary font-normal">(you)</span>}</td>
                          <td className="py-3 px-3">{u.email}</td>
                          <td className="py-3 px-3">
                            <Select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleChangeRole(u, e.target.value as "admin" | "buyer")}
                              className="h-8 py-0 px-2 text-xs bg-transparent border border-border w-28"
                            >
                              <option value="admin">Admin</option>
                              <option value="buyer">Buyer</option>
                            </Select>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              tone={
                                u.status === "active"
                                  ? "success"
                                  : u.status === "pending"
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {u.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-end">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || (u.role === "admin" && u.isActive && users.filter((x) => x.role === "admin" && x.isActive && x.status === "active").length === 1)}
                              onClick={() => handleToggleActive(u)}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
