import mongoose from 'mongoose';

const tagCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  { timestamps: true }
);

export const TagCategory = mongoose.model('TagCategory', tagCategorySchema);
