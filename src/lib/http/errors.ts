import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/observability/logger";

/**
 * Typed application errors + a single translator to JSON responses.
 * Every API route wraps its body in `handleRoute` so failures return a
 * consistent `{ error: { code, message } }` shape and never leak internals.
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: () => new AppError("UNAUTHORIZED", "Authentication required", 401),
  forbidden: () => new AppError("FORBIDDEN", "You do not have access to this resource", 403),
  notFound: (what = "Resource") => new AppError("NOT_FOUND", `${what} not found`, 404),
  outOfStock: (details?: unknown) =>
    new AppError("OUT_OF_STOCK", "One or more items are no longer available", 409, details),
  validation: (details?: unknown) => new AppError("VALIDATION", "Invalid request", 422, details),
};

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Invalid request", details: err.issues } },
      { status: 422 },
    );
  }
  logger.error("Unhandled API error", { err: err instanceof Error ? err.message : String(err) });
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong" } },
    { status: 500 },
  );
}

/** Wrap a route handler body so thrown AppError/ZodError become clean responses. */
export async function handleRoute(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    return errorResponse(err);
  }
}
