import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  name: string;
  moduleIds: mongoose.Types.ObjectId[];
  description?: string;
  workspaceId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const incidentSchema = new Schema<IIncident>(
  {
    name: { type: String, required: true, trim: true },
    moduleIds: [{ type: Schema.Types.ObjectId, ref: 'Module', required: true }],
    description: { type: String, default: '' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

incidentSchema.index({ name: 1, moduleIds: 1 });
incidentSchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });
incidentSchema.index({ workspaceId: 1 });

const cascadeSoftDelete = async function(this: any, next: any) {
  const update = this.getUpdate ? this.getUpdate() : null;
  const isUpdatingActive = update && update.$set && update.$set.isActive === false;
  const isSavingActive = this.isModified && this.isModified('isActive') && this.isActive === false;

  if (isUpdatingActive || isSavingActive) {
    const docId = this.getQuery ? (await this.model.findOne(this.getQuery()))?._id : this._id;
    if (docId) {
      const mongoose = (await import('mongoose')).default;
      let Action = mongoose.models['Action'];
      if (!Action) {
        Action = (await import('./Action.js')).Action;
      }
      // Action has incidentIds array. Same rule as Module->Incident: don't delete Action entirely unless we want to, 
 
      // but if we follow soft delete for Action we can do it if Action is strictly tied to Incident.
      // Wait, Action is N:M with Incident. Let's leave Action alone or mark it? I'll leave it as we decided.
    }
  }
  next();
};

incidentSchema.pre('save', cascadeSoftDelete);
incidentSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], cascadeSoftDelete);

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
