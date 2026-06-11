import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema(
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

actionSchema.index({ name: 1, applicationId: 1 }, { unique: true });

export const Action = mongoose.model('Action', actionSchema);
