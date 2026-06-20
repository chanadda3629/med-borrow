"use client"
import { useEffect, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function ThaiAddressFields() {
  const { control, watch, setValue, formState: { errors } } = useFormContext()
  const province = watch("address.province")
  const district = watch("address.district")

  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [subdistricts, setSubdistricts] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/address?level=province")
      .then((r) => r.json())
      .then((d: { data: string[] }) => setProvinces(d.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setValue("address.district", "")
    setValue("address.subdistrict", "")
    setValue("address.postalCode", "")
    if (!province) {
      Promise.resolve().then(() => { setDistricts([]); setSubdistricts([]) })
      return
    }
    fetch(`/api/address?level=district&province=${encodeURIComponent(province)}`)
      .then((r) => r.json())
      .then((d: { data: string[] }) => setDistricts(d.data ?? []))
      .catch(() => {})
  }, [province, setValue])

  useEffect(() => {
    setValue("address.subdistrict", "")
    setValue("address.postalCode", "")
    if (!province || !district) {
      Promise.resolve().then(() => { setSubdistricts([]) })
      return
    }
    fetch(`/api/address?level=subdistrict&province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}`)
      .then((r) => r.json())
      .then((d: { data: string[] }) => setSubdistricts(d.data ?? []))
      .catch(() => {})
  }, [province, district, setValue])

  async function handleSubdistrictChange(subdistrict: string) {
    if (!province || !district || !subdistrict) return
    try {
      const res = await fetch(`/api/address?level=postalcode&province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}&subdistrict=${encodeURIComponent(subdistrict)}`)
      const d = await res.json() as { data: string | null }
      if (d.data) setValue("address.postalCode", d.data)
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="province">จังหวัด</Label>
        <Controller name="address.province" control={control}
          render={({ field }) => (
            <Select {...field} id="province">
              <option value="">-- เลือกจังหวัด --</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          )} />
        {errors.address && (errors.address as { province?: { message?: string } }).province && (
          <p className="text-red-600 text-xs mt-1">{(errors.address as { province?: { message?: string } }).province?.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="district">อำเภอ/เขต</Label>
        <Controller name="address.district" control={control}
          render={({ field }) => (
            <Select {...field} id="district" disabled={!province}>
              <option value="">-- เลือกอำเภอ --</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          )} />
      </div>
      <div>
        <Label htmlFor="subdistrict">ตำบล/แขวง</Label>
        <Controller name="address.subdistrict" control={control}
          render={({ field }) => (
            <Select {...field} id="subdistrict" disabled={!district}
              onChange={(e) => { field.onChange(e); void handleSubdistrictChange(e.target.value) }}>
              <option value="">-- เลือกตำบล --</option>
              {subdistricts.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          )} />
      </div>
      <div>
        <Label htmlFor="postalCode">รหัสไปรษณีย์</Label>
        <Controller name="address.postalCode" control={control}
          render={({ field }) => (
            <Input {...field} id="postalCode" maxLength={5} placeholder="00000" readOnly className="bg-gray-50" />
          )} />
      </div>
    </div>
  )
}
