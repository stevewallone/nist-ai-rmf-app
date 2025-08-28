import RiskTemplate from '../models/RiskTemplate.js';
import { nistAiRmfTemplates } from '../data/nistAiRmfTemplates.js';

export const seedRiskTemplates = async () => {
  try {
    // Check if templates already exist
    const existingCount = await RiskTemplate.countDocuments();
    
    if (existingCount > 0) {
      console.log(`${existingCount} risk templates already exist, skipping seed`);
      return;
    }

    // Insert templates
    await RiskTemplate.insertMany(nistAiRmfTemplates);
    console.log(`Seeded ${nistAiRmfTemplates.length} NIST AI RMF risk templates`);
    
  } catch (error) {
    console.error('Error seeding risk templates:', error);
    throw error;
  }
};