import { NextResponse } from "next/server"

export async function GET() {
  const html = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>เชื่อมต่อ LINE</title>
  </head>
  <body style="font-family: sans-serif; text-align: center; padding-top: 20vh;">
    <h1>เชื่อมต่อ LINE สำเร็จ</h1>
    <p>ท่านสามารถปิดหน้านี้ได้เลย</p>
  </body>
</html>`

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}
