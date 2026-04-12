import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  twitterId: string
  twitterUsername: string
  twitterName: string
  twitterImage: string
  evmWallet: string
  tasksCompleted: number[]
  registeredAt: Date
}

const UserSchema = new Schema<IUser>({
  twitterId: { type: String, required: true, unique: true },
  twitterUsername: { type: String, default: "" },
  twitterName: { type: String, default: "" },
  twitterImage: { type: String, default: "" },
  evmWallet: { type: String, default: "" },
  tasksCompleted: { type: [Number], default: [] },
  registeredAt: { type: Date, default: Date.now },
})

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
