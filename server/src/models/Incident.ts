import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
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

incidentSchema.index({ name: 1, applicationId: 1 }, { unique: true });

export const Incident = mongoose.model('Incident', incidentSchema);
