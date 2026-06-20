import { NextRequest, NextResponse } from "next/server"
import { getProvinces, getDistricts, getSubdistricts, getPostalCode } from "@/lib/address/thai-address"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const level = searchParams.get("level")
  const province = searchParams.get("province") ?? ""
  const district = searchParams.get("district") ?? ""
  const subdistrict = searchParams.get("subdistrict") ?? ""

  switch (level) {
    case "province":
      return NextResponse.json({ data: getProvinces() })
    case "district":
      if (!province) return NextResponse.json({ error: "province required" }, { status: 400 })
      return NextResponse.json({ data: getDistricts(province) })
    case "subdistrict":
      if (!province || !district) return NextResponse.json({ error: "province and district required" }, { status: 400 })
      return NextResponse.json({ data: getSubdistricts(province, district) })
    case "postalcode":
      if (!province || !district || !subdistrict) return NextResponse.json({ error: "all params required" }, { status: 400 })
      return NextResponse.json({ data: getPostalCode(province, district, subdistrict) })
    default:
      return NextResponse.json({ error: "Invalid level. Use: province, district, subdistrict, postalcode" }, { status: 400 })
  }
}
