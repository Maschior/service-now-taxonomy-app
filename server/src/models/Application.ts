import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
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

applicationSchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });
applicationSchema.index({ workspaceId: 1 });

const cascadeSoftDelete = async function(this: any, next: any) {
  const update = this.getUpdate ? this.getUpdate() : null;
  const isUpdatingActive = update && update.$set && update.$set.isActive === false;
  const isSavingActive = this.isModified && this.isModified('isActive') && this.isActive === false;

  if (isUpdatingActive || isSavingActive) {
    const docId = this.getQuery ? (await this.model.findOne(this.getQuery()))?._id : this._id;
    if (docId) {
      const mongoose = (await import('mongoose')).default;
      let Module = mongoose.models['Module'];
      if (!Module) {
        Module = (await import('./Module.js')).Module;
      }
      await Module.updateMany({ applicationId: docId }, { $set: { isActive: false } });
    }
  }
  next();
};

applicationSchema.pre('save', cascadeSoftDelete);
applicationSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], cascadeSoftDelete);


export const Application = mongoose.model('Application', applicationSchema);
