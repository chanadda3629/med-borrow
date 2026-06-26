export function formatThaiDateTime(d: Date): string {
  return d.toLocaleString("th-TH", {
    calendar: "buddhist",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function formatThaiDate(d: Date): string {
  return d.toLocaleDateString("th-TH", {
    calendar: "buddhist",
    dateStyle: "medium",
  })
}
