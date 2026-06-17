import mongoose, { Schema, Document } from 'mongoose';

export interface IAction extends Document {
  name: string;
  incidentIds: mongoose.Types.ObjectId[];
  description?: string;
  workspaceId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const actionSchema = new Schema<IAction>(
  {
    name: { type: String, required: true, trim: true },
    incidentIds: [{ type: Schema.Types.ObjectId, ref: 'Incident', required: true }],
    description: { type: String, default: '' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

actionSchema.index({ name: 1, incidentIds: 1 });
actionSchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });
actionSchema.index({ workspaceId: 1 });

export const Action = mongoose.model<IAction>('Action', actionSchema);
