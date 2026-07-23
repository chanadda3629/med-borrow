import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Neon free tier auto-suspends; the first query after idle triggers a
    // multi-second cold start. Prisma's default maxWait to *start* a transaction
    // is only 2s, so $transaction() throws "Unable to start a transaction in the
    // given time" while the compute wakes. Give it room to cold-start.
    transactionOptions: {
      maxWait: 15000,
      timeout: 20000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
