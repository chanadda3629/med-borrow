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

// Compact Thai "time ago" label (e.g. "3 วันก่อน") for list rows. Falls back to
// larger units as the gap grows; uses the shortest sensible unit.
const thaiRelative = new Intl.RelativeTimeFormat("th-TH", { numeric: "auto" })

export function formatThaiRelativeTime(d: Date): string {
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return thaiRelative.format(diffSec, "second")

  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return thaiRelative.format(diffMin, "minute")

  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) return thaiRelative.format(diffHr, "hour")

  const diffDay = Math.round(diffHr / 24)
  if (Math.abs(diffDay) < 30) return thaiRelative.format(diffDay, "day")

  const diffMon = Math.round(diffDay / 30)
  if (Math.abs(diffMon) < 12) return thaiRelative.format(diffMon, "month")

  return thaiRelative.format(Math.round(diffMon / 12), "year")
}
