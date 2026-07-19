import {
  BedDouble,
  BedSingle,
  Accessibility,
  PersonStanding,
  Footprints,
  Wind,
  Cylinder,
  Table,
  Toilet,
  Package,
  type LucideIcon,
  type LucideProps,
} from "lucide-react"

// Maps a Thai equipment-type label to a representative lucide icon so the
// inventory UI can show a glanceable glyph next to each type. Unknown types
// fall back to a generic package icon.
const EQUIPMENT_TYPE_ICON: Record<string, LucideIcon> = {
  เตียงผู้ป่วย: BedDouble,
  ที่นอนลม: BedSingle,
  รถเข็น: Accessibility,
  Walker: PersonStanding,
  ไม้เท้า: Footprints,
  เครื่องดูดเสมหะ: Wind,
  ถังออกซิเจน: Cylinder,
  โต๊ะคร่อมเตียง: Table,
  โถสุขภัณฑ์เคลื่อนที่: Toilet,
}

export function equipmentIcon(type: string): LucideIcon {
  return EQUIPMENT_TYPE_ICON[type] ?? Package
}

// Renders the icon for an equipment type. Wrapping the lookup in a static
// component (rather than calling equipmentIcon() during a caller's render and
// using the result as JSX) keeps the react-hooks/static-components rule happy.
export function EquipmentIcon({ type, ...props }: { type: string } & LucideProps) {
  const Icon = EQUIPMENT_TYPE_ICON[type] ?? Package
  return <Icon {...props} />
}
