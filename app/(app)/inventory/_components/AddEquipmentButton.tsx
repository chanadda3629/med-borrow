import Link from "next/link"
import { getOptionalSession } from "@/lib/auth/get-session"
import { Button } from "@/components/ui/button"

/**
 * Admin-only header action. Kept as its own async component so the session read
 * does not hold up the rest of the page shell.
 */
export async function AddEquipmentButton() {
  const session = await getOptionalSession()
  if (session?.user?.role !== "ADMIN") return null

  return (
    <Link href="/inventory/new">
      <Button size="sm">+ เพิ่มอุปกรณ์</Button>
    </Link>
  )
}
