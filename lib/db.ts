import mongoose from "mongoose";
import { demoModeEnabled } from "./demo";

/**
 * Database connection helper.
 *
 * - If MONGODB_URI is set, we connect to that (Docker / Atlas / etc).
 * - Otherwise we boot an EMBEDDED MongoDB (mongodb-memory-server) that stores
 *   its data under ./.mongo-data, so the app runs with zero external setup.
 *
 * The connection is cached on the Node global so it survives Next.js hot reloads.
 */

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryUri: string | null;
  seeded: boolean;
};

const globalForMongoose = global as unknown as { _clinicallyMongoose?: Cache };

const cache: Cache =
  globalForMongoose._clinicallyMongoose ??
  (globalForMongoose._clinicallyMongoose = {
    conn: null,
    promise: null,
    memoryUri: null,
    seeded: false,
  });

async function resolveUri(): Promise<string> {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (cache.memoryUri) return cache.memoryUri;

  // Lazy-load so this never gets bundled into edge/client code.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const path = await import("node:path");
  const fs = await import("node:fs");

  const dbPath = path.join(process.cwd(), ".mongo-data");
  fs.mkdirSync(dbPath, { recursive: true });

  const server = await MongoMemoryServer.create({
    instance: { dbName: "clinically", dbPath, storageEngine: "wiredTiger" },
  });
  cache.memoryUri = server.getUri();
  // eslint-disable-next-line no-console
  console.log("🩺 Clinically: started embedded MongoDB at", cache.memoryUri);
  return cache.memoryUri;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = resolveUri().then((uri) =>
      mongoose.connect(uri, { dbName: "clinically" })
    );
  }
  cache.conn = await cache.promise;

  // Once per process, when the DB is empty: seed demo data in demo mode (see
  // lib/demo.ts), otherwise create the ADMIN_EMAIL/ADMIN_PASSWORD admin if set.
  if (!cache.seeded) {
    cache.seeded = true;
    try {
      const { ensureSeeded, ensureBootstrapAdmin } = await import("./seed");
      if (demoModeEnabled()) await ensureSeeded();
      else await ensureBootstrapAdmin();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Auto-seed failed:", err);
    }
  }

  return cache.conn;
}
