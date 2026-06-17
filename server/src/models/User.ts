import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'ADMIN' | 'USER';
  workspaces: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }]
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
