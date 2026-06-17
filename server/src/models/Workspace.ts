import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isGlobal: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
