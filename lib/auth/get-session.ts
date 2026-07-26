import { cache } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Request-scoped session read. `auth()` decodes and verifies the JWT on every
 * call, and a single navigation used to trigger it repeatedly (the layout, then
 * the page, then an admin-gated button). `cache()` collapses every call inside
 * one render pass down to a single decode.
 */
export const getOptionalSession = cache(async () => auth())

/** Session or bust — for routes that must not render to a signed-out user. */
export async function getSession() {
  const session = await getOptionalSession()
  if (!session) redirect("/login")
  return session
}
