import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthPage = nextUrl.pathname === "/login"

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }
  return NextResponse.next()
})

// Excluded at the matcher rather than inside the handler, so these paths never
// invoke the middleware at all. Auth routes, the LINE webhook, every /_next
// asset (including RSC prefetch chunks) and public static files are skipped;
// page and RSC navigations still pass through for the auth gate.
export const config = {
  matcher: [
    "/((?!api/auth|api/line|_next|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|json|webmanifest|txt|xml|js|css|woff|woff2|ttf)$).*)",
  ],
}
