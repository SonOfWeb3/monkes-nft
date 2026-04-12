import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasTwitterClientId: !!process.env.TWITTER_CLIENT_ID,
    hasTwitterClientSecret: !!process.env.TWITTER_CLIENT_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length ?? 0,
    twitterClientIdPrefix: process.env.TWITTER_CLIENT_ID?.slice(0, 5) ?? "MISSING",
  })
}
