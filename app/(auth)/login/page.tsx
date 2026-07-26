import { LoginForm } from "./_components/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">ระบบยืมอุปกรณ์</h1>
          <p className="text-sm text-muted mt-1">ศูนย์ประคองกาย</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
