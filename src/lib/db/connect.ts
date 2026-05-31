import mongoose from "mongoose";
import { getEnv } from "@/lib/config/env";

/**
 * Hot-reload-safe singleton Mongoose connection. Next.js dev re-evaluates
 * modules, so we cache the connection promise on globalThis to avoid creating
 * a new pool on every request/HMR.
 */
type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { _mongoose?: MongooseCache };
const cache: MongooseCache = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  // Reuse an already-open connection (e.g. tests connect directly to an
  // ephemeral server). readyState 1 = connected.
  if (mongoose.connection.readyState === 1) {
    cache.conn = mongoose;
    return cache.conn;
  }
  if (!cache.promise) {
    const { MONGODB_URI } = getEnv();
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
