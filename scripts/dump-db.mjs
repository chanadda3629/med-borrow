// Logical database backup: reads every table via the Prisma client and writes a
// single JSON snapshot to backups/. pg_dump is not available in this environment
// (Neon cloud DB, no local Postgres client), so this is a portable data-only dump.
//
// Run:  node --env-file=.env scripts/dump-db.mjs
//
// The output contains patient PII — backups/ is gitignored; never commit it.
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

// Every model in prisma/schema.prisma, in dependency-friendly order.
const MODELS = [
  "user",
  "referenceValue",
  "patient",
  "medicalAssessment",
  "mediaAsset",
  "equipmentItem",
  "equipmentItemStatusHistory",
  "borrowingRequest",
  "borrowingRequestStatusHistory",
  "borrowingReturn",
  "equipmentItemReturnHistory",
  "notificationHistory",
  "lineLinkToken",
  "lineMessage",
]

// Prisma returns Decimal (decimal.js) and BigInt values that JSON.stringify can't
// serialize directly. Coerce them to strings; Date already serializes to ISO.
function replacer(_key, value) {
  if (typeof value === "bigint") return value.toString()
  if (value && typeof value === "object" && value.constructor?.name === "Decimal") {
    return value.toString()
  }
  return value
}

async function main() {
  const data = {}
  const counts = {}
  for (const model of MODELS) {
    const rows = await db[model].findMany()
    data[model] = rows
    counts[model] = rows.length
  }

  const backup = {
    meta: {
      exportedAt: new Date().toISOString(),
      database: process.env.DATABASE_URL?.split("@")[1]?.split("?")[0] ?? "unknown",
      counts,
    },
    data,
  }

  const dir = join(process.cwd(), "backups")
  mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const file = join(dir, `db-backup-${stamp}.json`)
  writeFileSync(file, JSON.stringify(backup, replacer, 2), "utf8")

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  console.log(`Wrote ${file}`)
  console.log(`Total rows: ${total}`)
  for (const model of MODELS) console.log(`  ${model}: ${counts[model]}`)
}

main()
  .catch((e) => {
    console.error("Backup failed:", e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
