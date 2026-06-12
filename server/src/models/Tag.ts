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
    }
  },
  { timestamps: true }
);

tagSchema.index({ name: 1, categoryId: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Tag = mongoose.model('Tag', tagSchema);
