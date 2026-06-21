import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const email = "nurse@med-borrow.local";
const password = "Staff@12345";
const role = "STAFF";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const passwordHash = await bcrypt.hash(password, 10);
const user = await prisma.user.upsert({
  where: { email },
  update: { passwordHash, role },
  create: { email, passwordHash, role },
});
console.log("Seeded user:", { email: user.email, role: user.role, password });
await prisma.$disconnect();
