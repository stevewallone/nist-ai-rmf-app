import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'policy',
      'procedure',
      'risk-assessment',
      'audit-report',
      'training-material',
      'technical-documentation',
      'compliance-evidence',
      'other'
    ],
    required: true
  },
  tags: [String],
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  parentDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'internal'
  },
  expirationDate: Date,
  reviewDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Document', documentSchema);