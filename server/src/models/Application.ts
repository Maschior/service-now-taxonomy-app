import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Application = mongoose.model('Application', applicationSchema);
