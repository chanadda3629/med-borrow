import { BottomTabBar } from "./BottomTabBar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <main className="flex-1 pb-28">{children}</main>
      <BottomTabBar />
    </div>
  )
}
