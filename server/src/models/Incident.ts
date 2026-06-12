import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  name: string;
  moduleIds: mongoose.Types.ObjectId[];
  description?: string;
}

const incidentSchema = new Schema<IIncident>(
  {
    name: { type: String, required: true, trim: true },
    moduleIds: [{ type: Schema.Types.ObjectId, ref: 'Module', required: true }],
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

incidentSchema.index({ name: 1, moduleIds: 1 });
incidentSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
