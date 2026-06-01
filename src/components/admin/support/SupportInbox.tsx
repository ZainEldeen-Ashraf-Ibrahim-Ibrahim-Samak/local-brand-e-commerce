"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Badge, Button, Select, Input } from "@/components/ui";

type StatusHistoryItem = {
  status: "new" | "in_progress" | "resolved";
  changedAt: string;
  changedByUserId?: string;
  note?: string;
};

type InquiryType = {
  _id: string;
  name: string;
  email: string;
  whatsapp?: string;
  orderNumber?: string;
  subject?: string;
  message: string;
  status: "new" | "in_progress" | "resolved";
  statusHistory: StatusHistoryItem[];
  createdAt: string;
};

export function SupportInbox() {
  const [inquiries, setInquiries] = useState<InquiryType[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Update state
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryType | null>(null);
  const [transitionStatus, setTransitionStatus] = useState<"new" | "in_progress" | "resolved">("in_progress");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadInquiries() {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/admin/support" : `/api/admin/support?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        setInquiries(await res.json());
      } else {
        const data = await res.json();
        setError(data.error?.message || "Failed to load support inquiries");
      }
    } catch {
      setError("An error occurred loading inquiries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInquiries();
    // Reload whenever the status filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInquiry) return;
    
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/support/${selectedInquiry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: transitionStatus, note: note || undefined }),
      });

      const data = await res.json();
      setBusy(false);

      if (!res.ok) {
        setError(data.error?.message || "Failed to update inquiry status");
        return;
      }

      setNote("");
      setSelectedInquiry(null);
      loadInquiries();
    } catch {
      setBusy(false);
      setError("An error occurred updating the status");
    }
  }

  const getStatusBadgeTone = (status: string) => {
    switch (status) {
      case "new":
        return "danger";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-fg">Support Inbox</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-fg">Filter status:</span>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Inquiries</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-token bg-danger-subtle p-3 text-sm text-danger border border-danger/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Inquiry List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <Card>
              <CardBody className="py-12 text-center text-muted-fg">
                Loading support inbox...
              </CardBody>
            </Card>
          ) : inquiries.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center text-muted-fg">
                No inquiries found in this view.
              </CardBody>
            </Card>
          ) : (
            inquiries.map((inq) => (
              <Card
                key={inq._id}
                className={`transition cursor-pointer border ${
                  selectedInquiry?._id === inq._id ? "border-primary" : "border-border hover:border-muted-fg/40"
                }`}
                onClick={() => {
                  setSelectedInquiry(inq);
                  setTransitionStatus(inq.status);
                  setNote("");
                }}
              >
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-fg text-base">
                        {inq.subject || "No Subject"}
                      </h3>
                      <p className="text-xs text-muted-fg">
                        Submitted on {new Date(inq.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge tone={getStatusBadgeTone(inq.status)}>{inq.status}</Badge>
                  </div>
                  
                  <div className="text-sm text-fg line-clamp-3 whitespace-pre-wrap">
                    {inq.message}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-fg border-t border-border/50 pt-2">
                    <span>
                      <strong>From:</strong> {inq.name} ({inq.email})
                    </span>
                    {inq.whatsapp && (
                      <span>
                        <strong>WhatsApp:</strong> {inq.whatsapp}
                      </span>
                    )}
                    {inq.orderNumber && (
                      <span className="text-primary font-medium">
                        <strong>Order #:</strong> {inq.orderNumber}
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        {/* Action / Details Panel */}
        <div className="lg:col-span-1">
          {selectedInquiry ? (
            <Card className="sticky top-6 border border-border">
              <CardBody className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-fg">Inquiry Details</h2>
                  <p className="text-xs text-muted-fg">ID: {selectedInquiry._id}</p>
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-3">
                  <p>
                    <strong className="text-muted-fg">Customer:</strong> {selectedInquiry.name}
                  </p>
                  <p>
                    <strong className="text-muted-fg">Email:</strong>{" "}
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </p>
                  {selectedInquiry.whatsapp && (
                    <p>
                      <strong className="text-muted-fg">WhatsApp:</strong> {selectedInquiry.whatsapp}
                    </p>
                  )}
                  {selectedInquiry.orderNumber && (
                    <p>
                      <strong className="text-muted-fg">Order Ref:</strong> {selectedInquiry.orderNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-1 border-t border-border pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Message</span>
                  <div className="rounded-token bg-muted/40 p-3 text-sm text-fg whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </div>
                </div>

                {/* Status Update Form */}
                <form onSubmit={handleStatusUpdate} className="space-y-3 border-t border-border pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Update Status</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs space-y-1">
                      <span className="text-muted-fg">Set Status</span>
                      <Select
                        value={transitionStatus}
                        onChange={(e) => setTransitionStatus(e.target.value as "new" | "in_progress" | "resolved")}
                        className="h-8 py-0 px-2 text-xs"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </Select>
                    </label>
                  </div>

                  <label className="block text-xs space-y-1">
                    <span className="text-muted-fg">Internal Note (Optional)</span>
                    <Input
                      placeholder="Waiting for reply..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </label>

                  <Button type="submit" size="sm" className="w-full" disabled={busy}>
                    {busy ? "Updating..." : "Save Status"}
                  </Button>
                </form>

                {/* Status History Logs */}
                {selectedInquiry.statusHistory && selectedInquiry.statusHistory.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">History Log</span>
                    <div className="max-h-40 overflow-y-auto space-y-2 text-xs pe-1">
                      {selectedInquiry.statusHistory.map((h, i) => (
                        <div key={i} className="bg-muted/20 p-2 rounded-token border border-border/30">
                          <div className="flex justify-between font-medium">
                            <Badge tone={getStatusBadgeTone(h.status)}>{h.status}</Badge>
                            <span className="text-muted-fg text-[10px]">
                              {new Date(h.changedAt).toLocaleString()}
                            </span>
                          </div>
                          {h.note && <p className="mt-1 text-fg italic">&ldquo;{h.note}&rdquo;</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="py-8 text-center text-muted-fg text-sm">
                Select an inquiry from the list to view details and update its status.
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
