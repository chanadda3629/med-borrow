import { db } from "@/lib/db"

export async function getPatients(search?: string) {
  return db.patient.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { nationalId: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        }
      : undefined,
    include: {
      borrowingRequests: {
        select: { id: true, workflowStatus: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}
