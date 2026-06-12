import mongoose from 'mongoose';

const tagCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

tagCategorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const TagCategory = mongoose.model('TagCategory', tagCategorySchema);
