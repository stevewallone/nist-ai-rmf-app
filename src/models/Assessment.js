import mongoose from 'mongoose';

const riskCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'human-ai-configuration',
      'harmful-bias-homogenization',
      'dangerous-violent-hateful-content',
      'data-privacy',
      'intellectual-property',
      'environmental-impact',
      'value-chain-component-integration',
      'operational-system-security',
      'information-security',
      'information-integrity'
    ]
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  subcategories: [{
    subcategoryId: String,
    outcome: String,
    implementation: {
      type: String,
      enum: ['not-started', 'partially-implemented', 'substantially-implemented', 'fully-implemented'],
      default: 'not-started'
    },
    evidence: [{
      type: String,
      description: String,
      uploadDate: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    notes: String,
    lastReviewed: Date
  }]
});

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  aiSystem: {
    name: { type: String, required: true },
    description: String,
    purpose: String,
    dataTypes: [String],
    deploymentEnvironment: String,
    stakeholders: [String],
    lifecycle: {
      type: String,
      enum: ['design', 'development', 'deployment', 'operation', 'retirement'],
      default: 'design'
    }
  },
  framework: {
    govern: {
      completed: { type: Boolean, default: false },
      subcategories: [riskCategorySchema]
    },
    map: {
      completed: { type: Boolean, default: false },
      subcategories: [riskCategorySchema]
    },
    measure: {
      completed: { type: Boolean, default: false },
      subcategories: [riskCategorySchema]
    },
    manage: {
      completed: { type: Boolean, default: false },
      subcategories: [riskCategorySchema]
    }
  },
  overallStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'needs-review'],
    default: 'not-started'
  },
  overallRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  assessor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'requires-changes']
    },
    comments: String
  }],
  dueDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

assessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Assessment', assessmentSchema);