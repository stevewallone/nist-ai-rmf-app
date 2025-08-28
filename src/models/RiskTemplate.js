import mongoose from 'mongoose';

const riskTemplateSchema = new mongoose.Schema({
  frameworkFunction: {
    type: String,
    required: true,
    enum: ['govern', 'map', 'measure', 'manage']
  },
  category: {
    type: String,
    required: true
  },
  subcategoryId: {
    type: String,
    required: true,
    unique: true
  },
  outcome: {
    type: String,
    required: true
  },
  description: String,
  informativeReferences: [String],
  questions: [{
    id: String,
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'text', 'file-upload', 'yes-no', 'scale'],
      required: true
    },
    options: [String],
    required: {
      type: Boolean,
      default: false
    },
    helpText: String,
    weight: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  }],
  riskFactors: [{
    factor: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    likelihood: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  mitigationStrategies: [String],
  evidenceRequirements: [{
    type: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    mandatory: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('RiskTemplate', riskTemplateSchema);