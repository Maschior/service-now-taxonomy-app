import mongoose, { Schema, Document } from 'mongoose';

export interface IClosure extends Document {
  shortDescription: string;
  resolutionNotes: string;
  applicationId?: mongoose.Types.ObjectId;
  moduleId?: mongoose.Types.ObjectId;
  incidentId?: mongoose.Types.ObjectId;
  actionId?: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  motivo: string;
  analise: string;
  solucao: string;
  createdAt: Date;
}

const closureSchema = new Schema<IClosure>(
  {
    shortDescription: {
      type: String,
      required: true,
      trim: true
    },
    resolutionNotes: {
      type: String,
      required: true,
      trim: true
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application'
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module'
    },
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Incident'
    },
    actionId: {
      type: Schema.Types.ObjectId,
      ref: 'Action'
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    }],
    motivo: {
      type: String,
      default: '',
      trim: true
    },
    analise: {
      type: String,
      default: '',
      trim: true
    },
    solucao: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
);

closureSchema.index({ createdAt: -1 });

export const Closure = mongoose.model<IClosure>('Closure', closureSchema);
