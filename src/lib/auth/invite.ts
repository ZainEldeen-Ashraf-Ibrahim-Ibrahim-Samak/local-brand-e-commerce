import crypto from "crypto";

/**
 * Invite token utilities (Phase 3 User Story 1: T007).
 * Provides secure generation, hashing, and validation of user invite tokens.
 */

export function generateInviteToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = hashInviteToken(token);
  return { token, hash };
}

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isInviteExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
