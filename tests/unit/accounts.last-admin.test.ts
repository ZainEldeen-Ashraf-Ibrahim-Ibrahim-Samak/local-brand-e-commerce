// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "@/models/User";
import { updateUser } from "@/services/admin/accounts.admin.service";

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

describe("accounts last-admin protection (T004)", () => {
  it("prevents deactivating the only active admin", async () => {
    const admin = await User.create({
      email: "admin@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin One",
      isActive: true,
      status: "active",
    });

    await expect(updateUser(String(admin._id), { isActive: false })).rejects.toThrow(
      "Cannot deactivate the last active administrator"
    );

    // Verify it is still active
    const updated = await User.findById(admin._id);
    expect(updated?.isActive).toBe(true);
  });

  it("prevents changing status to inactive/pending for the only active admin", async () => {
    const admin = await User.create({
      email: "admin@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin One",
      isActive: true,
      status: "active",
    });

    await expect(updateUser(String(admin._id), { status: "inactive" })).rejects.toThrow(
      "Cannot deactivate the last active administrator"
    );

    await expect(updateUser(String(admin._id), { status: "pending" })).rejects.toThrow(
      "Cannot deactivate the last active administrator"
    );
  });

  it("prevents demoting the only active admin to buyer", async () => {
    const admin = await User.create({
      email: "admin@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin One",
      isActive: true,
      status: "active",
    });

    await expect(updateUser(String(admin._id), { role: "buyer" })).rejects.toThrow(
      "Cannot demote the last active administrator"
    );
  });

  it("allows deactivating an admin if another active admin exists", async () => {
    const admin1 = await User.create({
      email: "admin1@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin One",
      isActive: true,
      status: "active",
    });

    const admin2 = await User.create({
      email: "admin2@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin Two",
      isActive: true,
      status: "active",
    });

    // Deactivate admin1
    await updateUser(String(admin1._id), { isActive: false });

    const updated1 = await User.findById(admin1._id);
    expect(updated1?.isActive).toBe(false);

    // Deactivating admin2 now should fail
    await expect(updateUser(String(admin2._id), { isActive: false })).rejects.toThrow(
      "Cannot deactivate the last active administrator"
    );
  });

  it("allows deactivating or demoting a buyer", async () => {
    const admin = await User.create({
      email: "admin@test.com",
      passwordHash: "hash",
      role: "admin",
      name: "Admin One",
      isActive: true,
      status: "active",
    });

    const buyer = await User.create({
      email: "buyer@test.com",
      passwordHash: "hash",
      role: "buyer",
      name: "Buyer One",
      isActive: true,
      status: "active",
    });

    await updateUser(String(buyer._id), { isActive: false });
    const updatedBuyer = await User.findById(buyer._id);
    expect(updatedBuyer?.isActive).toBe(false);
  });
});
