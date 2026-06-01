// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/models/User";
import { createUser } from "@/services/admin/accounts.admin.service";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("accounts creation integration (T005)", () => {
  it("successfully creates a staff account via temporary password", async () => {
    const creator = await User.create({
      email: "admin@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin One",
      isActive: true,
      status: "active",
    });

    const result = await createUser({
      email: "buyer@test.com",
      name: "Buyer One",
      role: "buyer",
      password: "temporaryPassword123",
      method: "temp-password",
      createdByUserId: String(creator._id),
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("buyer@test.com");
    expect(result.user.role).toBe("buyer");
    expect(result.user.isActive).toBe(true);
    expect(result.user.status).toBe("active");
    expect(result.inviteToken).toBeUndefined();

    // Check database
    const dbUser = await User.findOne({ email: "buyer@test.com" }).select("+passwordHash");
    expect(dbUser).toBeDefined();
    expect(dbUser?.passwordHash).toBeDefined();
    expect(dbUser?.passwordHash).not.toBe("temporaryPassword123"); // should be hashed
  });

  it("successfully creates a staff account via email invite", async () => {
    const creator = await User.create({
      email: "admin@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin One",
      isActive: true,
      status: "active",
    });

    const result = await createUser({
      email: "invited-admin@test.com",
      name: "Invited Admin",
      role: "admin",
      method: "invite",
      createdByUserId: String(creator._id),
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("invited-admin@test.com");
    expect(result.user.role).toBe("admin");
    expect(result.user.status).toBe("pending");
    expect(result.inviteToken).toBeDefined(); // should return raw token to be sent in email

    // Check database
    const dbUser = await User.findOne({ email: "invited-admin@test.com" }).select("+inviteTokenHash");
    expect(dbUser).toBeDefined();
    expect(dbUser?.inviteTokenHash).toBeDefined();
    expect(dbUser?.inviteExpiresAt).toBeDefined();
  });

  it("rejects duplicate email address", async () => {
    await User.create({
      email: "duplicate@test.com",
      passwordHash: "hash",
      role: "buyer",
      name: "Existing Buyer",
      isActive: true,
      status: "active",
    });

    await expect(
      createUser({
        email: "duplicate@test.com",
        name: "New Buyer",
        role: "buyer",
        password: "password123",
        method: "temp-password",
      })
    ).rejects.toThrow("An account with this email already exists");
  });
});
