import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { getRedis } from "@/lib/cache";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — liveness + dependency readiness (research R2). Reports MongoDB
 * and Redis connectivity so uptime checks and dashboards can alert on degradation.
 * Returns 200 when healthy, 503 when a critical dependency is down.
 */
export async function GET() {
  const checks: Record<string, "ok" | "down"> = { mongo: "down", redis: "down" };

  try {
    await connectDB();
    checks.mongo = mongoose.connection.readyState === 1 ? "ok" : "down";
  } catch (err) {
    logger.warn("Health: mongo check failed", { err: err instanceof Error ? err.message : String(err) });
  }

  try {
    const pong = await getRedis().ping();
    checks.redis = pong ? "ok" : "down";
  } catch (err) {
    logger.warn("Health: redis check failed", { err: err instanceof Error ? err.message : String(err) });
  }

  const healthy = checks.mongo === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks, time: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
