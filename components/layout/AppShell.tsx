import { BottomTabBar } from "./BottomTabBar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomTabBar />
    </div>
  )
}
