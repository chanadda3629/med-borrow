import { cn } from "@/lib/utils"

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}
export function TableHeader({ ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-border" {...props} />
}
export function TableBody({ ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-hairline" {...props} />
}
export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-canvas", className)} {...props} />
}
export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("h-12 px-4 text-left align-middle text-xs font-medium uppercase text-muted", className)}
      {...props}
    />
  )
}
export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-foreground", className)} {...props} />
}
