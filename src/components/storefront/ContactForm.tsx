"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Card, CardBody, Spinner } from "@/components/ui";

/**
 * Guest Support Inquiry Form (Phase 4 User Story 2: T022).
 * Form inputs for name, email, WhatsApp, order number, subject, and message.
 * Displays appropriate success or error alerts including rate limits.
 */
export function ContactForm() {
  const t = useTranslations("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "rate-limit">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/storefront/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          whatsapp: whatsapp || undefined,
          orderNumber: orderNumber || undefined,
          subject: subject || undefined,
          message,
        }),
      });

      setBusy(false);

      if (res.status === 202) {
        setStatus("success");
        // Clear fields
        setName("");
        setEmail("");
        setWhatsapp("");
        setOrderNumber("");
        setSubject("");
        setMessage("");
      } else if (res.status === 429) {
        setStatus("rate-limit");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setBusy(false);
      setStatus("error");
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardBody className="space-y-4">
        <h2 className="text-xl font-bold text-fg">{t("formTitle")}</h2>

        {status === "success" && (
          <div className="rounded-token bg-success-subtle p-4 border border-success/20 text-sm text-success font-medium">
            {t("success")}
          </div>
        )}

        {status === "rate-limit" && (
          <div className="rounded-token bg-danger-subtle p-4 border border-danger/20 text-sm text-danger font-medium">
            {t("rateLimit")}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-token bg-danger-subtle p-4 border border-danger/20 text-sm text-danger font-medium">
            {t("error")}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-fg font-medium">{t("name")}</span>
              <Input
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-fg font-medium">{t("email")}</span>
              <Input
                required
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-fg font-medium">{t("whatsapp")}</span>
              <Input
                placeholder="+201234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-fg font-medium">{t("orderNumber")}</span>
              <Input
                placeholder="LB-XXXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-fg font-medium">{t("subject")}</span>
            <Input
              placeholder="Question about sizing"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-fg font-medium">{t("message")}</span>
            <textarea
              required
              rows={5}
              placeholder="Your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-token border border-border bg-bg p-3 text-sm text-fg placeholder:text-muted-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Sending...
              </span>
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
