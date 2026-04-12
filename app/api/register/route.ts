import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { evmWallet, tasksCompleted } = await req.json()

  await connectDB()

  await User.findOneAndUpdate(
    { twitterId: session.user.id },
    {
      twitterId: session.user.id,
      twitterUsername: (session.user as Record<string, unknown>).twitterUsername ?? "",
      twitterName: session.user.name ?? "",
      twitterImage: session.user.image ?? "",
      evmWallet: evmWallet ?? "",
      tasksCompleted: tasksCompleted ?? [],
    },
    { upsert: true, new: true }
  )

  return NextResponse.json({ success: true })
}
