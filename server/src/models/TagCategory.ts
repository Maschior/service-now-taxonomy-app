import mongoose from 'mongoose';

const tagCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
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

tagCategorySchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });
tagCategorySchema.index({ workspaceId: 1 });

const cascadeSoftDelete = async function(this: any, next: any) {
  const update = this.getUpdate ? this.getUpdate() : null;
  const isUpdatingActive = update && update.$set && update.$set.isActive === false;
  const isSavingActive = this.isModified && this.isModified('isActive') && this.isActive === false;

  if (isUpdatingActive || isSavingActive) {
    const docId = this.getQuery ? (await this.model.findOne(this.getQuery()))?._id : this._id;
    if (docId) {
      const mongoose = (await import('mongoose')).default;
      let Tag = mongoose.models['Tag'];
      if (!Tag) {
        Tag = (await import('./Tag.js')).Tag;
      }
      await Tag.updateMany({ categoryId: docId }, { $set: { isActive: false } });
    }
  }
  next();
};

tagCategorySchema.pre('save', cascadeSoftDelete);
tagCategorySchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], cascadeSoftDelete);


export const TagCategory = mongoose.model('TagCategory', tagCategorySchema);
