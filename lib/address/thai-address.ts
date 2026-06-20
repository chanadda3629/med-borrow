import rawData from "@/data/thai-address.json"

interface AddressEntry {
  province: string
  district: string
  subdistrict: string
  postalCode: string
}

const data = rawData as AddressEntry[]

export function getProvinces(): string[] {
  return [...new Set(data.map((e) => e.province))].sort()
}

export function getDistricts(province: string): string[] {
  return [...new Set(data.filter((e) => e.province === province).map((e) => e.district))].sort()
}

export function getSubdistricts(province: string, district: string): string[] {
  return [...new Set(
    data.filter((e) => e.province === province && e.district === district).map((e) => e.subdistrict)
  )].sort()
}

export function getPostalCode(province: string, district: string, subdistrict: string): string | null {
  return data.find((e) => e.province === province && e.district === district && e.subdistrict === subdistrict)?.postalCode ?? null
}
