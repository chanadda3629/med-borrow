import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { id: string; email: string; role: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as typeof session.user & { role: string }).role = token.role as string
      }
      return session
    },
  },
  providers: [], // Empty default, will be populated in auth.ts
} satisfies NextAuthConfig
