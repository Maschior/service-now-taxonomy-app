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
    }
  },
  { timestamps: true }
);

moduleSchema.index({ name: 1, applicationId: 1 }, { unique: true });

export const Module = mongoose.model('Module', moduleSchema);
