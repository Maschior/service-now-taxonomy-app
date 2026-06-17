import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TagCategory',
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

tagSchema.index({ name: 1, categoryId: 1 }, { collation: { locale: 'en', strength: 2 } });
tagSchema.index({ workspaceId: 1 });

export const Tag = mongoose.model('Tag', tagSchema);
