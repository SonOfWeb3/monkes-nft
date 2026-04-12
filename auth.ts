import NextAuth from "next-auth"
import Twitter from "next-auth/providers/twitter"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  logger: {
    error(code, ...message) {
      console.error("[AUTH]", code, JSON.stringify(message, null, 2))
    },
  },
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.providerAccountId) {
        token.twitterId = account.providerAccountId
      }
      if (profile) {
        const p = profile as Record<string, unknown>
        const data = p.data as Record<string, unknown> | undefined
        token.twitterUsername = data?.username ?? p.username ?? ""
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.twitterId as string
      ;(session.user as unknown as Record<string, unknown>).twitterUsername = token.twitterUsername
      return session
    },
  },
})
