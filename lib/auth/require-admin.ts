import { getSession } from "./get-session"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const session = await getSession()
  if (session.user.role !== "ADMIN") redirect("/dashboard")
  return session
}
