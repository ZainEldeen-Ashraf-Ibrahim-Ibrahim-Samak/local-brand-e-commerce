import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, AppError } from "@/lib/http/errors";
import { submitInquiry } from "@/services/support.service";

const supportInquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  whatsapp: z.string().optional(),
  orderNumber: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
});

/** POST /api/storefront/support — Submit customer support inquiry (public, rate-limited) */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = supportInquirySchema.parse(await req.json());
    
    // Resolve client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? (forwarded.split(",")[0]?.trim() ?? "127.0.0.1") : "127.0.0.1";

    try {
      await submitInquiry({
        name: body.name,
        email: body.email,
        whatsapp: body.whatsapp,
        orderNumber: body.orderNumber,
        subject: body.subject,
        message: body.message,
        ip,
      });

      return NextResponse.json({ success: true }, { status: 202 });
    } catch (err) {
      if (err instanceof Error && err.message === "Rate limit exceeded") {
        throw new AppError("RATE_LIMIT", "Too many requests. Please try again later.", 429);
      }
      throw err;
    }
  });
}
