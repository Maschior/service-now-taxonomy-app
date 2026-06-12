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
    }
  },
  { timestamps: true }
);

applicationSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Application = mongoose.model('Application', applicationSchema);
