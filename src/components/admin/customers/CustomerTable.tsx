"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Card, CardBody, Input, Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";

type CustomerType = {
  email: string;
  name: string;
  whatsapp: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string;
};

export function CustomerTable() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCustomers() {
    setLoading(true);
    try {
      const url = search ? `/api/admin/customers?search=${encodeURIComponent(search)}` : "/api/admin/customers";
      const res = await fetch(url);
      if (res.ok) {
        setCustomers(await res.json());
      } else {
        const data = await res.json();
        setError(data.error?.message || "Failed to load customer records");
      }
    } catch {
      setError("An error occurred loading customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    // Load once on mount; search is triggered explicitly via the search form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadCustomers();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-fg">Customer Records</h1>
      </div>

      {error && (
        <div className="rounded-token bg-danger-subtle p-3 text-sm text-danger border border-danger/20">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
            <Input
              placeholder="Search by email, name or WhatsApp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit">Search</Button>
            {search && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setSearch("");
                  // Trigger search reset immediately
                  setTimeout(() => {
                    loadCustomers();
                  }, 0);
                }}
              >
                Clear
              </Button>
            )}
          </form>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex py-8 justify-center items-center">
                <span className="text-sm text-muted-fg">Loading customer directory...</span>
              </div>
            ) : customers.length === 0 ? (
              <div className="flex py-8 justify-center items-center">
                <span className="text-sm text-muted-fg">No customer records found.</span>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-fg font-medium">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">WhatsApp</th>
                    <th className="py-2 px-3">Orders Count</th>
                    <th className="py-2 px-3">Total Spend</th>
                    <th className="py-2 px-3">Last Order Date</th>
                    <th className="py-2 px-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => (
                    <tr key={c.email} className="text-fg hover:bg-bg/50">
                      <td className="py-3 px-3 font-medium">{c.name}</td>
                      <td className="py-3 px-3">{c.email}</td>
                      <td className="py-3 px-3">{c.whatsapp}</td>
                      <td className="py-3 px-3 font-semibold">{c.orderCount}</td>
                      <td className="py-3 px-3 text-primary font-medium">
                        {formatMoney(c.totalSpend, "en")}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-fg">
                        {new Date(c.lastOrderAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(c.email)}`}
                          className="text-primary hover:underline font-medium text-xs"
                        >
                          View History
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
export default CustomerTable;
