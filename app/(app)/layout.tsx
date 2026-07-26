import { getSession } from "@/lib/auth/get-session"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Shares one cached JWT decode with every page and section below it.
  await getSession()
  return <AppShell>{children}</AppShell>
}
