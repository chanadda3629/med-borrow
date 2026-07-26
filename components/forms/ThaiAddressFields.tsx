"use client"
import { useEffect, useState, type ComponentType } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { MapPin, Building2, Milestone, Mail } from "lucide-react"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-danger text-xs mt-1">{message}</p>
}

function RequiredLabel({
  icon: Icon,
  htmlFor,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
      <Icon className="w-4 h-4 text-faint" />
      {children}
      <span className="text-danger">*</span>
    </Label>
  )
}

export function ThaiAddressFields() {
  const { control, watch, setValue, formState: { errors } } = useFormContext()
  const province = watch("address.province")
  const district = watch("address.district")

  const addrErrors = errors.address as
    | Record<string, { message?: string } | undefined>
    | undefined

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
        <RequiredLabel icon={MapPin} htmlFor="province">จังหวัด</RequiredLabel>
        <Controller name="address.province" control={control}
          rules={{ required: "กรุณาเลือกจังหวัด" }}
          render={({ field }) => (
            <Select {...field} id="province">
              <option value="">-- เลือกจังหวัด --</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          )} />
        <FieldError message={addrErrors?.province?.message} />
      </div>
      <div>
        <RequiredLabel icon={Building2} htmlFor="district">อำเภอ/เขต</RequiredLabel>
        <Controller name="address.district" control={control}
          rules={{ required: "กรุณาเลือกอำเภอ/เขต" }}
          render={({ field }) => (
            <Select {...field} id="district" disabled={!province}>
              <option value="">-- เลือกอำเภอ --</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          )} />
        <FieldError message={addrErrors?.district?.message} />
      </div>
      <div>
        <RequiredLabel icon={Milestone} htmlFor="subdistrict">ตำบล/แขวง</RequiredLabel>
        <Controller name="address.subdistrict" control={control}
          rules={{ required: "กรุณาเลือกตำบล/แขวง" }}
          render={({ field }) => (
            <Select {...field} id="subdistrict" disabled={!district}
              onChange={(e) => { field.onChange(e); void handleSubdistrictChange(e.target.value) }}>
              <option value="">-- เลือกตำบล --</option>
              {subdistricts.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          )} />
        <FieldError message={addrErrors?.subdistrict?.message} />
      </div>
      <div>
        <RequiredLabel icon={Mail} htmlFor="postalCode">รหัสไปรษณีย์</RequiredLabel>
        <Controller name="address.postalCode" control={control}
          rules={{ required: "กรุณาเลือกตำบล/แขวงเพื่อระบุรหัสไปรษณีย์" }}
          render={({ field }) => (
            <Input {...field} id="postalCode" maxLength={5} placeholder="00000" readOnly className="bg-canvas" />
          )} />
        <FieldError message={addrErrors?.postalCode?.message} />
      </div>
    </div>
  )
}
