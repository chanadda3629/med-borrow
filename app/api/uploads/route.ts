import { NextRequest, NextResponse } from "next/server"
import { uploadToCloudinary } from "@/lib/integrations/cloudinary/upload"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!file || !(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 })
    const result = await uploadToCloudinary(file)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 })
  }
}
