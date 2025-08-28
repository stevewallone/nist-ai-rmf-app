import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'enterprise'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  settings: {
    riskTolerance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    complianceFrameworks: [{
      type: String,
      enum: ['nist-ai-rmf', 'iso-27001', 'gdpr', 'ccpa', 'sox']
    }],
    notificationPreferences: {
      email: { type: Boolean, default: true },
      dashboard: { type: Boolean, default: true },
      reports: { type: Boolean, default: true }
    }
  },
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

export default mongoose.model('Organization', organizationSchema);