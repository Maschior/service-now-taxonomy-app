import mongoose, { Schema, Document } from 'mongoose';

export interface IAction extends Document {
  name: string;
  incidentIds: mongoose.Types.ObjectId[];
  description?: string;
}

const actionSchema = new Schema<IAction>(
  {
    name: { type: String, required: true, trim: true },
    incidentIds: [{ type: Schema.Types.ObjectId, ref: 'Incident', required: true }],
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

actionSchema.index({ name: 1, incidentIds: 1 });

export const Action = mongoose.model<IAction>('Action', actionSchema);
