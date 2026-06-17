import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

moduleSchema.index({ name: 1, applicationId: 1 }, { collation: { locale: 'en', strength: 2 } });
moduleSchema.index({ workspaceId: 1 });

const cascadeSoftDelete = async function(this: any, next: any) {
  const update = this.getUpdate ? this.getUpdate() : null;
  const isUpdatingActive = update && update.$set && update.$set.isActive === false;
  const isSavingActive = this.isModified && this.isModified('isActive') && this.isActive === false;

  if (isUpdatingActive || isSavingActive) {
    const docId = this.getQuery ? (await this.model.findOne(this.getQuery()))?._id : this._id;
    if (docId) {
      const mongoose = (await import('mongoose')).default;
      let Incident = mongoose.models['Incident'];
      if (!Incident) {
        Incident = (await import('./Incident.js')).Incident;
      }
      // Incident schema has moduleIds array, we need to handle that, but wait: Incident points to an array of moduleIds.

      // If a Module is deleted, we should maybe pull it from Incident's moduleIds, or mark Incident as inactive if it's the last one?
      // Actually, if a Module is soft deleted, we shouldn't delete the Incident if it belongs to other modules.
      // We should probably just pull the moduleId from the Incident's moduleIds array, or leave it and filter active modules in queries.
      // In the frontend, Incident slicer depends on the selected Module. If the Module is inactive, it won't be shown.
      // But let's follow the standard: if Module is inactive, its strictly dependent things might be affected.
      // Wait, since Incident has N:M relation with Module (array), we should NOT cascade delete the whole Incident.
      // I will leave it empty for Module -> Incident, since incidents can belong to multiple modules!
    }
  }
  next();
};

moduleSchema.pre('save', cascadeSoftDelete);
moduleSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], cascadeSoftDelete);


export const Module = mongoose.model('Module', moduleSchema);
