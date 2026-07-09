// Shared display formatters.

// Thai-locale date+time. Explicit timeZone because server components run in UTC
// on the host (e.g. Vercel) — without it, timestamps would render in UTC.
const thaiDateTime = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
})

export function formatThaiDateTime(d: Date): string {
  return thaiDateTime.format(d)
}
